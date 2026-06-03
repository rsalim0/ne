import { type NextRequest } from 'next/server'
import { withApi, readJson } from '@/lib/http/handler'
import { ok } from '@/lib/http/responses'
import { UnauthorizedError, ValidationError } from '@/lib/http/errors'
import { changePasswordSchema } from '@/lib/validation/auth'
import { verifySession } from '@/lib/auth/session'
import { findUserById, setUserPassword } from '@/lib/services/users'
import { hashPassword, verifyPassword } from '@/lib/auth/password'

export const POST = withApi(async (req: NextRequest) => {
  const ctx = await verifySession(req)
  const { currentPassword, newPassword } = changePasswordSchema.parse(await readJson(req))

  const user = await findUserById(ctx.userId)
  if (!user) throw new UnauthorizedError()
  if (!(await verifyPassword(currentPassword, user.passwordHash))) {
    throw new ValidationError('Current password is incorrect')
  }

  await setUserPassword(user.id, await hashPassword(newPassword))
  return ok({ message: 'Password changed successfully' })
})
