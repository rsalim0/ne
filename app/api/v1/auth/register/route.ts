import { after, type NextRequest } from 'next/server'
import { withApi, readJson, getClientIp } from '@/lib/http/handler'
import { created } from '@/lib/http/responses'
import { ConflictError } from '@/lib/http/errors'
import { registerSchema } from '@/lib/validation/auth'
import { findUserByEmail, insertUser } from '@/lib/services/users'
import { issueOtp } from '@/lib/services/email-otp'
import { sendVerificationOtp } from '@/lib/email'
import { hashPassword } from '@/lib/auth/password'
import { writeAuditLog } from '@/lib/audit'
import { isProd } from '@/lib/config'

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

  // Issue + email a confirmation code. The account stays unverified (and cannot
  // log in) until the code is confirmed.
  const code = await issueOtp(user.id, 'verify_email')
  await sendVerificationOtp(user.email, code)

  after(() =>
    writeAuditLog({
      actorUserId: user.id,
      action: 'user.register',
      entityType: 'user',
      entityId: user.id,
      ip: getClientIp(req),
    })
  )

  const data: Record<string, unknown> = {
    user,
    message: 'Account created. Check your email for a 6-digit confirmation code.',
  }
  // Dev convenience so the flow is testable without inspecting the inbox.
  if (!isProd()) data.devOtp = code
  return created(data)
})
