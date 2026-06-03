import type { NextConfig } from 'next'

const isProd = process.env.NODE_ENV === 'production'

// Pragmatic CSP: allows same-origin assets + inline styles/scripts (needed by
// React 19 + swagger-ui). 'unsafe-eval' only in dev (React debugging). Tighten
// with a nonce later if strict CSP is required.
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isProd ? '' : " 'unsafe-eval'"}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  ...(isProd ? ['upgrade-insecure-requests'] : []),
].join('; ')

const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  { key: 'Content-Security-Policy', value: csp },
  ...(isProd
    ? [{ key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' }]
    : []),
]

const nextConfig: NextConfig = {
  // pdfkit reads bundled .afm font files via fs at runtime; keep it external so
  // those assets resolve instead of being (incorrectly) bundled.
  serverExternalPackages: ['pdfkit'],
  async headers() {
    // Swagger UI loads its assets from a CDN, so /api-docs gets a scoped, looser
    // CSP that overrides the global one (last matching header key wins).
    const swaggerCsp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' https://unpkg.com",
      "style-src 'self' 'unsafe-inline' https://unpkg.com",
      "img-src 'self' data: https://unpkg.com",
      "connect-src 'self'",
      "worker-src 'self' blob:",
    ].join('; ')

    return [
      { source: '/:path*', headers: securityHeaders },
      { source: '/api-docs', headers: [{ key: 'Content-Security-Policy', value: swaggerCsp }] },
    ]
  },
}

export default nextConfig
