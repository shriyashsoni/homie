const prisma = require('../utils/prisma');
const { AppError } = require('../middleware/errorHandler');
const notificationService = require('../services/notification.service');
const analyticsService = require('../services/analytics.service');

// ─── Send Connection Request ──────────────────────────────────────────────────
const sendConnection = async (req, res, next) => {
  try {
    const { receiverId, listingId, message } = req.body;
    const senderId = req.user.id;

    if (senderId === receiverId) {
      throw new AppError('You cannot send a connection request to yourself.', 400);
    }

    // Check receiver exists
    const receiver = await prisma.user.findUnique({
      where: { id: receiverId },
      select: { id: true, isActive: true, deletedAt: true, firstName: true },
    });
    if (!receiver || !receiver.isActive || receiver.deletedAt) {
      throw new AppError('User not found.', 404);
    }

    // Check for block
    const blocked = await prisma.block.findFirst({
      where: {
        OR: [
          { blockerId: senderId, blockedId: receiverId },
          { blockerId: receiverId, blockedId: senderId },
        ],
      },
    });
    if (blocked) throw new AppError('Unable to connect with this user.', 403);

    // Check duplicate
    const existing = await prisma.connection.findFirst({
      where: {
        senderId,
        receiverId,
        ...(listingId ? { listingId } : {}),
        status: { in: ['PENDING', 'ACCEPTED'] },
      },
    });
    if (existing) {
      throw new AppError('A connection request already exists with this user.', 409);
    }

    // If listingId provided, verify it exists and is published
    if (listingId) {
      const listing = await prisma.listing.findUnique({ where: { id: listingId } });
      if (!listing || listing.status !== 'PUBLISHED') {
        throw new AppError('Listing not found or not available.', 404);
      }
    }

    const connection = await prisma.connection.create({
      data: { senderId, receiverId, listingId, message },
      include: {
        sender: { select: { id: true, firstName: true, avatarUrl: true } },
        listing: { select: { id: true, title: true, area: true } },
      },
    });

    // Notify receiver
    await notificationService.send(receiverId, {
      type: 'CONNECTION_REQUEST',
      title: 'New connection request',
      body: `${req.user.firstName} wants to connect with you.`,
      data: { connectionId: connection.id },
    });

    analyticsService.track(senderId, 'connection_requested', {
      connectionId: connection.id,
      listingId,
    });

    res.status(201).json({
      success: true,
      message: 'Connection request sent.',
      data: { connection },
    });
  } catch (err) {
    next(err);
  }
};

// ─── Get Connections ──────────────────────────────────────────────────────────
const getConnections = async (req, res, next) => {
  try {
    const { status, direction } = req.query;
    const userId = req.user.id;

    const where = {
      ...(direction === 'sent' && { senderId: userId }),
      ...(direction === 'received' && { receiverId: userId }),
      ...(direction === undefined && {
        OR: [{ senderId: userId }, { receiverId: userId }],
      }),
      ...(status && { status }),
    };

    const connections = await prisma.connection.findMany({
      where,
      include: {
        sender: { select: { id: true, firstName: true, avatarUrl: true } },
        receiver: { select: { id: true, firstName: true, avatarUrl: true } },
        listing: { select: { id: true, title: true, area: true, city: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, data: { connections } });
  } catch (err) {
    next(err);
  }
};

// ─── Get Single Connection ────────────────────────────────────────────────────
const getConnection = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const connection = await prisma.connection.findUnique({
      where: { id },
      include: {
        sender: { select: { id: true, firstName: true, avatarUrl: true, verificationLabels: { select: { label: true } } } },
        receiver: { select: { id: true, firstName: true, avatarUrl: true, verificationLabels: { select: { label: true } } } },
        listing: true,
        conversation: { select: { id: true, isActive: true } },
      },
    });

    if (!connection || (connection.senderId !== userId && connection.receiverId !== userId)) {
      throw new AppError('Connection not found.', 404);
    }

    // Only reveal contact info if accepted
    if (connection.status !== 'ACCEPTED') {
      // Mask email/phone
      if (connection.sender) connection.sender.email = undefined;
      if (connection.receiver) connection.receiver.email = undefined;
    }

    res.json({ success: true, data: { connection } });
  } catch (err) {
    next(err);
  }
};

// ─── Accept Connection ────────────────────────────────────────────────────────
const acceptConnection = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const connection = await prisma.connection.findUnique({ where: { id } });
    if (!connection) throw new AppError('Connection not found.', 404);
    if (connection.receiverId !== userId) throw new AppError('Only the recipient can accept.', 403);
    if (connection.status !== 'PENDING') throw new AppError('Connection is not pending.', 400);

    // Accept and create conversation in transaction
    const [updatedConnection, conversation] = await prisma.$transaction(async (tx) => {
      const conn = await tx.connection.update({
        where: { id },
        data: { status: 'ACCEPTED', contactRevealedAt: new Date() },
      });

      const convo = await tx.conversation.create({
        data: {
          connectionId: id,
          userAId: connection.senderId,
          userBId: connection.receiverId,
        },
      });

      return [conn, convo];
    });

    // Notify sender
    await notificationService.send(connection.senderId, {
      type: 'CONNECTION_ACCEPTED',
      title: 'Connection accepted!',
      body: `${req.user.firstName} accepted your connection request.`,
      data: { connectionId: id, conversationId: conversation.id },
    });

    analyticsService.track(userId, 'connection_accepted', { connectionId: id });

    res.json({
      success: true,
      message: 'Connection accepted.',
      data: { connection: updatedConnection, conversationId: conversation.id },
    });
  } catch (err) {
    next(err);
  }
};

// ─── Decline Connection ───────────────────────────────────────────────────────
const declineConnection = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const userId = req.user.id;

    const connection = await prisma.connection.findUnique({ where: { id } });
    if (!connection) throw new AppError('Connection not found.', 404);
    if (connection.receiverId !== userId) throw new AppError('Only the recipient can decline.', 403);
    if (connection.status !== 'PENDING') throw new AppError('Connection is not pending.', 400);

    await prisma.connection.update({
      where: { id },
      data: { status: 'DECLINED', declineReason: reason },
    });

    analyticsService.track(userId, 'connection_declined', { connectionId: id });

    res.json({ success: true, message: 'Connection declined.' });
  } catch (err) {
    next(err);
  }
};

// ─── Cancel Connection ────────────────────────────────────────────────────────
const cancelConnection = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const connection = await prisma.connection.findUnique({ where: { id } });
    if (!connection) throw new AppError('Connection not found.', 404);
    if (connection.senderId !== userId) throw new AppError('Only the sender can cancel.', 403);
    if (connection.status !== 'PENDING') throw new AppError('Connection is not pending.', 400);

    await prisma.connection.update({ where: { id }, data: { status: 'CANCELLED' } });

    res.json({ success: true, message: 'Connection request cancelled.' });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  sendConnection,
  getConnections,
  getConnection,
  acceptConnection,
  declineConnection,
  cancelConnection,
};
