import { type NextRequest } from 'next/server'
import { withApi } from '@/lib/http/handler'
import { ok } from '@/lib/http/responses'
import { requireAuth } from '@/lib/auth/rbac'
import { dashboardStats } from '@/lib/services/reports'

export const GET = withApi(async (req: NextRequest) => {
  await requireAuth(req)
  return ok(await dashboardStats())
})
