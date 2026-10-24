const prisma = require('../utils/prisma');
const { AppError } = require('../middleware/errorHandler');
const notificationService = require('../services/notification.service');
const analyticsService = require('../services/analytics.service');

// ─── Get Viewings ─────────────────────────────────────────────────────────────
const getViewings = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { role = 'both', status } = req.query;

    const where = {
      OR: [
        ...(role !== 'host' ? [{ seekerId: userId }] : []),
        ...(role !== 'seeker' ? [{ hostId: userId }] : []),
      ],
      ...(status && { status }),
    };

    const viewings = await prisma.viewingRequest.findMany({
      where,
      include: {
        listing: { select: { id: true, title: true, area: true, city: true } },
        seeker: { select: { id: true, firstName: true, avatarUrl: true } },
        host: { select: { id: true, firstName: true, avatarUrl: true } },
        slot: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, data: { viewings } });
  } catch (err) {
    next(err);
  }
};

// ─── Request Viewing ──────────────────────────────────────────────────────────
const requestViewing = async (req, res, next) => {
  try {
    const { listingId, slotId, proposedTime, meetingMode, message } = req.body;
    const seekerId = req.user.id;

    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      select: { id: true, hostId: true, status: true, title: true, area: true, city: true },
    });

    if (!listing || listing.status !== 'PUBLISHED') {
      throw new AppError('Listing not found or not available.', 404);
    }
    if (listing.hostId === seekerId) {
      throw new AppError('You cannot request a viewing of your own listing.', 400);
    }

    // Validate slot if provided
    if (slotId) {
      const slot = await prisma.viewingSlot.findUnique({ where: { id: slotId } });
      if (!slot || !slot.isAvailable) throw new AppError('Slot is not available.', 400);
      if (slot.startTime <= new Date()) throw new AppError('Slot is in the past.', 400);
      if (slot.bookedCount >= slot.capacity) throw new AppError('Slot is fully booked.', 400);
    }

    if (!slotId && !proposedTime) {
      throw new AppError('Either slotId or proposedTime is required.', 400);
    }

    // Check for duplicate viewing request
    const existing = await prisma.viewingRequest.findFirst({
      where: {
        seekerId,
        listingId,
        status: { in: ['REQUESTED', 'CONFIRMED'] },
      },
    });
    if (existing) throw new AppError('You already have a viewing request for this listing.', 409);

    const viewing = await prisma.$transaction(async (tx) => {
      const v = await tx.viewingRequest.create({
        data: {
          seekerId,
          hostId: listing.hostId,
          listingId,
          slotId,
          proposedTime: proposedTime ? new Date(proposedTime) : null,
          meetingMode,
          message,
        },
        include: {
          slot: true,
          listing: { select: { title: true, area: true } },
        },
      });

      if (slotId) {
        await tx.viewingSlot.update({
          where: { id: slotId },
          data: { bookedCount: { increment: 1 } },
        });
      }

      return v;
    });

    // Notify host
    await notificationService.send(listing.hostId, {
      type: 'VIEWING_REQUEST',
      title: 'New viewing request',
      body: `${req.user.firstName} wants to view your listing.`,
      data: { viewingId: viewing.id, listingId },
    });

    analyticsService.track(seekerId, 'viewing_requested', { viewingId: viewing.id, listingId });

    res.status(201).json({ success: true, message: 'Viewing requested.', data: { viewing } });
  } catch (err) {
    next(err);
  }
};

// ─── Confirm Viewing ──────────────────────────────────────────────────────────
const confirmViewing = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const viewing = await prisma.viewingRequest.findUnique({
      where: { id },
      include: { seeker: { select: { firstName: true } } },
    });

    if (!viewing) throw new AppError('Viewing not found.', 404);
    if (viewing.hostId !== userId) throw new AppError('Only the host can confirm viewings.', 403);
    if (viewing.status !== 'REQUESTED') throw new AppError('Viewing is not in pending state.', 400);

    const confirmedTime = viewing.slotId
      ? (await prisma.viewingSlot.findUnique({ where: { id: viewing.slotId } }))?.startTime
      : viewing.proposedTime;

    const updated = await prisma.viewingRequest.update({
      where: { id },
      data: { status: 'CONFIRMED', confirmedTime },
    });

    await notificationService.send(viewing.seekerId, {
      type: 'VIEWING_CONFIRMED',
      title: 'Viewing confirmed! 🎉',
      body: `Your viewing has been confirmed for ${confirmedTime?.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}.`,
      data: { viewingId: id },
    });

    analyticsService.track(userId, 'viewing_confirmed', { viewingId: id });

    res.json({ success: true, message: 'Viewing confirmed.', data: { viewing: updated } });
  } catch (err) {
    next(err);
  }
};

