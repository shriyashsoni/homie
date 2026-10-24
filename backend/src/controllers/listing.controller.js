const prisma = require('../utils/prisma');
const { AppError } = require('../middleware/errorHandler');
const analyticsService = require('../services/analytics.service');

// ─── Calculate Total Costs ────────────────────────────────────────────────────
const calculateCosts = (data) => {
  const rent = data.rent || 0;
  const maintenance = data.maintenance || 0;
  const deposit = data.deposit || 0;
  const brokerage = data.brokerage || 0;
  const otherFees = data.otherFees || 0;
  const utilities = data.utilitiesIncluded ? 0 : null; // null = unknown

  const totalRecurring = rent + maintenance;
  const totalUpfrontEstimate = rent + deposit + brokerage + otherFees;

  return { totalRecurring, totalUpfrontEstimate };
};

// ─── Get Listings (Browse) ────────────────────────────────────────────────────
const getListings = async (req, res, next) => {
  try {
    const {
      city,
      area,
      minBudget,
      maxBudget,
      roomType,
      availableFrom,
      petsAllowed,
      smokingAllowed,
      furnished,
      page = 1,
      limit = 20,
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = Math.min(parseInt(limit), 50);

    const where = {
      status: 'PUBLISHED',
      ...(city && { city: { contains: city, mode: 'insensitive' } }),
      ...(area && { area: { contains: area, mode: 'insensitive' } }),
      ...(minBudget && { rent: { gte: parseInt(minBudget) } }),
      ...(maxBudget && { rent: { lte: parseInt(maxBudget) } }),
      ...(roomType && { roomType }),
      ...(availableFrom && { availableFrom: { lte: new Date(availableFrom) } }),
      ...(petsAllowed === 'true' && { petsAllowed: true }),
      ...(smokingAllowed === 'true' && { smokingAllowed: true }),
      ...(furnished !== undefined && { furnished: furnished === 'true' }),
    };

    const [listings, total] = await Promise.all([
      prisma.listing.findMany({
        where,
        skip,
        take,
        orderBy: [{ lastConfirmedAt: 'desc' }, { publishedAt: 'desc' }],
        include: {
          host: {
            select: {
              id: true,
              firstName: true,
              displayName: true,
              avatarUrl: true,
              verificationLabels: { select: { label: true } },
            },
          },
          photos: { orderBy: { order: 'asc' }, take: 3 },
          _count: { select: { viewingRequests: true } },
        },
      }),
      prisma.listing.count({ where }),
    ]);

    // Increment view count (fire-and-forget)
    prisma.listing
      .updateMany({
        where: { id: { in: listings.map((l) => l.id) } },
        data: { viewCount: { increment: 1 } },
      })
      .catch(() => {});

    res.json({
      success: true,
      data: {
        listings,
        pagination: {
          page: parseInt(page),
          limit: take,
          total,
          totalPages: Math.ceil(total / take),
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

// ─── Get My Listings ──────────────────────────────────────────────────────────
const getMyListings = async (req, res, next) => {
  try {
    const listings = await prisma.listing.findMany({
      where: { hostId: req.user.id, status: { not: 'DELETED' } },
      include: {
        photos: { take: 1, orderBy: { order: 'asc' } },
        _count: { select: { viewingRequests: true, connections: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, data: { listings } });
  } catch (err) {
    next(err);
  }
};

// ─── Get Single Listing ───────────────────────────────────────────────────────
const getListing = async (req, res, next) => {
  try {
    const { id } = req.params;

    const listing = await prisma.listing.findUnique({
      where: { id },
      include: {
        host: {
          select: {
            id: true,
            firstName: true,
            displayName: true,
            avatarUrl: true,
            verificationLabels: { select: { label: true, verifiedAt: true } },
          },
        },
        photos: { orderBy: { order: 'asc' } },
        viewingSlots: {
          where: { isAvailable: true, startTime: { gte: new Date() } },
          orderBy: { startTime: 'asc' },
          take: 10,
        },
      },
    });

    if (!listing || listing.status === 'DELETED') {
      throw new AppError('Listing not found.', 404);
    }

    // Only show PUBLISHED listings to non-owners
    const viewerId = req.user?.id;
    if (listing.hostId !== viewerId && listing.status !== 'PUBLISHED') {
      throw new AppError('Listing not found.', 404);
    }

    // Hide address until connection is accepted
    if (listing.hostId !== viewerId) {
      listing.address = null;
    }

    // Track
    if (viewerId) {
      analyticsService.track(viewerId, 'listing_viewed', { listingId: id });
    }

    res.json({ success: true, data: { listing } });
  } catch (err) {
    next(err);
  }
};

// ─── Create Listing ───────────────────────────────────────────────────────────
const createListing = async (req, res, next) => {
  try {
    const { totalRecurring, totalUpfrontEstimate } = calculateCosts(req.body);

    const listing = await prisma.listing.create({
      data: {
        hostId: req.user.id,
        ...req.body,
        availableFrom: new Date(req.body.availableFrom),
        ...(req.body.availableTo && { availableTo: new Date(req.body.availableTo) }),
        totalRecurring,
        totalUpfrontEstimate,
      },
    });

    // Update user role to include HOST
    await prisma.user.update({
      where: { id: req.user.id },
      data: { role: req.user.role === 'SEEKER' ? 'BOTH' : req.user.role },
    });

    analyticsService.track(req.user.id, 'listing_created', { listingId: listing.id });

    res.status(201).json({
      success: true,
      message: 'Listing created successfully.',
      data: { listing },
    });
  } catch (err) {
    next(err);
  }
};

// ─── Update Listing ───────────────────────────────────────────────────────────
const updateListing = async (req, res, next) => {
  try {
    const { id } = req.params;

    const listing = await prisma.listing.findUnique({ where: { id } });
    if (!listing || listing.status === 'DELETED') throw new AppError('Listing not found.', 404);
    if (listing.hostId !== req.user.id) throw new AppError('You can only edit your own listings.', 403);

    const { totalRecurring, totalUpfrontEstimate } = calculateCosts({ ...listing, ...req.body });

    const updated = await prisma.listing.update({
      where: { id },
      data: {
        ...req.body,
        ...(req.body.availableFrom && { availableFrom: new Date(req.body.availableFrom) }),
        ...(req.body.availableTo && { availableTo: new Date(req.body.availableTo) }),
        totalRecurring,
        totalUpfrontEstimate,
      },
    });

    res.json({ success: true, message: 'Listing updated.', data: { listing: updated } });
  } catch (err) {
    next(err);
  }
};

// ─── Publish Listing ──────────────────────────────────────────────────────────
const publishListing = async (req, res, next) => {
  try {
    const { id } = req.params;
    const listing = await prisma.listing.findUnique({ where: { id } });
    if (!listing) throw new AppError('Listing not found.', 404);
    if (listing.hostId !== req.user.id) throw new AppError('Forbidden.', 403);

    const updated = await prisma.listing.update({
      where: { id },
      data: { status: 'PUBLISHED', publishedAt: new Date(), lastConfirmedAt: new Date() },
    });

    analyticsService.track(req.user.id, 'listing_confirmed', { listingId: id });

    res.json({ success: true, message: 'Listing published.', data: { listing: updated } });
  } catch (err) {
    next(err);
  }
};

// ─── Pause Listing ────────────────────────────────────────────────────────────
const pauseListing = async (req, res, next) => {
  try {
    const { id } = req.params;
    const listing = await prisma.listing.findUnique({ where: { id } });
    if (!listing) throw new AppError('Listing not found.', 404);
    if (listing.hostId !== req.user.id) throw new AppError('Forbidden.', 403);

    const updated = await prisma.listing.update({ where: { id }, data: { status: 'PAUSED' } });
    analyticsService.track(req.user.id, 'listing_paused', { listingId: id });

    res.json({ success: true, message: 'Listing paused.', data: { listing: updated } });
  } catch (err) {
    next(err);
  }
};

// ─── Mark Filled ──────────────────────────────────────────────────────────────
const markFilled = async (req, res, next) => {
  try {
    const { id } = req.params;
    const listing = await prisma.listing.findUnique({ where: { id } });
    if (!listing) throw new AppError('Listing not found.', 404);
    if (listing.hostId !== req.user.id) throw new AppError('Forbidden.', 403);

    const updated = await prisma.listing.update({
      where: { id },
      data: { status: 'FILLED', filledAt: new Date() },
    });

    analyticsService.track(req.user.id, 'listing_filled', { listingId: id });

    res.json({ success: true, message: 'Listing marked as filled.', data: { listing: updated } });
  } catch (err) {
    next(err);
  }
};

// ─── Confirm Availability ─────────────────────────────────────────────────────
const confirmAvailability = async (req, res, next) => {
  try {
    const { id } = req.params;
    const listing = await prisma.listing.findUnique({ where: { id } });
    if (!listing) throw new AppError('Listing not found.', 404);
    if (listing.hostId !== req.user.id) throw new AppError('Forbidden.', 403);

    const updated = await prisma.listing.update({
      where: { id },
      data: { lastConfirmedAt: new Date(), status: 'PUBLISHED', staleWarningAt: null },
    });

    res.json({ success: true, message: 'Availability confirmed.', data: { listing: updated } });
  } catch (err) {
    next(err);
  }
};

// ─── Delete Listing ───────────────────────────────────────────────────────────
const deleteListing = async (req, res, next) => {
  try {
    const { id } = req.params;
    const listing = await prisma.listing.findUnique({ where: { id } });
    if (!listing) throw new AppError('Listing not found.', 404);
    if (listing.hostId !== req.user.id && !req.user.isAdmin) throw new AppError('Forbidden.', 403);

    await prisma.listing.update({ where: { id }, data: { status: 'DELETED' } });

    res.json({ success: true, message: 'Listing deleted.' });
  } catch (err) {
    next(err);
  }
};

// ─── Save Listing ─────────────────────────────────────────────────────────────
const saveListing = async (req, res, next) => {
  try {
    const { id } = req.params;
    await prisma.savedListing.upsert({
      where: { userId_listingId: { userId: req.user.id, listingId: id } },
      create: { userId: req.user.id, listingId: id },
      update: {},
    });
    res.json({ success: true, message: 'Listing saved.' });
  } catch (err) {
    next(err);
  }
};

// ─── Unsave Listing ───────────────────────────────────────────────────────────
const unsaveListing = async (req, res, next) => {
  try {
    const { id } = req.params;
    await prisma.savedListing.deleteMany({
      where: { userId: req.user.id, listingId: id },
    });
    res.json({ success: true, message: 'Listing removed from saved.' });
  } catch (err) {
    next(err);
  }
};

// ─── Get Saved Listings ───────────────────────────────────────────────────────
const getSavedListings = async (req, res, next) => {
  try {
    const saved = await prisma.savedListing.findMany({
      where: { userId: req.user.id },
      include: {
        listing: {
          include: {
            photos: { take: 1 },
            host: { select: { id: true, firstName: true, avatarUrl: true } },
          },
        },
      },
      orderBy: { savedAt: 'desc' },
    });

    res.json({ success: true, data: { saved } });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getListings,
  getMyListings,
  getListing,
  createListing,
  updateListing,
  publishListing,
  pauseListing,
  markFilled,
  confirmAvailability,
  deleteListing,
  saveListing,
  unsaveListing,
  getSavedListings,
};
