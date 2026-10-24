const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');
const { query } = require('express-validator');
const { validate } = require('../middleware/validate.middleware');
const matchController = require('../controllers/match.controller');

// GET /api/v1/matches - Get matches for my profile (seeker)
router.get(
  '/',
  authenticate,
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 50 }),
    query('refresh').optional().isBoolean(),
  ],
  validate,
  matchController.getMatches
);

// POST /api/v1/matches/compute - Recompute matches
router.post('/compute', authenticate, matchController.computeMatches);

// GET /api/v1/matches/:listingId - Get match details for a specific listing
router.get('/:listingId', authenticate, matchController.getMatchDetail);

module.exports = router;
