import { type NextRequest } from 'next/server'
import { withApi } from '@/lib/http/handler'
import { ok } from '@/lib/http/responses'
import { verifySession } from '@/lib/auth/session'
import { markAllRead } from '@/lib/services/notifications'

export const POST = withApi(async (req: NextRequest) => {
  const ctx = await verifySession(req)
  const updated = await markAllRead(ctx.userId)
  return ok({ updated })
})
