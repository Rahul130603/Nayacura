import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../config/prisma';
import { env } from '../config/env';
import { asyncHandler, validate } from '../utils/http';
import {
  accountDeletionSchema,
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  verifyEmailSchema,
} from '../validators/schemas';
import {
  createSession,
  normalizeEmail,
  revokeAllSessions,
  revokeCurrentSession,
  userPayload,
} from '../services/authService';
import { optionalAuth, requireAuth } from '../middleware/auth';
import { authLimiter, formLimiter } from '../middleware/rateLimit';
import {
  AppError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
} from '../utils/errors';
import { hashToken, randomToken } from '../utils/crypto';
import { audit } from '../utils/audit';
import { sendPasswordReset, sendVerificationEmail } from '../services/mailer';
import { supportReference } from '../utils/crypto';
import { clearAuthCookies } from '../middleware/csrf';

export const authRouter = Router();

authRouter.use((_req, res, next) => {
  res.setHeader('Cache-Control', 'no-store');
  next();
});

authRouter.get('/csrf', (req, res) => {
  res.json({ csrfToken: req.cookies?.nayacura_csrf || null });
});

authRouter.post(
  '/register',
  authLimiter,
  validate(registerSchema),
  asyncHandler(async (req, res) => {
    const { name, email, password } = req.body as {
      name: string;
      email: string;
      password: string;
    };
    const normalized = normalizeEmail(email);
    const existing = await prisma.user.findUnique({ where: { email: normalized } });
    if (existing) {
      throw new AppError(
        'An account may already exist for this email. Try signing in or resetting your password.',
        409,
        'ACCOUNT_EXISTS',
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          name,
          email: normalized,
          passwordHash,
          role: 'PATIENT',
          patient: {
            create: {
              ageConfirmed: true,
              preferredLanguage: 'en',
            },
          },
        },
        include: { patient: true },
      });
      await tx.consentRecord.create({
        data: {
          userId: created.id,
          type: 'PRIVACY_NOTICE_AND_TERMS',
          granted: true,
          version: 'draft-2026-11',
        },
      });
      return created;
    });

    const verificationToken = randomToken(32);
    await prisma.emailVerificationToken.create({
      data: {
        userId: user.id,
        tokenHash: hashToken(verificationToken),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });
    const verifyUrl = `${env.APP_URL}/verify-email?token=${verificationToken}`;
    await sendVerificationEmail(user.email, verifyUrl);
    if (!env.smtpConfigured) {
      console.info(`[nayacura demo] Verification link for local testing: ${verifyUrl}`);
    }

    await createSession(req, res, user.id);
    await audit({
      req,
      actorId: user.id,
      actorRole: 'PATIENT',
      action: 'AUTH_REGISTER',
      entityType: 'User',
      entityId: user.id,
    });

    const payload = await userPayload(user.id);
    res.status(201).json({
      user: payload,
      message:
        'Your private account has been created. Please verify your email when you can — you can still explore your dashboard.',
      demoVerificationLink: env.isDemo && !env.smtpConfigured ? verifyUrl : undefined,
    });
  }),
);

authRouter.post(
  '/login',
  authLimiter,
  optionalAuth,
  validate(loginSchema),
  asyncHandler(async (req, res) => {
    const { email, password, role } = req.body as {
      email: string;
      password: string;
      role?: string;
    };
    const user = await prisma.user.findUnique({ where: { email: normalizeEmail(email) } });
    if (!user || user.deletedAt) {
      throw new UnauthorizedError('Email or password is incorrect.');
    }
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) throw new UnauthorizedError('Email or password is incorrect.');
    if (role && user.role !== role) {
      throw new ForbiddenError(
        'This account is not authorised for that portal. Use the sign-in page that matches your role.',
      );
    }

    await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
    await createSession(req, res, user.id);
    await audit({
      req,
      actorId: user.id,
      actorRole: user.role,
      action: 'AUTH_LOGIN',
      entityType: 'User',
      entityId: user.id,
    });

    res.json({ user: await userPayload(user.id) });
  }),
);

