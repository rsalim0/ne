import { z } from 'zod'

/**
 * Centralized, validated runtime configuration.
 *
 * Parsed lazily (on first `getConfig()` call) rather than at module load so that
 * `next build` — which imports route modules for analysis without setting all env
 * vars — does not crash. Handlers/db read config at request time.
 */
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),

  // Database (Supabase). DATABASE_URL = pooled transaction URL (app runtime).
  // DIRECT_URL = direct session URL (drizzle-kit migrations only).
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  DIRECT_URL: z.string().min(1).optional(),

  // Auth
  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 chars'),
  JWT_EXPIRES_IN: z.string().default('1h'),
  BCRYPT_ROUNDS: z.coerce.number().int().min(4).max(15).default(12),

  // App / CORS
  APP_URL: z.string().url().default('http://localhost:3000'),
  CORS_ALLOWED_ORIGINS: z.string().default('http://localhost:3000'),

  // Email (optional; falls back to console/log transport in dev)
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().optional(),
})

export type AppConfig = z.infer<typeof envSchema>

let cached: AppConfig | null = null

export function getConfig(): AppConfig {
  if (cached) return cached
  const parsed = envSchema.safeParse(process.env)
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  - ${i.path.join('.') || '(root)'}: ${i.message}`)
      .join('\n')
    throw new Error(`Invalid environment configuration:\n${issues}`)
  }
  cached = parsed.data
  return cached
}

/** Allowed CORS origins as a normalized array. */
export function getAllowedOrigins(): string[] {
  return getConfig()
    .CORS_ALLOWED_ORIGINS.split(',')
    .map((o) => o.trim())
    .filter(Boolean)
}

export const isProd = () => getConfig().NODE_ENV === 'production'
