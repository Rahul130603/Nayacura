import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../config/prisma';
import { asyncHandler, validate } from '../utils/http';
import { requireAuth, requireRole } from '../middleware/auth';
import {
  adminDoctorVerifySchema,
  adminReviewModerationSchema,
  adminTicketUpdateSchema,
  supportReplySchema,
} from '../validators/schemas';
import { NotFoundError, ValidationError } from '../utils/errors';
import { audit } from '../utils/audit';

export const adminRouter = Router();

adminRouter.use(requireAuth, requireRole('ADMIN'));

adminRouter.get(
  '/overview',
  asyncHandler(async (_req, res) => {
    const now = new Date();
    const [
      users,
      patients,
      doctors,
      pendingDoctors,
      appointments,
      upcomingAppointments,
      revenue,
      openTickets,
      auditEvents,
    ] = await Promise.all([
      prisma.user.count({ where: { deletedAt: null } }),
      prisma.patientProfile.count(),
      prisma.doctorProfile.count(),
      prisma.doctorProfile.count({ where: { status: 'PENDING' } }),
      prisma.appointment.count(),
      prisma.appointment.count({
        where: { startAt: { gte: now }, status: { in: ['CONFIRMED', 'PENDING_PAYMENT'] } },
      }),
      prisma.payment.aggregate({
        where: { status: { in: ['PAID', 'DEMO_PAID'] } },
        _sum: { totalPaise: true },
      }),
      prisma.supportTicket.count({ where: { status: { in: ['OPEN', 'IN_REVIEW'] } } }),
      prisma.auditLog.count(),
    ]);
    res.json({
      users,
      patients,
      doctors,
      pendingDoctors,
      appointments,
      upcomingAppointments,
      revenuePaise: revenue._sum.totalPaise || 0,
      openTickets,
      auditEvents,
      demo: true,
      permissions: {
        clinicalNotes: false,
        paymentCardData: false,
        patientHealthDetails: 'minimal only',
      },
    });
  }),
);

