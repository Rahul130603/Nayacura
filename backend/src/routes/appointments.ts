import { Router } from 'express';
import { AccessToken, RoomServiceClient } from 'livekit-server-sdk';
import { z } from 'zod';
import { prisma } from '../config/prisma';
import { env } from '../config/env';
import { asyncHandler, validate } from '../utils/http';
import { requireAuth } from '../middleware/auth';
import {
  cancelAppointmentSchema,
  createAppointmentSchema,
  rescheduleAppointmentSchema,
  verifyPaymentSchema,
} from '../validators/schemas';
import {
  AppError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from '../utils/errors';
import {
  bookingId as makeBookingId,
  randomToken,
} from '../utils/crypto';
import {
  hasBookingConflict,
  validateBookingSlot,
  withinJoinWindow,
} from '../services/slots';
import {
  appointmentInclude,
  serializeAppointment,
  serializeClinicalNote,
  serializePrescription,
} from '../services/serializers';
import { createPaymentOrder, fetchAndValidateRazorpayPayment, verifyRazorpaySignature } from '../services/payments';
import { sendBookingCancellation, sendBookingConfirmation } from '../services/mailer';
import { audit } from '../utils/audit';
import { logger } from '../utils/logger';

export const appointmentsRouter = Router();

const reviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  title: z.string().trim().max(100).optional(),
  body: z.string().trim().min(10, 'Please add a little more detail.').max(1500),
});

async function loadAppointment(id: string) {
  return prisma.appointment.findUnique({
    where: { id },
    include: appointmentInclude,
  });
}

async function getActor(req: Express.Request) {
  const user = req.user!;
  const [patient, doctor] = await Promise.all([
    user.role === 'PATIENT'
      ? prisma.patientProfile.findUnique({ where: { userId: user.id } })
      : Promise.resolve(null),
    user.role === 'DOCTOR'
      ? prisma.doctorProfile.findUnique({ where: { userId: user.id } })
      : Promise.resolve(null),
  ]);
  return { patient, doctor };
}

async function assertAppointmentAccess(
  req: Express.Request,
  appointment: NonNullable<Awaited<ReturnType<typeof loadAppointment>>>,
) {
  const { patient, doctor } = await getActor(req);
  if (req.user!.role === 'PATIENT' && appointment.patientId !== patient?.id) {
    throw new NotFoundError('That appointment could not be found.');
  }
  if (req.user!.role === 'DOCTOR' && appointment.doctorId !== doctor?.id) {
    throw new NotFoundError('That appointment could not be found.');
  }
  if (!['PATIENT', 'DOCTOR'].includes(req.user!.role)) {
    throw new ForbiddenError('Administrators do not have access to confidential appointment details.');
  }
  return { patient, doctor };
}

