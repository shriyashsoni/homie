const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');
const { body, param } = require('express-validator');
const { validate } = require('../middleware/validate.middleware');
const prisma = require('../utils/prisma');
const { AppError } = require('../middleware/errorHandler');

// POST /api/v1/buddy-groups - Create a buddy group
router.post('/', authenticate, [
  body('name').optional().trim().isLength({ max: 60 }),
  body('description').optional().isString().isLength({ max: 300 }),
  body('city').optional().trim(),
  body('maxSize').optional().isInt({ min: 2, max: 8 }),
], validate, async (req, res, next) => {
  try {
    const group = await prisma.buddyGroup.create({
      data: { ownerId: req.user.id, ...req.body },
    });
    // Add owner as first member
    await prisma.buddyGroupMember.create({ data: { groupId: group.id, userId: req.user.id } });
    res.status(201).json({ success: true, message: 'Buddy group created.', data: { group } });
  } catch (err) { next(err); }
});

// GET /api/v1/buddy-groups/my - My buddy groups
router.get('/my', authenticate, async (req, res, next) => {
  try {
    const memberships = await prisma.buddyGroupMember.findMany({
      where: { userId: req.user.id },
      include: {
        group: {
          include: {
            members: {
              include: { user: { select: { id: true, firstName: true, avatarUrl: true } } },
            },
          },
        },
      },
    });
    res.json({ success: true, data: { groups: memberships.map((m) => m.group) } });
  } catch (err) { next(err); }
});

// POST /api/v1/buddy-groups/:id/invite/:userId - Invite user to group
router.post('/:id/invite/:userId', authenticate, async (req, res, next) => {
  try {
    const { id, userId } = req.params;
    const group = await prisma.buddyGroup.findUnique({ where: { id }, include: { _count: { select: { members: true } } } });
    if (!group) throw new AppError('Group not found.', 404);
    if (group.ownerId !== req.user.id) throw new AppError('Only the group owner can invite members.', 403);
    if (group._count.members >= group.maxSize) throw new AppError('Group is full.', 400);

    await prisma.buddyGroupMember.upsert({
      where: { groupId_userId: { groupId: id, userId } },
      create: { groupId: id, userId },
      update: {},
    });
    res.json({ success: true, message: 'User added to buddy group.' });
  } catch (err) { next(err); }
});

// DELETE /api/v1/buddy-groups/:id/members/:userId - Remove member
router.delete('/:id/members/:userId', authenticate, async (req, res, next) => {
  try {
    const { id, userId } = req.params;
    const group = await prisma.buddyGroup.findUnique({ where: { id } });
    if (!group) throw new AppError('Group not found.', 404);
    // Owner can remove anyone; member can remove themselves
    if (group.ownerId !== req.user.id && userId !== req.user.id) {
      throw new AppError('Forbidden.', 403);
    }
    await prisma.buddyGroupMember.deleteMany({ where: { groupId: id, userId } });
    res.json({ success: true, message: 'Member removed.' });
  } catch (err) { next(err); }
});

// DELETE /api/v1/buddy-groups/:id - Disband group
router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    const group = await prisma.buddyGroup.findUnique({ where: { id: req.params.id } });
    if (!group) throw new AppError('Group not found.', 404);
    if (group.ownerId !== req.user.id) throw new AppError('Only the owner can disband the group.', 403);
    await prisma.buddyGroup.update({ where: { id: req.params.id }, data: { isActive: false } });
    res.json({ success: true, message: 'Group disbanded.' });
  } catch (err) { next(err); }
});

module.exports = router;
