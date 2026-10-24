const prisma = require('../utils/prisma');
const { logger } = require('../utils/logger');

/**
 * Track an analytics event (fire-and-forget safe)
 */
function track(userId, event, properties = {}) {
  prisma.analyticsEvent
    .create({
      data: {
        userId: userId || null,
        event,
        properties,
      },
    })
    .catch((err) => {
      logger.error('Analytics track failed:', { event, err: err.message });
    });
}

module.exports = { track };
