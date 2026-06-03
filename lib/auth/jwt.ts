import { SignJWT, jwtVerify } from 'jose'
import { getConfig } from '@/lib/config'
import type { UserRole } from '@/lib/db/schema'

export type AccessTokenClaims = {
  sub: string // user id
  role: UserRole
  sid: string // session id
  jti: string // session jti (for revocation lookup)
}

const key = () => new TextEncoder().encode(getConfig().JWT_SECRET)

export async function signAccessToken(claims: AccessTokenClaims): Promise<string> {
  return new SignJWT({ role: claims.role, sid: claims.sid })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(claims.sub)
    .setJti(claims.jti)
    .setIssuedAt()
    .setExpirationTime(getConfig().JWT_EXPIRES_IN)
    .sign(key())
}

/** Verify signature + expiry. Throws if invalid/expired. */
export async function verifyAccessToken(token: string): Promise<AccessTokenClaims> {
  const { payload } = await jwtVerify(token, key(), { algorithms: ['HS256'] })
  return {
    sub: String(payload.sub),
    role: payload.role as UserRole,
    sid: String(payload.sid),
    jti: String(payload.jti),
  }
}
