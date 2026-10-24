const express = require('express');
const router = express.Router();
const { authenticate, requireAdmin } = require('../middleware/auth.middleware');
const { body, param, query } = require('express-validator');
const { validate } = require('../middleware/validate.middleware');
const prisma = require('../utils/prisma');
const { AppError } = require('../middleware/errorHandler');

// All admin routes require authentication + admin role
router.use(authenticate, requireAdmin);

// ── Dashboard Stats ───────────────────────────────────────────────────────────
router.get('/stats', async (req, res, next) => {
  try {
    const [
      totalUsers, activeUsers, totalListings, publishedListings,
      totalConnections, acceptedConnections, totalViewings, attendedViewings,
      totalReports, openReports,
    ] = await Promise.all([
      prisma.user.count({ where: { deletedAt: null } }),
      prisma.user.count({ where: { deletedAt: null, isActive: true, lastActiveAt: { gte: new Date(Date.now() - 7 * 86400000) } } }),
      prisma.listing.count({ where: { status: { not: 'DELETED' } } }),
      prisma.listing.count({ where: { status: 'PUBLISHED' } }),
      prisma.connection.count(),
      prisma.connection.count({ where: { status: 'ACCEPTED' } }),
      prisma.viewingRequest.count(),
      prisma.viewingRequest.count({ where: { status: 'ATTENDED' } }),
      prisma.report.count(),
      prisma.report.count({ where: { status: 'OPEN' } }),
    ]);

    res.json({
      success: true,
      data: {
        users: { total: totalUsers, active7d: activeUsers },
        listings: { total: totalListings, published: publishedListings },
        connections: { total: totalConnections, accepted: acceptedConnections },
        viewings: { total: totalViewings, attended: attendedViewings },
        reports: { total: totalReports, open: openReports },
      },
    });
  } catch (err) { next(err); }
});

// ── User Management ──────────────────────────────────────────────────────────
router.get('/users', [
  query('page').optional().isInt({ min: 1 }),
  query('search').optional().isString(),
  query('isActive').optional().isBoolean(),
], validate, async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search, isActive } = req.query;
    const skip = (parseInt(page) - 1) * 20;
    const where = {
      deletedAt: null,
      ...(search && {
        OR: [
          { email: { contains: search, mode: 'insensitive' } },
          { firstName: { contains: search, mode: 'insensitive' } },
        ],
      }),
      ...(isActive !== undefined && { isActive: isActive === 'true' }),
    };
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where, skip, take: 20, orderBy: { createdAt: 'desc' },
        select: { id: true, email: true, firstName: true, lastName: true, role: true, isActive: true, emailVerified: true, createdAt: true, lastActiveAt: true },
      }),
      prisma.user.count({ where }),
    ]);
    res.json({ success: true, data: { users, pagination: { page: parseInt(page), total, totalPages: Math.ceil(total / 20) } } });
  } catch (err) { next(err); }
});

// PATCH /api/v1/admin/users/:id - Toggle active state / promote admin
router.patch('/users/:id', [param('id').isUUID(), body('isActive').optional().isBoolean(), body('isAdmin').optional().isBoolean()], validate, async (req, res, next) => {
  try {
    const { isActive, isAdmin } = req.body;
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { ...(isActive !== undefined && { isActive }), ...(isAdmin !== undefined && { isAdmin }) },
      select: { id: true, email: true, isActive: true, isAdmin: true },
    });
    res.json({ success: true, message: 'User updated.', data: { user } });
  } catch (err) { next(err); }
});

// ── Reports Queue ─────────────────────────────────────────────────────────────
router.get('/reports', [query('status').optional()], validate, async (req, res, next) => {
  try {
    const { status, page = 1 } = req.query;
    const skip = (parseInt(page) - 1) * 20;
    const reports = await prisma.report.findMany({
      where: { ...(status && { status }) },
      orderBy: { createdAt: 'desc' },
      skip, take: 20,
      include: {
        reportedBy: { select: { id: true, email: true, firstName: true } },
        reportedUser: { select: { id: true, email: true, firstName: true } },
      },
    });
    res.json({ success: true, data: { reports } });
  } catch (err) { next(err); }
});

router.patch('/reports/:id', [
  param('id').isUUID(),
  body('status').isIn(['OPEN', 'UNDER_REVIEW', 'RESOLVED', 'DISMISSED']),
  body('adminNote').optional().isString().isLength({ max: 1000 }),
], validate, async (req, res, next) => {
  try {
    const { status, adminNote } = req.body;
    const report = await prisma.report.update({
      where: { id: req.params.id },
      data: {
        status,
        adminNote,
        ...(status === 'RESOLVED' && { resolvedAt: new Date() }),
      },
    });
    res.json({ success: true, message: 'Report updated.', data: { report } });
  } catch (err) { next(err); }
});

// ── Stale Listing Scanner ─────────────────────────────────────────────────────
router.post('/scan-stale-listings', async (req, res, next) => {
  try {
    const threshold = new Date(Date.now() - 14 * 86400000); // 14 days
    const staleListings = await prisma.listing.findMany({
      where: {
        status: 'PUBLISHED',
        lastConfirmedAt: { lt: threshold },
      },
      include: { host: { select: { email: true, firstName: true } } },
    });

    let warned = 0;
    const emailService = require('../services/email.service');
    for (const listing of staleListings) {
      await prisma.listing.update({ where: { id: listing.id }, data: { staleWarningAt: new Date(), status: 'STALE' } });
      await emailService.sendStaleWarning(listing.host.email, listing.host.firstName, listing.title, listing.id).catch(() => {});
      warned++;
    }

    res.json({ success: true, message: `Marked ${warned} listings as stale and sent warnings.`, data: { warned } });
  } catch (err) { next(err); }
});

// ── Analytics Events ─────────────────────────────────────────────────────────
router.get('/analytics/events', async (req, res, next) => {
  try {
    const { event, page = 1 } = req.query;
    const events = await prisma.analyticsEvent.findMany({
      where: { ...(event && { event }) },
      orderBy: { createdAt: 'desc' },
      take: 50,
      skip: (parseInt(page) - 1) * 50,
    });
    res.json({ success: true, data: { events } });
  } catch (err) { next(err); }
});

module.exports = router;
