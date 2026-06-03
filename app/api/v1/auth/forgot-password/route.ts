import { type NextRequest } from 'next/server'
import { withApi, readJson } from '@/lib/http/handler'
import { ok } from '@/lib/http/responses'
import { forgotPasswordSchema } from '@/lib/validation/auth'
import { findUserByEmail } from '@/lib/services/users'
import { createResetToken } from '@/lib/services/password-reset'
import { sendEmail } from '@/lib/email'
import { getConfig, isProd } from '@/lib/config'

export const POST = withApi(async (req: NextRequest) => {
  const { email } = forgotPasswordSchema.parse(await readJson(req))

  let devToken: string | undefined
  const user = await findUserByEmail(email)
  if (user) {
    const token = await createResetToken(user.id)
    devToken = token
    const resetUrl = `${getConfig().APP_URL}/reset-password?token=${token}`
    await sendEmail({
      to: email,
      subject: 'Reset your FEMS password',
      text: `Reset your password using this link (valid 30 minutes): ${resetUrl}`,
    })
  }

  // Identical response regardless of account existence (no email enumeration).
  const data: Record<string, unknown> = {
    message: 'If an account exists for that email, a reset link has been sent.',
  }
  // Dev convenience so the flow is testable without an email provider.
  if (!isProd() && devToken) data.devResetToken = devToken
  return ok(data)
})
