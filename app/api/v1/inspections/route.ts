import { after, type NextRequest } from 'next/server'
import { withApi, readJson, getClientIp } from '@/lib/http/handler'
import { created, paginated } from '@/lib/http/responses'
import { ValidationError } from '@/lib/http/errors'
import { parsePageParams } from '@/lib/http/pagination'
import { requireAuth } from '@/lib/auth/rbac'
import { createInspection, listInspections } from '@/lib/services/inspections'
import { getExtinguisherById } from '@/lib/services/extinguishers'
import { createInspectionSchema } from '@/lib/validation/inspection'
import { notifyRoles } from '@/lib/notify'
import { writeAuditLog } from '@/lib/audit'
import type { InspectionStatus } from '@/lib/db/schema'

export const GET = withApi(async (req: NextRequest) => {
  await requireAuth(req)
  const params = parsePageParams(req.nextUrl)
  const sp = req.nextUrl.searchParams
  const { rows, total } = await listInspections({
    ...params,
    status: (sp.get('status') as InspectionStatus) || undefined,
    extinguisherId: sp.get('extinguisherId') || undefined,
    inspectorId: sp.get('inspectorId') || undefined,
    from: sp.get('from') || undefined,
    to: sp.get('to') || undefined,
  })
  return paginated(rows, { page: params.page, limit: params.limit, total })
})

// Any authenticated user may request/schedule an inspection.
export const POST = withApi(async (req: NextRequest) => {
  const ctx = await requireAuth(req)
  const body = createInspectionSchema.parse(await readJson(req))

  const ext = await getExtinguisherById(body.extinguisherId)
  if (!ext) throw new ValidationError('Extinguisher not found')

  const inspection = await createInspection({
    extinguisherId: body.extinguisherId,
    scheduledDate: body.scheduledDate,
    scheduledTime: body.scheduledTime ?? null,
    remarks: body.remarks ?? null,
    requestedBy: ctx.userId,
  })

  // Notify relevant personnel + audit, without blocking the response.
  after(async () => {
    await notifyRoles(['inspector', 'admin'], {
      type: 'inspection_scheduled',
      title: 'New inspection scheduled',
      message: `Inspection for ${ext.serialNumber} (${ext.location}) on ${body.scheduledDate}.`,
      entityType: 'inspection',
      entityId: inspection.id,
    })
    await writeAuditLog({
      actorUserId: ctx.userId,
      action: 'inspection.schedule',
      entityType: 'inspection',
      entityId: inspection.id,
      ip: getClientIp(req),
    })
  })

  return created(inspection)
})
