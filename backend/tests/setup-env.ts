process.env.NODE_ENV = 'test';
process.env.DEMO_MODE = 'true';
process.env.DATABASE_URL = process.env.DATABASE_URL || 'file:./dev.db';
process.env.COOKIE_SECURE = 'false';
process.env.DATA_ENCRYPTION_KEY =
  process.env.DATA_ENCRYPTION_KEY || 'nayacura-test-key-not-for-production';
process.env.APP_URL = 'http://localhost:5173';
process.env.CORS_ORIGIN = 'http://localhost:5173';
