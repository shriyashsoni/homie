const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');
const { body, param } = require('express-validator');
const { validate } = require('../middleware/validate.middleware');
const viewingController = require('../controllers/viewing.controller');

// GET /api/v1/viewings - My viewing requests
router.get('/', authenticate, viewingController.getViewings);

// POST /api/v1/viewings - Request a viewing
router.post(
  '/',
  authenticate,
  [
    body('listingId').isUUID().withMessage('Valid listingId required'),
    body('slotId').optional().isUUID(),
    body('proposedTime').optional().isISO8601(),
    body('meetingMode').optional().isIn(['IN_PERSON', 'VIDEO_CALL', 'EITHER']),
    body('message').optional().isString().isLength({ max: 300 }),
  ],
  validate,
  viewingController.requestViewing
);

// POST /api/v1/viewings/:id/confirm - Host confirms viewing
router.post('/:id/confirm', authenticate, viewingController.confirmViewing);

// POST /api/v1/viewings/:id/cancel - Cancel viewing
router.post(
  '/:id/cancel',
  authenticate,
  [body('reason').optional().isString().isLength({ max: 200 })],
  validate,
  viewingController.cancelViewing
);

// POST /api/v1/viewings/:id/attend - Mark as attended
router.post('/:id/attend', authenticate, viewingController.markAttended);

// POST /api/v1/viewings/:id/outcome - Record outcome
router.post(
  '/:id/outcome',
  authenticate,
  [body('note').optional().isString().isLength({ max: 500 })],
  validate,
  viewingController.recordOutcome
);

// GET /api/v1/viewings/slots/:listingId - Get available slots for a listing
router.get('/slots/:listingId', authenticate, viewingController.getSlots);

// POST /api/v1/viewings/slots - Create viewing slots (host)
router.post(
  '/slots',
  authenticate,
  [
    body('listingId').isUUID(),
    body('slots').isArray().withMessage('slots must be an array'),
    body('slots.*.startTime').isISO8601(),
    body('slots.*.endTime').isISO8601(),
    body('slots.*.capacity').optional().isInt({ min: 1 }),
    body('slots.*.meetingMode').optional().isIn(['IN_PERSON', 'VIDEO_CALL', 'EITHER']),
  ],
  validate,
  viewingController.createSlots
);

// DELETE /api/v1/viewings/slots/:slotId - Delete a slot
router.delete('/slots/:slotId', authenticate, viewingController.deleteSlot);

module.exports = router;
