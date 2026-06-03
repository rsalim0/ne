import type { NextRequest } from 'next/server'
import type { UserRole } from '@/lib/db/schema'
import { ForbiddenError } from '@/lib/http/errors'
import { verifySession, type AuthContext } from './session'

/** Require a valid authenticated session (any role). Throws 401 otherwise. */
export async function requireAuth(req: NextRequest): Promise<AuthContext> {
  return verifySession(req)
}

/** Require an authenticated session whose role is in `roles`. Throws 401/403. */
export async function requireRole(
  req: NextRequest,
  ...roles: UserRole[]
): Promise<AuthContext> {
  const ctx = await verifySession(req)
  if (!roles.includes(ctx.role)) throw new ForbiddenError()
  return ctx
}
