import { cookies } from 'next/headers'
import { and, eq, isNull, gt } from 'drizzle-orm'
import type { NextRequest } from 'next/server'
import { db } from '@/lib/db/client'
import { sessions, type UserRole } from '@/lib/db/schema'
import { getConfig, isProd } from '@/lib/config'
import { signAccessToken, verifyAccessToken } from './jwt'
import { UnauthorizedError } from '@/lib/http/errors'

export const ACCESS_COOKIE = 'access_token'

export type AuthContext = {
  userId: string
  role: UserRole
  sessionId: string
  jti: string
}

/**
 * Create a DB-backed session and issue a signed JWT.
 * The DB row enables true logout/invalidation (verifySession checks revokedAt).
 */
export async function createSession(
  userId: string,
  role: UserRole,
  meta: { userAgent?: string | null; ip?: string | null } = {}
): Promise<{ token: string; expiresAt: Date }> {
  const ttlSeconds = parseDuration(getConfig().JWT_EXPIRES_IN)
  const expiresAt = new Date(Date.now() + ttlSeconds * 1000)
  const jti = crypto.randomUUID()

  const [row] = await db
    .insert(sessions)
    .values({
      userId,
      jti,
      userAgent: meta.userAgent ?? null,
      ip: meta.ip ?? null,
      expiresAt,
    })
    .returning({ id: sessions.id })

  const token = await signAccessToken({ sub: userId, role, sid: row.id, jti })
  return { token, expiresAt }
}

/** Verify a token string AND that its DB session is still active. */
async function resolveToken(token: string | null): Promise<AuthContext> {
  if (!token) throw new UnauthorizedError()

  let claims
  try {
    claims = await verifyAccessToken(token)
  } catch {
    throw new UnauthorizedError('Invalid or expired token')
  }

  const [session] = await db
    .select({ id: sessions.id, userId: sessions.userId })
    .from(sessions)
    .where(
      and(
        eq(sessions.jti, claims.jti),
        isNull(sessions.revokedAt),
        gt(sessions.expiresAt, new Date())
      )
    )
    .limit(1)

  if (!session) throw new UnauthorizedError('Session is no longer valid')

  return { userId: claims.sub, role: claims.role, sessionId: session.id, jti: claims.jti }
}

/** Route-handler auth: read token from cookie or Bearer header. Throws 401. */
export async function verifySession(req: NextRequest): Promise<AuthContext> {
  return resolveToken(getTokenFromRequest(req))
}

/** Server-component auth: read token from the request cookie. Returns null if invalid. */
export async function getServerSession(): Promise<AuthContext | null> {
  const store = await cookies()
  try {
    return await resolveToken(store.get(ACCESS_COOKIE)?.value ?? null)
  } catch {
    return null
  }
}

/** Revoke a session by jti (idempotent). */
export async function revokeSession(jti: string): Promise<void> {
  await db.update(sessions).set({ revokedAt: new Date() }).where(eq(sessions.jti, jti))
}

export function getTokenFromRequest(req: NextRequest): string | null {
  const auth = req.headers.get('authorization')
  if (auth?.startsWith('Bearer ')) return auth.slice(7).trim()
  return req.cookies.get(ACCESS_COOKIE)?.value ?? null
}

/* ---- cookie helpers (used by login/logout route handlers) ---- */

export async function setAuthCookie(token: string, expiresAt: Date): Promise<void> {
  const store = await cookies()
  store.set(ACCESS_COOKIE, token, {
    httpOnly: true,
    secure: isProd(),
    sameSite: 'lax',
    path: '/',
    expires: expiresAt,
  })
}

export async function clearAuthCookie(): Promise<void> {
  const store = await cookies()
  store.delete(ACCESS_COOKIE)
}

/** Parse durations like "1h", "30m", "7d", "3600s", "120" (seconds). */
function parseDuration(input: string): number {
  const m = /^(\d+)\s*([smhd])?$/.exec(input.trim())
  if (!m) return 3600
  const n = Number(m[1])
  switch (m[2]) {
    case 'd':
      return n * 86400
    case 'h':
      return n * 3600
    case 'm':
      return n * 60
    default:
      return n // seconds
  }
}
