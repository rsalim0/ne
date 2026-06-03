import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

/**
 * Drizzle client over postgres-js.
 *
 * `prepare: false` is REQUIRED when connecting through Supabase's transaction
 * pooler (the pooled `DATABASE_URL`), which does not support prepared statements.
 *
 * A single connection is memoized on `globalThis` to avoid exhausting the pool
 * across hot reloads in development. postgres-js connects lazily (on first
 * query), so constructing this at module load is safe for `next build`.
 */
const globalForDb = globalThis as unknown as {
  __pgClient?: ReturnType<typeof postgres>
}

const client =
  globalForDb.__pgClient ??
  postgres(process.env.DATABASE_URL ?? '', {
    prepare: false,
    max: process.env.NODE_ENV === 'production' ? 10 : 5,
  })

if (process.env.NODE_ENV !== 'production') {
  globalForDb.__pgClient = client
}

export const db = drizzle({ client, schema })
export { schema }
