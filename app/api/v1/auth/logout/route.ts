import { after, type NextRequest } from 'next/server'
import { withApi, getClientIp } from '@/lib/http/handler'
import { ok } from '@/lib/http/responses'
import { verifySession, revokeSession, clearAuthCookie } from '@/lib/auth/session'
import { writeAuditLog } from '@/lib/audit'

export const POST = withApi(async (req: NextRequest) => {
  const ctx = await verifySession(req)
  await revokeSession(ctx.jti) // true server-side invalidation
  await clearAuthCookie()

  after(() =>
    writeAuditLog({ actorUserId: ctx.userId, action: 'user.logout', ip: getClientIp(req) })
  )
  return ok({ message: 'Logged out' })
})
