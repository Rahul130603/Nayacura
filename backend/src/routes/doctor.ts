import { Router } from 'express';
import { prisma } from '../config/prisma';
import { asyncHandler, validate } from '../utils/http';
import { requireAuth, requireRole, requireVerifiedDoctor } from '../middleware/auth';
import {
  appointmentStatusSchema,
  availabilityUpdateSchema,
  clinicalNoteSchema,
  doctorProfileUpdateSchema,
  prescriptionSchema,
} from '../validators/schemas';
import { encryptText } from '../utils/crypto';
import { AppError, ForbiddenError, NotFoundError, ValidationError } from '../utils/errors';
import {
  appointmentInclude,
  serializeAppointment,
  serializeClinicalNote,
  serializePrescription,
} from '../services/serializers';
import { audit } from '../utils/audit';
import { DateTime } from 'luxon';

export const doctorRouter = Router();

doctorRouter.use(requireAuth, requireRole('DOCTOR'), requireVerifiedDoctor);

async function doctorFor(userId: string) {
  const doctor = await prisma.doctorProfile.findUnique({
    where: { userId },
    include: { user: true },
  });
  if (!doctor) throw new NotFoundError('Professional profile not found.');
  return doctor;
}

async function ownAppointment(id: string, doctorId: string) {
  const appointment = await prisma.appointment.findFirst({
    where: { id, doctorId },
    include: appointmentInclude,
  });
  if (!appointment) throw new NotFoundError('Appointment not found.');
  return appointment;
}

doctorRouter.get(
  '/overview',
  asyncHandler(async (req, res) => {
    const doctor = await doctorFor(req.user!.id);
    const now = new Date();
    const startOfDay = DateTime.now().setZone(doctor.timezone).startOf('day').toJSDate();
    const endOfDay = DateTime.now().setZone(doctor.timezone).endOf('day').toJSDate();
    const weekEnd = DateTime.now().setZone(doctor.timezone).plus({ days: 7 }).toJSDate();

    const [today, upcoming, requests, completed, notifications, recentPayments] =
      await Promise.all([
        prisma.appointment.findMany({
          where: { doctorId: doctor.id, startAt: { gte: startOfDay, lte: endOfDay } },
          include: appointmentInclude,
          orderBy: { startAt: 'asc' },
        }),
        prisma.appointment.findMany({
          where: {
            doctorId: doctor.id,
            startAt: { gte: now, lte: weekEnd },
            status: { in: ['CONFIRMED', 'PENDING_PAYMENT'] },
          },
          include: appointmentInclude,
          orderBy: { startAt: 'asc' },
          take: 8,
        }),
        prisma.appointment.findMany({
          where: {
            doctorId: doctor.id,
            status: 'PENDING_PAYMENT',
            holdExpiresAt: { gt: now },
          },
          include: appointmentInclude,
          orderBy: { createdAt: 'desc' },
          take: 5,
        }),
        prisma.appointment.count({ where: { doctorId: doctor.id, status: 'COMPLETED' } }),
        prisma.notification.findMany({
          where: { userId: req.user!.id },
          orderBy: { createdAt: 'desc' },
          take: 6,
        }),
        prisma.payment.findMany({
          where: {
            appointment: { doctorId: doctor.id },
            status: { in: ['PAID', 'DEMO_PAID'] },
          },
          select: { totalPaise: true, createdAt: true },
          orderBy: { createdAt: 'desc' },
          take: 50,
        }),
      ]);

    const monthStart = DateTime.now().setZone(doctor.timezone).startOf('month');
    const monthEarnings = recentPayments
      .filter((payment) => payment.createdAt >= monthStart.toJSDate())
      .reduce((total, payment) => total + payment.totalPaise, 0);
    const lifetimeEarnings = recentPayments.reduce((total, payment) => total + payment.totalPaise, 0);

    res.json({
      doctor: {
        id: doctor.id,
        name: doctor.user.name,
        email: doctor.user.email,
        title: doctor.title,
        verified: doctor.verified,
        status: doctor.status,
        timezone: doctor.timezone,
      },
      today: today.map((appointment) => serializeAppointment(appointment, 'DOCTOR')),
      upcoming: upcoming.map((appointment) => serializeAppointment(appointment, 'DOCTOR')),
      requests: requests.map((appointment) => serializeAppointment(appointment, 'DOCTOR')),
      notifications: notifications.map((item) => ({
        id: item.id,
        title: item.title,
        body: item.body,
        type: item.type,
        readAt: item.readAt?.toISOString() || null,
        createdAt: item.createdAt.toISOString(),
      })),
      stats: {
        today: today.length,
        upcoming: upcoming.length,
        completed,
        monthEarningsPaise: monthEarnings,
        lifetimeEarningsPaise: lifetimeEarnings,
      },
      demo: true,
    });
  }),
);

