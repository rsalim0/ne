import { after, type NextRequest } from 'next/server'
import { withApi, readJson, getClientIp } from '@/lib/http/handler'
import { ok } from '@/lib/http/responses'
import { ValidationError, TooManyRequestsError } from '@/lib/http/errors'
import { verifyEmailSchema } from '@/lib/validation/auth'
import { findUserByEmail, markEmailVerified, toSafeUser } from '@/lib/services/users'
import { verifyOtp } from '@/lib/services/email-otp'
import { createSession, setAuthCookie } from '@/lib/auth/session'
import { writeAuditLog } from '@/lib/audit'

export const POST = withApi(async (req: NextRequest) => {
  const { email, code } = verifyEmailSchema.parse(await readJson(req))

  const user = await findUserByEmail(email)
  // Generic failure if the user doesn't exist (avoid enumeration), unless
  // already verified — in which case just succeed idempotently.
  if (!user) throw new ValidationError('Invalid or expired code')
  if (user.emailVerifiedAt) {
    return ok({ user: toSafeUser(user), message: 'Email already verified. You can sign in.' })
  }

  const result = await verifyOtp(user.id, 'verify_email', code)
  if (result === 'too_many_attempts') {
    throw new TooManyRequestsError('Too many incorrect attempts. Request a new code.')
  }
  if (result !== 'ok') throw new ValidationError('Invalid or expired code')

  await markEmailVerified(user.id)

  // Auto-sign-in on successful confirmation for a smooth onboarding.
  const { token, expiresAt } = await createSession(user.id, user.role, {
    userAgent: req.headers.get('user-agent'),
    ip: getClientIp(req),
  })
  await setAuthCookie(token, expiresAt)

  after(() =>
    writeAuditLog({
      actorUserId: user.id,
      action: 'user.email_verified',
      entityType: 'user',
      entityId: user.id,
      ip: getClientIp(req),
    })
  )

  return ok({ user: toSafeUser(user), token, expiresAt, message: 'Email verified.' })
})
