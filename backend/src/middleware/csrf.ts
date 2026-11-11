import type { NextFunction, Request, Response } from 'express';
import { randomBytes, timingSafeEqual } from 'node:crypto';
import { env } from '../config/env';
import { CSRF_COOKIE, SESSION_COOKIE } from './auth';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

function readCookie(req: Request, name: string) {
  const header = req.headers.cookie;
  if (!header) return undefined;
  for (const part of header.split(';')) {
    const [key, ...rest] = part.trim().split('=');
    if (key === name) return decodeURIComponent(rest.join('='));
  }
  return undefined;
}

function safeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

/**
 * Double-submit cookie CSRF protection. The cookie is readable by the SPA and
 * must be echoed in X-CSRF-Token for every state-changing request. Cross-site
 * scripts cannot read it because of the same-origin policy.
 */
export function csrfProtection(req: Request, res: Response, next: NextFunction) {
  let csrf = readCookie(req, CSRF_COOKIE);
  if (!csrf) {
    csrf = randomBytes(24).toString('base64url');
    res.cookie(CSRF_COOKIE, csrf, {
      httpOnly: false,
      sameSite: 'lax',
      secure: env.COOKIE_SECURE,
      path: '/',
      maxAge: 1000 * 60 * 60 * 24 * 7,
    });
  }

  if (SAFE_METHODS.has(req.method)) return next();
  if (req.path === '/health' || req.path.startsWith('/webhooks/')) return next();

  const header = req.get('x-csrf-token');
  if (!header || !safeEqual(header, csrf)) {
    return res.status(403).json({
      message: 'Your security token expired. Please refresh the page and try again.',
      code: 'CSRF_FAILED',
    });
  }
  next();
}

export function clearAuthCookies(res: Response) {
  res.clearCookie(SESSION_COOKIE, { path: '/' });
  res.clearCookie(CSRF_COOKIE, { path: '/' });
}
