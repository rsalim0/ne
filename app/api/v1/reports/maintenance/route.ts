import { type NextRequest } from 'next/server'
import { withApi } from '@/lib/http/handler'
import { requireAuth } from '@/lib/auth/rbac'
import { maintenanceReportTable } from '@/lib/services/reports'
import { renderReport } from '@/lib/reports/render'

export const GET = withApi(async (req: NextRequest) => {
  await requireAuth(req)
  const sp = req.nextUrl.searchParams
  const by = sp.get('by') === 'inspector' ? 'inspector' : 'extinguisher'
  const table = await maintenanceReportTable(by, sp.get('id') || undefined)
  return renderReport(sp.get('format'), table)
})
