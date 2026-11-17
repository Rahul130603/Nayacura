import express, { type Request, type Response } from 'express';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import type { MedicalDocument } from '@prisma/client';
import { prisma } from '../config/prisma';
import { env } from '../config/env';
import { NotFoundError, ValidationError } from '../utils/errors';
import { audit } from '../utils/audit';
import { logger } from '../utils/logger';

export const clinicianPrescriptionCategory = 'CLINICIAN_PRESCRIPTION';

export const medicalDocumentBody = express.raw({
  type: ['application/pdf', 'image/jpeg', 'image/png', 'application/octet-stream'],
  limit: '5mb',
});

export async function storeMedicalDocument(
  req: Request,
  input: { patientId: string; appointmentId: string | null; clinicianPrescription?: boolean },
) {
  const rawName = req.get('x-file-name');
  if (!rawName) throw new ValidationError({ file: ['A file name is required.'] });
  let fileName: string;
  try {
    fileName = decodeURIComponent(rawName);
  } catch {
    throw new ValidationError({ file: ['The file name is invalid.'] });
  }
  fileName = fileName.replace(/[\r\n"/\\]/g, '_').slice(0, 200);
  const allowed = ['application/pdf', 'image/jpeg', 'image/png'];
  const mimeType = (req.get('content-type') || '').split(';')[0];
  if (input.clinicianPrescription && mimeType !== 'application/pdf') {
    throw new ValidationError({ file: ['Upload the prescription as a PDF.'] });
  }
  if (!allowed.includes(mimeType)) {
    throw new ValidationError({ file: ['Only PDF, JPEG or PNG files are accepted.'] });
  }
  const categoryHeader = (req.get('x-file-category') || 'OTHER').toUpperCase();
  const patientCategory = ['REPORT', 'PRESCRIPTION', 'REFERRAL', 'OTHER'].includes(categoryHeader)
    ? categoryHeader
    : 'OTHER';
  const category = input.clinicianPrescription ? clinicianPrescriptionCategory : patientCategory;
  const buffer = Buffer.isBuffer(req.body) ? req.body : null;
  if (!buffer || buffer.length === 0) throw new ValidationError({ file: ['The file is empty.'] });
  if (buffer.length > 5 * 1024 * 1024) {
    throw new ValidationError({ file: ['The file must be smaller than 5 MB.'] });
  }
  const magicValid =
    (mimeType === 'application/pdf' && buffer.subarray(0, 5).toString() === '%PDF-') ||
    (mimeType === 'image/jpeg' && buffer[0] === 0xff && buffer[1] === 0xd8) ||
    (mimeType === 'image/png' &&
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47);
  if (!magicValid) {
    throw new ValidationError({ file: ['The file does not match its declared type.'] });
  }

  const extension = mimeType === 'application/pdf' ? 'pdf' : mimeType === 'image/png' ? 'png' : 'jpg';
  const storageKey = `${randomUUID()}.${extension}`;
  const uploadDir = path.resolve(env.UPLOAD_DIR);
  await fs.mkdir(uploadDir, { recursive: true });
  await fs.writeFile(path.join(uploadDir, storageKey), buffer, { mode: 0o600 });

  let document: MedicalDocument;
  try {
    document = await prisma.medicalDocument.create({
      data: {
        patientId: input.patientId,
        appointmentId: input.appointmentId,
        uploadedById: req.user!.id,
        fileName,
        storageKey,
        mimeType,
        sizeBytes: buffer.length,
        category,
        visibility: 'CARE_TEAM',
      },
    });
  } catch (error) {
    await fs.unlink(path.join(uploadDir, storageKey)).catch(() => {
      logger.warn('Could not clean up an unlinked document', { storageKey });
    });
    throw error;
  }

  await audit({
    req,
    action: 'DOCUMENT_UPLOADED',
    entityType: 'MedicalDocument',
    entityId: document.id,
    metadata: { category, sizeBytes: buffer.length, mimeType, appointmentId: input.appointmentId },
  });
  return document;
}

export function serializeMedicalDocument(document: MedicalDocument) {
  return {
    id: document.id,
    fileName: document.fileName,
    mimeType: document.mimeType,
    sizeBytes: document.sizeBytes,
    category: document.category,
    createdAt: document.createdAt.toISOString(),
  };
}

export async function downloadMedicalDocument(req: Request, res: Response, document: MedicalDocument) {
  const filePath = path.join(path.resolve(env.UPLOAD_DIR), document.storageKey);
  try {
    await fs.access(filePath);
  } catch {
    logger.warn('Document file missing from storage', { documentId: document.id });
    throw new NotFoundError('The stored file is no longer available.');
  }
  await audit({
    req,
    action: 'DOCUMENT_DOWNLOADED',
    entityType: 'MedicalDocument',
    entityId: document.id,
  });
  res.setHeader('Content-Type', document.mimeType);
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Cache-Control', 'private, no-store');
  res.download(filePath, document.fileName);
}
