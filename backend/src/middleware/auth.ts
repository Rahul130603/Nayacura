import type { NextFunction, Request, Response } from 'express';
import { prisma } from '../config/prisma';
import { ForbiddenError, UnauthorizedError } from '../utils/errors';
import { hashToken } from '../utils/crypto';

export const SESSION_COOKIE = 'nayacura_session';
export const CSRF_COOKIE = 'nayacura_csrf';

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  role: string;
  emailVerified: boolean;
};

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
      sessionId?: string;
    }
  }
}

function readCookie(req: Request, name: string) {
  const header = req.headers.cookie;
  if (!header) return undefined;
  for (const part of header.split(';')) {
    const [key, ...rest] = part.trim().split('=');
    if (key === name) return decodeURIComponent(rest.join('='));
  }
  return undefined;
}

export async function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  try {
    const token = readCookie(req, SESSION_COOKIE);
    if (!token) return next();
    const session = await prisma.session.findUnique({
      where: { tokenHash: hashToken(token) },
      include: { user: true },
    });
    if (
      !session ||
      session.revokedAt ||
      session.expiresAt <= new Date() ||
      session.user.deletedAt
    ) {
      return next();
    }
    req.user = {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      role: session.user.role,
      emailVerified: session.user.emailVerified,
    };
    req.sessionId = session.id;
    next();
  } catch (error) {
    next(error);
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  res.setHeader('Cache-Control', 'no-store');
  if (!req.user) return next(new UnauthorizedError());
  next();
}

export function requireRole(...roles: string[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(new UnauthorizedError());
    if (!roles.includes(req.user.role)) {
      return next(new ForbiddenError('This account is not authorised for that area.'));
    }
    next();
  };
}

export function requireVerifiedDoctor(req: Request, _res: Response, next: NextFunction) {
  if (!req.user) return next(new UnauthorizedError());
  if (req.user.role !== 'DOCTOR') return next(new ForbiddenError());
  prisma.doctorProfile
    .findUnique({ where: { userId: req.user.id } })
    .then((doctor) => {
      if (!doctor || !doctor.verified || doctor.status !== 'VERIFIED') {
        return next(
          new ForbiddenError(
            'Clinical tools are available only after professional credential verification.',
          ),
        );
      }
      next();
    })
    .catch(next);
}