authRouter.post(
  '/logout',
  requireAuth,
  asyncHandler(async (req, res) => {
    await revokeCurrentSession(req, res);
    await audit({
      req,
      action: 'AUTH_LOGOUT',
      entityType: 'Session',
      entityId: req.sessionId || null,
    });
    res.json({ message: 'Signed out.' });
  }),
);

authRouter.get(
  '/me',
  optionalAuth,
  asyncHandler(async (req, res) => {
    if (!req.user) return res.json({ user: null });
    const payload = await userPayload(req.user.id);
    if (!payload) return res.json({ user: null });
    res.json({ user: payload });
  }),
);

authRouter.post(
  '/forgot-password',
  authLimiter,
  validate(forgotPasswordSchema),
  asyncHandler(async (req, res) => {
    const { email } = req.body as { email: string };
    const user = await prisma.user.findUnique({ where: { email: normalizeEmail(email) } });
    if (user && !user.deletedAt) {
      const rawToken = randomToken(32);
      await prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          tokenHash: hashToken(rawToken),
          expiresAt: new Date(Date.now() + 30 * 60 * 1000),
        },
      });
      const resetUrl = `${env.APP_URL}/reset-password?token=${rawToken}`;
      await sendPasswordReset(user.email, resetUrl);
      if (!env.smtpConfigured) {
        console.info(`[nayacura demo] Password reset link for local testing: ${resetUrl}`);
      }
      await audit({
        req,
        actorId: user.id,
        actorRole: user.role,
        action: 'AUTH_PASSWORD_RESET_REQUESTED',
        entityType: 'User',
        entityId: user.id,
      });
    }
    res.json({
      message:
        'If an account exists for that email, a reset link has been sent. For local demo without SMTP, check the API terminal.',
    });
  }),
);

