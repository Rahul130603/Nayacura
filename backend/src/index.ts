import { createApp } from './app';
import { env } from './config/env';
import { prisma } from './config/prisma';
import { logger } from './utils/logger';

const app = createApp();
const server = app.listen(env.PORT, () => {
  logger.info('server.started', {
    port: env.PORT,
    env: env.NODE_ENV,
    demoMode: env.isDemo,
    integrations: {
      razorpay: env.razorpayConfigured,
      livekit: env.livekitConfigured,
      llm: env.llmConfigured,
      smtp: env.smtpConfigured,
    },
  });
  console.log(`\n  Nayacura API · http://localhost:${env.PORT}/api/health\n`);
});

async function shutdown(signal: string) {
  logger.info('server.shutdown', { signal });
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on('SIGINT', () => void shutdown('SIGINT'));
process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('unhandledRejection', (reason) => {
  logger.error('unhandled.rejection', {
    error: reason instanceof Error ? reason.message : String(reason),
    stack: reason instanceof Error ? reason.stack?.split('\n').slice(0, 8).join('\n') : undefined,
  });
});
process.on('uncaughtException', (error) => {
  logger.error('uncaught.exception', {
    error: error.message,
    stack: error.stack?.split('\n').slice(0, 10).join('\n'),
  });
});
