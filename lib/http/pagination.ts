const DEFAULT_LIMIT = 20
const MAX_LIMIT = 100

export type PageParams = {
  page: number
  limit: number
  offset: number
  sort?: string
  order: 'asc' | 'desc'
  q?: string
}

/**
 * Parse standard list query params from a request URL:
 *   ?page=1&limit=20&sort=createdAt&order=desc&q=foo
 */
export function parsePageParams(url: URL): PageParams {
  const page = Math.max(1, toInt(url.searchParams.get('page'), 1))
  const rawLimit = toInt(url.searchParams.get('limit'), DEFAULT_LIMIT)
  const limit = Math.min(MAX_LIMIT, Math.max(1, rawLimit))
  const order = url.searchParams.get('order') === 'asc' ? 'asc' : 'desc'
  const sort = url.searchParams.get('sort') ?? undefined
  const q = url.searchParams.get('q')?.trim() || undefined

  return { page, limit, offset: (page - 1) * limit, sort, order, q }
}

function toInt(value: string | null, fallback: number): number {
  const n = Number(value)
  return Number.isFinite(n) ? Math.trunc(n) : fallback
}
