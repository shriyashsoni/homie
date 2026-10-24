const jwt = require('jsonwebtoken');
const prisma = require('../utils/prisma');
const { AppError } = require('./errorHandler');

/**
 * Authenticate JWT token - required
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Authentication required. Please provide a valid token.', 401);
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        isAdmin: true,
        emailVerified: true,
        phoneVerified: true,
        deletedAt: true,
      },
    });

    if (!user || !user.isActive || user.deletedAt) {
      throw new AppError('Account not found or has been deactivated.', 401);
    }

    req.user = user;

    // Update lastActiveAt (fire-and-forget)
    prisma.user
      .update({ where: { id: user.id }, data: { lastActiveAt: new Date() } })
      .catch(() => {});

    next();
  } catch (err) {
    next(err);
  }
};

/**
 * Authenticate JWT token - optional (does not fail if no token)
 */
const optionalAuthenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        role: true,
        isActive: true,
        isAdmin: true,
      },
    });

    if (user && user.isActive) {
      req.user = user;
    }

    next();
  } catch {
    // Silently fail - optional auth
    next();
  }
};

/**
 * Require admin role
 */
const requireAdmin = (req, res, next) => {
  if (!req.user?.isAdmin) {
    return next(new AppError('Admin access required.', 403));
  }
  next();
};

/**
 * Require email verified
 */
const requireEmailVerified = (req, res, next) => {
  if (!req.user?.emailVerified) {
    return next(new AppError('Please verify your email address to access this feature.', 403));
  }
  next();
};

module.exports = { authenticate, optionalAuthenticate, requireAdmin, requireEmailVerified };
