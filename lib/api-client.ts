import type { PaginationMeta } from '@/lib/http/responses'

export class ApiError extends Error {
  status: number
  code?: string
  details?: unknown
  constructor(message: string, status: number, code?: string, details?: unknown) {
    super(message)
    this.status = status
    this.code = code
    this.details = details
  }
}

export type ApiEnvelope<T> = { success: true; data: T; meta?: PaginationMeta }

/**
 * Browser-side fetch wrapper for the FEMS REST API. Same-origin requests send
 * the httpOnly auth cookie automatically. Throws ApiError on non-2xx.
 */
async function request<T>(path: string, init?: RequestInit): Promise<ApiEnvelope<T>> {
  const res = await fetch(path, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
  })
  const json = await res.json().catch(() => null)
  if (!res.ok || !json?.success) {
    throw new ApiError(
      json?.error?.message ?? `Request failed (${res.status})`,
      res.status,
      json?.error?.code,
      json?.error?.details
    )
  }
  return json as ApiEnvelope<T>
}

export const api = {
  get: <T>(path: string) => request<T>(path, { method: 'GET' }),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PATCH', body: body ? JSON.stringify(body) : undefined }),
  put: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PUT', body: body ? JSON.stringify(body) : undefined }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
}

/** SWR fetcher returning the full envelope (so callers can read `meta`). */
export const fetcher = <T>(path: string) => request<T>(path)