doctorRouter.get(
  '/appointments',
  asyncHandler(async (req, res) => {
    const doctor = await doctorFor(req.user!.id);
    const filter = typeof req.query.filter === 'string' ? req.query.filter : 'all';
    const now = new Date();
    const where =
      filter === 'today'
        ? {
            doctorId: doctor.id,
            startAt: {
              gte: DateTime.now().setZone(doctor.timezone).startOf('day').toJSDate(),
              lte: DateTime.now().setZone(doctor.timezone).endOf('day').toJSDate(),
            },
          }
        : filter === 'upcoming'
          ? {
              doctorId: doctor.id,
              startAt: { gte: now },
              status: { in: ['CONFIRMED', 'PENDING_PAYMENT', 'IN_PROGRESS'] },
            }
          : filter === 'requests'
            ? { doctorId: doctor.id, status: 'PENDING_PAYMENT' }
            : { doctorId: doctor.id };
    const appointments = await prisma.appointment.findMany({
      where,
      include: appointmentInclude,
      orderBy: { startAt: filter === 'upcoming' || filter === 'today' ? 'asc' : 'desc' },
    });
    res.json({
      appointments: appointments.map((appointment) =>
        serializeAppointment(appointment, 'DOCTOR'),
      ),
    });
  }),
);

doctorRouter.patch(
  '/appointments/:id/status',
  validate(appointmentStatusSchema),
  asyncHandler(async (req, res) => {
    const doctor = await doctorFor(req.user!.id);
    const appointment = await ownAppointment(req.params.id, doctor.id);
    const nextStatus = req.body.status as string;
    const allowed: Record<string, string[]> = {
      PENDING_PAYMENT: ['CANCELLED'],
      CONFIRMED: ['IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW'],
      IN_PROGRESS: ['COMPLETED', 'CANCELLED'],
      COMPLETED: [],
      CANCELLED: [],
      NO_SHOW: [],
    };
    if (!(allowed[appointment.status] || []).includes(nextStatus)) {
      throw new ValidationError({
        status: [`This appointment cannot move from ${appointment.status} to ${nextStatus}.`],
      });
    }

    const updated = await prisma.$transaction(async (tx) => {
      await tx.appointment.update({
        where: { id: appointment.id },
        data: {
          status: nextStatus,
          ...(nextStatus === 'CANCELLED'
            ? { cancelledAt: new Date(), cancellationReason: req.body.note || 'Clinician cancellation' }
            : {}),
          statusHistory: {
            create: {
              status: nextStatus,
              note: req.body.note || null,
              changedBy: req.user!.id,
            },
          },
        },
      });
      if (nextStatus === 'IN_PROGRESS' && appointment.consultation) {
        await tx.consultation.update({
          where: { id: appointment.consultation.id },
          data: { status: 'LIVE', startedAt: new Date() },
        });
      }
      if (nextStatus === 'COMPLETED' && appointment.consultation) {
        await tx.consultation.update({
          where: { id: appointment.consultation.id },
          data: { status: 'ENDED', endedAt: new Date() },
        });
      }
      await tx.notification.create({
        data: {
          userId: appointment.patient.userId,
          type: 'APPOINTMENT_STATUS',
          title: `Consultation ${nextStatus.toLowerCase().replace(/_/g, ' ')}`,
          body: `Booking ${appointment.bookingId} has been updated. Sign in to your dashboard for details.`,
        },
      });
      return tx.appointment.findUniqueOrThrow({
        where: { id: appointment.id },
        include: appointmentInclude,
      });
    });

    await audit({
      req,
      action: 'APPOINTMENT_STATUS_UPDATED',
      entityType: 'Appointment',
      entityId: appointment.id,
      metadata: { from: appointment.status, to: nextStatus },
    });
    res.json({
      appointment: serializeAppointment(updated, 'DOCTOR'),
      message: 'Appointment status updated.',
    });
  }),
);

