import { after, type NextRequest } from 'next/server'
import { withApi, readJson, getClientIp } from '@/lib/http/handler'
import { created, paginated } from '@/lib/http/responses'
import { ConflictError } from '@/lib/http/errors'
import { parsePageParams } from '@/lib/http/pagination'
import { createUserSchema } from '@/lib/validation/user'
import { requireRole } from '@/lib/auth/rbac'
import { findUserByEmail, insertUser, listUsers } from '@/lib/services/users'
import { hashPassword } from '@/lib/auth/password'
import { writeAuditLog } from '@/lib/audit'
import type { UserRole } from '@/lib/db/schema'

const ROLES = ['admin', 'inspector', 'user'] as const

export const GET = withApi(async (req: NextRequest) => {
  await requireRole(req, 'admin')
  const params = parsePageParams(req.nextUrl)
  const roleParam = req.nextUrl.searchParams.get('role')
  const role = ROLES.includes(roleParam as UserRole) ? (roleParam as UserRole) : undefined

  const { rows, total } = await listUsers({ ...params, role })
  return paginated(rows, { page: params.page, limit: params.limit, total })
})

export const POST = withApi(async (req: NextRequest) => {
  const ctx = await requireRole(req, 'admin')
  const body = createUserSchema.parse(await readJson(req))

  if (await findUserByEmail(body.email)) throw new ConflictError('Email is already registered')

  const user = await insertUser({
    firstName: body.firstName,
    lastName: body.lastName,
    email: body.email,
    passwordHash: await hashPassword(body.password),
    role: body.role,
  })

  after(() =>
    writeAuditLog({
      actorUserId: ctx.userId,
      action: 'user.create',
      entityType: 'user',
      entityId: user.id,
      metadata: { role: user.role },
      ip: getClientIp(req),
    })
  )
  return created(user)
})
