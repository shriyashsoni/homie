const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');
const { body, param } = require('express-validator');
const { validate } = require('../middleware/validate.middleware');
const prisma = require('../utils/prisma');
const { AppError } = require('../middleware/errorHandler');

// GET /api/v1/conversations - My conversations
router.get('/', authenticate, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const conversations = await prisma.conversation.findMany({
      where: {
        isActive: true,
        OR: [{ userAId: userId }, { userBId: userId }],
      },
      include: {
        userA: { select: { id: true, firstName: true, avatarUrl: true } },
        userB: { select: { id: true, firstName: true, avatarUrl: true } },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          where: { deletedAt: null },
        },
        _count: {
          select: {
            messages: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    res.json({ success: true, data: { conversations } });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/conversations/:id/messages - Get messages
router.get('/:id/messages', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 30 } = req.query;
    const userId = req.user.id;

    const conversation = await prisma.conversation.findUnique({ where: { id } });
    if (!conversation) throw new AppError('Conversation not found.', 404);
    if (conversation.userAId !== userId && conversation.userBId !== userId) {
      throw new AppError('Forbidden.', 403);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = Math.min(parseInt(limit), 100);

    const messages = await prisma.message.findMany({
      where: { conversationId: id, deletedAt: null },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
      include: {
        sender: { select: { id: true, firstName: true, avatarUrl: true } },
      },
    });

    // Mark messages as read
    await prisma.message.updateMany({
      where: {
        conversationId: id,
        senderId: { not: userId },
        isRead: false,
      },
      data: { isRead: true, readAt: new Date() },
    });

    res.json({ success: true, data: { messages: messages.reverse() } });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/conversations/:id/messages - Send message
router.post(
  '/:id/messages',
  authenticate,
  [
    param('id').isUUID(),
    body('content').trim().notEmpty().isLength({ max: 2000 }).withMessage('Message cannot exceed 2000 chars'),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const { content } = req.body;
      const userId = req.user.id;

      const conversation = await prisma.conversation.findUnique({ where: { id } });
      if (!conversation || !conversation.isActive) throw new AppError('Conversation not found.', 404);
      if (conversation.userAId !== userId && conversation.userBId !== userId) {
        throw new AppError('Forbidden.', 403);
      }

      const message = await prisma.message.create({
        data: { conversationId: id, senderId: userId, content },
        include: {
          sender: { select: { id: true, firstName: true, avatarUrl: true } },
        },
      });

      // Update conversation timestamp
      await prisma.conversation.update({ where: { id }, data: { updatedAt: new Date() } });

      res.status(201).json({ success: true, data: { message } });
    } catch (err) {
      next(err);
    }
  }
);

// DELETE /api/v1/conversations/:id/messages/:msgId - Delete message (soft)
router.delete('/:id/messages/:msgId', authenticate, async (req, res, next) => {
  try {
    const { msgId } = req.params;
    const userId = req.user.id;

    const message = await prisma.message.findUnique({ where: { id: msgId } });
    if (!message) throw new AppError('Message not found.', 404);
    if (message.senderId !== userId) throw new AppError('You can only delete your own messages.', 403);

    await prisma.message.update({ where: { id: msgId }, data: { deletedAt: new Date() } });

    res.json({ success: true, message: 'Message deleted.' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
