import { FireExtinguisher } from '@phosphor-icons/react/dist/ssr'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-accent-foreground">
            <FireExtinguisher weight="fill" className="h-5 w-5" />
          </span>
          <div>
            <p className="text-sm font-semibold leading-tight text-foreground">FEMS</p>
            <p className="text-xs text-muted">Fire Extinguisher Management</p>
          </div>
        </div>
        {children}
      </div>
    </div>
  )
}
