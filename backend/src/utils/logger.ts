type Level = 'info' | 'warn' | 'error';

const REDACT_KEYS = /password|token|secret|authorization|cookie|content|reason|email|phone/i;

function sanitize(value: unknown, depth = 0): unknown {
  if (depth > 4) return '[nested]';
  if (value === null || value === undefined) return value;
  if (typeof value === 'string') return value.length > 500 ? `${value.slice(0, 500)}…` : value;
  if (typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.slice(0, 10).map((item) => sanitize(item, depth + 1));
  const result: Record<string, unknown> = {};
  for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
    result[key] = REDACT_KEYS.test(key) ? '[redacted]' : sanitize(item, depth + 1);
  }
  return result;
}

function write(level: Level, message: string, meta?: Record<string, unknown>) {
  const line = {
    time: new Date().toISOString(),
    level,
    service: 'nayacura-api',
    message,
    ...(meta ? { meta: sanitize(meta) } : {}),
  };
  const output = JSON.stringify(line);
  if (level === 'error') console.error(output);
  else if (level === 'warn') console.warn(output);
  else console.log(output);
}

export const logger = {
  info: (message: string, meta?: Record<string, unknown>) => write('info', message, meta),
  warn: (message: string, meta?: Record<string, unknown>) => write('warn', message, meta),
  error: (message: string, meta?: Record<string, unknown>) => write('error', message, meta),
};
