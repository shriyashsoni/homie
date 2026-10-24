const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');
const { body, param } = require('express-validator');
const { validate } = require('../middleware/validate.middleware');
const prisma = require('../utils/prisma');
const { AppError } = require('../middleware/errorHandler');

// POST /api/v1/reports - Submit a report
router.post('/', authenticate, [
  body('reportType').isIn(['SPAM', 'FAKE_LISTING', 'HARASSMENT', 'PAYMENT_SCAM', 'IMPERSONATION', 'OFFENSIVE_CONTENT', 'OTHER']),
  body('reportedUserId').optional().isUUID(),
  body('reportedListingId').optional().isUUID(),
  body('description').optional().isString().isLength({ max: 1000 }),
], validate, async (req, res, next) => {
  try {
    const { reportType, reportedUserId, reportedListingId, description } = req.body;
    if (!reportedUserId && !reportedListingId) {
      throw new AppError('Either reportedUserId or reportedListingId is required.', 400);
    }
    const report = await prisma.report.create({
      data: {
        reportedById: req.user.id,
        reportedUserId,
        reportedListingId,
        reportType,
        description,
      },
    });
    res.status(201).json({ success: true, message: 'Report submitted. Our team will review it.', data: { reportId: report.id } });
  } catch (err) { next(err); }
});

// GET /api/v1/reports/my - My submitted reports
router.get('/my', authenticate, async (req, res, next) => {
  try {
    const reports = await prisma.report.findMany({
      where: { reportedById: req.user.id },
      select: { id: true, reportType: true, status: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: { reports } });
  } catch (err) { next(err); }
});

module.exports = router;
