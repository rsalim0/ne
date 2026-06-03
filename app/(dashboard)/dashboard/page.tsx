'use client'

import type { Icon } from '@phosphor-icons/react'
import Link from 'next/link'
import useSWR from 'swr'
import { useUser } from '@/lib/user-context'
import { fetcher } from '@/lib/api-client'
import { Skeleton } from '@/components/ui'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { DonutChart, BarChart, MiniProgressBar } from '@/components/charts'
import {
  FireExtinguisher,
  ClipboardText,
  Wrench,
  ChartBar,
  UsersThree,
  Warning,
  CheckCircle,
  Clock,
  ChartLineUp,
} from '@phosphor-icons/react/dist/ssr'
import type { UserRole } from '@/lib/db/schema'

/* -------------------------------------------------------------------------- */
/*  Module definitions                                                        */
/* -------------------------------------------------------------------------- */

const ALL: UserRole[] = ['admin', 'inspector', 'user']

const MODULES: {
  href: string
  label: string
  desc: string
  icon: Icon
  roles: UserRole[]
}[] = [
  {
    href: '/extinguishers',
    label: 'Extinguishers',
    desc: 'Register, track status and manage equipment.',
    icon: FireExtinguisher,
    roles: ALL,
  },
  {
    href: '/inspections',
    label: 'Inspections',
    desc: 'Schedule and track inspection activities.',
    icon: ClipboardText,
    roles: ALL,
  },
  {
    href: '/maintenance',
    label: 'Maintenance',
    desc: 'Log maintenance and review history.',
    icon: Wrench,
    roles: ['admin', 'inspector'],
  },
  {
    href: '/reports',
    label: 'Reports',
    desc: 'Compliance analytics and PDF/CSV exports.',
    icon: ChartBar,
    roles: ALL,
  },
  {
    href: '/users',
    label: 'Users',
    desc: 'Manage accounts and roles.',
    icon: UsersThree,
    roles: ['admin'],
  },
]

/* -------------------------------------------------------------------------- */
/*  Data types                                                                */
/* -------------------------------------------------------------------------- */

type DashboardStatsData = {
  extinguishers: {
    total: number
    active: number
    underMaintenance: number
    expired: number
    expiringSoon: number
  }
  inspections: { pending: number; overdue: number }
  maintenance: { total: number }
}

/* -------------------------------------------------------------------------- */
/*  Page                                                                      */
/* -------------------------------------------------------------------------- */

