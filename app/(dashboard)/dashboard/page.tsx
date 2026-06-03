'use client'

import type { Icon } from '@phosphor-icons/react'
import Link from 'next/link'
import useSWR from 'swr'
import { useUser } from '@/lib/user-context'
import { fetcher } from '@/lib/api-client'
import { Card, CardContent, Skeleton } from '@/components/ui'
import {
  FireExtinguisher,
  ClipboardText,
  Wrench,
  ChartBar,
  UsersThree,
} from '@phosphor-icons/react/dist/ssr'
import type { UserRole } from '@/lib/db/schema'

const ALL: UserRole[] = ['admin', 'inspector', 'user']
const MODULES: { href: string; label: string; desc: string; icon: Icon; roles: UserRole[] }[] = [
  { href: '/extinguishers', label: 'Extinguishers', desc: 'Register, track status and manage equipment.', icon: FireExtinguisher, roles: ALL },
  { href: '/inspections', label: 'Inspections', desc: 'Schedule and track inspection activities.', icon: ClipboardText, roles: ALL },
  { href: '/maintenance', label: 'Maintenance', desc: 'Log maintenance and review history.', icon: Wrench, roles: ['admin', 'inspector'] },
  { href: '/reports', label: 'Reports', desc: 'Compliance analytics and PDF/CSV exports.', icon: ChartBar, roles: ALL },
  { href: '/users', label: 'Users', desc: 'Manage accounts and roles.', icon: UsersThree, roles: ['admin'] },
]

export default function DashboardPage() {
  const user = useUser()
  const mods = MODULES.filter((m) => m.roles.includes(user.role))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Welcome back, {user.firstName}</h1>
        <p className="mt-1 text-sm text-muted">Fire safety operations overview.</p>
      </div>

      <Stats />

      <h2 className="text-sm font-semibold text-foreground">Quick access</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {mods.map((m) => (
          <Link key={m.href} href={m.href}>
            <Card className="h-full transition-colors hover:border-accent/40">
              <CardContent className="flex items-start gap-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">
                  <m.icon className="h-5 w-5" weight="fill" />
                </span>
                <span>
                  <span className="block font-medium text-foreground">{m.label}</span>
                  <span className="mt-0.5 block text-sm text-muted">{m.desc}</span>
                </span>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}

type DashboardStatsData = {
  extinguishers: { total: number; active: number; underMaintenance: number; expired: number; expiringSoon: number }
  inspections: { pending: number; overdue: number }
  maintenance: { total: number }
}

function Stats() {
  const { data, isLoading } = useSWR('/api/v1/reports/dashboard', (k: string) => fetcher<DashboardStatsData>(k))
  const s = data?.data
  const cards: { label: string; value?: number }[] = [
    { label: 'Extinguishers', value: s?.extinguishers.total },
    { label: 'Active', value: s?.extinguishers.active },
    { label: 'Expired', value: s?.extinguishers.expired },
    { label: 'Expiring ≤30d', value: s?.extinguishers.expiringSoon },
    { label: 'Pending insp.', value: s?.inspections.pending },
    { label: 'Overdue insp.', value: s?.inspections.overdue },
  ]
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
      {cards.map((c) => (
        <Card key={c.label}>
          <CardContent className="py-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted">{c.label}</p>
            {isLoading || c.value === undefined ? (
              <Skeleton className="mt-2 h-7 w-10" />
            ) : (
              <p className="mt-1 text-2xl font-semibold text-foreground">{c.value}</p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
