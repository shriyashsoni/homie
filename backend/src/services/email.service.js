const nodemailer = require('nodemailer');
const { logger } = require('../utils/logger');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || 587),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const FROM = process.env.EMAIL_FROM || 'Find My Homie <noreply@findmyhomie.in>';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

/**
 * Send a verification email
 */
async function sendVerificationEmail(email, firstName, token) {
  const verifyUrl = `${FRONTEND_URL}/verify-email?token=${token}`;

  await transporter.sendMail({
    from: FROM,
    to: email,
    subject: 'Verify your FMH email address',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto;">
        <h2 style="color: #6366f1;">Welcome to Find My Homie, ${firstName}! 🏠</h2>
        <p>Thanks for joining FMH. Please verify your email to complete your account.</p>
        <a href="${verifyUrl}" style="
          display: inline-block;
          background: #6366f1;
          color: white;
          padding: 12px 24px;
          border-radius: 8px;
          text-decoration: none;
          margin: 16px 0;
          font-weight: bold;
        ">Verify Email</a>
        <p style="color: #6b7280; font-size: 14px;">This link expires in 24 hours.</p>
        <p style="color: #6b7280; font-size: 14px;">If you didn't create an FMH account, you can safely ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
        <p style="color: #9ca3af; font-size: 12px;">Find My Homie · Bengaluru, India</p>
      </div>
    `,
    text: `Welcome to FMH, ${firstName}!\n\nVerify your email: ${verifyUrl}\n\nThis link expires in 24 hours.`,
  });

  logger.info(`Verification email sent to ${email}`);
}

/**
 * Send a password reset email
 */
async function sendPasswordResetEmail(email, firstName, token) {
  const resetUrl = `${FRONTEND_URL}/reset-password?token=${token}`;

  await transporter.sendMail({
    from: FROM,
    to: email,
    subject: 'Reset your FMH password',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto;">
        <h2 style="color: #6366f1;">Reset your password, ${firstName}</h2>
        <p>We received a request to reset your FMH password. Click the button below to create a new one.</p>
        <a href="${resetUrl}" style="
          display: inline-block;
          background: #6366f1;
          color: white;
          padding: 12px 24px;
          border-radius: 8px;
          text-decoration: none;
          margin: 16px 0;
          font-weight: bold;
        ">Reset Password</a>
        <p style="color: #6b7280; font-size: 14px;">This link expires in 1 hour.</p>
        <p style="color: #6b7280; font-size: 14px;">If you didn't request a password reset, please ignore this email. Your password will remain unchanged.</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
        <p style="color: #9ca3af; font-size: 12px;">Find My Homie · Bengaluru, India</p>
      </div>
    `,
    text: `Reset your FMH password: ${resetUrl}\n\nThis link expires in 1 hour.`,
  });

  logger.info(`Password reset email sent to ${email}`);
}

/**
 * Send a viewing reminder email
 */
async function sendViewingReminder(email, firstName, viewingDetails) {
  await transporter.sendMail({
    from: FROM,
    to: email,
    subject: `Viewing reminder: ${viewingDetails.listingTitle}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto;">
        <h2 style="color: #6366f1;">Viewing reminder 🏠</h2>
        <p>Hi ${firstName}, you have a viewing coming up:</p>
        <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <strong>${viewingDetails.listingTitle}</strong><br>
          📍 ${viewingDetails.area}, ${viewingDetails.city}<br>
          🕐 ${viewingDetails.time}
        </div>
        <a href="${FRONTEND_URL}/viewings/${viewingDetails.id}" style="
          display: inline-block;
          background: #6366f1;
          color: white;
          padding: 12px 24px;
          border-radius: 8px;
          text-decoration: none;
        ">View Details</a>
        <p style="color: #9ca3af; font-size: 12px; margin-top: 24px;">Find My Homie · Bengaluru, India</p>
      </div>
    `,
  });
}

/**
 * Send listing stale warning
 */
async function sendStaleWarning(email, firstName, listingTitle, listingId) {
  await transporter.sendMail({
    from: FROM,
    to: email,
    subject: `Is your listing still available? ${listingTitle}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto;">
        <h2 style="color: #f59e0b;">⚠️ Is your room still available?</h2>
        <p>Hi ${firstName}, it's been a while since you confirmed your listing: <strong>${listingTitle}</strong></p>
        <p>Please confirm it's still available so seekers can trust the listing.</p>
        <a href="${FRONTEND_URL}/listings/${listingId}/confirm" style="
          display: inline-block;
          background: #6366f1;
          color: white;
          padding: 12px 24px;
          border-radius: 8px;
          text-decoration: none;
          margin: 16px 0;
        ">Confirm Availability</a>
        <a href="${FRONTEND_URL}/listings/${listingId}/fill" style="
          display: inline-block;
          background: #e5e7eb;
          color: #374151;
          padding: 12px 24px;
          border-radius: 8px;
          text-decoration: none;
          margin: 16px 0;
          margin-left: 8px;
        ">Mark as Filled</a>
        <p style="color: #9ca3af; font-size: 12px; margin-top: 24px;">Find My Homie · Bengaluru, India</p>
      </div>
    `,
  });
}

module.exports = {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendViewingReminder,
  sendStaleWarning,
};
