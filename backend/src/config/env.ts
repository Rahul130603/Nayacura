import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { z } from 'zod';

function loadEnvFiles() {
  const candidates = [
    resolve(process.cwd(), '.env'),
    resolve(process.cwd(), 'backend', '.env'),
    resolve(__dirname, '../../.env'),
  ];
  for (const file of candidates) {
    if (!existsSync(file)) continue;
    try {
      // Node 20.12+ built-in .env parser; avoids an extra runtime dependency.
      process.loadEnvFile(file);
    } catch {
      // Environment may be supplied by the platform instead.
    }
  }
}

loadEnvFiles();

const bool = (fallback: 'true' | 'false') =>
  z
    .string()
    .optional()
    .transform((value) => (value === undefined ? fallback === 'true' : value === 'true'));

const numberFromEnv = (fallback: number) =>
  z
    .string()
    .optional()
    .transform((value) => (value ? Number(value) : fallback))
    .pipe(z.number().finite());

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: numberFromEnv(4000),
  APP_URL: z.string().default('http://localhost:5173'),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  DATABASE_URL: z.string().default('file:./dev.db'),
  SESSION_TTL_DAYS: numberFromEnv(7),
  DATA_ENCRYPTION_KEY: z.string().optional(),
  DEMO_MODE: bool('true'),
  TAX_PERCENT: numberFromEnv(18),
  COOKIE_SECURE: bool('false'),
  TRUST_PROXY: z.string().default('0'),
  UPLOAD_DIR: z.string().default('uploads'),
  RAZORPAY_KEY_ID: z.string().optional(),
  RAZORPAY_KEY_SECRET: z.string().optional(),
  LIVEKIT_URL: z.string().optional(),
  LIVEKIT_API_KEY: z.string().optional(),
  LIVEKIT_API_SECRET: z.string().optional(),
  LLM_API_KEY: z.string().optional(),
  LLM_BASE_URL: z.string().default('https://api.openai.com/v1'),
  LLM_MODEL: z.string().default('gpt-4o-mini'),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: numberFromEnv(587),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().default('Nayacura <no-reply@nayacura.example>'),
  SUPPORT_EMAIL: z.string().default('support@nayacura.example'),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment configuration', parsed.error.flatten().fieldErrors);
  throw new Error('Invalid environment configuration');
}

const raw = parsed.data;
const isProduction = raw.NODE_ENV === 'production';

if (isProduction && !raw.DATA_ENCRYPTION_KEY) {
  throw new Error('DATA_ENCRYPTION_KEY is required in production.');
}
if (isProduction && raw.DEMO_MODE) {
  console.warn(
    '[nayacura] DEMO_MODE is enabled in production. Disable it before accepting real payments.',
  );
}
if (isProduction && !raw.COOKIE_SECURE) {
  console.warn('[nayacura] COOKIE_SECURE should be true in production.');
}

export const env = {
  ...raw,
  isProduction,
  isTest: raw.NODE_ENV === 'test',
  isDemo: raw.DEMO_MODE,
  razorpayConfigured: Boolean(raw.RAZORPAY_KEY_ID && raw.RAZORPAY_KEY_SECRET),
  livekitConfigured: Boolean(
    raw.LIVEKIT_URL && raw.LIVEKIT_API_KEY && raw.LIVEKIT_API_SECRET,
  ),
  llmConfigured: Boolean(raw.LLM_API_KEY),
  smtpConfigured: Boolean(raw.SMTP_HOST && raw.SMTP_USER && raw.SMTP_PASS),
  encryptionKey: raw.DATA_ENCRYPTION_KEY || 'nayacura-development-only-key-do-not-use-in-production',
};

export type AppEnv = typeof env;
