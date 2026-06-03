import { config as loadEnv } from 'dotenv'
import { defineConfig } from 'drizzle-kit'

// drizzle-kit runs as a standalone CLI — load env from .env.local then .env.
loadEnv({ path: '.env.local' })
loadEnv()

/**
 * drizzle-kit reads env directly (not via lib/config) because it runs as a
 * standalone CLI. Use DIRECT_URL (Supabase direct/session connection, port 5432)
 * for migrations — the pooled transaction URL is not suitable for DDL.
 */
export default defineConfig({
  schema: './lib/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DIRECT_URL ?? process.env.DATABASE_URL ?? '',
  },
  verbose: true,
  strict: true,
})
