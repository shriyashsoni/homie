const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');
const { body, param, query } = require('express-validator');
const { validate } = require('../middleware/validate.middleware');
const profileController = require('../controllers/profile.controller');

// GET /api/v1/profiles/me - Get my profile
router.get('/me', authenticate, profileController.getMyProfile);

// PUT /api/v1/profiles/me - Update my profile
router.put(
  '/me',
  authenticate,
  [
    body('cityArea').optional().trim(),
    body('preferredAreas').optional().isArray(),
    body('budgetMin').optional().isInt({ min: 0 }),
    body('budgetMax').optional().isInt({ min: 0 }),
    body('budgetIncludesAll').optional().isBoolean(),
    body('moveInDate').optional().isISO8601(),
    body('moveInFlexDays').optional().isInt({ min: 0, max: 90 }),
    body('roomType').optional().isIn(['PRIVATE', 'SHARED', 'STUDIO', 'ENTIRE_FLAT']),
    body('durationMin').optional().isInt({ min: 1 }),
    body('durationMax').optional().isInt({ min: 1 }),
    body('sleepSchedule')
      .optional()
      .isIn(['EARLY_BIRD', 'STANDARD', 'NIGHT_OWL', 'SHIFT_WORK', 'VARIABLE']),
    body('cleanlinessLevel')
      .optional()
      .isIn(['VERY_CLEAN', 'REASONABLY_CLEAN', 'RELAXED', 'FLEXIBLE']),
    body('socialLevel')
      .optional()
      .isIn([
        'MOSTLY_INDEPENDENT',
        'OCCASIONAL_SHARED_NO_PRESSURE',
        'REGULAR_MEALS_ACTIVITIES',
        'CLOSE_KNIT',
      ]),
    body('workFromHome').optional().isBoolean(),
    body('wfhDaysPerWeek').optional().isInt({ min: 0, max: 7 }),
    body('dietaryPreference')
      .optional()
      .isIn([
        'VEGETARIAN',
        'VEGETARIAN_EGGS_OKAY',
        'EGGS_OKAY_NO_MEAT',
        'NON_VEGETARIAN',
        'VEGAN',
        'JAIN',
        'OTHER',
        'PREFER_NOT_TO_SAY',
      ]),
    body('alcoholPreference')
      .optional()
      .isIn([
        'NO_ALCOHOL_IN_HOME',
        'OKAY_OUTSIDE_NOT_AT_HOME',
        'OCCASIONAL_OKAY',
        'OKAY_WITH_BOUNDARIES',
        'NO_PREFERENCE',
      ]),
    body('smokingPreference')
      .optional()
      .isIn(['NO_INDOOR', 'OUTDOORS_ONLY', 'DESIGNATED_AREA_OKAY', 'NOT_COMFORTABLE', 'NO_PREFERENCE']),
    body('guestPolicy')
      .optional()
      .isIn(['NO_OVERNIGHT', 'ADVANCE_NOTICE', 'AGREED_FREQUENCY', 'FLEXIBLE', 'OTHER']),
    body('bio').optional().isString().isLength({ max: 500 }),
  ],
  validate,
  profileController.updateMyProfile
);

// POST /api/v1/profiles/me/publish - Publish profile
router.post('/me/publish', authenticate, profileController.publishProfile);

// POST /api/v1/profiles/me/unpublish - Unpublish profile
router.post('/me/unpublish', authenticate, profileController.unpublishProfile);

// GET /api/v1/profiles/me/quiz - Get quiz answers
router.get('/me/quiz', authenticate, profileController.getQuizAnswers);

// POST /api/v1/profiles/me/quiz - Save quiz answer(s)
router.post(
  '/me/quiz',
  authenticate,
  [
    body('answers').isArray().withMessage('answers must be an array'),
    body('answers.*.questionId').notEmpty().withMessage('questionId required'),
    body('answers.*.questionText').notEmpty().withMessage('questionText required'),
    body('answers.*.answerRaw').optional().isString(),
    body('answers.*.answerCode').optional().isString(),
    body('answers.*.strength')
      .optional()
      .isIn(['MUST_HAVE', 'STRONG_PREFERENCE', 'FLEXIBLE']),
    body('answers.*.isSkipped').optional().isBoolean(),
    body('answers.*.isPrivate').optional().isBoolean(),
  ],
  validate,
  profileController.saveQuizAnswers
);

// GET /api/v1/profiles/:profileId - Get public profile
router.get(
  '/:profileId',
  authenticate,
  [param('profileId').isUUID().withMessage('Invalid profile ID')],
  validate,
  profileController.getPublicProfile
);

// GET /api/v1/profiles/me/fields - Get extracted profile fields
router.get('/me/fields', authenticate, profileController.getProfileFields);

// PATCH /api/v1/profiles/me/fields/:fieldKey - Update a specific field
router.patch(
  '/me/fields/:fieldKey',
  authenticate,
  [
    param('fieldKey').notEmpty(),
    body('value').notEmpty().withMessage('Value is required'),
    body('confirmationStatus')
      .optional()
      .isIn(['PROPOSED', 'CONFIRMED', 'REJECTED', 'NEEDS_CLARIFICATION']),
  ],
  validate,
  profileController.updateProfileField
);

// GET /api/v1/profiles/me/privacy - Get privacy settings
router.get('/me/privacy', authenticate, profileController.getPrivacySettings);

// PUT /api/v1/profiles/me/privacy - Update privacy settings
router.put(
  '/me/privacy',
  authenticate,
  [
    body('religiousPracticePublic').optional().isBoolean(),
    body('dietPublic').optional().isBoolean(),
    body('phonePublic').optional().isBoolean(),
    body('bioPublic').optional().isBoolean(),
  ],
  validate,
  profileController.updatePrivacySettings
);

module.exports = router;
