import { type NextRequest } from 'next/server'
import { withApi } from '@/lib/http/handler'
import { paginated } from '@/lib/http/responses'
import { parsePageParams } from '@/lib/http/pagination'
import { verifySession } from '@/lib/auth/session'
import { listNotifications } from '@/lib/services/notifications'

export const GET = withApi(async (req: NextRequest) => {
  const ctx = await verifySession(req)
  const { page, limit, offset } = parsePageParams(req.nextUrl)
  const unreadOnly = req.nextUrl.searchParams.get('unread') === 'true'
  const { rows, total } = await listNotifications(ctx.userId, { limit, offset, unreadOnly })
  return paginated(rows, { page, limit, total })
})
