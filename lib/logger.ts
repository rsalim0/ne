import pino from 'pino'

/**
 * Structured application logger.
 *
 * Pretty-printed in development, JSON in production (ideal for Vercel log
 * aggregation). Use `logger.child({ requestId })` for per-request context.
 */
const isDev = process.env.NODE_ENV !== 'production'

export const logger = pino({
  level: process.env.LOG_LEVEL ?? (isDev ? 'debug' : 'info'),
  ...(isDev
    ? {
        transport: {
          target: 'pino-pretty',
          options: { colorize: true, translateTime: 'SYS:HH:MM:ss', ignore: 'pid,hostname' },
        },
      }
    : {}),
  redact: ['req.headers.authorization', 'req.headers.cookie', '*.password', '*.passwordHash'],
})
