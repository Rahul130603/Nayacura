import type { Request } from 'express';
import { prisma } from '../config/prisma';
import { hashIp } from './crypto';
import { logger } from './logger';

type AuditInput = {
  req?: Request;
  actorId?: string | null;
  actorRole?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  metadata?: Record<string, unknown>;
};

/**
 * Audit metadata must never contain clinical free text, passwords, tokens or
 * card data. Callers pass deliberate, minimal facts.
 */
export async function audit(input: AuditInput) {
  try {
    const actorId = input.actorId ?? input.req?.user?.id ?? null;
    const actorRole = input.actorRole ?? input.req?.user?.role ?? null;
    const ip = input.req?.ip;
    await prisma.auditLog.create({
      data: {
        actorId: actorId || null,
        actorRole,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId || null,
        metadata: input.metadata ? JSON.stringify(input.metadata) : null,
        ipHash: hashIp(ip),
      },
    });
  } catch (error) {
    logger.warn('Audit write failed', {
      action: input.action,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
