import { db } from '@/lib/db/client'
import { auditLogs } from '@/lib/db/schema'
import { logger } from '@/lib/logger'

export type AuditEntry = {
  actorUserId?: string | null
  action: string
  entityType?: string
  entityId?: string
  metadata?: Record<string, unknown>
  ip?: string | null
}

/**
 * Record a system-activity entry. Swallows its own errors so an audit failure
 * never breaks the originating request — typically invoked via `after()`.
 */
export async function writeAuditLog(entry: AuditEntry): Promise<void> {
  try {
    await db.insert(auditLogs).values({
      actorUserId: entry.actorUserId ?? null,
      action: entry.action,
      entityType: entry.entityType ?? null,
      entityId: entry.entityId ?? null,
      metadata: entry.metadata ?? null,
      ip: entry.ip ?? null,
    })
  } catch (err) {
    logger.error({ err, action: entry.action }, 'failed to write audit log')
  }
}
