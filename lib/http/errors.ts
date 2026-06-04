import { ZodError } from 'zod'
import { logger } from '@/lib/logger'

/** Base class for all expected/operational errors thrown by services. */
export class AppError extends Error {
  readonly status: number
  readonly code: string
  readonly details?: unknown

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message)
    this.name = this.constructor.name
    this.status = status
    this.code = code
    this.details = details
  }
}

export class ValidationError extends AppError {
  constructor(message = 'Validation failed', details?: unknown) {
    super(400, 'VALIDATION_ERROR', message, details)
  }
}
export class UnauthorizedError extends AppError {
  constructor(message = 'Authentication required') {
    super(401, 'UNAUTHORIZED', message)
  }
}
export class ForbiddenError extends AppError {
  constructor(message = 'You do not have permission to perform this action') {
    super(403, 'FORBIDDEN', message)
  }
}
export class EmailNotVerifiedError extends AppError {
  constructor(message = 'Please verify your email before signing in') {
    super(403, 'EMAIL_NOT_VERIFIED', message)
  }
}
export class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(404, 'NOT_FOUND', message)
  }
}
export class ConflictError extends AppError {
  constructor(message = 'Resource already exists', details?: unknown) {
    super(409, 'CONFLICT', message, details)
  }
}
export class TooManyRequestsError extends AppError {
  constructor(message = 'Too many requests, please try again later') {
    super(429, 'TOO_MANY_REQUESTS', message)
  }
}

type ErrorBody = {
  success: false
  error: { code: string; message: string; details?: unknown }
}

/** Map any thrown value to a uniform JSON error Response (and log it). */
export function handleError(err: unknown): Response {
  // Zod validation errors
  if (err instanceof ZodError) {
    const details = err.issues.map((i) => ({
      field: i.path.join('.') || '(root)',
      message: i.message,
    }))
    return json(400, { code: 'VALIDATION_ERROR', message: 'Validation failed', details })
  }

  // Known operational errors
  if (err instanceof AppError) {
    if (err.status >= 500) logger.error({ err }, err.message)
    return json(err.status, { code: err.code, message: err.message, details: err.details })
  }

  // Postgres driver errors (postgres-js exposes the PG `code`)
  if (err && typeof err === 'object' && 'code' in err) {
    const pgCode = (err as { code?: string }).code
    if (pgCode === '23505') {
      return json(409, { code: 'CONFLICT', message: 'A record with these values already exists' })
    }
    if (pgCode === '23503') {
      return json(400, { code: 'FOREIGN_KEY_VIOLATION', message: 'Referenced record does not exist' })
    }
  }

  // Unknown / unexpected — never leak internals
  logger.error({ err }, 'Unhandled error')
  return json(500, { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' })
}

function json(status: number, error: ErrorBody['error']): Response {
  return new Response(JSON.stringify({ success: false, error } satisfies ErrorBody), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}
