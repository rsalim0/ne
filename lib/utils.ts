import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/** className combiner with Tailwind conflict resolution (used by coss UI + legacy ui). */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
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