appointmentsRouter.post(
  '/',
  requireAuth,
  validate(createAppointmentSchema),
  asyncHandler(async (req, res) => {
    if (req.user!.role !== 'PATIENT') {
      throw new ForbiddenError('Only patient accounts can book consultations.');
    }
    const body = req.body as {
      doctorSlug: string;
      mode: 'ONLINE' | 'IN_PERSON';
      startAt: string;
      serviceSlug?: string;
      fullName: string;
      email: string;
      phone: string;
      reason?: string;
      communicationPreference: string;
    };

    const [doctor, patient] = await Promise.all([
      prisma.doctorProfile.findFirst({
        where: { slug: body.doctorSlug, verified: true, status: 'VERIFIED' },
        include: { user: true, availabilities: true, clinics: true },
      }),
      prisma.patientProfile.findUnique({ where: { userId: req.user!.id } }),
    ]);
    if (!doctor) throw new NotFoundError('That specialist is not available for booking.');
    if (!patient) throw new NotFoundError('Your patient profile could not be found.');
    if (body.mode === 'ONLINE' && !doctor.onlineEnabled) {
      throw new ValidationError({ mode: ['This clinician does not offer video consultations.'] });
    }
    if (body.mode === 'IN_PERSON' && !doctor.inPersonEnabled) {
      throw new ValidationError({ mode: ['This clinician does not offer in-person consultations.'] });
    }

    const slot = await validateBookingSlot({
      doctorId: doctor.id,
      timezone: doctor.timezone,
      startAt: body.startAt,
      mode: body.mode,
    });
    if (!slot.valid) throw new ValidationError({ startAt: [slot.reason] });

    const taxPaise = Math.round((doctor.feePaise * env.TAX_PERCENT) / 100);
    const totalPaise = doctor.feePaise + taxPaise;
    const booking = makeBookingId();
    const holdExpiresAt = new Date(Date.now() + 15 * 60 * 1000);

    // Expired payment holds must release the slot before a new booking can use it.
    await prisma.appointment.updateMany({
      where: {
        doctorId: doctor.id,
        status: 'PENDING_PAYMENT',
        holdExpiresAt: { lt: new Date() },
      },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
        cancellationReason: 'Payment hold expired automatically.',
      },
    });

    let appointment;
    try {
      appointment = await prisma.$transaction(async (tx) => {
        const conflict = await tx.appointment.findFirst({
          where: {
            doctorId: doctor.id,
            startAt: { lt: slot.endAt },
            endAt: { gt: slot.startAt },
            OR: [
              { status: { in: ['CONFIRMED', 'IN_PROGRESS'] } },
              { status: 'PENDING_PAYMENT', holdExpiresAt: { gt: new Date() } },
            ],
          },
          select: { id: true },
        });
        if (conflict) throw new ConflictError();

        return tx.appointment.create({
          data: {
            bookingId: booking,
            patientId: patient.id,
            doctorId: doctor.id,
            clinicId: doctor.clinics[0]?.clinicId || null,
            mode: body.mode,
            status: 'PENDING_PAYMENT',
            startAt: slot.startAt,
            endAt: slot.endAt,
            timezone: doctor.timezone,
            reason: body.reason || null,
            feePaise: doctor.feePaise,
            taxPaise,
            totalPaise,
            holdExpiresAt,
            videoRoomName: `nayacura-${randomToken(10).toLowerCase()}`,
            statusHistory: {
              create: {
                status: 'PENDING_PAYMENT',
                note: 'Slot held for secure payment.',
                changedBy: req.user!.id,
              },
            },
            payment: {
              create: {
                amountPaise: doctor.feePaise,
                taxPaise,
                totalPaise,
                status: 'CREATED',
                provider: 'DEMO',
              },
            },
          },
          include: appointmentInclude,
        });
      });
    } catch (error) {
      if (error instanceof ConflictError) throw error;
      throw error;
    }

    try {
      const order = await createPaymentOrder({
        amountPaise: totalPaise,
        receipt: booking,
        bookingId: booking,
      });
      await prisma.payment.update({
        where: { appointmentId: appointment.id },
        data: {
          provider: order.provider,
          providerOrderId: order.providerOrderId,
        },
      });
      await prisma.patientProfile.update({
        where: { id: patient.id },
        data: {
          phone: body.phone,
          preferredLanguage: patient.preferredLanguage,
          communicationPreference: body.communicationPreference,
          ageConfirmed: true,
        },
      });

      await audit({
        req,
        action: 'APPOINTMENT_CREATED',
        entityType: 'Appointment',
        entityId: appointment.id,
        metadata: {
          bookingId: appointment.bookingId,
          doctorId: doctor.id,
          mode: body.mode,
          paymentProvider: order.provider,
        },
      });

      res.status(201).json({
        appointment: serializeAppointment(
          await prisma.appointment.findUniqueOrThrow({
            where: { id: appointment.id },
            include: appointmentInclude,
          }),
          'PATIENT',
        ),
        payment: {
          provider: order.provider,
          providerOrderId: order.providerOrderId,
          keyId: order.keyId,
          amountPaise: totalPaise,
          mode: order.mode,
          holdExpiresAt: holdExpiresAt.toISOString(),
        },
        message:
          order.mode === 'demo'
            ? 'Demo booking created. Complete the simulated payment to confirm the slot.'
            : 'Booking held. Complete payment to confirm.',
      });
    } catch (error) {
      logger.error('Payment order creation failed', {
        appointmentId: appointment.id,
        error: error instanceof Error ? error.message : String(error),
      });
      throw new AppError(
        'The appointment was held, but the payment service could not be started. Please try again from your dashboard.',
        502,
        'PAYMENT_START_FAILED',
        { appointmentId: appointment.id },
      );
    }
  }),
);

