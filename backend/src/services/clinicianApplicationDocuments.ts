import { randomUUID } from 'node:crypto';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { env } from '../config/env';
import { ValidationError } from '../utils/errors';
import { logger } from '../utils/logger';

export const applicationDocumentTypes = {
  resume: 'PRIVATE_APPLICATION_RESUME',
  registrationCertificate: 'PRIVATE_REGISTRATION_CERTIFICATE',
} as const;
export const privateApplicationDocumentTypes = Object.values(applicationDocumentTypes);
export const applicationDocumentMaxBytes = 2 * 1024 * 1024;

export function applicationDocumentPath(key: string) {
  return path.resolve(env.UPLOAD_DIR, 'clinician-resumes', `${key}.pdf`);
}

export async function storeApplicationDocument(field: keyof typeof applicationDocumentTypes, encoded: string) {
  const pdf = Buffer.from(encoded, 'base64');
  if (pdf.length > applicationDocumentMaxBytes || pdf.toString('base64') !== encoded || pdf.subarray(0, 5).toString() !== '%PDF-') {
    throw new ValidationError({ [field]: ['Choose a valid PDF up to 2 MB.'] });
  }
  const key = randomUUID();
  const filePath = applicationDocumentPath(key);
  await fs.mkdir(path.dirname(filePath), { recursive: true, mode: 0o700 });
  await fs.writeFile(filePath, pdf, { flag: 'wx', mode: 0o600 });
  return {
    type: applicationDocumentTypes[field],
    title: field === 'resume' ? 'Application résumé' : 'Registration certificate',
    note: key,
  };
}

export async function discardApplicationDocument(key: string) {
  await fs.unlink(applicationDocumentPath(key)).catch(() => logger.warn('Could not remove an unlinked clinician application document'));
}
