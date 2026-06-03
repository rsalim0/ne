import crypto from 'node:crypto'
import { and, eq, gt, isNull } from 'drizzle-orm'
import { db } from '@/lib/db/client'
import { passwordResets } from '@/lib/db/schema'

function hashToken(raw: string): string {
  return crypto.createHash('sha256').update(raw).digest('hex')
}

/** Create a single-use reset token; returns the RAW token (emailed to the user). */
export async function createResetToken(userId: string, ttlMinutes = 30): Promise<string> {
  const raw = crypto.randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + ttlMinutes * 60_000)
  await db.insert(passwordResets).values({ userId, tokenHash: hashToken(raw), expiresAt })
  return raw
}

/** Validate + consume a reset token. Returns the userId, or null if invalid/expired/used. */
export async function consumeResetToken(raw: string): Promise<string | null> {
  const [row] = await db
    .select()
    .from(passwordResets)
    .where(
      and(
        eq(passwordResets.tokenHash, hashToken(raw)),
        isNull(passwordResets.usedAt),
        gt(passwordResets.expiresAt, new Date())
      )
    )
    .limit(1)
  if (!row) return null
  await db.update(passwordResets).set({ usedAt: new Date() }).where(eq(passwordResets.id, row.id))
  return row.userId
}
