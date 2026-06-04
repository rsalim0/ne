import crypto from 'node:crypto'
import { and, desc, eq, isNull } from 'drizzle-orm'
import { db } from '@/lib/db/client'
import { emailOtps, type OtpPurpose } from '@/lib/db/schema'

const CODE_LENGTH = 6
const MAX_ATTEMPTS = 5

function hashCode(raw: string): string {
  return crypto.createHash('sha256').update(raw).digest('hex')
}

/** Cryptographically random 6-digit numeric code (zero-padded). */
function randomCode(): string {
  const n = crypto.randomInt(0, 10 ** CODE_LENGTH)
  return n.toString().padStart(CODE_LENGTH, '0')
}

/**
 * Issue a fresh OTP for a user + purpose. Any earlier un-consumed codes for the
 * same purpose are invalidated first (only the newest code is ever valid).
 * Returns the RAW code, which is emailed to the user.
 */
export async function issueOtp(
  userId: string,
  purpose: OtpPurpose,
  ttlMinutes = 15
): Promise<string> {
  // Invalidate previous outstanding codes for this purpose.
  await db
    .update(emailOtps)
    .set({ consumedAt: new Date() })
    .where(
      and(eq(emailOtps.userId, userId), eq(emailOtps.purpose, purpose), isNull(emailOtps.consumedAt))
    )

  const code = randomCode()
  await db.insert(emailOtps).values({
    userId,
    purpose,
    codeHash: hashCode(code),
    expiresAt: new Date(Date.now() + ttlMinutes * 60_000),
  })
  return code
}

export type OtpResult = 'ok' | 'invalid' | 'expired' | 'too_many_attempts'

/**
 * Validate and consume an OTP. On success the code is marked consumed and 'ok'
 * is returned. Wrong codes increment an attempt counter and are rejected with
 * 'too_many_attempts' once the limit is hit (the code is then burned).
 */
export async function verifyOtp(
  userId: string,
  purpose: OtpPurpose,
  code: string
): Promise<OtpResult> {
  const [row] = await db
    .select()
    .from(emailOtps)
    .where(
      and(eq(emailOtps.userId, userId), eq(emailOtps.purpose, purpose), isNull(emailOtps.consumedAt))
    )
    .orderBy(desc(emailOtps.createdAt))
    .limit(1)

  if (!row) return 'invalid'
  if (row.expiresAt.getTime() <= Date.now()) return 'expired'
  if (row.attempts >= MAX_ATTEMPTS) {
    await db.update(emailOtps).set({ consumedAt: new Date() }).where(eq(emailOtps.id, row.id))
    return 'too_many_attempts'
  }

  if (hashCode(code) !== row.codeHash) {
    const attempts = row.attempts + 1
    await db
      .update(emailOtps)
      .set({ attempts, consumedAt: attempts >= MAX_ATTEMPTS ? new Date() : null })
      .where(eq(emailOtps.id, row.id))
    return attempts >= MAX_ATTEMPTS ? 'too_many_attempts' : 'invalid'
  }

  await db.update(emailOtps).set({ consumedAt: new Date() }).where(eq(emailOtps.id, row.id))
  return 'ok'
}
