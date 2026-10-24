const express = require('express');
const router = express.Router();
const { authenticate, optionalAuthenticate } = require('../middleware/auth.middleware');
const { body, param, query } = require('express-validator');
const { validate } = require('../middleware/validate.middleware');
const listingController = require('../controllers/listing.controller');

// GET /api/v1/listings - Browse listings with filters
router.get('/', optionalAuthenticate, listingController.getListings);

// GET /api/v1/listings/my - My listings (host)
router.get('/my', authenticate, listingController.getMyListings);

// GET /api/v1/listings/:id - Get single listing
router.get(
  '/:id',
  optionalAuthenticate,
  [param('id').isUUID()],
  validate,
  listingController.getListing
);

// POST /api/v1/listings - Create listing
router.post(
  '/',
  authenticate,
  [
    body('title').trim().notEmpty().isLength({ max: 100 }),
    body('city').trim().notEmpty(),
    body('area').trim().notEmpty(),
    body('roomType').isIn(['PRIVATE', 'SHARED', 'STUDIO', 'ENTIRE_FLAT']),
    body('rent').isInt({ min: 1 }),
    body('availableFrom').isISO8601(),
    body('deposit').optional().isInt({ min: 0 }),
    body('brokerage').optional().isInt({ min: 0 }),
    body('maintenance').optional().isInt({ min: 0 }),
    body('utilitiesIncluded').optional().isBoolean(),
    body('description').optional().isString().isLength({ max: 2000 }),
    body('furnished').optional().isBoolean(),
    body('amenities').optional().isArray(),
    body('totalBedrooms').optional().isInt({ min: 1 }),
    body('availableBeds').optional().isInt({ min: 1 }),
    body('currentOccupants').optional().isInt({ min: 0 }),
    body('maxOccupants').optional().isInt({ min: 1 }),
    body('householdVibe').optional().isString(),
    body('houseRules').optional().isArray(),
    body('cookingRules').optional().isString(),
    body('guestPolicy').optional().isIn(['NO_OVERNIGHT', 'ADVANCE_NOTICE', 'AGREED_FREQUENCY', 'FLEXIBLE', 'OTHER']),
    body('smokingAllowed').optional().isBoolean(),
    body('petsAllowed').optional().isBoolean(),
    body('posterIsAgent').optional().isBoolean(),
    body('posterAuthority').optional().isString(),
    body('leaseDurationMin').optional().isInt({ min: 1 }),
    body('leaseDurationMax').optional().isInt({ min: 1 }),
  ],
  validate,
  listingController.createListing
);

// PUT /api/v1/listings/:id - Update listing
router.put(
  '/:id',
  authenticate,
  [param('id').isUUID()],
  validate,
  listingController.updateListing
);

// POST /api/v1/listings/:id/publish - Publish listing
router.post('/:id/publish', authenticate, listingController.publishListing);

// POST /api/v1/listings/:id/pause - Pause listing
router.post('/:id/pause', authenticate, listingController.pauseListing);

// POST /api/v1/listings/:id/fill - Mark listing as filled
router.post(
  '/:id/fill',
  authenticate,
  [param('id').isUUID()],
  validate,
  listingController.markFilled
);

// POST /api/v1/listings/:id/confirm - Confirm listing is still available
router.post('/:id/confirm', authenticate, listingController.confirmAvailability);

// DELETE /api/v1/listings/:id - Delete listing
router.delete('/:id', authenticate, listingController.deleteListing);

// POST /api/v1/listings/:id/save - Save listing
router.post('/:id/save', authenticate, listingController.saveListing);

// DELETE /api/v1/listings/:id/save - Unsave listing
router.delete('/:id/save', authenticate, listingController.unsaveListing);

// GET /api/v1/listings/saved - My saved listings
router.get('/saved/list', authenticate, listingController.getSavedListings);

module.exports = router;