appointmentsRouter.get(
  '/:id',
  requireAuth,
  asyncHandler(async (req, res) => {
    const appointment = await loadAppointment(req.params.id);
    if (!appointment) throw new NotFoundError('That appointment could not be found.');
    await assertAppointmentAccess(req, appointment);
    res.json({
      appointment: serializeAppointment(
        appointment,
        req.user!.role === 'DOCTOR' ? 'DOCTOR' : 'PATIENT',
      ),
    });
  }),
);

appointmentsRouter.post(
  '/:id/payment/verify',
  requireAuth,
  validate(verifyPaymentSchema),
  asyncHandler(async (req, res) => {
    const appointment = await loadAppointment(req.params.id);
    if (!appointment) throw new NotFoundError('That appointment could not be found.');
    if (req.user!.role !== 'PATIENT') throw new ForbiddenError();
    const { patient } = await assertAppointmentAccess(req, appointment);
    if (!patient || appointment.patientId !== patient.id) throw new ForbiddenError();
    if (!appointment.payment) throw new NotFoundError('Payment record not found.');
    if (appointment.payment.status === 'PAID' || appointment.payment.status === 'DEMO_PAID') {
      return res.json({
        appointment: serializeAppointment(appointment, 'PATIENT'),
        payment: { status: appointment.payment.status },
        message: 'This consultation is already confirmed.',
      });
    }
    const body = req.body as {
      razorpay_order_id?: string;
      razorpay_payment_id?: string;
      razorpay_signature?: string;
      demo?: boolean;
    };

    let nextStatus: 'PAID' | 'DEMO_PAID';
    if (appointment.payment.provider === 'DEMO') {
      if (!env.isDemo) {
        throw new AppError(
          'Demo payment is disabled. Configure Razorpay before accepting payments.',
          503,
          'PAYMENT_NOT_CONFIGURED',
        );
      }
      if (body.demo !== true) throw new ValidationError({ demo: ['Confirm the demo payment.'] });
      nextStatus = 'DEMO_PAID';
    } else {
      if (!body.razorpay_order_id || !body.razorpay_payment_id || !body.razorpay_signature) {
        throw new ValidationError({ payment: ['Payment verification details are missing.'] });
      }
      if (body.razorpay_order_id !== appointment.payment.providerOrderId) {
        throw new ValidationError({ payment: ['Payment order does not match this booking.'] });
      }
      const valid = verifyRazorpaySignature({
        orderId: body.razorpay_order_id,
        paymentId: body.razorpay_payment_id,
        signature: body.razorpay_signature,
      });
      if (!valid) {
        throw new AppError('Payment signature could not be verified.', 400, 'PAYMENT_INVALID');
      }
      await fetchAndValidateRazorpayPayment({
        paymentId: body.razorpay_payment_id,
        orderId: body.razorpay_order_id,
        expectedAmountPaise: appointment.payment.totalPaise,
      });
      nextStatus = 'PAID';
    }

    const updated = await prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { id: appointment.payment!.id },
        data: {
          status: nextStatus,
          paidAt: new Date(),
          providerPaymentId: body.razorpay_payment_id || null,
          providerSignature: body.razorpay_signature || null,
        },
      });
      await tx.appointment.update({
        where: { id: appointment.id },
        data: {
          status: 'CONFIRMED',
          holdExpiresAt: null,
          statusHistory: {
            create: {
              status: 'CONFIRMED',
              note:
                nextStatus === 'DEMO_PAID'
                  ? 'Demo payment completed; appointment confirmed.'
                  : 'Payment verified; appointment confirmed.',
              changedBy: req.user!.id,
            },
          },
        },
      });
      await tx.consultation.upsert({
        where: { appointmentId: appointment.id },
        create: {
          appointmentId: appointment.id,
          roomName: appointment.videoRoomName || `nayacura-${randomToken(10).toLowerCase()}`,
        },
        update: {},
      });
      await tx.notification.create({
        data: {
          userId: req.user!.id,
          type: 'BOOKING_CONFIRMED',
          title: 'Your consultation is confirmed',
          body: `Booking ${appointment.bookingId} with ${appointment.doctor.user.name}. Open your dashboard for details.`,
        },
      });
      return tx.appointment.findUniqueOrThrow({
        where: { id: appointment.id },
        include: appointmentInclude,
      });
    });

    await sendBookingConfirmation({
      to: req.user!.email,
      bookingId: updated.bookingId,
      doctorName: updated.doctor.user.name,
      startAt: updated.startAt,
      timezone: updated.timezone,
      mode: updated.mode,
    });
    await audit({
      req,
      action: 'PAYMENT_VERIFIED',
      entityType: 'Payment',
      entityId: appointment.payment.id,
      metadata: {
        bookingId: appointment.bookingId,
        provider: appointment.payment.provider,
        demo: nextStatus === 'DEMO_PAID',
      },
    });
    res.json({
      appointment: serializeAppointment(updated, 'PATIENT'),
      payment: { status: nextStatus },
      message:
        nextStatus === 'DEMO_PAID'
          ? 'Demo payment recorded. No real money was charged.'
          : 'Payment verified and appointment confirmed.',
    });
  }),
);

