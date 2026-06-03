import { after, type NextRequest } from 'next/server'
import { withApi, readJson, getClientIp } from '@/lib/http/handler'
import { ok } from '@/lib/http/responses'
import { ConflictError, NotFoundError } from '@/lib/http/errors'
import { requireAuth, requireRole } from '@/lib/auth/rbac'
import {
  deleteExtinguisher,
  getExtinguisherById,
  getExtinguisherBySerial,
  updateExtinguisher,
} from '@/lib/services/extinguishers'
import { updateExtinguisherSchema } from '@/lib/validation/extinguisher'
import { writeAuditLog } from '@/lib/audit'

type Ctx = { params: Promise<{ id: string }> }

export const GET = withApi(async (req: NextRequest, { params }: Ctx) => {
  await requireAuth(req)
  const { id } = await params
  const ext = await getExtinguisherById(id)
  if (!ext) throw new NotFoundError('Extinguisher not found')
  return ok(ext)
})

export const PATCH = withApi(async (req: NextRequest, { params }: Ctx) => {
  const ctx = await requireRole(req, 'admin', 'inspector')
  const { id } = await params
  const patch = updateExtinguisherSchema.parse(await readJson(req))

  if (patch.serialNumber) {
    const existing = await getExtinguisherBySerial(patch.serialNumber)
    if (existing && existing.id !== id) throw new ConflictError('Serial number already in use')
  }

  const ext = await updateExtinguisher(id, patch)
  if (!ext) throw new NotFoundError('Extinguisher not found')

  after(() =>
    writeAuditLog({
      actorUserId: ctx.userId,
      action: 'extinguisher.update',
      entityType: 'extinguisher',
      entityId: id,
      ip: getClientIp(req),
    })
  )
  return ok(ext)
})

export const DELETE = withApi(async (req: NextRequest, { params }: Ctx) => {
  const ctx = await requireRole(req, 'admin')
  const { id } = await params

  const deleted = await deleteExtinguisher(id)
  if (!deleted) throw new NotFoundError('Extinguisher not found')

  after(() =>
    writeAuditLog({
      actorUserId: ctx.userId,
      action: 'extinguisher.delete',
      entityType: 'extinguisher',
      entityId: id,
      ip: getClientIp(req),
    })
  )
  return ok({ message: 'Extinguisher deleted' })
})
