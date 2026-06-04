import { after, type NextRequest } from 'next/server'
import { withApi, readJson, getClientIp } from '@/lib/http/handler'
import { ok } from '@/lib/http/responses'
import { ValidationError, TooManyRequestsError } from '@/lib/http/errors'
import { resetPasswordSchema } from '@/lib/validation/auth'
import { verifyOtp } from '@/lib/services/email-otp'
import { findUserByEmail, setUserPassword, markEmailVerified } from '@/lib/services/users'
import { hashPassword } from '@/lib/auth/password'
import { writeAuditLog } from '@/lib/audit'

export const POST = withApi(async (req: NextRequest) => {
  const { email, code, password } = resetPasswordSchema.parse(await readJson(req))

  const user = await findUserByEmail(email)
  // Generic error to avoid revealing whether the account exists.
  if (!user) throw new ValidationError('Invalid or expired code')

  const result = await verifyOtp(user.id, 'password_reset', code)
  if (result === 'too_many_attempts') {
    throw new TooManyRequestsError('Too many incorrect attempts. Request a new code.')
  }
  if (result !== 'ok') throw new ValidationError('Invalid or expired code')

  await setUserPassword(user.id, await hashPassword(password))
  // A successful reset proves email ownership, so confirm it if still pending.
  if (!user.emailVerifiedAt) await markEmailVerified(user.id)

  after(() =>
    writeAuditLog({ actorUserId: user.id, action: 'user.password_reset', ip: getClientIp(req) })
  )
  return ok({ message: 'Password has been reset. You can now log in.' })
})
