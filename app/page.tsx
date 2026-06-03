import Link from 'next/link'
import {
  FireExtinguisher,
  ClipboardText,
  Wrench,
  ShieldCheck,
  ChartBar,
  UsersThree,
  ArrowRight,
  CheckCircle,
  FilePdf,
  FileCsv,
} from '@phosphor-icons/react/dist/ssr'

export default function LandingPage() {
  return (
    <div className="flex min-h-[100dvh] flex-col">
      <SiteNav />
      <main className="flex-1">
        <Hero />
        <Features />
        <Roles />
        <Reporting />
        <CtaBand />
      </main>
      <SiteFooter />
    </div>
  )
}

/* --------------------------------- Nav ---------------------------------- */

function SiteNav() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-accent-foreground">
            <FireExtinguisher weight="fill" className="h-4 w-4" />
          </span>
          <span className="text-sm font-semibold text-foreground">FEMS</span>
        </Link>
        <div className="hidden items-center gap-7 text-sm text-muted md:flex">
          <a href="#features" className="hover:text-foreground">Features</a>
          <a href="#roles" className="hover:text-foreground">Roles</a>
          <a href="#reporting" className="hover:text-foreground">Reporting</a>
          <Link href="/api-docs" className="hover:text-foreground">API</Link>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login" className="text-sm font-medium text-muted hover:text-foreground">Sign in</Link>
          <Link
            href="/register"
            className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-3.5 py-2 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent-hover"
          >
            Get started
          </Link>
        </div>
      </nav>
    </header>
  )
}

/* -------------------------------- Hero ---------------------------------- */

function Hero() {
  return (
    <section className="mx-auto grid max-w-7xl items-center gap-12 px-4 pt-16 pb-20 sm:px-6 lg:grid-cols-2 lg:gap-8 lg:pt-24">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
          Fire safety operations platform
        </p>
        <h1 className="mt-4 text-balance text-4xl font-semibold leading-[1.05] tracking-tight text-foreground md:text-5xl lg:text-6xl">
          Fire safety compliance, under control.
        </h1>
        <p className="mt-5 max-w-md text-lg leading-relaxed text-muted">
          Register every extinguisher, schedule inspections, log maintenance, and prove
          compliance with real-time reports.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Link
            href="/register"
            className="inline-flex items-center gap-2 rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent-hover"
          >
            Get started <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center rounded-lg border border-border bg-surface px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-surface-2"
          >
            Sign in
          </Link>
        </div>
      </div>
      <ConsolePreview />
    </section>
  )
}