doctorRouter.get(
  '/availability',
  asyncHandler(async (req, res) => {
    const doctor = await doctorFor(req.user!.id);
    const windows = await prisma.doctorAvailability.findMany({
      where: { doctorId: doctor.id },
      orderBy: [{ weekday: 'asc' }, { startMinute: 'asc' }],
    });
    res.json({
      windows: windows.map((window) => ({
        id: window.id,
        weekday: window.weekday,
        startMinute: window.startMinute,
        endMinute: window.endMinute,
        mode: window.mode,
        slotMinutes: window.slotMinutes,
        active: window.active,
      })),
      timezone: doctor.timezone,
    });
  }),
);

doctorRouter.put(
  '/availability',
  validate(availabilityUpdateSchema),
  asyncHandler(async (req, res) => {
    const doctor = await doctorFor(req.user!.id);
    const windows = req.body.windows as {
      weekday: number;
      startMinute: number;
      endMinute: number;
      mode: string;
    }[];
    for (const window of windows) {
      if (window.endMinute <= window.startMinute) {
        throw new ValidationError({
          windows: ['Each availability window must end after it starts.'],
        });
      }
    }
    await prisma.$transaction(async (tx) => {
      await tx.doctorAvailability.deleteMany({ where: { doctorId: doctor.id } });
      if (windows.length) {
        await tx.doctorAvailability.createMany({
          data: windows.map((window) => ({
            doctorId: doctor.id,
            weekday: window.weekday,
            startMinute: window.startMinute,
            endMinute: window.endMinute,
            mode: window.mode,
            slotMinutes: 30,
            active: true,
          })),
        });
      }
    });
    await audit({
      req,
      action: 'AVAILABILITY_UPDATED',
      entityType: 'DoctorProfile',
      entityId: doctor.id,
      metadata: { windows: windows.length },
    });
    res.json({ message: 'Availability updated.', count: windows.length });
  }),
);

doctorRouter.get(
  '/profile',
  asyncHandler(async (req, res) => {
    const doctor = await prisma.doctorProfile.findUnique({
      where: { userId: req.user!.id },
      include: {
        user: { select: { name: true, email: true } },
        specializations: { include: { specialization: true } },
        credentials: true,
        clinics: { include: { clinic: true } },
      },
    });
    if (!doctor) throw new NotFoundError('Professional profile not found.');
    res.json({
      profile: {
        id: doctor.id,
        name: doctor.user.name,
        email: doctor.user.email,
        slug: doctor.slug,
        title: doctor.title,
        bio: doctor.bio,
        approach: doctor.approach,
        gender: doctor.gender,
        experienceYears: doctor.experienceYears,
        languages: JSON.parse(doctor.languages),
        feePaise: doctor.feePaise,
        followUpFeePaise: doctor.followUpFeePaise,
        onlineEnabled: doctor.onlineEnabled,
        inPersonEnabled: doctor.inPersonEnabled,
        city: doctor.city,
        timezone: doctor.timezone,
        verified: doctor.verified,
        status: doctor.status,
        specializations: doctor.specializations.map((item) => item.specialization.name),
        credentials: doctor.credentials,
        clinics: doctor.clinics.map((item) => item.clinic),
      },
    });
  }),
);