appointmentsRouter.post(
  '/:id/payment/order',
  requireAuth,
  asyncHandler(async (req, res) => {
    const appointment = await loadAppointment(req.params.id);
    if (!appointment) throw new NotFoundError('That appointment could not be found.');
    if (req.user!.role !== 'PATIENT') throw new ForbiddenError();
    if (appointment.patientId !== (await getActor(req)).patient?.id) throw new ForbiddenError();
    if (!appointment.payment) throw new NotFoundError('Payment record not found.');
    if (appointment.status !== 'PENDING_PAYMENT') {
      throw new ValidationError({ status: ['This booking is no longer awaiting payment.'] });
    }
    if (appointment.payment.status !== 'CREATED') {
      throw new ValidationError({ payment: ['This payment can no longer be started.'] });
    }
    if (appointment.holdExpiresAt && appointment.holdExpiresAt < new Date()) {
      throw new AppError(
        'This booking hold expired. Please choose a new time.',
        409,
        'HOLD_EXPIRED',
      );
    }
    const order = await createPaymentOrder({
      amountPaise: appointment.payment.totalPaise,
      receipt: appointment.bookingId,
      bookingId: appointment.bookingId,
    });
    await prisma.payment.update({
      where: { id: appointment.payment.id },
      data: { provider: order.provider, providerOrderId: order.providerOrderId },
    });
    res.json({
      payment: {
        provider: order.provider,
        providerOrderId: order.providerOrderId,
        keyId: order.keyId,
        amountPaise: appointment.payment.totalPaise,
        mode: order.mode,
      },
    });
  }),
);

