/**
 * Uniform success response envelope:
 *   { success: true, data, meta? }
 * Error envelope (see errors.ts):
 *   { success: false, error: { code, message, details? } }
 */

export type PaginationMeta = {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

export function ok<T>(data: T, status = 200): Response {
  return jsonResponse(status, { success: true, data })
}

export function created<T>(data: T): Response {
  return jsonResponse(201, { success: true, data })
}

export function noContent(): Response {
  return new Response(null, { status: 204 })
}

export function paginated<T>(
  data: T[],
  opts: { page: number; limit: number; total: number }
): Response {
  const totalPages = opts.limit > 0 ? Math.ceil(opts.total / opts.limit) : 0
  const meta: PaginationMeta = {
    page: opts.page,
    limit: opts.limit,
    total: opts.total,
    totalPages,
    hasNext: opts.page < totalPages,
    hasPrev: opts.page > 1,
  }
  return jsonResponse(200, { success: true, data, meta })
}
