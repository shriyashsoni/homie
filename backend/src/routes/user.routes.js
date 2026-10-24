const express = require('express');
const router = express.Router();
const { authenticate, requireAdmin } = require('../middleware/auth.middleware');
const { body, param } = require('express-validator');
const { validate } = require('../middleware/validate.middleware');
const prisma = require('../utils/prisma');
const { AppError } = require('../middleware/errorHandler');

// GET /api/v1/users/me - Get current user
router.get('/me', authenticate, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true, email: true, phone: true, firstName: true, lastName: true,
        displayName: true, avatarUrl: true, role: true, intent: true,
        emailVerified: true, phoneVerified: true, preferredLanguage: true,
        createdAt: true, lastActiveAt: true,
        verificationLabels: { select: { label: true, verifiedAt: true } },
        socialVerifications: { select: { platform: true, profileUrl: true, verifiedAt: true } },
        _count: { select: { listings: true, sentConnections: true, receivedConnections: true } },
      },
    });
    res.json({ success: true, data: { user } });
  } catch (err) { next(err); }
});

// PUT /api/v1/users/me - Update profile info
router.put('/me', authenticate, [
  body('firstName').optional().trim().notEmpty(),
  body('lastName').optional().trim(),
  body('displayName').optional().trim().isLength({ max: 50 }),
  body('preferredLanguage').optional().isIn(['en', 'hi', 'kn']),
], validate, async (req, res, next) => {
  try {
    const { firstName, lastName, displayName, preferredLanguage } = req.body;
    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        ...(firstName && { firstName }),
        ...(lastName !== undefined && { lastName }),
        ...(displayName !== undefined && { displayName }),
        ...(preferredLanguage && { preferredLanguage }),
      },
      select: { id: true, firstName: true, lastName: true, displayName: true, preferredLanguage: true },
    });
    res.json({ success: true, message: 'User updated.', data: { user } });
  } catch (err) { next(err); }
});

// POST /api/v1/users/me/change-password - Change password
router.post('/me/change-password', authenticate, [
  body('currentPassword').notEmpty(),
  body('newPassword').isLength({ min: 8 }).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/),
], validate, async (req, res, next) => {
  try {
    const bcrypt = require('bcryptjs');
    const { currentPassword, newPassword } = req.body;
    const user = await prisma.user.findUnique({ where: { id: req.user.id }, select: { passwordHash: true } });
    const match = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!match) throw new AppError('Current password is incorrect.', 400);
    const passwordHash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({ where: { id: req.user.id }, data: { passwordHash } });
    res.json({ success: true, message: 'Password changed successfully.' });
  } catch (err) { next(err); }
});

// DELETE /api/v1/users/me - Delete account (soft delete)
router.delete('/me', authenticate, async (req, res, next) => {
  try {
    await prisma.user.update({
      where: { id: req.user.id },
      data: { deletedAt: new Date(), isActive: false },
    });
    // Unpublish profile and listings
    await prisma.profile.updateMany({ where: { userId: req.user.id }, data: { status: 'DELETED' } });
    await prisma.listing.updateMany({ where: { hostId: req.user.id }, data: { status: 'DELETED' } });
    res.json({ success: true, message: 'Account deleted. Your data will be retained per our privacy policy.' });
  } catch (err) { next(err); }
});

// POST /api/v1/users/block/:userId - Block a user
router.post('/block/:userId', authenticate, [param('userId').isUUID()], validate, async (req, res, next) => {
  try {
    const { userId } = req.params;
    if (userId === req.user.id) throw new AppError('Cannot block yourself.', 400);
    await prisma.block.upsert({
      where: { blockerId_blockedId: { blockerId: req.user.id, blockedId: userId } },
      create: { blockerId: req.user.id, blockedId: userId },
      update: {},
    });
    // Also cancel any pending connections
    await prisma.connection.updateMany({
      where: {
        OR: [
          { senderId: req.user.id, receiverId: userId },
          { senderId: userId, receiverId: req.user.id },
        ],
        status: 'PENDING',
      },
      data: { status: 'BLOCKED' },
    });
    res.json({ success: true, message: 'User blocked.' });
  } catch (err) { next(err); }
});

// DELETE /api/v1/users/block/:userId - Unblock a user
router.delete('/block/:userId', authenticate, async (req, res, next) => {
  try {
    await prisma.block.deleteMany({ where: { blockerId: req.user.id, blockedId: req.params.userId } });
    res.json({ success: true, message: 'User unblocked.' });
  } catch (err) { next(err); }
});

// POST /api/v1/users/me/verify-phone - Phone OTP send (stub for v1)
router.post('/me/verify-phone', authenticate, async (req, res, next) => {
  res.json({ success: true, message: 'Phone verification OTP sent. (Integration pending)' });
});

// POST /api/v1/users/me/social - Link social account
router.post('/me/social', authenticate, [
  body('platform').isIn(['linkedin', 'instagram', 'github']),
  body('profileUrl').isURL(),
], validate, async (req, res, next) => {
  try {
    const { platform, profileUrl } = req.body;
    const social = await prisma.socialVerification.upsert({
      where: { userId_platform: { userId: req.user.id, platform } },
      create: { userId: req.user.id, platform, profileUrl, verifiedAt: new Date() },
      update: { profileUrl, verifiedAt: new Date(), isActive: true },
    });
    // Add SOCIAL_LINKED verification label
    await prisma.userVerification.upsert({
      where: { userId_label: { userId: req.user.id, label: 'SOCIAL_LINKED' } },
      create: { userId: req.user.id, label: 'SOCIAL_LINKED', verifiedAt: new Date() },
      update: { verifiedAt: new Date() },
    });
    res.json({ success: true, message: 'Social account linked.', data: { social } });
  } catch (err) { next(err); }
});

module.exports = router;
