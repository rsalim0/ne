import { after, type NextRequest } from 'next/server'
import { withApi, readJson, getClientIp } from '@/lib/http/handler'
import { created } from '@/lib/http/responses'
import { ConflictError } from '@/lib/http/errors'
import { registerSchema } from '@/lib/validation/auth'
import { findUserByEmail, insertUser } from '@/lib/services/users'
import { hashPassword } from '@/lib/auth/password'
import { writeAuditLog } from '@/lib/audit'

export const POST = withApi(async (req: NextRequest) => {
  const body = registerSchema.parse(await readJson(req))

  if (await findUserByEmail(body.email)) {
    throw new ConflictError('Email is already registered')
  }

  const user = await insertUser({
    firstName: body.firstName,
    lastName: body.lastName,
    email: body.email,
    passwordHash: await hashPassword(body.password),
  })

  after(() =>
    writeAuditLog({
      actorUserId: user.id,
      action: 'user.register',
      entityType: 'user',
      entityId: user.id,
      ip: getClientIp(req),
    })
  )
  return created(user)
})
