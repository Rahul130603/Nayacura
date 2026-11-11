import { Router } from 'express';
import express from 'express';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { prisma } from '../config/prisma';
import { env } from '../config/env';
import { asyncHandler, validate } from '../utils/http';
import { requireAuth, requireRole } from '../middleware/auth';
import { patientProfileSchema } from '../validators/schemas';
import {
  appointmentInclude,
  serializeAppointment,
  serializePayment,
  serializePrescription,
} from '../services/serializers';
import { NotFoundError, ValidationError } from '../utils/errors';
import { audit } from '../utils/audit';
import { hashIp } from '../utils/crypto';
import { logger } from '../utils/logger';

export const patientRouter = Router();

patientRouter.use(requireAuth, requireRole('PATIENT'));

async function patientFor(userId: string) {
  const patient = await prisma.patientProfile.findUnique({
    where: { userId },
    include: { user: true },
  });
  if (!patient) throw new NotFoundError('Patient profile not found.');
  return patient;
}

patientRouter.get(
  '/overview',
  asyncHandler(async (req, res) => {
    const patient = await patientFor(req.user!.id);
    const now = new Date();
    const [
      upcoming,
      previous,
      notifications,
      documents,
      documentCount,
      prescriptions,
      unreadCount,
      payments,
      completedCount,
    ] = await Promise.all([
        prisma.appointment.findMany({
          where: {
            patientId: patient.id,
            startAt: { gte: now },
            status: { in: ['CONFIRMED', 'PENDING_PAYMENT'] },
          },
          include: appointmentInclude,
          orderBy: { startAt: 'asc' },
          take: 3,
        }),
        prisma.appointment.findMany({
          where: {
            patientId: patient.id,
            OR: [{ status: { in: ['COMPLETED', 'CANCELLED', 'NO_SHOW'] } }, { startAt: { lt: now } }],
          },
          include: appointmentInclude,
          orderBy: { startAt: 'desc' },
          take: 3,
        }),
        prisma.notification.findMany({
          where: { userId: req.user!.id },
          orderBy: { createdAt: 'desc' },
          take: 5,
        }),
        prisma.medicalDocument.findMany({
          where: { patientId: patient.id },
          orderBy: { createdAt: 'desc' },
          take: 3,
          select: { id: true, fileName: true, category: true, mimeType: true, createdAt: true },
        }),
        prisma.medicalDocument.count({ where: { patientId: patient.id } }),
        prisma.prescription.count({ where: { patientId: patient.id } }),
        prisma.notification.count({ where: { userId: req.user!.id, readAt: null } }),
        prisma.payment.findMany({
          where: { appointment: { patientId: patient.id } },
          include: { appointment: true },
          orderBy: { createdAt: 'desc' },
          take: 3,
        }),
        prisma.appointment.count({
          where: { patientId: patient.id, status: 'COMPLETED' },
        }),
      ]);

    res.json({
      user: {
        id: patient.user.id,
        name: patient.user.name,
        email: patient.user.email,
        emailVerified: patient.user.emailVerified,
      },
      patient: {
        id: patient.id,
        phone: patient.phone,
        preferredLanguage: patient.preferredLanguage,
        communicationPreference: patient.communicationPreference,
        aiHistoryEnabled: patient.aiHistoryEnabled,
      },
      upcoming: upcoming.map((appointment) => serializeAppointment(appointment, 'PATIENT')),
      previous: previous.map((appointment) => serializeAppointment(appointment, 'PATIENT')),
      notifications: notifications.map((item) => ({
        id: item.id,
        title: item.title,
        body: item.body,
        type: item.type,
        readAt: item.readAt?.toISOString() || null,
        createdAt: item.createdAt.toISOString(),
      })),
      unreadCount,
      stats: {
        documents: documentCount,
        prescriptions,
        upcoming: upcoming.length,
        completed: completedCount,
      },
      recentDocuments: documents.map((document) => ({
        ...document,
        createdAt: document.createdAt.toISOString(),
      })),
      recentPayments: payments.map((payment) => ({
        ...serializePayment(payment),
        bookingId: payment.appointment.bookingId,
      })),
    });
  }),
);

patientRouter.get(
  '/appointments',
  asyncHandler(async (req, res) => {
    const patient = await patientFor(req.user!.id);
    const filter = typeof req.query.filter === 'string' ? req.query.filter : 'all';
    const now = new Date();
    const where =
      filter === 'upcoming'
        ? { patientId: patient.id, startAt: { gte: now }, status: { in: ['CONFIRMED', 'PENDING_PAYMENT'] } }
        : filter === 'past'
          ? {
              patientId: patient.id,
              OR: [
                { status: { in: ['COMPLETED', 'CANCELLED', 'NO_SHOW'] } },
                { startAt: { lt: now } },
              ],
            }
          : { patientId: patient.id };
    const appointments = await prisma.appointment.findMany({
      where,
      include: appointmentInclude,
      orderBy: { startAt: filter === 'upcoming' ? 'asc' : 'desc' },
    });
    res.json({
      appointments: appointments.map((appointment) =>
        serializeAppointment(appointment, 'PATIENT'),
      ),
    });
  }),
);

