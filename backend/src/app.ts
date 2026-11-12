import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import path from 'node:path';
import { existsSync } from 'node:fs';
import { env } from './config/env';
import { csrfProtection } from './middleware/csrf';
import { optionalAuth } from './middleware/auth';
import { generalLimiter } from './middleware/rateLimit';
import { errorHandler, notFoundHandler } from './utils/http';
import { logger } from './utils/logger';
import { prisma } from './config/prisma';
import { authRouter } from './routes/auth';
import { doctorsRouter } from './routes/doctors';
import { contentRouter } from './routes/content';
import { appointmentsRouter } from './routes/appointments';
import { patientRouter } from './routes/patient';
import { doctorRouter } from './routes/doctor';
import { adminRouter } from './routes/admin';
import { aiRouter } from './routes/ai';
import { supportRouter } from './routes/support';

export function createApp() {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', env.TRUST_PROXY === '1' ? 1 : false);

  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      hsts: env.isProduction ? { maxAge: 31536000, includeSubDomains: true } : false,
    }),
  );
  app.use(
    '/api',
    cors({
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        const allowed = env.CORS_ORIGIN.split(',').map((value) => value.trim()).filter(Boolean);
        if (allowed.includes(origin) || env.APP_URL === origin) return callback(null, true);
        if (
          !env.isProduction &&
          /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)
        ) {
          return callback(null, true);
        }
        return callback(new Error('Origin is not allowed.'));
      },
      credentials: true,
      methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'X-CSRF-Token', 'X-File-Name', 'X-File-Category', 'X-Appointment-Id'],
    }),
  );
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: false, limit: '100kb' }));
  app.use(cookieParser());
  app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      if (req.path === '/api/health') return;
      logger.info('http.request', {
        method: req.method,
        path: req.path,
        status: res.statusCode,
        durationMs: Date.now() - start,
      });
    });
    next();
  });

  app.use('/api', generalLimiter, csrfProtection);
  app.use('/api', optionalAuth);

  app.get('/api/health', async (_req, res) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      res.json({
        status: 'ok',
        service: 'nayacura-api',
        time: new Date().toISOString(),
        database: 'ok',
        demoMode: env.isDemo,
        integrations: {
          razorpay: env.razorpayConfigured,
          livekit: env.livekitConfigured,
          llm: env.llmConfigured,
          smtp: env.smtpConfigured,
        },
      });
    } catch {
      res.status(503).json({ status: 'degraded', database: 'unavailable' });
    }
  });

  app.use('/api/auth', authRouter);
  app.use('/api/doctors', doctorsRouter);
  app.use('/api', contentRouter);
  app.use('/api/appointments', appointmentsRouter);
  app.use('/api/patient', patientRouter);
  app.use('/api/doctor', doctorRouter);
  app.use('/api/admin', adminRouter);
  app.use('/api/ai', aiRouter);
  app.use('/api/support', supportRouter);

  app.use('/api', notFoundHandler);

  if (env.isProduction) {
    const frontendDist = path.resolve(__dirname, '../../frontend/dist');
    if (existsSync(frontendDist)) {
      app.use(express.static(frontendDist, { maxAge: '1h', index: false }));
      app.get('*', (req, res, next) => {
        if (req.path.startsWith('/api/')) return next();
        res.sendFile(path.join(frontendDist, 'index.html'));
      });
    } else {
      logger.warn('Frontend build not found. Build the frontend before starting production server.');
    }
  }

  app.use(errorHandler);
  return app;
}
