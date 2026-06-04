import { type NextRequest } from 'next/server'
import { withApi } from '@/lib/http/handler'
import { ok } from '@/lib/http/responses'
import { verifySession } from '@/lib/auth/session'
import { countUnread } from '@/lib/services/notifications'

export const GET = withApi(async (req: NextRequest) => {
  const ctx = await verifySession(req)
  const count = await countUnread(ctx.userId)
  return ok({ count })
})
