import { after, type NextRequest } from 'next/server'
import { withApi, readJson, getClientIp } from '@/lib/http/handler'
import { created, paginated } from '@/lib/http/responses'
import { ValidationError } from '@/lib/http/errors'
import { parsePageParams } from '@/lib/http/pagination'
import { requireAuth, requireRole } from '@/lib/auth/rbac'
import { createMaintenance, listMaintenance } from '@/lib/services/maintenance'
import { getExtinguisherById } from '@/lib/services/extinguishers'
import { createMaintenanceSchema } from '@/lib/validation/maintenance'
import { writeAuditLog } from '@/lib/audit'

export const GET = withApi(async (req: NextRequest) => {
  await requireAuth(req)
  const params = parsePageParams(req.nextUrl)
  const sp = req.nextUrl.searchParams
  const { rows, total } = await listMaintenance({
    limit: params.limit,
    offset: params.offset,
    extinguisherId: sp.get('extinguisherId') || undefined,
    inspectorId: sp.get('inspectorId') || undefined,
    from: sp.get('from') || undefined,
    to: sp.get('to') || undefined,
  })
  return paginated(rows, { page: params.page, limit: params.limit, total })
})

// Inspectors/admins log maintenance activity.
export const POST = withApi(async (req: NextRequest) => {
  const ctx = await requireRole(req, 'admin', 'inspector')
  const body = createMaintenanceSchema.parse(await readJson(req))

  const ext = await getExtinguisherById(body.extinguisherId)
  if (!ext) throw new ValidationError('Extinguisher not found')

  const record = await createMaintenance({
    extinguisherId: body.extinguisherId,
    inspectorId: ctx.userId,
    inspectionId: body.inspectionId ?? null,
    actionsTaken: body.actionsTaken,
    maintenanceDate: body.maintenanceDate,
    conditionsNoted: body.conditionsNoted ?? null,
  })

  after(() =>
    writeAuditLog({
      actorUserId: ctx.userId,
      action: 'maintenance.log',
      entityType: 'maintenance',
      entityId: record.id,
      ip: getClientIp(req),
    })
  )
  return created(record)
})
