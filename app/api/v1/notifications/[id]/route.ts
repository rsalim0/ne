import { type NextRequest } from 'next/server'
import { withApi } from '@/lib/http/handler'
import { ok } from '@/lib/http/responses'
import { NotFoundError } from '@/lib/http/errors'
import { verifySession } from '@/lib/auth/session'
import { markNotificationRead } from '@/lib/services/notifications'

/** Mark a single notification as read. */
export const PATCH = withApi<{ id: string }>(async (req: NextRequest, { params }) => {
  const ctx = await verifySession(req)
  const { id } = await params
  const row = await markNotificationRead(ctx.userId, id)
  if (!row) throw new NotFoundError('Notification not found')
  return ok(row)
})
