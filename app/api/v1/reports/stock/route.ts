import { type NextRequest } from 'next/server'
import { withApi } from '@/lib/http/handler'
import { requireAuth } from '@/lib/auth/rbac'
import { stockReportTable } from '@/lib/services/reports'
import { renderReport } from '@/lib/reports/render'

const PERIODS = ['daily', 'monthly', 'yearly'] as const

export const GET = withApi(async (req: NextRequest) => {
  await requireAuth(req)
  const p = req.nextUrl.searchParams.get('period')
  const period = (PERIODS as readonly string[]).includes(p ?? '') ? (p as (typeof PERIODS)[number]) : 'monthly'
  const table = await stockReportTable(period)
  return renderReport(req.nextUrl.searchParams.get('format'), table)
})