doctorRouter.patch(
  '/profile',
  validate(doctorProfileUpdateSchema),
  asyncHandler(async (req, res) => {
    const doctor = await doctorFor(req.user!.id);
    const body = req.body as {
      bio?: string;
      approach?: string;
      feePaise?: number;
      followUpFeePaise?: number;
      onlineEnabled?: boolean;
      inPersonEnabled?: boolean;
      languages?: string[];
    };
    await prisma.doctorProfile.update({
      where: { id: doctor.id },
      data: {
        ...(body.bio ? { bio: body.bio } : {}),
        ...(body.approach ? { approach: body.approach } : {}),
        ...(body.feePaise !== undefined ? { feePaise: body.feePaise } : {}),
        ...(body.followUpFeePaise !== undefined
          ? { followUpFeePaise: body.followUpFeePaise }
          : {}),
        ...(body.onlineEnabled !== undefined ? { onlineEnabled: body.onlineEnabled } : {}),
        ...(body.inPersonEnabled !== undefined ? { inPersonEnabled: body.inPersonEnabled } : {}),
        ...(body.languages ? { languages: JSON.stringify(body.languages) } : {}),
      },
    });
    await audit({
      req,
      action: 'DOCTOR_PROFILE_UPDATED',
      entityType: 'DoctorProfile',
      entityId: doctor.id,
      metadata: { fields: Object.keys(body) },
    });
    res.json({
      message:
        'Profile updated. Fee and availability changes apply to future bookings only; existing appointments keep their agreed price.',
    });
  }),
);

