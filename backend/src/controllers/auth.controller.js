const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const prisma = require('../utils/prisma');
const { AppError } = require('../middleware/errorHandler');
const { logger } = require('../utils/logger');
const emailService = require('../services/email.service');
const analyticsService = require('../services/analytics.service');

/**
 * Generate JWT access token
 */
const generateAccessToken = (userId) =>
  jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

/**
 * Generate JWT refresh token
 */
const generateRefreshToken = (userId) =>
  jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  });

// ─── Register ────────────────────────────────────────────────────────────────
const register = async (req, res, next) => {
  try {
    const { email, password, firstName, lastName, phone, intent } = req.body;

    // Check existing user
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new AppError('An account with this email already exists.', 409);
    }

    // Check phone uniqueness
    if (phone) {
      const existingPhone = await prisma.user.findUnique({ where: { phone } });
      if (existingPhone) {
        throw new AppError('An account with this phone number already exists.', 409);
      }
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user + profile in transaction
    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email,
          passwordHash,
          firstName,
          lastName,
          phone,
          intent,
          role: intent === 'FILL_ROOM' ? 'HOST' : 'SEEKER',
        },
      });

      // Create empty profile
      await tx.profile.create({
        data: { userId: newUser.id },
      });

      // Create email verification token
      const token = uuidv4();
      await tx.emailVerifyToken.create({
        data: {
          userId: newUser.id,
          token,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h
        },
      });

      // Send verification email (fire-and-forget)
      emailService.sendVerificationEmail(email, firstName, token).catch((err) => {
        logger.error('Failed to send verification email:', err);
      });

      return newUser;
    });

    // Track analytics
    analyticsService.track(user.id, 'onboarding_started', { intent });

    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    res.status(201).json({
      success: true,
      message: 'Account created successfully. Please check your email to verify your account.',
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          intent: user.intent,
          emailVerified: user.emailVerified,
        },
        accessToken,
        refreshToken,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ─── Login ───────────────────────────────────────────────────────────────────
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        passwordHash: true,
        firstName: true,
        lastName: true,
        role: true,
        intent: true,
        isActive: true,
        isAdmin: true,
        emailVerified: true,
        phoneVerified: true,
        deletedAt: true,
      },
    });

    if (!user || user.deletedAt) {
      throw new AppError('Invalid email or password.', 401);
    }

    if (!user.isActive) {
      throw new AppError('Your account has been deactivated. Please contact support.', 403);
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      throw new AppError('Invalid email or password.', 401);
    }

    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    // Update lastActiveAt
    await prisma.user.update({
      where: { id: user.id },
      data: { lastActiveAt: new Date() },
    });

    const { passwordHash: _, ...safeUser } = user;

    res.json({
      success: true,
      message: 'Login successful.',
      data: {
        user: safeUser,
        accessToken,
        refreshToken,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ─── Logout ──────────────────────────────────────────────────────────────────
const logout = async (req, res, next) => {
  try {
    // Client should discard tokens. Stateless JWT - no server invalidation in v1.
    res.json({ success: true, message: 'Logged out successfully.' });
  } catch (err) {
    next(err);
  }
};

// ─── Refresh Token ───────────────────────────────────────────────────────────
const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken: token } = req.body;
    if (!token) throw new AppError('Refresh token required.', 400);

    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, isActive: true, deletedAt: true },
    });

    if (!user || !user.isActive || user.deletedAt) {
      throw new AppError('Invalid token.', 401);
    }

    const accessToken = generateAccessToken(user.id);
    const newRefreshToken = generateRefreshToken(user.id);

    res.json({
      success: true,
      data: { accessToken, refreshToken: newRefreshToken },
    });
  } catch (err) {
    next(err);
  }
};

// ─── Verify Email ─────────────────────────────────────────────────────────────
const verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.body;

    const record = await prisma.emailVerifyToken.findUnique({ where: { token } });
    if (!record) throw new AppError('Invalid or expired verification token.', 400);
    if (record.usedAt) throw new AppError('This verification token has already been used.', 400);
    if (record.expiresAt < new Date()) throw new AppError('Verification token has expired.', 400);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: record.userId },
        data: { emailVerified: true },
      }),
      prisma.emailVerifyToken.update({
        where: { token },
        data: { usedAt: new Date() },
      }),
      prisma.userVerification.upsert({
        where: { userId_label: { userId: record.userId, label: 'EMAIL_VERIFIED' } },
        create: { userId: record.userId, label: 'EMAIL_VERIFIED', verifiedAt: new Date() },
        update: { verifiedAt: new Date() },
      }),
    ]);

    res.json({ success: true, message: 'Email verified successfully.' });
  } catch (err) {
    next(err);
  }
};

// ─── Resend Verification ─────────────────────────────────────────────────────
const resendVerification = async (req, res, next) => {
  try {
    const user = req.user;
    if (user.emailVerified) {
      return res.json({ success: true, message: 'Your email is already verified.' });
    }

    const token = uuidv4();
    await prisma.emailVerifyToken.create({
      data: {
        userId: user.id,
        token,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    const fullUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { email: true, firstName: true },
    });

    await emailService.sendVerificationEmail(fullUser.email, fullUser.firstName, token);

    res.json({ success: true, message: 'Verification email sent.' });
  } catch (err) {
    next(err);
  }
};

// ─── Forgot Password ──────────────────────────────────────────────────────────
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, firstName: true, email: true },
    });

    // Always return success to prevent email enumeration
    if (!user) {
      return res.json({
        success: true,
        message: 'If an account exists with this email, a reset link will be sent.',
      });
    }

    const token = uuidv4();
    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
      },
    });

    await emailService.sendPasswordResetEmail(user.email, user.firstName, token).catch((err) => {
      logger.error('Failed to send password reset email:', err);
    });

    res.json({
      success: true,
      message: 'If an account exists with this email, a reset link will be sent.',
    });
  } catch (err) {
    next(err);
  }
};

// ─── Reset Password ───────────────────────────────────────────────────────────
const resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;

    const record = await prisma.passwordResetToken.findUnique({ where: { token } });
    if (!record) throw new AppError('Invalid or expired reset token.', 400);
    if (record.usedAt) throw new AppError('This reset token has already been used.', 400);
    if (record.expiresAt < new Date()) throw new AppError('Reset token has expired.', 400);

    const passwordHash = await bcrypt.hash(password, 12);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: record.userId },
        data: { passwordHash },
      }),
      prisma.passwordResetToken.update({
        where: { token },
        data: { usedAt: new Date() },
      }),
    ]);

    res.json({ success: true, message: 'Password reset successfully. Please log in.' });
  } catch (err) {
    next(err);
  }
};

// ─── Get Me ───────────────────────────────────────────────────────────────────
const getMe = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        phone: true,
        firstName: true,
        lastName: true,
        displayName: true,
        avatarUrl: true,
        role: true,
        intent: true,
        emailVerified: true,
        phoneVerified: true,
        preferredLanguage: true,
        createdAt: true,
        lastActiveAt: true,
        profile: {
          select: {
            id: true,
            status: true,
            profileCompletionScore: true,
            cityArea: true,
          },
        },
        verificationLabels: {
          select: { label: true, verifiedAt: true },
        },
      },
    });

    res.json({ success: true, data: { user } });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  register,
  login,
  logout,
  refreshToken,
  verifyEmail,
  resendVerification,
  forgotPassword,
  resetPassword,
  getMe,
};
