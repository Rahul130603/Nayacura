import type { Request, Response } from 'express';
import { prisma } from '../config/prisma';
import { env } from '../config/env';
import { hashToken, randomToken } from '../utils/crypto';
import { SESSION_COOKIE } from '../middleware/auth';

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: env.COOKIE_SECURE,
    path: '/',
    maxAge: env.SESSION_TTL_DAYS * 24 * 60 * 60 * 1000,
  };
}

export async function createSession(req: Request, res: Response, userId: string) {
  const token = randomToken(48);
  const expiresAt = new Date(Date.now() + env.SESSION_TTL_DAYS * 24 * 60 * 60 * 1000);
  const session = await prisma.session.create({
    data: {
      userId,
      tokenHash: hashToken(token),
      expiresAt,
      ipHash: req.ip ? hashToken(`${env.encryptionKey}:${req.ip}`).slice(0, 24) : null,
      userAgent: req.get('user-agent')?.slice(0, 250) || null,
    },
  });
  res.cookie(SESSION_COOKIE, token, sessionCookieOptions());
  return session;
}

export async function revokeCurrentSession(req: Request, res: Response) {
  if (req.sessionId) {
    await prisma.session.updateMany({
      where: { id: req.sessionId },
      data: { revokedAt: new Date() },
    });
  }
  res.clearCookie(SESSION_COOKIE, { path: '/' });
}

export async function revokeAllSessions(userId: string, exceptSessionId?: string) {
  await prisma.session.updateMany({
    where: { userId, id: exceptSessionId ? { not: exceptSessionId } : undefined, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

export async function userPayload(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { patient: true, doctor: true },
  });
  if (!user) return null;
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    emailVerified: user.emailVerified,
    createdAt: user.createdAt.toISOString(),
    patient: user.patient
      ? {
          id: user.patient.id,
          phone: user.patient.phone,
          communicationPreference: user.patient.communicationPreference,
        }
      : null,
    doctor: user.doctor
      ? {
          id: user.doctor.id,
          slug: user.doctor.slug,
          status: user.doctor.status,
          verified: user.doctor.verified,
        }
      : null,
  };
}

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}
