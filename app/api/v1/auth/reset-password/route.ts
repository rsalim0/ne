import { after, type NextRequest } from 'next/server'
import { withApi, readJson, getClientIp } from '@/lib/http/handler'
import { ok } from '@/lib/http/responses'
import { ValidationError } from '@/lib/http/errors'
import { resetPasswordSchema } from '@/lib/validation/auth'
import { consumeResetToken } from '@/lib/services/password-reset'
import { setUserPassword } from '@/lib/services/users'
import { hashPassword } from '@/lib/auth/password'
import { writeAuditLog } from '@/lib/audit'

export const POST = withApi(async (req: NextRequest) => {
  const { token, password } = resetPasswordSchema.parse(await readJson(req))

  const userId = await consumeResetToken(token)
  if (!userId) throw new ValidationError('Invalid or expired reset token')

  await setUserPassword(userId, await hashPassword(password))

  after(() =>
    writeAuditLog({ actorUserId: userId, action: 'user.password_reset', ip: getClientIp(req) })
  )
  return ok({ message: 'Password has been reset. You can now log in.' })
})