// Authentic mini-preview built from the real design system (not a fake screenshot).
function ConsolePreview() {
  const stats = [
    { label: 'Extinguishers', value: '128' },
    { label: 'Active', value: '109' },
    { label: 'Expiring ≤30d', value: '14' },
  ]
  const rows = [
    { serial: 'FE-0481', loc: 'Building A - Lobby', label: 'Active', color: 'bg-green-500/15 text-green-700 dark:text-green-300' },
    { serial: 'FE-0123', loc: 'Building C - Workshop', label: 'Expiring', color: 'bg-amber-500/15 text-amber-700 dark:text-amber-300' },
    { serial: 'FE-0067', loc: 'Building B - Server Room', label: 'Overdue', color: 'bg-red-500/15 text-red-700 dark:text-red-300' },
  ]
  return (
    <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
      <p className="text-sm font-semibold text-foreground">Compliance overview</p>
      <div className="mt-4 grid grid-cols-3 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="rounded-lg bg-surface-2 px-3 py-3">
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted">{s.label}</p>
            <p className="mt-1 text-xl font-semibold text-foreground">{s.value}</p>
          </div>
        ))}
      </div>
      <div className="mt-4 divide-y divide-border rounded-lg border border-border">
        {rows.map((r) => (
          <div key={r.serial} className="flex items-center justify-between gap-3 px-3 py-2.5">
            <div className="min-w-0">
              <p className="font-mono text-xs font-medium text-foreground">{r.serial}</p>
              <p className="truncate text-xs text-muted">{r.loc}</p>
            </div>
            <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${r.color}`}>{r.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ------------------------------ Features -------------------------------- */

function Features() {
  return (
    <section id="features" className="border-t border-border bg-surface/40 py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <h2 className="max-w-xl text-3xl font-semibold tracking-tight text-foreground">
          Everything a fire-safety team needs in one place
        </h2>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          <FeatureCell
            className="md:col-span-2 bg-gradient-to-br from-accent/10 to-surface"
            icon={ClipboardText}
            title="Inspection scheduling"
            body="Pick an extinguisher, choose a date and time, and the right inspectors and admins are notified automatically."
          />
          <FeatureCell icon={Wrench} title="Maintenance history" body="Log actions taken, dates, and conditions noted, with a full per-extinguisher trail." />
          <FeatureCell icon={ShieldCheck} title="Compliance monitoring" body="Surface expired and soon-to-expire units before they become a liability." />
          <FeatureCell
            className="bg-gradient-to-br from-accent/10 to-surface"
            icon={ChartBar}
            title="Real-time reporting"
            body="Stock, inspection, expiry, and maintenance reports, exportable to PDF and CSV."
          />
          <FeatureCell icon={UsersThree} title="Role-based access" body="Admins, inspectors, and standard users each get exactly the access they need." />
        </div>
      </div>
    </section>
  )
}

function FeatureCell({
  icon: Icon,
  title,
  body,
  className = '',
}: {
  icon: typeof Wrench
  title: string
  body: string
  className?: string
}) {
  return (
    <div className={`rounded-xl border border-border bg-surface p-6 ${className}`}>
      <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 text-accent">
        <Icon className="h-5 w-5" weight="fill" />
      </span>
      <h3 className="mt-4 font-semibold text-foreground">{title}</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-muted">{body}</p>
    </div>
  )
}

/* -------------------------------- Roles --------------------------------- */

function Roles() {
  const roles = [
    { name: 'Administrator', color: 'bg-accent/15 text-accent', desc: 'Manages system features, user accounts, and data integrity.' },
    { name: 'Inspector', color: 'bg-blue-500/15 text-blue-700 dark:text-blue-300', desc: 'Conducts inspections, logs results, and records maintenance activities.' },
    { name: 'User', color: 'bg-zinc-500/15 text-zinc-600 dark:text-zinc-300', desc: 'Views extinguisher status, schedules inspections, and manages their profile.' },
  ]
  return (
    <section id="roles" className="py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <h2 className="text-3xl font-semibold tracking-tight text-foreground">Built for every role</h2>
        <p className="mt-2 max-w-lg text-muted">Role-based access keeps responsibilities clear and data secure.</p>
        <div className="mt-8 divide-y divide-border rounded-xl border border-border bg-surface">
          {roles.map((r) => (
            <div key={r.name} className="flex flex-col gap-2 px-6 py-5 sm:flex-row sm:items-center sm:gap-6">
              <span className={`inline-flex w-fit rounded-full px-3 py-1 text-sm font-medium ${r.color}`}>{r.name}</span>
              <p className="text-sm text-muted">{r.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ------------------------------ Reporting ------------------------------- */

function Reporting() {
  const points = [
    'Real-time analytics across stock, inspections, and maintenance',
    'Expired and overdue tracking for audit readiness',
    'One-click PDF and CSV export for any report',
  ]
  return (
    <section id="reporting" className="border-t border-border bg-surface/40 py-20">
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-foreground">Expired extinguishers</p>
            <div className="flex gap-2">
              <span className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs text-muted"><FileCsv className="h-3.5 w-3.5" /> CSV</span>
              <span className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs text-muted"><FilePdf className="h-3.5 w-3.5" /> PDF</span>
            </div>
          </div>
          <div className="mt-4 overflow-hidden rounded-lg border border-border text-xs">
            <div className="grid grid-cols-3 bg-surface-2 px-3 py-2 font-medium uppercase tracking-wide text-muted">
              <span>Serial</span><span>Location</span><span>Expiry</span>
            </div>
            {[
              ['FE-0067', 'Server Room', '2024-06-01'],
              ['FE-0210', 'Parking L1', '2025-02-15'],
              ['FE-0388', 'Workshop', '2025-09-30'],
            ].map((row) => (
              <div key={row[0]} className="grid grid-cols-3 border-t border-border px-3 py-2 text-foreground">
                <span className="font-mono">{row[0]}</span><span className="text-muted">{row[1]}</span><span className="text-muted">{row[2]}</span>
              </div>
            ))}
          </div>
        </div>
        <div>
          <h2 className="text-3xl font-semibold tracking-tight text-foreground">Reports that keep you audit-ready</h2>
          <p className="mt-3 max-w-md text-muted">Generate compliance reports in seconds and hand auditors exactly what they ask for.</p>
          <ul className="mt-6 space-y-3">
            {points.map((p) => (
              <li key={p} className="flex items-start gap-3 text-sm text-foreground">
                <CheckCircle weight="fill" className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
                {p}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}

/* ------------------------------- CTA band ------------------------------- */

function CtaBand() {
  return (
    <section className="py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="rounded-2xl bg-accent px-6 py-14 text-center text-accent-foreground sm:px-12">
          <h2 className="mx-auto max-w-xl text-3xl font-semibold tracking-tight">
            Ready to take control of fire safety?
          </h2>
          <p className="mx-auto mt-3 max-w-md text-accent-foreground/85">
            Set up your equipment register and start tracking compliance today.
          </p>
          <div className="mt-8 flex items-center justify-center gap-4">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-accent transition-transform hover:-translate-y-px"
            >
              Get started <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/login" className="text-sm font-medium text-accent-foreground/90 underline-offset-4 hover:underline">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

/* -------------------------------- Footer -------------------------------- */

function SiteFooter() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-8 sm:flex-row sm:px-6">
        <div className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent text-accent-foreground">
            <FireExtinguisher weight="fill" className="h-4 w-4" />
          </span>
          <span className="text-sm font-semibold text-foreground">FEMS</span>
        </div>
        <div className="flex items-center gap-6 text-sm text-muted">
          <a href="#features" className="hover:text-foreground">Features</a>
          <Link href="/api-docs" className="hover:text-foreground">API docs</Link>
          <Link href="/login" className="hover:text-foreground">Sign in</Link>
        </div>
        <p className="text-sm text-muted">© 2026 TZW Ltd</p>
      </div>
    </footer>
  )
}
