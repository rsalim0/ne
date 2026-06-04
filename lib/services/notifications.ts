import { and, desc, eq, isNull, sql } from 'drizzle-orm'
import { db } from '@/lib/db/client'
import { notifications } from '@/lib/db/schema'

export type NotificationRow = typeof notifications.$inferSelect

/** List a user's notifications (newest first), optionally only unread ones. */
export async function listNotifications(
  userId: string,
  opts: { limit: number; offset: number; unreadOnly?: boolean }
): Promise<{ rows: NotificationRow[]; total: number }> {
  const where = opts.unreadOnly
    ? and(eq(notifications.userId, userId), isNull(notifications.readAt))
    : eq(notifications.userId, userId)

  const rows = await db
    .select()
    .from(notifications)
    .where(where)
    .orderBy(desc(notifications.createdAt))
    .limit(opts.limit)
    .offset(opts.offset)

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(notifications)
    .where(where)

  return { rows, total: count }
}

/** Number of unread notifications for the badge. */
export async function countUnread(userId: string): Promise<number> {
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(notifications)
    .where(and(eq(notifications.userId, userId), isNull(notifications.readAt)))
  return count
}

/** Mark one notification read (ownership-checked, idempotent). Returns null if not found. */
export async function markNotificationRead(
  userId: string,
  id: string
): Promise<NotificationRow | null> {
  const [updated] = await db
    .update(notifications)
    .set({ readAt: new Date() })
    .where(
      and(
        eq(notifications.id, id),
        eq(notifications.userId, userId),
        isNull(notifications.readAt)
      )
    )
    .returning()
  if (updated) return updated

  // Already read or non-existent — confirm ownership before reporting found/not-found.
  const [existing] = await db
    .select()
    .from(notifications)
    .where(and(eq(notifications.id, id), eq(notifications.userId, userId)))
    .limit(1)
  return existing ?? null
}

/** Mark all of a user's unread notifications read. Returns how many were updated. */
export async function markAllRead(userId: string): Promise<number> {
  const rows = await db
    .update(notifications)
    .set({ readAt: new Date() })
    .where(and(eq(notifications.userId, userId), isNull(notifications.readAt)))
    .returning({ id: notifications.id })
  return rows.length
}