authRouter.post(
  '/reset-password',
  authLimiter,
  validate(resetPasswordSchema),
  asyncHandler(async (req, res) => {
    const { token, password } = req.body as { token: string; password: string };
    const record = await prisma.passwordResetToken.findUnique({
      where: { tokenHash: hashToken(token) },
      include: { user: true },
    });
    if (!record || record.usedAt || record.expiresAt <= new Date() || record.user.deletedAt) {
      throw new AppError(
        'This reset link is invalid or has expired. Please request a new one.',
        400,
        'INVALID_RESET_TOKEN',
      );
    }
    const passwordHash = await bcrypt.hash(password, 12);
    await prisma.$transaction([
      prisma.user.update({ where: { id: record.userId }, data: { passwordHash } }),
      prisma.passwordResetToken.update({
        where: { id: record.id },
        data: { usedAt: new Date() },
      }),
      prisma.session.updateMany({
        where: { userId: record.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);
    await audit({
      req,
      actorId: record.userId,
      actorRole: record.user.role,
      action: 'AUTH_PASSWORD_RESET_COMPLETED',
      entityType: 'User',
      entityId: record.userId,
    });
    res.json({ message: 'Your password has been updated. Please sign in again.' });
  }),
);

authRouter.post(
  '/verify-email',
  formLimiter,
  validate(verifyEmailSchema),
  asyncHandler(async (req, res) => {
    const { token } = req.body as { token: string };
    const record = await prisma.emailVerificationToken.findUnique({
      where: { tokenHash: hashToken(token) },
    });
    if (!record || record.expiresAt <= new Date()) {
      throw new AppError(
        'This verification link is invalid or has expired.',
        400,
        'INVALID_VERIFICATION_TOKEN',
      );
    }
    await prisma.$transaction([
      prisma.user.update({ where: { id: record.userId }, data: { emailVerified: true } }),
      prisma.emailVerificationToken.update({
        where: { id: record.id },
        data: { usedAt: new Date() },
      }),
    ]);
    await audit({
      req,
      actorId: record.userId,
      action: 'AUTH_EMAIL_VERIFIED',
      entityType: 'User',
      entityId: record.userId,
    });
    res.json({ message: 'Your email address is verified.' });
  }),
);

authRouter.post(
  '/resend-verification',
  requireAuth,
  authLimiter,
  asyncHandler(async (req, res) => {
    if (req.user!.emailVerified) {
      return res.json({ message: 'Your email is already verified.' });
    }
    const token = randomToken(32);
    await prisma.emailVerificationToken.create({
      data: {
        userId: req.user!.id,
        tokenHash: hashToken(token),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });
    const verifyUrl = `${env.APP_URL}/verify-email?token=${token}`;
    await sendVerificationEmail(req.user!.email, verifyUrl);
    if (!env.smtpConfigured) {
      console.info(`[nayacura demo] Verification link for local testing: ${verifyUrl}`);
    }
    res.json({
      message: env.smtpConfigured
        ? 'Verification email sent.'
        : 'Email delivery is not configured. In local demo mode, the link is printed in the API terminal.',
    });
  }),
);

authRouter.get(
  '/sessions',
  requireAuth,
  asyncHandler(async (req, res) => {
    const sessions = await prisma.session.findMany({
      where: { userId: req.user!.id, revokedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { lastSeenAt: 'desc' },
      select: {
        id: true,
        userAgent: true,
        createdAt: true,
        lastSeenAt: true,
        expiresAt: true,
      },
    });
    res.json({
      sessions: sessions.map((session) => ({
        ...session,
        current: session.id === req.sessionId,
        createdAt: session.createdAt.toISOString(),
        lastSeenAt: session.lastSeenAt.toISOString(),
        expiresAt: session.expiresAt.toISOString(),
      })),
    });
  }),
);

authRouter.delete(
  '/sessions/:id',
  requireAuth,
  asyncHandler(async (req, res) => {
    const session = await prisma.session.findFirst({
      where: { id: req.params.id, userId: req.user!.id },
    });
    if (!session) throw new NotFoundError('That session could not be found.');
    await prisma.session.update({
      where: { id: session.id },
      data: { revokedAt: new Date() },
    });
    await audit({
      req,
      action: 'AUTH_SESSION_REVOKED',
      entityType: 'Session',
      entityId: session.id,
    });
    if (session.id === req.sessionId) {
      clearAuthCookies(res);
    }
    res.status(204).end();
  }),
);

authRouter.post(
  '/logout-all',
  requireAuth,
  asyncHandler(async (req, res) => {
    await revokeAllSessions(req.user!.id, req.sessionId);
    await audit({ req, action: 'AUTH_ALL_OTHER_SESSIONS_REVOKED', entityType: 'User', entityId: req.user!.id });
    res.json({ message: 'All other sessions have been signed out.' });
  }),
);

authRouter.post(
  '/account-deletion',
  requireAuth,
  formLimiter,
  validate(accountDeletionSchema),
  asyncHandler(async (req, res) => {
    if (req.user!.role !== 'PATIENT') {
      throw new ForbiddenError('This self-service request is available to patient accounts.');
    }
    const patient = await prisma.patientProfile.findUnique({ where: { userId: req.user!.id } });
    if (!patient) throw new NotFoundError('Patient profile not found.');
    const reference = supportReference();
    await prisma.$transaction([
      prisma.patientProfile.update({
        where: { id: patient.id },
        data: { deletionRequestedAt: new Date() },
      }),
      prisma.supportTicket.create({
        data: {
          reference,
          userId: req.user!.id,
          name: req.user!.name,
          email: req.user!.email,
          category: 'PRIVACY',
          subject: 'Account deletion request',
          priority: 'HIGH',
          status: 'OPEN',
          messages: {
            create: {
              authorUserId: req.user!.id,
              authorRole: 'PATIENT',
              body: 'Account deletion requested through the privacy dashboard. Production handling must verify identity and apply lawful clinical-record retention.',
            },
          },
        },
      }),
      prisma.auditLog.create({
        data: {
          actorId: req.user!.id,
          actorRole: 'PATIENT',
          action: 'ACCOUNT_DELETION_REQUESTED',
          entityType: 'User',
          entityId: req.user!.id,
          metadata: JSON.stringify({ reference }),
        },
      }),
    ]);
    await revokeAllSessions(req.user!.id);
    clearAuthCookies(res);
    res.json({
      message:
        'Your deletion request has been logged. This demo does not delete clinical or payment records automatically; a production process must verify identity and apply lawful retention rules.',
      reference,
    });
  }),
);
