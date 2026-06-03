import { type NextRequest } from 'next/server'
import { withApi } from '@/lib/http/handler'
import { requireAuth } from '@/lib/auth/rbac'
import { inspectionReportTable } from '@/lib/services/reports'
import { renderReport } from '@/lib/reports/render'

export const GET = withApi(async (req: NextRequest) => {
  await requireAuth(req)
  const table = await inspectionReportTable()
  return renderReport(req.nextUrl.searchParams.get('format'), table)
})