patientRouter.get(
  '/documents',
  asyncHandler(async (req, res) => {
    const patient = await patientFor(req.user!.id);
    const documents = await prisma.medicalDocument.findMany({
      where: { patientId: patient.id },
      orderBy: { createdAt: 'desc' },
    });
    res.json({
      documents: documents.map((document) => ({
        id: document.id,
        fileName: document.fileName,
        mimeType: document.mimeType,
        sizeBytes: document.sizeBytes,
        category: document.category,
        createdAt: document.createdAt.toISOString(),
        uploader: document.uploadedById ? 'You or your care team' : 'Care team',
      })),
    });
  }),
);

patientRouter.post(
  '/documents',
  express.raw({
    type: ['application/pdf', 'image/jpeg', 'image/png', 'application/octet-stream'],
    limit: '5mb',
  }),
  asyncHandler(async (req, res) => {
    const patient = await patientFor(req.user!.id);
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
    if (!allowed.includes(mimeType)) {
      throw new ValidationError({ file: ['Only PDF, JPEG or PNG files are accepted.'] });
    }
    const categoryHeader = (req.get('x-file-category') || 'OTHER').toUpperCase();
    const category = ['REPORT', 'PRESCRIPTION', 'REFERRAL', 'OTHER'].includes(categoryHeader)
      ? categoryHeader
      : 'OTHER';
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

    let appointmentId: string | null = null;
    const requestedAppointment = req.get('x-appointment-id');
    if (requestedAppointment) {
      const appointment = await prisma.appointment.findFirst({
        where: { id: requestedAppointment, patientId: patient.id },
      });
      if (appointment) appointmentId = appointment.id;
    }

    const document = await prisma.medicalDocument.create({
      data: {
        patientId: patient.id,
        uploadedById: req.user!.id,
        appointmentId,
        fileName,
        storageKey,
        mimeType,
        sizeBytes: buffer.length,
        category,
        visibility: 'CARE_TEAM',
      },
    });
    await audit({
      req,
      action: 'DOCUMENT_UPLOADED',
      entityType: 'MedicalDocument',
      entityId: document.id,
      metadata: { category, sizeBytes: buffer.length, mimeType },
    });
    res.status(201).json({
      document: {
        id: document.id,
        fileName: document.fileName,
        mimeType: document.mimeType,
        sizeBytes: document.sizeBytes,
        category: document.category,
        createdAt: document.createdAt.toISOString(),
      },
      message: 'Document stored with access limited to your care team.',
    });
  }),
);

patientRouter.get(
  '/documents/:id/download',
  asyncHandler(async (req, res) => {
    const patient = await patientFor(req.user!.id);
    const document = await prisma.medicalDocument.findFirst({
      where: { id: req.params.id, patientId: patient.id },
      include: { appointment: true },
    });
    if (!document) throw new NotFoundError('Document not found.');
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
    res.download(filePath, document.fileName);
  }),
);

patientRouter.delete(
  '/documents/:id',
  asyncHandler(async (req, res) => {
    const patient = await patientFor(req.user!.id);
    const document = await prisma.medicalDocument.findFirst({
      where: { id: req.params.id, patientId: patient.id },
    });
    if (!document) throw new NotFoundError('Document not found.');
    if (document.uploadedById !== req.user!.id) {
      throw new ValidationError({
        document: ['Documents shared by a clinician can only be removed by the care team.'],
      });
    }
    await prisma.medicalDocument.delete({ where: { id: document.id } });
    try {
      await fs.unlink(path.join(path.resolve(env.UPLOAD_DIR), document.storageKey));
    } catch {
      /* file may already be absent */
    }
    await audit({
      req,
      action: 'DOCUMENT_DELETED',
      entityType: 'MedicalDocument',
      entityId: document.id,
    });
    res.status(204).end();
  }),
);

patientRouter.get(
  '/prescriptions',
  asyncHandler(async (req, res) => {
    const patient = await patientFor(req.user!.id);
    const prescriptions = await prisma.prescription.findMany({
      where: { patientId: patient.id },
      include: {
        doctor: { include: { user: { select: { name: true } } } },
        appointment: { select: { bookingId: true, startAt: true } },
      },
      orderBy: { issuedAt: 'desc' },
    });
    res.json({
      prescriptions: prescriptions.map((prescription) => ({
        ...serializePrescription(prescription),
        doctorName: prescription.doctor.user.name,
        bookingId: prescription.appointment.bookingId,
        appointmentDate: prescription.appointment.startAt.toISOString(),
        disclaimer:
          'Demo prescription record. Medication shown here is illustrative and must not be used as clinical advice.',
      })),
    });
  }),
);

