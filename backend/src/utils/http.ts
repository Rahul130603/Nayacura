import type { NextFunction, Request, RequestHandler, Response } from 'express';
import { ZodError, type ZodTypeAny } from 'zod';
import { AppError, ValidationError } from './errors';
import { logger } from './logger';

export function asyncHandler(
  handler: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
): RequestHandler {
  return (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}

export function validate(schema: ZodTypeAny, source: 'body' | 'query' | 'params' = 'body') {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      const parsed = schema.parse(req[source]);
      if (source === 'body') req.body = parsed;
      else if (source === 'query') Object.assign(req.query, parsed);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return next(new ValidationError(error.flatten().fieldErrors));
      }
      next(error);
    }
  };
}

export function notFoundHandler(req: Request, _res: Response, next: NextFunction) {
  next(new AppError(`No API route matches ${req.method} ${req.path}.`, 404, 'NOT_FOUND'));
}

export function errorHandler(
  error: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
) {
  if (error instanceof ZodError) {
    return res.status(422).json({
      message: 'Please check the highlighted information and try again.',
      code: 'VALIDATION_ERROR',
      details: error.flatten().fieldErrors,
    });
  }

  if (error instanceof AppError) {
    return res.status(error.status).json({
      message: error.message,
      code: error.code,
      ...(error.details ? { details: error.details } : {}),
    });
  }

  // Prisma errors are transformed without exposing database internals.
  const prismaCode = (error as { code?: string })?.code;
  if (prismaCode === 'P2002') {
    return res.status(409).json({
      message: 'That record already exists. Please check the information and try again.',
      code: 'CONFLICT',
    });
  }
  if (prismaCode === 'P2025') {
    return res.status(404).json({
      message: 'The requested information could not be found.',
      code: 'NOT_FOUND',
    });
  }
  if ((error as { type?: string })?.type === 'entity.parse.failed') {
    return res.status(400).json({
      message: 'The request could not be read. Please refresh and try again.',
      code: 'INVALID_BODY',
    });
  }

  logger.error('Unhandled request error', {
    path: req.path,
    method: req.method,
    error: error instanceof Error ? error.message : String(error),
    stack: envStack(error),
  });

  return res.status(500).json({
    message: 'Something went wrong on our side. Your information has not been changed.',
    code: 'INTERNAL_ERROR',
  });
}

function envStack(error: unknown) {
  if (!(error instanceof Error)) return undefined;
  if (process.env.NODE_ENV === 'production') return undefined;
  return error.stack?.split('\n').slice(0, 6).join('\n');
}
