import type { NextRequest } from 'next/server'
import { handleError, ValidationError } from './errors'
import { logger } from '@/lib/logger'

type RouteContext<P extends Record<string, string> = Record<string, string>> = {
  params: Promise<P>
}
type RouteHandler<P extends Record<string, string> = Record<string, string>> = (
  req: NextRequest,
  ctx: RouteContext<P>
) => Promise<Response> | Response

/**
 * Wraps a route handler with uniform error handling + per-request structured
 * logging. CORS is handled centrally in `proxy.ts`. Generic over the dynamic
 * route params shape (e.g. `withApi<{ id: string }>(...)`).
 *
 * Usage:
 *   export const GET = withApi(async (req, { params }) => { ... })
 */
export function withApi<P extends Record<string, string> = Record<string, string>>(
  handler: RouteHandler<P>
): RouteHandler<P> {
  return async (req, ctx) => {
    const start = Date.now()
    let res: Response
    try {
      res = await handler(req, ctx)
    } catch (err) {
      res = handleError(err)
    }
    logger.info(
      { method: req.method, path: req.nextUrl.pathname, status: res.status, ms: Date.now() - start },
      'request'
    )
    return res
  }
}

/** Parse a JSON request body, returning a 400 (not 500) on malformed JSON. */
export async function readJson(req: NextRequest): Promise<unknown> {
  try {
    return await req.json()
  } catch {
    throw new ValidationError('Request body must be valid JSON')
  }
}

/** Best-effort client IP from forwarding headers. */
export function getClientIp(req: NextRequest): string {
  const fwd = req.headers.get('x-forwarded-for')
  if (fwd) return fwd.split(',')[0].trim()
  return req.headers.get('x-real-ip') ?? 'unknown'
}
