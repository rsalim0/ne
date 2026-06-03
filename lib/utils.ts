/** Minimal className combiner (truthy join) — avoids a clsx dependency. */
export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

/** Format an ISO date/datetime string as a short local date. */
export function formatDate(value?: string | null): string {
  if (!value) return '—'
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString()
}

/** Human label for enum-ish slugs (e.g. "dry_chemical" -> "Dry Chemical"). */
export function humanize(value?: string | null): string {
  if (!value) return '—'
  return value.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}