// ─── Cancel Viewing ───────────────────────────────────────────────────────────
const cancelViewing = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const userId = req.user.id;

    const viewing = await prisma.viewingRequest.findUnique({ where: { id } });
    if (!viewing) throw new AppError('Viewing not found.', 404);
    if (viewing.seekerId !== userId && viewing.hostId !== userId) {
      throw new AppError('Forbidden.', 403);
    }
    if (!['REQUESTED', 'CONFIRMED'].includes(viewing.status)) {
      throw new AppError('Viewing cannot be cancelled at this stage.', 400);
    }

    await prisma.$transaction(async (tx) => {
      await tx.viewingRequest.update({
        where: { id },
        data: { status: 'CANCELLED', cancelReason: reason },
      });

      if (viewing.slotId) {
        await tx.viewingSlot.update({
          where: { id: viewing.slotId },
          data: { bookedCount: { decrement: 1 } },
        });
      }
    });

    // Notify the other party
    const notifyId = userId === viewing.seekerId ? viewing.hostId : viewing.seekerId;
    await notificationService.send(notifyId, {
      type: 'VIEWING_CANCELLED',
      title: 'Viewing cancelled',
      body: 'A viewing has been cancelled.',
      data: { viewingId: id },
    });

    analyticsService.track(userId, 'viewing_cancelled', { viewingId: id });

    res.json({ success: true, message: 'Viewing cancelled.' });
  } catch (err) {
    next(err);
  }
};

// ─── Mark Attended ────────────────────────────────────────────────────────────
const markAttended = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const viewing = await prisma.viewingRequest.findUnique({ where: { id } });
    if (!viewing) throw new AppError('Viewing not found.', 404);
    if (viewing.hostId !== userId && viewing.seekerId !== userId) throw new AppError('Forbidden.', 403);

    const updated = await prisma.viewingRequest.update({
      where: { id },
      data: { status: 'ATTENDED', attendedAt: new Date() },
    });

    analyticsService.track(userId, 'viewing_attended', { viewingId: id });

    res.json({ success: true, message: 'Viewing marked as attended.', data: { viewing: updated } });
  } catch (err) {
    next(err);
  }
};

// ─── Record Outcome ───────────────────────────────────────────────────────────
const recordOutcome = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { note } = req.body;
    const userId = req.user.id;

    const viewing = await prisma.viewingRequest.findUnique({ where: { id } });
    if (!viewing) throw new AppError('Viewing not found.', 404);
    if (viewing.seekerId !== userId && viewing.hostId !== userId) throw new AppError('Forbidden.', 403);

    await prisma.viewingRequest.update({ where: { id }, data: { outcomeNote: note } });

    res.json({ success: true, message: 'Outcome recorded (private).' });
  } catch (err) {
    next(err);
  }
};

// ─── Get Slots ────────────────────────────────────────────────────────────────
const getSlots = async (req, res, next) => {
  try {
    const { listingId } = req.params;

    const slots = await prisma.viewingSlot.findMany({
      where: {
        listingId,
        isAvailable: true,
        startTime: { gte: new Date() },
      },
      orderBy: { startTime: 'asc' },
    });

    res.json({ success: true, data: { slots } });
  } catch (err) {
    next(err);
  }
};

// ─── Create Slots ─────────────────────────────────────────────────────────────
const createSlots = async (req, res, next) => {
  try {
    const { listingId, slots } = req.body;

    const listing = await prisma.listing.findUnique({ where: { id: listingId } });
    if (!listing) throw new AppError('Listing not found.', 404);
    if (listing.hostId !== req.user.id) throw new AppError('Only host can create slots.', 403);

    const created = await prisma.viewingSlot.createMany({
      data: slots.map((s) => ({
        listingId,
        startTime: new Date(s.startTime),
        endTime: new Date(s.endTime),
        capacity: s.capacity || 1,
        meetingMode: s.meetingMode || 'IN_PERSON',
        bufferMinutes: s.bufferMinutes || 15,
        minNoticeHours: s.minNoticeHours || 2,
      })),
    });

    res.status(201).json({ success: true, message: `${created.count} slots created.`, data: { count: created.count } });
  } catch (err) {
    next(err);
  }
};

// ─── Delete Slot ──────────────────────────────────────────────────────────────
const deleteSlot = async (req, res, next) => {
  try {
    const { slotId } = req.params;

    const slot = await prisma.viewingSlot.findUnique({
      where: { id: slotId },
      include: { listing: { select: { hostId: true } } },
    });

    if (!slot) throw new AppError('Slot not found.', 404);
    if (slot.listing.hostId !== req.user.id) throw new AppError('Forbidden.', 403);
    if (slot.bookedCount > 0) throw new AppError('Cannot delete a slot with active bookings.', 400);

    await prisma.viewingSlot.delete({ where: { id: slotId } });

    res.json({ success: true, message: 'Slot deleted.' });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getViewings,
  requestViewing,
  confirmViewing,
  cancelViewing,
  markAttended,
  recordOutcome,
  getSlots,
  createSlots,
  deleteSlot,
};
