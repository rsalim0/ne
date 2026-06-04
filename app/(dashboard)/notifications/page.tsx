'use client'

import { useState } from 'react'
import useSWR, { useSWRConfig } from 'swr'
import type { Icon } from '@phosphor-icons/react'
import {
  Bell,
  ClipboardText,
  Wrench,
  FireExtinguisher,
  WarningCircle,
  CheckCircle,
} from '@phosphor-icons/react/dist/ssr'
import { api, fetcher, ApiError } from '@/lib/api-client'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Alert, EmptyState, Pagination, Skeleton } from '@/components/ui'
import { UNREAD_COUNT_KEY } from '@/components/notification-bell'

type Notification = {
  id: string
  type: string
  title: string
  message: string
  entityType: string | null
  entityId: string | null
  readAt: string | null
  createdAt: string
}

const ICONS: Record<string, Icon> = {
  inspection_scheduled: ClipboardText,
  inspection: ClipboardText,
  maintenance: Wrench,
  extinguisher: FireExtinguisher,
  warning: WarningCircle,
}

function iconFor(n: Notification): Icon {
  return ICONS[n.type] ?? ICONS[n.entityType ?? ''] ?? Bell
}

function relativeTime(iso: string): string {
  const then = new Date(iso).getTime()
  if (Number.isNaN(then)) return ''
  const diff = Date.now() - then
  const mins = Math.round(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.round(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.round(hrs / 24)
  if (days < 30) return `${days}d ago`
  return new Date(iso).toLocaleDateString()
}

export default function NotificationsPage() {
  const [page, setPage] = useState(1)
  const [error, setError] = useState('')
  const { mutate: globalMutate } = useSWRConfig()

  const key = `/api/v1/notifications?page=${page}&limit=20`
  const { data, isLoading, mutate } = useSWR(key, (k: string) => fetcher<Notification[]>(k))

  const rows = data?.data ?? []
  const meta = data?.meta
  const hasUnread = rows.some((n) => !n.readAt)

  async function markRead(n: Notification) {
    if (n.readAt) return
    try {
      await api.patch(`/api/v1/notifications/${n.id}`)
      mutate()
      globalMutate(UNREAD_COUNT_KEY)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not update notification')
    }
  }

  async function markAllRead() {
    setError('')
    try {
      await api.post('/api/v1/notifications/read-all')
      mutate()
      globalMutate(UNREAD_COUNT_KEY)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not update notifications')
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">Notifications</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Inspection, maintenance and compliance alerts.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={markAllRead} disabled={!hasUnread}>
          <CheckCircle weight="fill" />
          Mark all read
        </Button>
      </div>

      {error && <Alert>{error}</Alert>}

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-2xl border bg-card">
          <EmptyState title="You're all caught up" hint="New alerts will show up here." />
        </div>
      ) : (
        <ul className="space-y-2">
          {rows.map((n) => {
            const ItemIcon = iconFor(n)
            const unread = !n.readAt
            return (
              <li key={n.id}>
                <button
                  type="button"
                  onClick={() => markRead(n)}
                  className={cn(
                    'flex w-full items-start gap-3 rounded-xl border bg-card p-4 text-left transition-colors hover:border-primary/30',
                    unread && 'bg-primary/[0.03]',
                  )}
                >
                  <span
                    className={cn(
                      'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
                      unread
                        ? 'bg-primary/10 text-primary'
                        : 'bg-surface-2 text-muted-foreground',
                    )}
                  >
                    <ItemIcon weight="fill" className="h-[18px] w-[18px]" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="truncate text-sm font-medium text-foreground">{n.title}</span>
                      {unread && (
                        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" aria-label="Unread" />
                      )}
                    </span>
                    <span className="mt-0.5 block text-sm text-muted-foreground">{n.message}</span>
                    <span className="mt-1 block text-xs text-muted-foreground/80">
                      {relativeTime(n.createdAt)}
                    </span>
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      )}

      {meta && <Pagination page={meta.page} totalPages={meta.totalPages} onPage={setPage} />}
    </div>
  )
}
