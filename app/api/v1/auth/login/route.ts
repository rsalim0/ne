import { after, type NextRequest } from 'next/server'
import { withApi, readJson, getClientIp } from '@/lib/http/handler'
import { ok } from '@/lib/http/responses'
import { UnauthorizedError } from '@/lib/http/errors'
import { loginSchema } from '@/lib/validation/auth'
import { findUserByEmail, toSafeUser } from '@/lib/services/users'
import { verifyPassword } from '@/lib/auth/password'
import { createSession, setAuthCookie } from '@/lib/auth/session'
import { writeAuditLog } from '@/lib/audit'

export const POST = withApi(async (req: NextRequest) => {
  const { email, password } = loginSchema.parse(await readJson(req))

  const user = await findUserByEmail(email)
  // Same error whether the user exists or the password is wrong (no enumeration).
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    throw new UnauthorizedError('Invalid email or password')
  }

  const { token, expiresAt } = await createSession(user.id, user.role, {
    userAgent: req.headers.get('user-agent'),
    ip: getClientIp(req),
  })
  await setAuthCookie(token, expiresAt)

  after(() =>
    writeAuditLog({
      actorUserId: user.id,
      action: 'user.login',
      entityType: 'user',
      entityId: user.id,
      ip: getClientIp(req),
    })
  )

  // Token is returned in the body for API clients (Postman/Swagger "Authorize");
  // the web UI relies on the httpOnly cookie set above.
  return ok({ user: toSafeUser(user), token, expiresAt })
})