appointmentsRouter.post(
  '/:id/cancel',
  requireAuth,
  validate(cancelAppointmentSchema),
  asyncHandler(async (req, res) => {
    const appointment = await loadAppointment(req.params.id);
    if (!appointment) throw new NotFoundError('That appointment could not be found.');
    await assertAppointmentAccess(req, appointment);
    if (['CANCELLED', 'COMPLETED', 'NO_SHOW'].includes(appointment.status)) {
      throw new ValidationError({ status: ['This appointment cannot be cancelled.'] });
    }

    const isDoctor = req.user!.role === 'DOCTOR';
    const paid = ['PAID', 'DEMO_PAID'].includes(appointment.payment?.status || '');
    const hoursUntil = (appointment.startAt.getTime() - Date.now()) / (1000 * 60 * 60);
    const refundable = paid && (isDoctor || hoursUntil >= 24);
    const refundAmount = refundable ? appointment.payment?.totalPaise || 0 : 0;

    const updated = await prisma.$transaction(async (tx) => {
      await tx.appointment.update({
        where: { id: appointment.id },
        data: {
          status: 'CANCELLED',
          cancelledAt: new Date(),
          cancellationReason: req.body.reason || null,
          holdExpiresAt: null,
          statusHistory: {
            create: {
              status: 'CANCELLED',
              note: isDoctor ? 'Cancelled by clinician.' : 'Cancelled by patient.',
              changedBy: req.user!.id,
            },
          },
        },
      });
      if (refundAmount > 0 && appointment.payment) {
        await tx.refund.create({
          data: {
            paymentId: appointment.payment.id,
            amountPaise: refundAmount,
            status: 'PENDING',
            reason: isDoctor ? 'Clinician cancellation' : 'Cancelled within refund window',
          },
        });
      }
      await tx.notification.create({
        data: {
          userId: appointment.patient.userId,
          type: 'BOOKING_CANCELLED',
          title: 'Consultation cancelled',
          body: `Booking ${appointment.bookingId} has been cancelled. ${
            refundAmount > 0 ? 'A refund request has been recorded as pending.' : ''
          }`,
        },
      });
      return tx.appointment.findUniqueOrThrow({
        where: { id: appointment.id },
        include: appointmentInclude,
      });
    });

    await sendBookingCancellation({
      to: req.user!.role === 'PATIENT' ? req.user!.email : appointment.patient.user.email,
      bookingId: appointment.bookingId,
      doctorName: appointment.doctor.user.name,
      startAt: appointment.startAt,
      timezone: appointment.timezone,
    });
    await audit({
      req,
      action: 'APPOINTMENT_CANCELLED',
      entityType: 'Appointment',
      entityId: appointment.id,
      metadata: {
        bookingId: appointment.bookingId,
        cancelledBy: req.user!.role,
        refundRecorded: refundAmount > 0,
      },
    });
    res.json({
      appointment: serializeAppointment(
        updated,
        req.user!.role === 'DOCTOR' ? 'DOCTOR' : 'PATIENT',
      ),
      refund: refundAmount
        ? {
            amountPaise: refundAmount,
            status: 'PENDING',
            note: 'Refund is recorded, not yet processed. Live gateway processing is not enabled in this demo.',
          }
        : null,
      message: 'The appointment has been cancelled.',
    });
  }),
);

appointmentsRouter.post(
  '/:id/reschedule',
  requireAuth,
  validate(rescheduleAppointmentSchema),
  asyncHandler(async (req, res) => {
    if (req.user!.role !== 'PATIENT') throw new ForbiddenError();
    const appointment = await loadAppointment(req.params.id);
    if (!appointment) throw new NotFoundError('That appointment could not be found.');
    await assertAppointmentAccess(req, appointment);
    if (!['CONFIRMED', 'PENDING_PAYMENT'].includes(appointment.status)) {
      throw new ValidationError({ status: ['This appointment cannot be rescheduled.'] });
    }
    if (appointment.startAt <= new Date()) {
      throw new ValidationError({ startAt: ['Past appointments cannot be rescheduled.'] });
    }
    const slot = await validateBookingSlot({
      doctorId: appointment.doctorId,
      timezone: appointment.doctor.timezone,
      startAt: req.body.startAt,
      mode: appointment.mode as 'ONLINE' | 'IN_PERSON',
    });
    if (!slot.valid) throw new ValidationError({ startAt: [slot.reason] });
    const conflict = await hasBookingConflict(appointment.doctorId, slot.startAt, slot.endAt);
    if (conflict) throw new ConflictError();

    const updated = await prisma.$transaction(async (tx) => {
      await tx.appointment.update({
        where: { id: appointment.id },
        data: {
          startAt: slot.startAt,
          endAt: slot.endAt,
          status: 'CONFIRMED',
          holdExpiresAt: null,
          statusHistory: {
            create: {
              status: 'CONFIRMED',
              note: 'Rescheduled by patient.',
              changedBy: req.user!.id,
            },
          },
        },
      });
      await tx.notification.create({
        data: {
          userId: appointment.doctor.userId,
          type: 'BOOKING_RESCHEDULED',
          title: 'Appointment rescheduled',
          body: `Booking ${appointment.bookingId} was moved to a new time.`,
        },
      });
      return tx.appointment.findUniqueOrThrow({
        where: { id: appointment.id },
        include: appointmentInclude,
      });
    });
    await audit({
      req,
      action: 'APPOINTMENT_RESCHEDULED',
      entityType: 'Appointment',
      entityId: appointment.id,
      metadata: { bookingId: appointment.bookingId },
    });
    res.json({
      appointment: serializeAppointment(updated, 'PATIENT'),
      message: 'Your appointment has been moved.',
    });
  }),
);

