const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');
const { body, param } = require('express-validator');
const { validate } = require('../middleware/validate.middleware');
const connectionController = require('../controllers/connection.controller');

// POST /api/v1/connections - Send connection request
router.post(
  '/',
  authenticate,
  [
    body('receiverId').isUUID().withMessage('Valid receiverId required'),
    body('listingId').optional().isUUID(),
    body('message').optional().isString().isLength({ max: 500 }),
  ],
  validate,
  connectionController.sendConnection
);

// GET /api/v1/connections - Get my connections
router.get('/', authenticate, connectionController.getConnections);

// GET /api/v1/connections/:id - Get single connection
router.get('/:id', authenticate, connectionController.getConnection);

// POST /api/v1/connections/:id/accept - Accept connection
router.post(
  '/:id/accept',
  authenticate,
  [param('id').isUUID()],
  validate,
  connectionController.acceptConnection
);

// POST /api/v1/connections/:id/decline - Decline connection
router.post(
  '/:id/decline',
  authenticate,
  [
    param('id').isUUID(),
    body('reason').optional().isString().isLength({ max: 200 }),
  ],
  validate,
  connectionController.declineConnection
);

// POST /api/v1/connections/:id/cancel - Cancel connection (sender)
router.post('/:id/cancel', authenticate, connectionController.cancelConnection);

module.exports = router;
