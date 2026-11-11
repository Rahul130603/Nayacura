import { Router } from 'express';
import { prisma } from '../config/prisma';
import { asyncHandler, validate } from '../utils/http';
import { optionalAuth, requireAuth } from '../middleware/auth';
import { formLimiter } from '../middleware/rateLimit';
import { supportReplySchema, supportTicketSchema } from '../validators/schemas';
import { supportReference } from '../utils/crypto';
import { ForbiddenError, NotFoundError } from '../utils/errors';
import { sendSupportAcknowledgement } from '../services/mailer';
import { audit } from '../utils/audit';

export const supportRouter = Router();

const ticketInclude = {
  messages: { orderBy: { createdAt: 'asc' as const } },
} as const;

supportRouter.post(
  '/tickets',
  formLimiter,
  optionalAuth,
  validate(supportTicketSchema),
  asyncHandler(async (req, res) => {
    const data = req.body as {
      name: string;
      email: string;
      category: string;
      subject: string;
      message: string;
      priority: string;
    };
    const reference = supportReference();
    const ticket = await prisma.supportTicket.create({
      data: {
        reference,
        userId: req.user?.id || null,
        name: data.name,
        email: data.email.trim().toLowerCase(),
        category: data.category,
        subject: data.subject,
        priority: data.priority,
        messages: {
          create: {
            authorUserId: req.user?.id || null,
            authorRole: req.user?.role || 'GUEST',
            body: data.message,
          },
        },
      },
      include: ticketInclude,
    });
    await sendSupportAcknowledgement({ to: ticket.email, reference: ticket.reference });
    await audit({
      req,
      action: 'SUPPORT_TICKET_CREATED',
      entityType: 'SupportTicket',
      entityId: ticket.id,
      metadata: { category: ticket.category, reference: ticket.reference },
    });
    res.status(201).json({
      ticket: {
        id: ticket.id,
        reference: ticket.reference,
        subject: ticket.subject,
        category: ticket.category,
        status: ticket.status,
        createdAt: ticket.createdAt.toISOString(),
      },
      message:
        'Your support request has been logged. Please do not send clinical records or identity documents in a support message.',
    });
  }),
);

supportRouter.get(
  '/tickets',
  requireAuth,
  asyncHandler(async (req, res) => {
    const tickets = await prisma.supportTicket.findMany({
      where: { userId: req.user!.id },
      orderBy: { updatedAt: 'desc' },
      include: ticketInclude,
    });
    res.json({
      tickets: tickets.map((ticket) => ({
        id: ticket.id,
        reference: ticket.reference,
        subject: ticket.subject,
        category: ticket.category,
        status: ticket.status,
        priority: ticket.priority,
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

supportRouter.get(
  '/tickets/:id',
  requireAuth,
  asyncHandler(async (req, res) => {
    const ticket = await prisma.supportTicket.findFirst({
      where: {
        id: req.params.id,
        ...(req.user!.role === 'ADMIN' ? {} : { userId: req.user!.id }),
      },
      include: ticketInclude,
    });
    if (!ticket) throw new NotFoundError('That support request could not be found.');
    res.json({
      ticket: {
        id: ticket.id,
        reference: ticket.reference,
        subject: ticket.subject,
        category: ticket.category,
        status: ticket.status,
        priority: ticket.priority,
        createdAt: ticket.createdAt.toISOString(),
        updatedAt: ticket.updatedAt.toISOString(),
        messages: ticket.messages.map((message) => ({
          id: message.id,
          body: message.body,
          authorRole: message.authorRole,
          createdAt: message.createdAt.toISOString(),
        })),
      },
    });
  }),
);

supportRouter.post(
  '/tickets/:id/messages',
  requireAuth,
  formLimiter,
  validate(supportReplySchema),
  asyncHandler(async (req, res) => {
    const ticket = await prisma.supportTicket.findFirst({
      where: {
        id: req.params.id,
        ...(req.user!.role === 'ADMIN' ? {} : { userId: req.user!.id }),
      },
    });
    if (!ticket) throw new NotFoundError('That support request could not be found.');
    if (ticket.status === 'CLOSED') {
      throw new ForbiddenError('This support request is closed. Please open a new request.');
    }
    const message = await prisma.ticketMessage.create({
      data: {
        ticketId: ticket.id,
        authorUserId: req.user!.id,
        authorRole: req.user!.role,
        body: req.body.message,
      },
    });
    await prisma.supportTicket.update({
      where: { id: ticket.id },
      data: {
        updatedAt: new Date(),
        status: req.user!.role === 'ADMIN' ? 'WAITING_ON_USER' : 'OPEN',
      },
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
