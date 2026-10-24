const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');
const { body } = require('express-validator');
const { validate } = require('../middleware/validate.middleware');
const analyticsService = require('../services/analytics.service');

// POST /api/v1/analytics/track - Track a client-side event
router.post('/track', [
  body('event').notEmpty().isString().isLength({ max: 100 }),
  body('properties').optional().isObject(),
  body('sessionId').optional().isString(),
], validate, async (req, res, next) => {
  try {
    const { event, properties, sessionId } = req.body;
    const userId = req.headers.authorization ? req.user?.id : null;

    // Whitelist only defined events per FMH spec
    const allowedEvents = [
      'onboarding_started', 'intent_selected', 'housing_essentials_completed',
      'quiz_answered', 'quiz_completed', 'profile_reviewed',
      'social_verification_started', 'social_verification_completed',
      'profile_published', 'listing_viewed', 'profile_viewed',
      'connection_requested', 'viewing_requested', 'terms_opened',
    ];

    if (!allowedEvents.includes(event)) {
      return res.json({ success: true, message: 'Event not tracked (not in whitelist).' });
    }

    analyticsService.track(userId, event, { ...properties, sessionId, userAgent: req.headers['user-agent'] });
    res.json({ success: true, message: 'Event tracked.' });
  } catch (err) { next(err); }
});

module.exports = router;
