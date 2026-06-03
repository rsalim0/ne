import {
  FireExtinguisher,
  ShieldCheck,
  ClipboardText,
  ChartLineUp,
} from '@phosphor-icons/react/dist/ssr'

const HIGHLIGHTS = [
  {
    icon: ShieldCheck,
    title: 'Every unit accounted for',
    desc: 'A live register of extinguishers, locations and service status.',
  },
  {
    icon: ClipboardText,
    title: 'Never miss an inspection',
    desc: 'Scheduling and reminders keep your site audit-ready.',
  },
  {
    icon: ChartLineUp,
    title: 'Compliance, on demand',
    desc: 'Export inspection and maintenance reports in a click.',
  },
]

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-[100dvh] lg:grid-cols-2">
      {/* Brand panel */}
      <aside className="relative hidden overflow-hidden bg-zinc-950 p-10 text-white lg:flex lg:flex-col xl:p-14">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(120% 120% at 0% 0%, #7f1d1d 0%, #450a0a 34%, #0a0a0b 72%)',
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              'linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)',
            backgroundSize: '44px 44px',
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 -right-24 h-80 w-80 rounded-full blur-3xl"
          style={{
            background:
              'radial-gradient(circle, rgba(239,68,68,0.45), transparent 60%)',
          }}
        />

        <div className="relative flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-600 shadow-lg shadow-red-950/40 ring-1 ring-white/15">
            <FireExtinguisher weight="fill" className="h-6 w-6" />
          </span>
          <div className="leading-tight">
            <p className="text-base font-semibold tracking-tight">FEMS</p>
            <p className="text-xs text-white/55">Fire Extinguisher Management</p>
          </div>
        </div>

        <div className="relative mt-auto">
          <h2 className="max-w-md text-balance text-4xl font-semibold leading-[1.1] tracking-tight xl:text-[2.75rem]">
            Fire safety, fully under control.
          </h2>
          <p className="mt-4 max-w-sm text-[15px] leading-relaxed text-white/60">
            The single source of truth for your fire-protection equipment —
            tracked, inspected and compliant.
          </p>

          <ul className="mt-10 space-y-5">
            {HIGHLIGHTS.map((h) => (
              <li key={h.title} className="flex items-start gap-4">
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10 ring-1 ring-white/10 backdrop-blur">
                  <h.icon weight="fill" className="h-[18px] w-[18px] text-red-300" />
                </span>
                <span>
                  <span className="block text-sm font-medium text-white/90">
                    {h.title}
                  </span>
                  <span className="mt-0.5 block text-[13px] leading-snug text-white/50">
                    {h.desc}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative mt-12 text-xs text-white/40">
          © {new Date().getFullYear()} TZW Ltd · Fire safety operations
        </p>
      </aside>

      {/* Form panel */}
      <main className="flex flex-col items-center justify-center px-5 py-10 sm:px-8">
        <div className="mb-8 flex items-center gap-2.5 lg:hidden">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-accent-foreground">
            <FireExtinguisher weight="fill" className="h-5 w-5" />
          </span>
          <div className="leading-tight">
            <p className="text-sm font-semibold text-foreground">FEMS</p>
            <p className="text-xs text-muted">Fire Extinguisher Management</p>
          </div>
        </div>
        <div className="w-full max-w-[400px]">{children}</div>
      </main>
    </div>
  )
}
