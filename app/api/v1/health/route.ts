import { sql } from 'drizzle-orm'
import { withApi } from '@/lib/http/handler'
import { ok } from '@/lib/http/responses'
import { db } from '@/lib/db/client'

/** Liveness + DB connectivity probe. */
export const GET = withApi(async () => {
  let database = 'down'
  try {
    await db.execute(sql`select 1`)
    database = 'up'
  } catch {
    database = 'down'
  }
  return ok({ status: 'ok', database, timestamp: new Date().toISOString() })
})
