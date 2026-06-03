import { after, type NextRequest } from 'next/server'
import { withApi, readJson, getClientIp } from '@/lib/http/handler'
import { ok } from '@/lib/http/responses'
import { ConflictError, NotFoundError, ValidationError } from '@/lib/http/errors'
import { updateUserSchema } from '@/lib/validation/user'
import { requireRole } from '@/lib/auth/rbac'
import {
  deleteUserById,
  findUserByEmail,
  findUserById,
  toSafeUser,
  updateUserById,
} from '@/lib/services/users'
import { writeAuditLog } from '@/lib/audit'

type Ctx = { params: Promise<{ id: string }> }

export const GET = withApi(async (req: NextRequest, { params }: Ctx) => {
  await requireRole(req, 'admin')
  const { id } = await params
  const user = await findUserById(id)
  if (!user) throw new NotFoundError('User not found')
  return ok(toSafeUser(user))
})

export const PATCH = withApi(async (req: NextRequest, { params }: Ctx) => {
  const ctx = await requireRole(req, 'admin')
  const { id } = await params
  const patch = updateUserSchema.parse(await readJson(req))

  if (patch.email) {
    const existing = await findUserByEmail(patch.email)
    if (existing && existing.id !== id) throw new ConflictError('Email already in use')
  }

  const user = await updateUserById(id, patch)
  if (!user) throw new NotFoundError('User not found')

  after(() =>
    writeAuditLog({
      actorUserId: ctx.userId,
      action: 'user.update',
      entityType: 'user',
      entityId: id,
      ip: getClientIp(req),
    })
  )
  return ok(user)
})

export const DELETE = withApi(async (req: NextRequest, { params }: Ctx) => {
  const ctx = await requireRole(req, 'admin')
  const { id } = await params
  if (id === ctx.userId) throw new ValidationError('You cannot delete your own account')

  const deleted = await deleteUserById(id)
  if (!deleted) throw new NotFoundError('User not found')

  after(() =>
    writeAuditLog({
      actorUserId: ctx.userId,
      action: 'user.delete',
      entityType: 'user',
      entityId: id,
      ip: getClientIp(req),
    })
  )
  return ok({ message: 'User deleted' })
})
