import { type NextRequest } from 'next/server'
import { withApi, readJson } from '@/lib/http/handler'
import { ok } from '@/lib/http/responses'
import { resendOtpSchema } from '@/lib/validation/auth'
import { findUserByEmail } from '@/lib/services/users'
import { issueOtp } from '@/lib/services/email-otp'
import { sendVerificationOtp } from '@/lib/email'
import { isProd } from '@/lib/config'

export const POST = withApi(async (req: NextRequest) => {
  const { email } = resendOtpSchema.parse(await readJson(req))

  let devOtp: string | undefined
  const user = await findUserByEmail(email)
  // Only (re)send for an existing, still-unverified account.
  if (user && !user.emailVerifiedAt) {
    const code = await issueOtp(user.id, 'verify_email')
    devOtp = code
    await sendVerificationOtp(user.email, code)
  }

  // Identical response regardless of account state (no enumeration).
  const data: Record<string, unknown> = {
    message: 'If that account still needs confirmation, a new code has been sent.',
  }
  if (!isProd() && devOtp) data.devOtp = devOtp
  return ok(data)
})
