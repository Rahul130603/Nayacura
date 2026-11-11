import {
  createCipheriv,
  createDecipheriv,
  createHash,
  createHmac,
  randomBytes,
  randomUUID,
  scryptSync,
  timingSafeEqual,
} from 'node:crypto';
import { env } from '../config/env';

const algorithm = 'aes-256-gcm';
const key = scryptSync(env.encryptionKey, 'nayacura-encryption-salt-v1', 32);

export function hashToken(value: string) {
  return createHash('sha256').update(value).digest('hex');
}

export function randomToken(bytes = 32) {
  return randomBytes(bytes).toString('base64url');
}

export function hashIp(value: string | undefined) {
  if (!value) return null;
  return createHash('sha256').update(`${env.encryptionKey}:${value}`).digest('hex').slice(0, 24);
}

export function encryptText(plain: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv(algorithm, key, iv);
  const encrypted = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `v1.${iv.toString('base64url')}.${tag.toString('base64url')}.${encrypted.toString('base64url')}`;
}

export function decryptText(payload: string): string {
  const [version, ivValue, tagValue, dataValue] = payload.split('.');
  if (version !== 'v1' || !ivValue || !tagValue || !dataValue) {
    throw new Error('Unsupported encrypted payload');
  }
  const decipher = createDecipheriv(algorithm, key, Buffer.from(ivValue, 'base64url'));
  decipher.setAuthTag(Buffer.from(tagValue, 'base64url'));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(dataValue, 'base64url')),
    decipher.final(),
  ]);
  return decrypted.toString('utf8');
}

export function bookingId() {
  return `NYC-${new Date().getFullYear()}-${randomUUID().slice(0, 8).toUpperCase()}`;
}

export function supportReference() {
  return `NYS-${randomUUID().slice(0, 8).toUpperCase()}`;
}

export function safeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

export function signHmacSha256(payload: string, secret: string) {
  return createHmac('sha256', secret).update(payload).digest('hex');
}
