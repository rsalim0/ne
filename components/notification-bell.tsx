'use client'

import Link from 'next/link'
import useSWR from 'swr'
import { Bell } from '@phosphor-icons/react/dist/ssr'
import { fetcher } from '@/lib/api-client'
import { cn } from '@/lib/utils'

export const UNREAD_COUNT_KEY = '/api/v1/notifications/unread-count'

export function NotificationBell({ className }: { className?: string }) {
  const { data } = useSWR(UNREAD_COUNT_KEY, (k: string) => fetcher<{ count: number }>(k), {
    refreshInterval: 30000,
    revalidateOnFocus: true,
  })
  const count = data?.data.count ?? 0

  return (
    <Link
      href="/notifications"
      aria-label={count > 0 ? `Notifications, ${count} unread` : 'Notifications'}
      className={cn(
        'relative flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-surface-2 hover:text-foreground',
        className,
      )}
    >
      <Bell weight={count > 0 ? 'fill' : 'regular'} className="h-[18px] w-[18px]" />
      {count > 0 && (
        <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold leading-none text-primary-foreground ring-2 ring-surface">
          {count > 9 ? '9+' : count}
        </span>
      )}
    </Link>
  )
}
