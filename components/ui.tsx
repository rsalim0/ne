import * as React from 'react'
import { cn } from '@/lib/utils'

/* -------------------------------- Button -------------------------------- */

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  size?: 'sm' | 'md'
}
const buttonVariants: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary: 'bg-accent text-accent-foreground hover:bg-accent-hover',
  secondary: 'bg-surface text-foreground border border-border hover:bg-surface-2',
  danger: 'bg-transparent text-accent border border-accent/30 hover:bg-accent/10',
  ghost: 'bg-transparent text-muted hover:bg-surface-2 hover:text-foreground',
}
export function Button({ variant = 'primary', size = 'md', className, ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background',
        'active:translate-y-px disabled:opacity-50 disabled:pointer-events-none',
        size === 'sm' ? 'px-3 py-1.5 text-sm' : 'px-4 py-2 text-sm',
        buttonVariants[variant],
        className
      )}
      {...props}
    />
  )
}

/* ----------------------------- Form controls ---------------------------- */

export function Label({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn('mb-1.5 block text-sm font-medium text-foreground', className)} {...props} />
}

const controlBase =
  'w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground shadow-sm placeholder:text-muted ' +
  'focus:border-accent focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-60'

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...props }, ref) {
    return <input ref={ref} className={cn(controlBase, className)} {...props} />
  }
)

export function Select({ className, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={cn(controlBase, 'appearance-none', className)} {...props} />
}

export function Textarea({ className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(controlBase, 'min-h-20', className)} {...props} />
}

export function Field({
  label,
  error,
  htmlFor,
  children,
}: {
  label: string
  error?: string
  htmlFor?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {error && <p className="mt-1 text-xs text-accent">{error}</p>}
    </div>
  )
}

/* -------------------------------- Card ---------------------------------- */

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('rounded-lg border border-border bg-surface shadow-sm', className)} {...props} />
}
export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex items-center justify-between gap-3 border-b border-border px-5 py-4', className)} {...props} />
}
export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h2 className={cn('text-base font-semibold text-foreground', className)} {...props} />
}
export function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('px-5 py-4', className)} {...props} />
}

/* -------------------------------- Badge --------------------------------- */

const badgeColors = {
  green: 'bg-green-500/15 text-green-700 dark:text-green-300',
  red: 'bg-red-500/15 text-red-700 dark:text-red-300',
  amber: 'bg-amber-500/15 text-amber-700 dark:text-amber-300',
  blue: 'bg-blue-500/15 text-blue-700 dark:text-blue-300',
  gray: 'bg-zinc-500/15 text-zinc-600 dark:text-zinc-300',
} as const
export function Badge({ color = 'gray', children }: { color?: keyof typeof badgeColors; children: React.ReactNode }) {
  return (
    <span className={cn('inline-flex rounded-full px-2 py-0.5 text-xs font-medium', badgeColors[color])}>
      {children}
    </span>
  )
}

/* -------------------------------- Table --------------------------------- */

export function Table({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="min-w-full divide-y divide-border text-sm">{children}</table>
    </div>
  )
}
export function Th({ className, ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={cn('bg-surface-2 px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-muted', className)}
      {...props}
    />
  )
}
export function Td({ className, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className={cn('px-4 py-3 text-foreground', className)} {...props} />
}
export function TBody({ children }: { children: React.ReactNode }) {
  return <tbody className="divide-y divide-border bg-surface">{children}</tbody>
}

/* ------------------------------- Feedback ------------------------------- */

export function Alert({ kind = 'error', children }: { kind?: 'error' | 'success'; children: React.ReactNode }) {
  if (!children) return null
  return (
    <div
      className={cn(
        'rounded-lg border px-3 py-2 text-sm',
        kind === 'error'
          ? 'border-accent/20 bg-accent/10 text-accent'
          : 'border-green-500/20 bg-green-500/10 text-green-700 dark:text-green-300'
      )}
      role={kind === 'error' ? 'alert' : 'status'}
    >
      {children}
    </div>
  )
}

export function Spinner({ className }: { className?: string }) {
  return (
    <span
      className={cn('inline-block h-4 w-4 animate-spin rounded-full border-2 border-border border-t-accent', className)}
      aria-label="Loading"
    />
  )
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-md bg-surface-2', className)} />
}

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="py-12 text-center">
      <p className="text-sm font-medium text-foreground">{title}</p>
      {hint && <p className="mt-1 text-sm text-muted">{hint}</p>}
    </div>
  )
}

/* ------------------------------ Pagination ------------------------------ */

export function Pagination({
  page,
  totalPages,
  onPage,
}: {
  page: number
  totalPages: number
  onPage: (p: number) => void
}) {
  if (totalPages <= 1) return null
  return (
    <div className="flex items-center justify-between pt-3 text-sm text-muted">
      <span>
        Page {page} of {totalPages}
      </span>
      <div className="flex gap-2">
        <Button size="sm" variant="secondary" disabled={page <= 1} onClick={() => onPage(page - 1)}>
          Previous
        </Button>
        <Button size="sm" variant="secondary" disabled={page >= totalPages} onClick={() => onPage(page + 1)}>
          Next
        </Button>
      </div>
    </div>
  )
}
