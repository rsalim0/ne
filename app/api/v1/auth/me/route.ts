import { type NextRequest } from 'next/server'
import { withApi } from '@/lib/http/handler'
import { ok } from '@/lib/http/responses'
import { UnauthorizedError } from '@/lib/http/errors'
import { verifySession } from '@/lib/auth/session'
import { findUserById, toSafeUser } from '@/lib/services/users'

export const GET = withApi(async (req: NextRequest) => {
  const ctx = await verifySession(req)
  const user = await findUserById(ctx.userId)
  if (!user) throw new UnauthorizedError()
  return ok(toSafeUser(user))
})
