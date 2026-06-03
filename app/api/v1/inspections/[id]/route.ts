import { after, type NextRequest } from 'next/server'
import { withApi, readJson, getClientIp } from '@/lib/http/handler'
import { ok } from '@/lib/http/responses'
import { NotFoundError } from '@/lib/http/errors'
import { requireAuth, requireRole } from '@/lib/auth/rbac'
import { getInspectionById, updateInspection } from '@/lib/services/inspections'
import { updateInspectionSchema } from '@/lib/validation/inspection'
import { writeAuditLog } from '@/lib/audit'

type Ctx = { params: Promise<{ id: string }> }

export const GET = withApi(async (req: NextRequest, { params }: Ctx) => {
  await requireAuth(req)
  const { id } = await params
  const inspection = await getInspectionById(id)
  if (!inspection) throw new NotFoundError('Inspection not found')
  return ok(inspection)
})

// Inspectors/admins assign, complete, reschedule, or annotate inspections.
export const PATCH = withApi(async (req: NextRequest, { params }: Ctx) => {
  const ctx = await requireRole(req, 'admin', 'inspector')
  const { id } = await params
  const patch = updateInspectionSchema.parse(await readJson(req))

  const inspection = await updateInspection(id, patch)
  if (!inspection) throw new NotFoundError('Inspection not found')

  after(() =>
    writeAuditLog({
      actorUserId: ctx.userId,
      action: 'inspection.update',
      entityType: 'inspection',
      entityId: id,
      metadata: { status: patch.status },
      ip: getClientIp(req),
    })
  )
  return ok(inspection)
})
