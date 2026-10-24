const prisma = require('../utils/prisma');
const { AppError } = require('../middleware/errorHandler');
const { computeMatch } = require('../services/matching.service');
const analyticsService = require('../services/analytics.service');

// ─── Get Matches ──────────────────────────────────────────────────────────────
const getMatches = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = Math.min(parseInt(limit), 50);

    const profile = await prisma.profile.findUnique({ where: { userId: req.user.id } });
    if (!profile) throw new AppError('Profile not found.', 404);

    // Get existing computed matches for this profile
    const [matches, total] = await Promise.all([
      prisma.match.findMany({
        where: {
          seekerProfileId: profile.id,
          isFeasible: true,
          OR: [
            { expiresAt: null },
            { expiresAt: { gte: new Date() } },
          ],
        },
        orderBy: [{ overallRank: 'asc' }, { compatibilityScore: 'desc' }],
        skip,
        take,
        include: {
          listing: {
            include: {
              photos: { take: 1, orderBy: { order: 'asc' } },
              host: {
                select: {
                  id: true,
                  firstName: true,
                  avatarUrl: true,
                  verificationLabels: { select: { label: true } },
                },
              },
            },
          },
        },
      }),
      prisma.match.count({
        where: {
          seekerProfileId: profile.id,
          isFeasible: true,
          OR: [{ expiresAt: null }, { expiresAt: { gte: new Date() } }],
        },
      }),
    ]);

    res.json({
      success: true,
      data: {
        matches,
        pagination: {
          page: parseInt(page),
          limit: take,
          total,
          totalPages: Math.ceil(total / take),
        },
        profileCompletionScore: profile.profileCompletionScore,
        lowCoverageWarning:
          profile.profileCompletionScore < 50
            ? 'Complete more of your profile to get better matches'
            : null,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ─── Compute Matches ──────────────────────────────────────────────────────────
const computeMatches = async (req, res, next) => {
  try {
    const profile = await prisma.profile.findUnique({
      where: { userId: req.user.id },
      include: { quizAnswers: true },
    });

    if (!profile) throw new AppError('Profile not found.', 404);

    // Get all published listings
    const listings = await prisma.listing.findMany({
      where: { status: 'PUBLISHED' },
      take: 500, // process in batches for v1
    });

    const computedMatches = [];
    let rank = 1;

    // Sort by rankScore after computing all
    const scoredListings = listings.map((listing) => {
      const matchData = computeMatch(profile, listing);
      return { listing, matchData };
    });

    // Sort feasible listings by rank score descending
    scoredListings
      .filter((s) => s.matchData.isFeasible)
      .sort((a, b) => (b.matchData.rankScore || 0) - (a.matchData.rankScore || 0))
      .forEach(({ listing, matchData }, idx) => {
        computedMatches.push({
          seekerProfileId: profile.id,
          listingId: listing.id,
          isFeasible: matchData.isFeasible,
          feasibilityReason: matchData.feasibilityReason,
          compatibilityScore: matchData.compatibilityScore,
          coverageScore: matchData.coverageScore,
          confidenceScore: matchData.confidenceScore,
          freshnessFactor: matchData.freshnessFactor,
          overallRank: idx + 1,
          explanationPositive: matchData.explanationPositive || [],
          explanationTradeoffs: matchData.explanationTradeoffs || [],
          budgetScore: matchData.budgetScore,
          areaScore: matchData.areaScore,
          foodScore: matchData.foodScore,
          routineScore: matchData.routineScore,
          socialScore: matchData.socialScore,
          guestsScore: matchData.guestsScore,
          smokingScore: matchData.smokingScore,
          petsScore: matchData.petsScore,
          algorithmVersion: matchData.algorithmVersion,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // Expire in 24h
        });
      });

    // Also store infeasible ones for transparency
    scoredListings
      .filter((s) => !s.matchData.isFeasible)
      .forEach(({ listing, matchData }) => {
        computedMatches.push({
          seekerProfileId: profile.id,
          listingId: listing.id,
          isFeasible: false,
          feasibilityReason: matchData.feasibilityReason,
          compatibilityScore: null,
          coverageScore: null,
          confidenceScore: null,
          freshnessFactor: null,
          overallRank: null,
          explanationPositive: [],
          explanationTradeoffs: matchData.explanationTradeoffs || [],
          algorithmVersion: matchData.algorithmVersion,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        });
      });

    // Delete old matches for this profile and bulk insert new ones
    await prisma.$transaction([
      prisma.match.deleteMany({ where: { seekerProfileId: profile.id } }),
      prisma.match.createMany({ data: computedMatches, skipDuplicates: true }),
    ]);

    analyticsService.track(req.user.id, 'matches_computed', {
      total: computedMatches.length,
      feasible: computedMatches.filter((m) => m.isFeasible).length,
    });

    res.json({
      success: true,
      message: `Computed ${computedMatches.filter((m) => m.isFeasible).length} matches.`,
      data: {
        totalListings: listings.length,
        feasibleMatches: computedMatches.filter((m) => m.isFeasible).length,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ─── Get Match Detail ─────────────────────────────────────────────────────────
const getMatchDetail = async (req, res, next) => {
  try {
    const { listingId } = req.params;
    const profile = await prisma.profile.findUnique({ where: { userId: req.user.id } });
    if (!profile) throw new AppError('Profile not found.', 404);

    const match = await prisma.match.findFirst({
      where: { seekerProfileId: profile.id, listingId },
      include: {
        listing: {
          include: {
            photos: { orderBy: { order: 'asc' } },
            host: {
              select: {
                id: true,
                firstName: true,
                avatarUrl: true,
                verificationLabels: { select: { label: true, verifiedAt: true } },
              },
            },
            viewingSlots: {
              where: { isAvailable: true, startTime: { gte: new Date() } },
              take: 5,
              orderBy: { startTime: 'asc' },
            },
          },
        },
      },
    });

    if (!match) {
      // Compute on-the-fly if not cached
      const listing = await prisma.listing.findUnique({ where: { id: listingId } });
      if (!listing) throw new AppError('Listing not found.', 404);

      const matchData = computeMatch(profile, listing);
      return res.json({ success: true, data: { match: { ...matchData, listing } } });
    }

    res.json({ success: true, data: { match } });
  } catch (err) {
    next(err);
  }
};

module.exports = { getMatches, computeMatches, getMatchDetail };