patientRouter.get(
  '/payments',
  asyncHandler(async (req, res) => {
    const patient = await patientFor(req.user!.id);
    const payments = await prisma.payment.findMany({
      where: { appointment: { patientId: patient.id } },
      include: {
        appointment: {
          include: {
            doctor: { include: { user: { select: { name: true } } } },
          },
        },
        refunds: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({
      payments: payments.map((payment) => ({
        id: payment.id,
        bookingId: payment.appointment.bookingId,
        doctorName: payment.appointment.doctor.user.name,
        startAt: payment.appointment.startAt.toISOString(),
        ...serializePayment(payment),
        refunds: payment.refunds.map((refund) => ({
          id: refund.id,
          amountPaise: refund.amountPaise,
          status: refund.status,
          createdAt: refund.createdAt.toISOString(),
        })),
      })),
    });
  }),
);

patientRouter.get(
  '/profile',
  asyncHandler(async (req, res) => {
    const patient = await patientFor(req.user!.id);
    res.json({
      profile: {
        name: patient.user.name,
        email: patient.user.email,
        emailVerified: patient.user.emailVerified,
        phone: patient.phone,
        preferredLanguage: patient.preferredLanguage,
        communicationPreference: patient.communicationPreference,
        marketingConsent: patient.marketingConsent,
        aiHistoryEnabled: patient.aiHistoryEnabled,
        deletionRequestedAt: patient.deletionRequestedAt?.toISOString() || null,
        createdAt: patient.user.createdAt.toISOString(),
      },
    });
  }),
);

patientRouter.patch(
  '/profile',
  validate(patientProfileSchema),
  asyncHandler(async (req, res) => {
    const patient = await patientFor(req.user!.id);
    const body = req.body as {
      name?: string;
      phone?: string;
      preferredLanguage?: string;
      communicationPreference?: string;
      marketingConsent?: boolean;
      aiHistoryEnabled?: boolean;
    };
    if (body.name !== undefined) {
      await prisma.user.update({ where: { id: patient.userId }, data: { name: body.name } });
    }
    await prisma.patientProfile.update({
      where: { id: patient.id },
      data: {
        ...(body.phone !== undefined ? { phone: body.phone || null } : {}),
        ...(body.preferredLanguage ? { preferredLanguage: body.preferredLanguage } : {}),
        ...(body.communicationPreference
          ? { communicationPreference: body.communicationPreference }
          : {}),
        ...(body.marketingConsent !== undefined
          ? { marketingConsent: body.marketingConsent }
          : {}),
        ...(body.aiHistoryEnabled !== undefined
          ? { aiHistoryEnabled: body.aiHistoryEnabled }
          : {}),
      },
    });
    if (body.marketingConsent !== undefined) {
      await prisma.consentRecord.create({
        data: {
          userId: req.user!.id,
          type: 'MARKETING_EMAIL',
          granted: body.marketingConsent,
          ipHash: hashIp(req.ip),
        },
      });
    }
    await audit({
      req,
      action: 'PATIENT_PROFILE_UPDATED',
      entityType: 'PatientProfile',
      entityId: patient.id,
      metadata: { fields: Object.keys(body) },
    });
    res.json({ message: 'Your profile preferences have been updated.' });
  }),
);

patientRouter.get(
  '/notifications',
  asyncHandler(async (req, res) => {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    res.json({
      notifications: notifications.map((item) => ({
        id: item.id,
        title: item.title,
        body: item.body,
        type: item.type,
        readAt: item.readAt?.toISOString() || null,
        createdAt: item.createdAt.toISOString(),
      })),
    });
  }),
);

patientRouter.patch(
  '/notifications/:id/read',
  asyncHandler(async (req, res) => {
    const notification = await prisma.notification.findFirst({
      where: { id: req.params.id, userId: req.user!.id },
    });
    if (!notification) throw new NotFoundError('Notification not found.');
    await prisma.notification.update({
      where: { id: notification.id },
      data: { readAt: new Date() },
    });
    res.json({ message: 'Marked as read.' });
  }),
);

patientRouter.post(
  '/notifications/read-all',
  asyncHandler(async (req, res) => {
    await prisma.notification.updateMany({
      where: { userId: req.user!.id, readAt: null },
      data: { readAt: new Date() },
    });
    res.json({ message: 'All notifications marked as read.' });
  }),
);