appointmentsRouter.get(
  '/:id/notes',
  requireAuth,
  asyncHandler(async (req, res) => {
    const appointment = await loadAppointment(req.params.id);
    if (!appointment) throw new NotFoundError('That appointment could not be found.');
    await assertAppointmentAccess(req, appointment);
    const notes = await prisma.clinicalNote.findMany({
      where: { appointmentId: appointment.id },
      orderBy: { createdAt: 'asc' },
    });
    res.json({ notes: notes.map(serializeClinicalNote) });
  }),
);

appointmentsRouter.get(
  '/:id/prescriptions',
  requireAuth,
  asyncHandler(async (req, res) => {
    const appointment = await loadAppointment(req.params.id);
    if (!appointment) throw new NotFoundError('That appointment could not be found.');
    await assertAppointmentAccess(req, appointment);
    const prescriptions = await prisma.prescription.findMany({
      where: { appointmentId: appointment.id },
      orderBy: { issuedAt: 'desc' },
    });
    res.json({ prescriptions: prescriptions.map(serializePrescription) });
  }),
);

appointmentsRouter.post(
  '/:id/consultation/consent',
  requireAuth,
  asyncHandler(async (req, res) => {
    const appointment = await loadAppointment(req.params.id);
    if (!appointment) throw new NotFoundError('That appointment could not be found.');
    await assertAppointmentAccess(req, appointment);
    if (appointment.mode !== 'ONLINE') {
      throw new ValidationError({ mode: ['This is an in-person appointment.'] });
    }
    if (!['CONFIRMED', 'IN_PROGRESS'].includes(appointment.status)) {
      throw new ValidationError({ status: ['This consultation is not ready to join.'] });
    }
    if (!req.body?.teleconsultationConsent || req.body?.recordingConsent) {
      throw new ValidationError({
        consent: [
          'Teleconsultation consent is required. Recording consent is not offered by default in this demo.',
        ],
      });
    }
    const roomName =
      appointment.videoRoomName || appointment.consultation?.roomName || `nayacura-${randomToken(10)}`;
    const consultation = await prisma.consultation.upsert({
      where: { appointmentId: appointment.id },
      create: {
        appointmentId: appointment.id,
        roomName,
        consentRecordedAt: new Date(),
        recordingConsent: false,
      },
      update: {
        consentRecordedAt: new Date(),
        recordingConsent: false,
      },
    });
    await prisma.consentRecord.create({
      data: {
        userId: req.user!.id,
        type: 'TELECONSULTATION',
        granted: true,
        version: 'draft-2026-11',
      },
    });
    await audit({
      req,
      action: 'TELECONSULTATION_CONSENT_RECORDED',
      entityType: 'Consultation',
      entityId: consultation.id,
    });
    res.json({
      consultation: {
        id: consultation.id,
        roomName: consultation.roomName,
        status: consultation.status,
      },
      message: 'Consent recorded. You can now open the consultation room.',
    });
  }),
);

