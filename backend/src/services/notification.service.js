const prisma = require('../utils/prisma');
const { logger } = require('../utils/logger');

/**
 * Create an in-app notification (fire-and-forget safe)
 */
async function send(userId, { type, title, body, data }) {
  try {
    await prisma.notification.create({
      data: { userId, type, title, body, data },
    });
  } catch (err) {
    logger.error('Failed to create notification:', err);
  }
}

/**
 * Get unread notification count for a user
 */
async function getUnreadCount(userId) {
  return prisma.notification.count({
    where: { userId, isRead: false },
  });
}

module.exports = { send, getUnreadCount };