export default function DashboardPage() {
  const user = useUser()
  const mods = MODULES.filter((m) => m.roles.includes(user.role))

  const { data, isLoading } = useSWR('/api/v1/reports/dashboard', (k: string) =>
    fetcher<DashboardStatsData>(k)
  )
  const s = data?.data

  return (
    <div className="space-y-8">
      {/* ------------------------------------------------------------------ */}
      {/* Welcome header                                                      */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
            Fire Safety Operations
          </p>
          <h1 className="mt-0.5 text-2xl font-bold text-foreground">
            Welcome back, {user.firstName}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Here&apos;s an overview of your system as of today.
          </p>
        </div>
        <Badge variant="outline" size="lg" className="self-start sm:self-auto capitalize">
          {user.role}
        </Badge>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* KPI stat cards                                                       */}
      {/* ------------------------------------------------------------------ */}
      <KpiGrid stats={s} isLoading={isLoading} />

      {/* ------------------------------------------------------------------ */}
      {/* Charts row                                                          */}
      {/* ------------------------------------------------------------------ */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Donut — extinguisher status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FireExtinguisher className="h-4 w-4 text-primary" weight="fill" />
              Extinguisher Status
            </CardTitle>
            <CardDescription>Breakdown by current condition</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            {isLoading || !s ? (
              <div className="flex items-center gap-6">
                <Skeleton className="h-40 w-40 rounded-full" />
                <div className="flex flex-col gap-3">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-20" />
                </div>
              </div>
            ) : (
              <DonutChart
                label="Total"
                size={160}
                data={[
                  { label: 'Active', value: s.extinguishers.active, color: '#10b981' },
                  {
                    label: 'Maintenance',
                    value: s.extinguishers.underMaintenance,
                    color: '#3b82f6',
                  },
                  { label: 'Expired', value: s.extinguishers.expired, color: '#dc2626' },
                  {
                    label: 'Expiring soon',
                    value: s.extinguishers.expiringSoon,
                    color: '#f59e0b',
                  },
                ]}
              />
            )}
          </CardContent>
        </Card>

        {/* Bar — inspections + maintenance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ChartLineUp className="h-4 w-4 text-primary" weight="fill" />
              Activity Summary
            </CardTitle>
            <CardDescription>Inspections and maintenance at a glance</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            {isLoading || !s ? (
              <div className="flex items-end gap-4 pt-4">
                <Skeleton className="h-24 w-16 rounded" />
                <Skeleton className="h-16 w-16 rounded" />
                <Skeleton className="h-32 w-16 rounded" />
              </div>
            ) : (
              <BarChart
                height={180}
                data={[
                  {
                    label: 'Pending',
                    value: s.inspections.pending,
                    color: '#f59e0b',
                  },
                  {
                    label: 'Overdue',
                    value: s.inspections.overdue,
                    color: '#dc2626',
                  },
                  {
                    label: 'Maintenance',
                    value: s.maintenance.total,
                    color: '#3b82f6',
                  },
                ]}
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Quick access module grid                                            */}
      {/* ------------------------------------------------------------------ */}
      <div>
        <h2 className="mb-4 text-sm font-semibold text-foreground">Quick access</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {mods.map((m) => (
            <ModuleCard key={m.href} module={m} />
          ))}
        </div>
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  KPI grid                                                                  */
/* -------------------------------------------------------------------------- */

type KpiCardDef = {
  label: string
  value?: number
  icon: Icon
  /** Tailwind text colour for the icon background circle */
  iconBg: string
  /** Tailwind text colour for the icon itself */
  iconColor: string
  badge?: { label: string; variant: 'success' | 'warning' | 'error' | 'info' | 'secondary' }
  /** If provided, renders a mini progress bar */
  progressOf?: number
  progressColor?: string
}

function buildKpis(s?: DashboardStatsData): KpiCardDef[] {
  return [
    {
      label: 'Total extinguishers',
      value: s?.extinguishers.total,
      icon: FireExtinguisher,
      iconBg: 'bg-primary/10',
      iconColor: 'text-primary',
    },
    {
      label: 'Active',
      value: s?.extinguishers.active,
      icon: CheckCircle,
      iconBg: 'bg-emerald-500/10',
      iconColor: 'text-emerald-600',
      badge: { label: 'Good', variant: 'success' },
      progressOf: s?.extinguishers.total,
      progressColor: '#10b981',
    },
    {
      label: 'Expired',
      value: s?.extinguishers.expired,
      icon: Warning,
      iconBg: 'bg-red-500/10',
      iconColor: 'text-red-600',
      badge: s && s.extinguishers.expired > 0 ? { label: 'Action needed', variant: 'error' } : undefined,
      progressOf: s?.extinguishers.total,
      progressColor: '#dc2626',
    },
    {
      label: 'Expiring ≤30d',
      value: s?.extinguishers.expiringSoon,
      icon: Clock,
      iconBg: 'bg-amber-500/10',
      iconColor: 'text-amber-600',
      badge:
        s && s.extinguishers.expiringSoon > 0
          ? { label: 'Review soon', variant: 'warning' }
          : undefined,
      progressOf: s?.extinguishers.total,
      progressColor: '#f59e0b',
    },
    {
      label: 'Pending inspections',
      value: s?.inspections.pending,
      icon: ClipboardText,
      iconBg: 'bg-amber-500/10',
      iconColor: 'text-amber-600',
    },
    {
      label: 'Overdue inspections',
      value: s?.inspections.overdue,
      icon: Warning,
      iconBg: 'bg-red-500/10',
      iconColor: 'text-red-600',
      badge:
        s && s.inspections.overdue > 0 ? { label: 'Overdue', variant: 'error' } : undefined,
    },
  ]
}

function KpiGrid({
  stats,
  isLoading,
}: {
  stats?: DashboardStatsData
  isLoading: boolean
}) {
  const cards = buildKpis(stats)

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-6">
      {cards.map((c) => (
        <KpiCard key={c.label} def={c} isLoading={isLoading} />
      ))}
    </div>
  )
}

function KpiCard({ def, isLoading }: { def: KpiCardDef; isLoading: boolean }) {
  const Icon = def.icon
  return (
    <Card className="flex flex-col gap-3 p-5">
      {/* Icon + badge row */}
      <div className="flex items-start justify-between">
        <span
          className={`flex h-9 w-9 items-center justify-center rounded-xl ${def.iconBg} ${def.iconColor}`}
        >
          <Icon className="h-4 w-4" weight="fill" />
        </span>
        {def.badge && !isLoading && (
          <Badge variant={def.badge.variant} size="sm">
            {def.badge.label}
          </Badge>
        )}
      </div>

      {/* Value */}
      {isLoading || def.value === undefined ? (
        <Skeleton className="h-8 w-12" />
      ) : (
        <p className="text-2xl font-bold leading-none text-foreground">{def.value}</p>
      )}

      {/* Label */}
      <p className="text-xs font-medium text-muted-foreground">{def.label}</p>

      {/* Optional mini progress bar */}
      {def.progressOf !== undefined && !isLoading && def.value !== undefined && (
        <MiniProgressBar
          value={def.value}
          max={def.progressOf}
          color={def.progressColor}
          className="mt-auto"
        />
      )}
    </Card>
  )
}

/* -------------------------------------------------------------------------- */
/*  Module card                                                               */
/* -------------------------------------------------------------------------- */

function ModuleCard({
  module: m,
}: {
  module: { href: string; label: string; desc: string; icon: Icon; roles: UserRole[] }
}) {
  const Icon = m.icon
  return (
    <Link href={m.href} className="group">
      <Card className="h-full transition-all duration-150 hover:border-primary/30 hover:shadow-sm group-focus-visible:ring-2 group-focus-visible:ring-ring">
        <CardContent className="flex items-start gap-4 p-5">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/8 text-primary ring-1 ring-primary/12 transition-colors group-hover:bg-primary/14">
            <Icon className="h-5 w-5" weight="fill" />
          </span>
          <span>
            <span className="block font-semibold text-foreground">{m.label}</span>
            <span className="mt-0.5 block text-sm leading-snug text-muted-foreground">
              {m.desc}
            </span>
          </span>
        </CardContent>
      </Card>
    </Link>
  )
}
