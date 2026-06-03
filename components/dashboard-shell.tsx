'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import type { Icon } from '@phosphor-icons/react'
import {
  Gauge,
  FireExtinguisher,
  ClipboardText,
  Wrench,
  ChartBar,
  UsersThree,
  SignOut,
  BookOpen,
  UserCircle,
} from '@phosphor-icons/react/dist/ssr'
import { api } from '@/lib/api-client'
import { UserProvider, type CurrentUser } from '@/lib/user-context'
import { cn } from '@/lib/utils'
import type { UserRole } from '@/lib/db/schema'

type NavItem = { href: string; label: string; icon: Icon; roles: UserRole[] }

const ALL: UserRole[] = ['admin', 'inspector', 'user']
const NAV: NavItem[] = [
  { href: '/dashboard', label: 'Overview', icon: Gauge, roles: ALL },
  { href: '/extinguishers', label: 'Extinguishers', icon: FireExtinguisher, roles: ALL },
  { href: '/inspections', label: 'Inspections', icon: ClipboardText, roles: ALL },
  { href: '/maintenance', label: 'Maintenance', icon: Wrench, roles: ['admin', 'inspector'] },
  { href: '/reports', label: 'Reports', icon: ChartBar, roles: ALL },
  { href: '/users', label: 'Users', icon: UsersThree, roles: ['admin'] },
]

const roleColor: Record<UserRole, string> = {
  admin: 'text-accent',
  inspector: 'text-blue-600 dark:text-blue-400',
  user: 'text-muted',
}

export function DashboardShell({ user, children }: { user: CurrentUser; children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const items = NAV.filter((n) => n.roles.includes(user.role))

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/')

  async function logout() {
    try {
      await api.post('/api/v1/auth/logout')
    } finally {
      router.push('/login')
      router.refresh()
    }
  }

  return (
    <UserProvider user={user}>
      <div className="flex min-h-[100dvh]">
        {/* Sidebar (desktop) */}
        <aside className="hidden w-60 shrink-0 flex-col border-r border-border bg-surface md:flex">
          <div className="flex h-16 items-center gap-2.5 border-b border-border px-5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-accent-foreground">
              <FireExtinguisher weight="fill" className="h-4 w-4" />
            </span>
            <span className="text-sm font-semibold text-foreground">FEMS</span>
          </div>
          <nav className="flex-1 space-y-1 p-3">
            {items.map((item) => (
              <NavLink key={item.href} item={item} active={isActive(item.href)} />
            ))}
            <Link
              href="/api-docs"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted transition-colors hover:bg-surface-2 hover:text-foreground"
            >
              <BookOpen className="h-4 w-4" weight="regular" />
              API Docs
            </Link>
          </nav>
          <div className="border-t border-border p-3">
            <Link
              href="/profile"
              className="flex items-center gap-2.5 rounded-lg px-2 py-2 hover:bg-surface-2"
            >
              <UserCircle className="h-7 w-7 text-muted" weight="fill" />
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium text-foreground">
                  {user.firstName} {user.lastName}
                </span>
                <span className={cn('block text-xs font-medium capitalize', roleColor[user.role])}>{user.role}</span>
              </span>
            </Link>
            <button
              onClick={logout}
              className="mt-1 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted transition-colors hover:bg-surface-2 hover:text-foreground"
            >
              <SignOut className="h-4 w-4" />
              Sign out
            </button>
          </div>
        </aside>

        {/* Main */}
        <div className="flex min-w-0 flex-1 flex-col">
          {/* Mobile top bar */}
          <header className="flex h-14 items-center justify-between border-b border-border bg-surface px-4 md:hidden">
            <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                <FireExtinguisher weight="fill" className="h-4 w-4" />
              </span>
              FEMS
            </span>
            <button onClick={logout} className="text-muted hover:text-foreground" aria-label="Sign out">
              <SignOut className="h-5 w-5" />
            </button>
          </header>
          {/* Mobile nav strip */}
          <nav className="flex gap-1 overflow-x-auto border-b border-border bg-surface px-2 py-2 md:hidden">
            {items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium',
                  isActive(item.href) ? 'bg-accent/10 text-accent' : 'text-muted'
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            ))}
          </nav>

          <main className="mx-auto w-full max-w-[1400px] flex-1 p-4 md:p-8">{children}</main>
        </div>
      </div>
    </UserProvider>
  )
}

function NavLink({ item, active }: { item: NavItem; active: boolean }) {
  return (
    <Link
      href={item.href}
      className={cn(
        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
        active ? 'bg-accent/10 text-accent' : 'text-muted hover:bg-surface-2 hover:text-foreground'
      )}
    >
      <item.icon className="h-4 w-4" weight={active ? 'fill' : 'regular'} />
      {item.label}
    </Link>
  )
}