adminRouter.get(
  '/doctors',
  asyncHandler(async (req, res) => {
    const status = typeof req.query.status === 'string' ? req.query.status : undefined;
    const doctors = await prisma.doctorProfile.findMany({
      where: status ? { status } : undefined,
      include: {
        user: { select: { name: true, email: true, createdAt: true, lastLoginAt: true } },
        credentials: true,
        specializations: { include: { specialization: true } },
        _count: { select: { appointments: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({
      doctors: doctors.map((doctor) => ({
        id: doctor.id,
        slug: doctor.slug,
        name: doctor.user.name,
        email: doctor.user.email,
        title: doctor.title,
        city: doctor.city,
        status: doctor.status,
        verified: doctor.verified,
        isDemo: doctor.isDemo,
        experienceYears: doctor.experienceYears,
        feePaise: doctor.feePaise,
        createdAt: doctor.createdAt.toISOString(),
        lastLoginAt: doctor.user.lastLoginAt?.toISOString() || null,
        appointments: doctor._count.appointments,
        specializations: doctor.specializations.map((item) => item.specialization.name),
        credentials: doctor.credentials.map((credential) => ({
          id: credential.id,
          type: credential.type,
          title: credential.title,
          institution: credential.institution,
          registrationNumber: credential.registrationNumber,
          council: credential.council,
          year: credential.year,
          verified: credential.verified,
        })),
      })),
    });
  }),
);

adminRouter.post(
  '/doctors/:id/verify',
  validate(adminDoctorVerifySchema),
  asyncHandler(async (req, res) => {
    const doctor = await prisma.doctorProfile.findUnique({
      where: { id: req.params.id },
      include: { user: true },
    });
    if (!doctor) throw new NotFoundError('Clinician profile not found.');
    if (req.body.status === 'VERIFIED' && !req.body.verified) {
      throw new ValidationError({
        verified: ['A profile cannot be marked VERIFIED without the verified flag.'],
      });
    }
    const updated = await prisma.$transaction(async (tx) => {
      await tx.doctorCredential.updateMany({
        where: { doctorId: doctor.id },
        data: { verified: req.body.verified },
      });
      const result = await tx.doctorProfile.update({
        where: { id: doctor.id },
        data: {
          verified: req.body.verified,
          status: req.body.status,
          credentialCheckedAt: new Date(),
          credentialCheckedBy: req.user!.id,
        },
        include: { user: true },
      });
      await tx.notification.create({
        data: {
          userId: doctor.userId,
          type: 'CREDENTIAL_STATUS',
          title: 'Professional profile status updated',
          body:
            req.body.status === 'VERIFIED'
              ? 'Your demonstration credential status is now marked verified. Clinical tools are available.'
              : `Your professional profile status is now ${req.body.status}. Contact support for details.`,
        },
      });
      return result;
    });
    await audit({
      req,
      action: 'DOCTOR_CREDENTIAL_STATUS_UPDATED',
      entityType: 'DoctorProfile',
      entityId: doctor.id,
      metadata: {
        status: req.body.status,
        verified: req.body.verified,
        isDemo: doctor.isDemo,
      },
    });
    res.json({
      doctor: {
        id: updated.id,
        name: updated.user.name,
        status: updated.status,
        verified: updated.verified,
      },
      message:
        'Credential status updated. This demo does not perform real primary-source verification.',
    });
  }),
);

adminRouter.get(
  '/users',
  asyncHandler(async (_req, res) => {
    const users = await prisma.user.findMany({
      include: {
        patient: { select: { id: true, ageConfirmed: true } },
        doctor: { select: { id: true, status: true, verified: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
    res.json({
      users: users.map((user) => ({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        emailVerified: user.emailVerified,
        deletedAt: user.deletedAt?.toISOString() || null,
        createdAt: user.createdAt.toISOString(),
        lastLoginAt: user.lastLoginAt?.toISOString() || null,
        patientId: user.patient?.id || null,
        doctorStatus: user.doctor?.status || null,
      })),
      note: 'Administrative listing excludes clinical notes, AI conversations and medical documents.',
    });
  }),
);

adminRouter.get(
  '/appointments',
  asyncHandler(async (req, res) => {
    const status = typeof req.query.status === 'string' ? req.query.status : undefined;
    const appointments = await prisma.appointment.findMany({
      where: status ? { status } : undefined,
      select: {
        id: true,
        bookingId: true,
        status: true,
        mode: true,
        startAt: true,
        endAt: true,
        totalPaise: true,
        createdAt: true,
        doctor: { include: { user: { select: { name: true } } } },
        patient: { include: { user: { select: { name: true } } } },
        payment: { select: { status: true, provider: true } },
        _count: { select: { clinicalNotes: true, prescriptions: true } },
      },
      orderBy: { startAt: 'desc' },
      take: 200,
    });
    res.json({
      appointments: appointments.map((appointment) => ({
        id: appointment.id,
        bookingId: appointment.bookingId,
        status: appointment.status,
        mode: appointment.mode,
        startAt: appointment.startAt.toISOString(),
        endAt: appointment.endAt.toISOString(),
        totalPaise: appointment.totalPaise,
        createdAt: appointment.createdAt.toISOString(),
        doctorName: appointment.doctor.user.name,
        patientName: appointment.patient.user.name,
        paymentStatus: appointment.payment?.status || null,
        paymentProvider: appointment.payment?.provider || null,
        hasClinicalNotes: appointment._count.clinicalNotes > 0,
        hasPrescriptions: appointment._count.prescriptions > 0,
        clinicalAccess: 'RESTRICTED',
      })),
    });
  }),
);

adminRouter.get(
  '/payments',
  asyncHandler(async (_req, res) => {
    const payments = await prisma.payment.findMany({
      include: {
        appointment: {
          include: {
            doctor: { include: { user: { select: { name: true } } } },
            patient: { include: { user: { select: { name: true } } } },
          },
        },
        refunds: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
    res.json({
      payments: payments.map((payment) => ({
        id: payment.id,
        bookingId: payment.appointment.bookingId,
        doctorName: payment.appointment.doctor.user.name,
        patientName: payment.appointment.patient.user.name,
        amountPaise: payment.amountPaise,
        taxPaise: payment.taxPaise,
        totalPaise: payment.totalPaise,
        status: payment.status,
        provider: payment.provider,
        createdAt: payment.createdAt.toISOString(),
        paidAt: payment.paidAt?.toISOString() || null,
        refunds: payment.refunds.map((refund) => ({
          id: refund.id,
          amountPaise: refund.amountPaise,
          status: refund.status,
          reason: refund.reason,
          createdAt: refund.createdAt.toISOString(),
        })),
      })),
      note: 'No card data is stored. Demo payments are not settled to any bank account.',
    });
  }),
);

adminRouter.post(
  '/payments/:id/refund',
  validate(
    z.object({
      amountPaise: z.number().int().min(1),
      reason: z.string().trim().min(3).max(300),
    }),
  ),
  asyncHandler(async (req, res) => {
    const payment = await prisma.payment.findUnique({
      where: { id: req.params.id },
      include: { refunds: true, appointment: true },
    });
    if (!payment) throw new NotFoundError('Payment not found.');
    if (!['PAID', 'DEMO_PAID'].includes(payment.status)) {
      throw new ValidationError({ payment: ['Only a paid transaction can be refunded.'] });
    }
    const already = payment.refunds.reduce((total, refund) => total + refund.amountPaise, 0);
    if (already + req.body.amountPaise > payment.totalPaise) {
      throw new ValidationError({ amountPaise: ['Refund exceeds the paid amount.'] });
    }
    const refund = await prisma.refund.create({
      data: {
        paymentId: payment.id,
        amountPaise: req.body.amountPaise,
        status: 'PENDING',
        reason: req.body.reason,
      },
    });
    await audit({
      req,
      action: 'REFUND_RECORDED',
      entityType: 'Refund',
      entityId: refund.id,
      metadata: { paymentId: payment.id, amountPaise: refund.amountPaise, demo: true },
    });
    res.status(201).json({
      refund: {
        id: refund.id,
        amountPaise: refund.amountPaise,
        status: refund.status,
        createdAt: refund.createdAt.toISOString(),
      },
      message:
        'Refund recorded as pending. No live Razorpay refund API call is made in this development demo.',
    });
  }),
);

adminRouter.get(
  '/tickets',
  asyncHandler(async (_req, res) => {
    const tickets = await prisma.supportTicket.findMany({
      include: {
        messages: { orderBy: { createdAt: 'asc' } },
        user: { select: { role: true } },
      },
      orderBy: { updatedAt: 'desc' },
      take: 200,
    });
    res.json({
      tickets: tickets.map((ticket) => ({
        id: ticket.id,
        reference: ticket.reference,
        subject: ticket.subject,
        category: ticket.category,
        status: ticket.status,
        priority: ticket.priority,
        name: ticket.name,
        email: ticket.email,
        role: ticket.user?.role || 'GUEST',
        createdAt: ticket.createdAt.toISOString(),
        updatedAt: ticket.updatedAt.toISOString(),
        messages: ticket.messages.map((message) => ({
          id: message.id,
          body: message.body,
          authorRole: message.authorRole,
          createdAt: message.createdAt.toISOString(),
        })),
      })),
    });
  }),
);

adminRouter.patch(
  '/tickets/:id',
  validate(adminTicketUpdateSchema),
  asyncHandler(async (req, res) => {
    const ticket = await prisma.supportTicket.findUnique({ where: { id: req.params.id } });
    if (!ticket) throw new NotFoundError('Support request not found.');
    const updated = await prisma.supportTicket.update({
      where: { id: ticket.id },
      data: {
        ...(req.body.status ? { status: req.body.status } : {}),
        ...(req.body.priority ? { priority: req.body.priority } : {}),
      },
    });
    await audit({
      req,
      action: 'SUPPORT_TICKET_UPDATED',
      entityType: 'SupportTicket',
      entityId: ticket.id,
      metadata: { status: updated.status, priority: updated.priority },
    });
    res.json({
      ticket: {
        id: updated.id,
        status: updated.status,
        priority: updated.priority,
        updatedAt: updated.updatedAt.toISOString(),
      },
    });
  }),
);

adminRouter.post(
  '/tickets/:id/reply',
  validate(supportReplySchema),
  asyncHandler(async (req, res) => {
    const ticket = await prisma.supportTicket.findUnique({ where: { id: req.params.id } });
    if (!ticket) throw new NotFoundError('Support request not found.');
    const message = await prisma.ticketMessage.create({
      data: {
        ticketId: ticket.id,
        authorUserId: req.user!.id,
        authorRole: 'ADMIN',
        body: req.body.message,
      },
    });
    await prisma.supportTicket.update({
      where: { id: ticket.id },
      data: { status: 'WAITING_ON_USER', updatedAt: new Date() },
    });
    await audit({
      req,
      action: 'SUPPORT_TICKET_REPLIED',
      entityType: 'SupportTicket',
      entityId: ticket.id,
    });
    res.status(201).json({
      message: {
        id: message.id,
        body: message.body,
        authorRole: message.authorRole,
        createdAt: message.createdAt.toISOString(),
      },
    });
  }),
);

adminRouter.get(
  '/reviews',
  asyncHandler(async (_req, res) => {
    const reviews = await prisma.review.findMany({
      include: {
        doctor: { include: { user: { select: { name: true } } } },
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
    res.json({
      reviews: reviews.map((review) => ({
        id: review.id,
        doctorName: review.doctor.user.name,
        rating: review.rating,
        title: review.title,
        body: review.body,
        status: review.status,
        isIllustrative: review.isIllustrative,
        createdAt: review.createdAt.toISOString(),
      })),
    });
  }),
);

adminRouter.patch(
  '/reviews/:id',
  validate(adminReviewModerationSchema),
  asyncHandler(async (req, res) => {
    const review = await prisma.review.findUnique({ where: { id: req.params.id } });
    if (!review) throw new NotFoundError('Review not found.');
    const updated = await prisma.review.update({
      where: { id: review.id },
      data: { status: req.body.status },
    });
    await audit({
      req,
      action: 'REVIEW_MODERATED',
      entityType: 'Review',
      entityId: review.id,
      metadata: { status: updated.status },
    });
    res.json({ review: { id: updated.id, status: updated.status } });
  }),
);

adminRouter.get(
  '/services',
  asyncHandler(async (_req, res) => {
    const [categories, services] = await Promise.all([
      prisma.serviceCategory.findMany({
        include: { _count: { select: { services: true } } },
        orderBy: { sortOrder: 'asc' },
      }),
      prisma.service.findMany({
        include: { category: true },
        orderBy: [{ category: { sortOrder: 'asc' } }, { sortOrder: 'asc' }],
      }),
    ]);
    res.json({
      categories: categories.map((category) => ({
        id: category.id,
        slug: category.slug,
        name: category.name,
        tagline: category.tagline,
        description: category.description,
        serviceCount: category._count.services,
      })),
      services: services.map((service) => ({
        id: service.id,
        slug: service.slug,
        name: service.name,
        summary: service.summary,
        categoryName: service.category.name,
        active: service.active,
        featured: service.featured,
      })),
    });
  }),
);

adminRouter.patch(
  '/services/:id',
  validate(
    z.object({
      active: z.boolean().optional(),
      featured: z.boolean().optional(),
      summary: z.string().trim().min(10).max(500).optional(),
    }),
  ),
  asyncHandler(async (req, res) => {
    const service = await prisma.service.findUnique({ where: { id: req.params.id } });
    if (!service) throw new NotFoundError('Service not found.');
    const updated = await prisma.service.update({
      where: { id: service.id },
      data: {
        ...(req.body.active !== undefined ? { active: req.body.active } : {}),
        ...(req.body.featured !== undefined ? { featured: req.body.featured } : {}),
        ...(req.body.summary ? { summary: req.body.summary } : {}),
      },
    });
    await audit({
      req,
      action: 'SERVICE_UPDATED',
      entityType: 'Service',
      entityId: service.id,
      metadata: { active: updated.active, featured: updated.featured },
    });
    res.json({ service: { id: updated.id, active: updated.active, featured: updated.featured } });
  }),
);

adminRouter.get(
  '/articles',
  asyncHandler(async (_req, res) => {
    const articles = await prisma.article.findMany({
      orderBy: { publishedAt: 'desc' },
      select: {
        id: true,
        slug: true,
        title: true,
        categoryName: true,
        status: true,
        featured: true,
        author: true,
        reviewer: true,
        publishedAt: true,
        reviewedAt: true,
      },
    });
    res.json({
      articles: articles.map((article) => ({
        ...article,
        publishedAt: article.publishedAt.toISOString(),
        reviewedAt: article.reviewedAt?.toISOString() || null,
      })),
    });
  }),
);

adminRouter.patch(
  '/articles/:id',
  validate(
    z.object({
      status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).optional(),
      featured: z.boolean().optional(),
    }),
  ),
  asyncHandler(async (req, res) => {
    const article = await prisma.article.findUnique({ where: { id: req.params.id } });
    if (!article) throw new NotFoundError('Article not found.');
    const updated = await prisma.article.update({
      where: { id: article.id },
      data: {
        ...(req.body.status ? { status: req.body.status } : {}),
        ...(req.body.featured !== undefined ? { featured: req.body.featured } : {}),
      },
    });
    await audit({
      req,
      action: 'ARTICLE_UPDATED',
      entityType: 'Article',
      entityId: article.id,
      metadata: { status: updated.status, featured: updated.featured },
    });
    res.json({
      article: { id: updated.id, status: updated.status, featured: updated.featured },
      warning:
        'Articles in this demo are unreviewed editorial drafts. A production workflow requires a documented medical review before publishing.',
    });
  }),
);

adminRouter.get(
  '/audit',
  asyncHandler(async (_req, res) => {
    const logs = await prisma.auditLog.findMany({
      include: { actor: { select: { name: true, role: true } } },
      orderBy: { createdAt: 'desc' },
      take: 150,
    });
    res.json({
      logs: logs.map((log) => ({
        id: log.id,
        actor: log.actor?.name || 'System',
        actorRole: log.actorRole,
        action: log.action,
        entityType: log.entityType,
        entityId: log.entityId,
        metadata: log.metadata,
        createdAt: log.createdAt.toISOString(),
      })),
      note: 'Audit metadata is deliberately minimal. Clinical note content is never written to audit logs.',
    });
  }),
);

adminRouter.get(
  '/settings',
  asyncHandler(async (_req, res) => {
    const settings = await prisma.platformSetting.findMany({ orderBy: { key: 'asc' } });
    res.json({
      settings: settings.map((setting) => ({
        id: setting.id,
        key: setting.key,
        value: setting.value,
        updatedAt: setting.updatedAt.toISOString(),
      })),
      environment: {
        demoMode: process.env.DEMO_MODE !== 'false',
        razorpayConfigured: Boolean(process.env.RAZORPAY_KEY_ID),
        livekitConfigured: Boolean(process.env.LIVEKIT_API_KEY),
        llmConfigured: Boolean(process.env.LLM_API_KEY),
        smtpConfigured: Boolean(process.env.SMTP_HOST),
      },
    });
  }),
);

adminRouter.patch(
  '/settings',
  validate(
    z.object({
      settings: z.array(
        z.object({
          key: z.string().trim().min(2).max(80),
          value: z.string().max(500),
        }),
      ),
    }),
  ),
  asyncHandler(async (req, res) => {
    const entries = req.body.settings as { key: string; value: string }[];
    await prisma.$transaction(
      entries.map((entry) =>
        prisma.platformSetting.upsert({
          where: { key: entry.key },
          create: { key: entry.key, value: entry.value },
          update: { value: entry.value },
        }),
      ),
    );
    await audit({
      req,
      action: 'PLATFORM_SETTINGS_UPDATED',
      entityType: 'PlatformSetting',
      entityId: null,
      metadata: { keys: entries.map((entry) => entry.key) },
    });
    res.json({ message: 'Settings updated.' });
  }),
);

adminRouter.get(
  '/roles',
  asyncHandler(async (_req, res) => {
    res.json({
      roles: [
        {
          role: 'PATIENT',
          permissions: [
            'own profile',
            'own appointments',
            'own documents',
            'own prescriptions',
            'own payments',
            'own AI conversations',
          ],
          restrictions: ['no access to other patient records', 'no clinical authoring'],
        },
        {
          role: 'DOCTOR',
          permissions: [
            'own professional profile',
            'own availability',
            'own appointments',
            'clinical notes for own patients',
            'prescriptions for own patients',
          ],
          restrictions: [
            'requires verified professional status',
            'no access to unrelated patients',
            'no admin financial controls',
          ],
        },
        {
          role: 'ADMIN',
          permissions: [
            'platform analytics',
            'credential workflow',
            'account administration',
            'payments and refunds records',
            'content moderation',
            'support tickets',
            'audit logs',
            'platform settings',
          ],
          restrictions: [
            'no automatic access to clinical notes',
            'no access to AI conversation content',
            'no card data',
            'no ability to alter medical records',
          ],
        },
      ],
      note: 'Least-privilege matrix for this demo. Production permissions require formal review.',
    });
  }),
);