doctorRouter.get(
  '/earnings',
  asyncHandler(async (req, res) => {
    const doctor = await doctorFor(req.user!.id);
    const payments = await prisma.payment.findMany({
      where: {
        appointment: { doctorId: doctor.id },
        status: { in: ['PAID', 'DEMO_PAID'] },
      },
      include: {
        appointment: {
          include: {
            patient: { include: { user: { select: { name: true } } } },
          },
        },
        refunds: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    const total = payments.reduce((sum, payment) => sum + payment.totalPaise, 0);
    res.json({
      earnings: {
        lifetimePaise: total,
        pendingSettlementPaise: 0,
        currency: 'INR',
        demoNote:
          'Gross demonstration amounts only. No settlement, platform fee, tax withholding or bank transfer is implemented.',
      },
      transactions: payments.map((payment) => ({
        id: payment.id,
        bookingId: payment.appointment.bookingId,
        patientName: payment.appointment.patient.user.name,
        totalPaise: payment.totalPaise,
        status: payment.status,
        paidAt: payment.paidAt?.toISOString() || null,
        refunds: payment.refunds.map((refund) => ({
          amountPaise: refund.amountPaise,
          status: refund.status,
        })),
      })),
    });
  }),
);

doctorRouter.post(
  '/appointments/:id/notes',
  validate(clinicalNoteSchema),
  asyncHandler(async (req, res) => {
    const doctor = await doctorFor(req.user!.id);
    const appointment = await ownAppointment(req.params.id, doctor.id);
    if (!['CONFIRMED', 'IN_PROGRESS', 'COMPLETED'].includes(appointment.status)) {
      throw new ValidationError({
        status: ['Clinical notes can be added to a confirmed, active or completed consultation.'],
      });
    }
    const note = await prisma.clinicalNote.create({
      data: {
        appointmentId: appointment.id,
        doctorId: doctor.id,
        patientId: appointment.patientId,
        encryptedContent: encryptText(req.body.content),
      },
    });
    await prisma.notification.create({
      data: {
        userId: appointment.patient.userId,
        type: 'CLINICAL_NOTE_ADDED',
        title: 'A consultation note was added',
        body: `Your clinician added a note to booking ${appointment.bookingId}. Open your dashboard to view it.`,
      },
    });
    await audit({
      req,
      action: 'CLINICAL_NOTE_CREATED',
      entityType: 'ClinicalNote',
      entityId: note.id,
      metadata: { appointmentId: appointment.id },
    });
    res.status(201).json({ note: serializeClinicalNote(note) });
  }),
);

doctorRouter.post(
  '/appointments/:id/prescriptions',
  validate(prescriptionSchema),
  asyncHandler(async (req, res) => {
    const doctor = await doctorFor(req.user!.id);
    const appointment = await ownAppointment(req.params.id, doctor.id);
    if (!['IN_PROGRESS', 'COMPLETED'].includes(appointment.status)) {
      throw new ValidationError({
        status: ['A prescription can be issued only during or after an active consultation.'],
      });
    }
    const prescription = await prisma.prescription.create({
      data: {
        appointmentId: appointment.id,
        doctorId: doctor.id,
        patientId: appointment.patientId,
        encryptedMedications: encryptText(JSON.stringify(req.body.medications)),
        encryptedInstructions: encryptText(req.body.instructions),
      },
    });
    await prisma.notification.create({
      data: {
        userId: appointment.patient.userId,
        type: 'PRESCRIPTION_ISSUED',
        title: 'A prescription record was added',
        body: `A prescription record was added to booking ${appointment.bookingId}. Open your dashboard to review it.`,
      },
    });
    await audit({
      req,
      action: 'PRESCRIPTION_CREATED',
      entityType: 'Prescription',
      entityId: prescription.id,
      metadata: { appointmentId: appointment.id },
    });
    res.status(201).json({
      prescription: serializePrescription(prescription),
      warning:
        'Development demo only. A prescription must only be issued by a legally registered clinician after an appropriate assessment, with valid consent and compliant record-keeping.',
    });
  }),
);

doctorRouter.get(
  '/appointments/:id/clinical',
  asyncHandler(async (req, res) => {
    const doctor = await doctorFor(req.user!.id);
    const appointment = await ownAppointment(req.params.id, doctor.id);
    const [notes, prescriptions] = await Promise.all([
      prisma.clinicalNote.findMany({
        where: { appointmentId: appointment.id },
        orderBy: { createdAt: 'asc' },
      }),
      prisma.prescription.findMany({
        where: { appointmentId: appointment.id },
        orderBy: { issuedAt: 'desc' },
      }),
    ]);
    res.json({
      notes: notes.map(serializeClinicalNote),
      prescriptions: prescriptions.map(serializePrescription),
      appointment: serializeAppointment(appointment, 'DOCTOR'),
    });
  }),
);

doctorRouter.post(
  '/appointments/:id/cancel',
  asyncHandler(async (req, res) => {
    const doctor = await doctorFor(req.user!.id);
    const appointment = await ownAppointment(req.params.id, doctor.id);
    if (['CANCELLED', 'COMPLETED', 'NO_SHOW'].includes(appointment.status)) {
      throw new ValidationError({ status: ['This appointment cannot be cancelled.'] });
    }
    if (appointment.startAt <= new Date()) {
      throw new AppError('Past appointments cannot be cancelled online.', 409, 'PAST_APPOINTMENT');
    }
    const refundAmount = ['PAID', 'DEMO_PAID'].includes(appointment.payment?.status || '')
      ? appointment.payment?.totalPaise || 0
      : 0;
    const updated = await prisma.$transaction(async (tx) => {
      await tx.appointment.update({
        where: { id: appointment.id },
        data: {
          status: 'CANCELLED',
          cancelledAt: new Date(),
          cancellationReason: req.body?.reason || 'Clinician cancellation',
          holdExpiresAt: null,
          statusHistory: {
            create: {
              status: 'CANCELLED',
              note: 'Clinician cancelled the appointment. Full refund recorded as pending.',
              changedBy: req.user!.id,
            },
          },
        },
      });
      if (refundAmount && appointment.payment) {
        await tx.refund.create({
          data: {
            paymentId: appointment.payment.id,
            amountPaise: refundAmount,
            status: 'PENDING',
            reason: 'Clinician cancellation',
          },
        });
      }
      await tx.notification.create({
        data: {
          userId: appointment.patient.userId,
          type: 'BOOKING_CANCELLED',
          title: 'Your clinician cancelled',
          body: `Booking ${appointment.bookingId} has been cancelled. A refund request has been recorded as pending if payment was made.`,
        },
      });
      return tx.appointment.findUniqueOrThrow({
        where: { id: appointment.id },
        include: appointmentInclude,
      });
    });
    await audit({
      req,
      action: 'APPOINTMENT_CANCELLED_BY_DOCTOR',
      entityType: 'Appointment',
      entityId: appointment.id,
      metadata: { bookingId: appointment.bookingId },
    });
    res.json({
      appointment: serializeAppointment(updated, 'DOCTOR'),
      message: 'Appointment cancelled. Any refund is recorded as pending.',
    });
  }),
);
