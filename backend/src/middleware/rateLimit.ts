import rateLimit from 'express-rate-limit';
import { env } from '../config/env';

const skip = () => env.isTest;

export const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 180,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skip,
  message: { message: 'Too many requests. Please wait a moment and try again.', code: 'RATE_LIMITED' },
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 12,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skip,
  message: {
    message: 'Too many sign-in attempts. Please wait 15 minutes before trying again.',
    code: 'AUTH_RATE_LIMITED',
  },
});

export const formLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skip,
  message: {
    message: 'Too many submissions. Please wait a little while and try again.',
    code: 'FORM_RATE_LIMITED',
  },
});

export const aiLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 35,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skip,
  message: {
    message: 'Naya needs a short pause. Please try again in a few minutes.',
    code: 'AI_RATE_LIMITED',
  },
});
