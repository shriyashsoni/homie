const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');
const prisma = require('../utils/prisma');
const notificationService = require('../services/notification.service');

// GET /api/v1/notifications - Get my notifications
router.get('/', authenticate, async (req, res, next) => {
  try {
    const { page = 1, limit = 20, unreadOnly } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = Math.min(parseInt(limit), 50);

    const where = {
      userId: req.user.id,
      ...(unreadOnly === 'true' && { isRead: false }),
    };

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take }),
      prisma.notification.count({ where }),
      notificationService.getUnreadCount(req.user.id),
    ]);

    res.json({
      success: true,
      data: {
        notifications,
        unreadCount,
        pagination: { page: parseInt(page), limit: take, total, totalPages: Math.ceil(total / take) },
      },
    });
  } catch (err) { next(err); }
});

// POST /api/v1/notifications/read-all - Mark all as read
router.post('/read-all', authenticate, async (req, res, next) => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.user.id, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
    res.json({ success: true, message: 'All notifications marked as read.' });
  } catch (err) { next(err); }
});

// PATCH /api/v1/notifications/:id/read - Mark one as read
router.patch('/:id/read', authenticate, async (req, res, next) => {
  try {
    await prisma.notification.updateMany({
      where: { id: req.params.id, userId: req.user.id },
      data: { isRead: true, readAt: new Date() },
    });
    res.json({ success: true, message: 'Notification marked as read.' });
  } catch (err) { next(err); }
});

module.exports = router;
