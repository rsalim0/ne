import { inArray } from 'drizzle-orm'
import { db } from '@/lib/db/client'
import { notifications, users, type UserRole } from '@/lib/db/schema'

export type NotificationPayload = {
  type: string
  title: string
  message: string
  entityType?: string
  entityId?: string
}

/** Create a single in-app notification for one recipient. */
export async function createNotification(
  userId: string,
  payload: NotificationPayload
): Promise<void> {
  await db.insert(notifications).values({ userId, ...payload })
}

/** Notify every user whose role is in `roles` (e.g. alert inspectors + admins). */
export async function notifyRoles(
  roles: UserRole[],
  payload: NotificationPayload
): Promise<void> {
  const recipients = await db
    .select({ id: users.id })
    .from(users)
    .where(inArray(users.role, roles))

  if (recipients.length === 0) return
  await db
    .insert(notifications)
    .values(recipients.map((r) => ({ userId: r.id, ...payload })))
}