appointmentsRouter.get(
  '/:id/video-token',
  requireAuth,
  asyncHandler(async (req, res) => {
    const appointment = await loadAppointment(req.params.id);
    if (!appointment) throw new NotFoundError('That appointment could not be found.');
    await assertAppointmentAccess(req, appointment);
    if (appointment.mode !== 'ONLINE') {
      throw new ValidationError({ mode: ['This is not a video appointment.'] });
    }
    if (!['CONFIRMED', 'IN_PROGRESS'].includes(appointment.status)) {
      throw new ValidationError({ status: ['This consultation is not active.'] });
    }
    if (!withinJoinWindow(appointment.startAt, appointment.endAt)) {
      throw new ForbiddenError(
        'The secure room opens 15 minutes before the appointment and closes 30 minutes after it ends.',
      );
    }
    if (!appointment.consultation?.consentRecordedAt) {
      throw new AppError(
        'Teleconsultation consent is required before joining.',
        409,
        'CONSENT_REQUIRED',
      );
    }

    const roomName = appointment.consultation.roomName;
    if (env.livekitConfigured) {
      try {
        const roomService = new RoomServiceClient(
          env.LIVEKIT_URL as string,
          env.LIVEKIT_API_KEY as string,
          env.LIVEKIT_API_SECRET as string,
        );
        await roomService.createRoom({
          name: roomName,
          emptyTimeout: 10 * 60,
          maxParticipants: 2,
        }).catch(() => undefined);
      } catch (error) {
        logger.warn('LiveKit room creation failed; token can still be issued', {
          error: error instanceof Error ? error.message : String(error),
        });
      }
      const identity =
        req.user!.role === 'DOCTOR'
          ? `doctor_${appointment.doctorId}`
          : `patient_${appointment.patientId}`;
      const token = new AccessToken(env.LIVEKIT_API_KEY as string, env.LIVEKIT_API_SECRET as string, {
        identity,
        name: req.user!.name,
        ttl: '20m',
      });
      token.addGrant({
        room: roomName,
        roomJoin: true,
        canPublish: true,
        canSubscribe: true,
        canPublishData: true,
      });
      await prisma.consultation.update({
        where: { id: appointment.consultation.id },
        data: { status: appointment.status === 'IN_PROGRESS' ? 'LIVE' : 'READY' },
      });
      return res.json({
        provider: 'LIVEKIT',
        url: env.LIVEKIT_URL,
        token: await token.toJwt(),
        roomName,
        role: req.user!.role,
        expiresInSeconds: 1200,
      });
    }

    await prisma.consultation.update({
      where: { id: appointment.consultation.id },
      data: { status: 'DEMO_READY' },
    });
    res.json({
      provider: 'DEMO',
      roomName,
      role: req.user!.role,
      message:
        'LiveKit is not configured. This is a local demo room with device preview only; no remote clinician is connected.',
    });
  }),
);

appointmentsRouter.post(
  '/:id/review',
  requireAuth,
  validate(reviewSchema),
  asyncHandler(async (req, res) => {
    if (req.user!.role !== 'PATIENT') throw new ForbiddenError();
    const appointment = await loadAppointment(req.params.id);
    if (!appointment) throw new NotFoundError('That appointment could not be found.');
    const { patient } = await assertAppointmentAccess(req, appointment);
    if (!patient || appointment.patientId !== patient.id) throw new ForbiddenError();
    if (appointment.status !== 'COMPLETED') {
      throw new ValidationError({
        status: ['Reviews can be submitted only after a completed consultation.'],
      });
    }
    const existing = await prisma.review.findUnique({
      where: { appointmentId: appointment.id },
    });
    if (existing) throw new ConflictError('A review already exists for this consultation.');
    const review = await prisma.review.create({
      data: {
        appointmentId: appointment.id,
        doctorId: appointment.doctorId,
        patientId: patient.id,
        userId: req.user!.id,
        rating: req.body.rating,
        title: req.body.title || null,
        body: req.body.body,
        status: 'PENDING',
        isIllustrative: false,
      },
    });
    await audit({
      req,
      action: 'REVIEW_SUBMITTED',
      entityType: 'Review',
      entityId: review.id,
      metadata: { doctorId: appointment.doctorId },
    });
    res.status(201).json({
      message:
        'Thank you. Your review is pending moderation and will be published only if approved.',
      review: { id: review.id, status: review.status },
    });
  }),
);
