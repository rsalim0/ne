import { type NextRequest } from 'next/server'
import { withApi, readJson } from '@/lib/http/handler'
import { ok } from '@/lib/http/responses'
import { ConflictError, UnauthorizedError } from '@/lib/http/errors'
import { updateProfileSchema } from '@/lib/validation/user'
import { verifySession } from '@/lib/auth/session'
import { findUserByEmail, updateUserById } from '@/lib/services/users'

export const PATCH = withApi(async (req: NextRequest) => {
  const ctx = await verifySession(req)
  const patch = updateProfileSchema.parse(await readJson(req))

  if (patch.email) {
    const existing = await findUserByEmail(patch.email)
    if (existing && existing.id !== ctx.userId) throw new ConflictError('Email already in use')
  }

  const user = await updateUserById(ctx.userId, patch)
  if (!user) throw new UnauthorizedError()
  return ok(user)
})
