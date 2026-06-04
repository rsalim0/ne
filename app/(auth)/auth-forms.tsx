'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Eye,
  EyeSlash,
  WarningCircle,
  CheckCircle,
} from '@phosphor-icons/react/dist/ssr'
import { api, ApiError } from '@/lib/api-client'
import { loginSchema, registerSchema } from '@/lib/validation/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Field, FieldLabel } from '@/components/ui/field'
import { cn } from '@/lib/utils'

type Errors = Record<string, string>

/** Map a ZodError's issues into a flat {field: message}. */
function fieldErrors(err: unknown): Errors {
  if (err && typeof err === 'object' && 'issues' in err) {
    const out: Errors = {}
    for (const issue of (err as { issues: { path: (string | number)[]; message: string }[] }).issues) {
      const key = String(issue.path[0] ?? '')
      if (key && !out[key]) out[key] = issue.message
    }
    return out
  }
  return {}
}

/* --------------------------------- shells -------------------------------- */

function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle: string
  children: React.ReactNode
}) {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
      </div>
      {children}
    </div>
  )
}

function FormError({ message }: { message: string }) {
  if (!message) return null
  return (
    <div
      role="alert"
      className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/8 px-3 py-2 text-sm text-destructive-foreground"
    >
      <WarningCircle weight="fill" className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{message}</span>
    </div>
  )
}

function FieldMessage({ message }: { message?: string }) {
  if (!message) return null
  return <p className="text-xs text-destructive-foreground">{message}</p>
}

function PasswordField({
  id,
  label,
  value,
  onChange,
  autoComplete,
  placeholder,
  error,
  rightLink,
}: {
  id: string
  label: string
  value: string
  onChange: (v: string) => void
  autoComplete: string
  placeholder?: string
  error?: string
  rightLink?: React.ReactNode
}) {
  const [show, setShow] = useState(false)
  return (
    <Field>
      <div className="flex w-full items-center justify-between">
        <FieldLabel htmlFor={id}>{label}</FieldLabel>
        {rightLink}
      </div>
      <div className="relative w-full">
        <Input
          id={id}
          type={show ? 'text' : 'password'}
          autoComplete={autoComplete}
          required
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          aria-invalid={!!error}
          className="[&_input]:pr-9"
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          aria-label={show ? 'Hide password' : 'Show password'}
          className="absolute top-1/2 right-1.5 -translate-y-1/2 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-surface-2 hover:text-foreground"
        >
          {show ? <EyeSlash className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      <FieldMessage message={error} />
    </Field>
  )
}

/* -------------------------------- sign in -------------------------------- */

export function SignInForm() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<Errors>({})
  const [formError, setFormError] = useState('')
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFormError('')
    const parsed = loginSchema.safeParse({ email, password })
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error))
      return
    }
    setErrors({})
    setLoading(true)
    try {
      await api.post('/api/v1/auth/login', parsed.data)
      router.push('/dashboard')
      router.refresh()
    } catch (err) {
      // Unverified accounts: route to the confirmation screen (a fresh code was
      // just emailed by the API).
      if (err instanceof ApiError && err.code === 'EMAIL_NOT_VERIFIED') {
        router.push(`/verify-email?email=${encodeURIComponent(parsed.data.email)}`)
        return
      }
      setFormError(err instanceof ApiError ? err.message : 'Sign in failed')
      setLoading(false)
    }
  }

  return (
    <AuthShell title="Welcome back" subtitle="Sign in to the fire safety console.">
      <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
        <FormError message={formError} />
        <Field>
          <FieldLabel htmlFor="login-email">Email</FieldLabel>
          <Input
            id="login-email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
            aria-invalid={!!errors.email}
          />
          <FieldMessage message={errors.email} />
        </Field>

        <PasswordField
          id="login-password"
          label="Password"
          value={password}
          onChange={setPassword}
          autoComplete="current-password"
          placeholder="Your password"
          error={errors.password}
          rightLink={
            <Link
              href="/forgot-password"
              className="text-xs font-medium text-muted-foreground hover:text-foreground"
            >
              Forgot password?
            </Link>
          }
        />

        <Button type="submit" size="lg" loading={loading} className="mt-1 w-full">
          Sign in
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="font-medium text-primary hover:underline">
            Create one
          </Link>
        </p>
      </form>
    </AuthShell>
  )
}

/* ------------------------------- register -------------------------------- */

function passwordStrength(pw: string): { score: number; label: string } {
  let score = 0
  if (pw.length >= 8) score++
  if (/[a-zA-Z]/.test(pw) && /[0-9]/.test(pw)) score++
  if (pw.length >= 12) score++
  if (/[^a-zA-Z0-9]/.test(pw)) score++
  const labels = ['Too weak', 'Weak', 'Fair', 'Good', 'Strong']
  return { score, label: labels[score] }
}

export function SignUpForm() {
  const router = useRouter()
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirm: '',
  })
  const [errors, setErrors] = useState<Errors>({})
  const [formError, setFormError] = useState('')
  const [loading, setLoading] = useState(false)

  const set = (k: keyof typeof form) => (v: string) =>
    setForm((f) => ({ ...f, [k]: v }))

  const strength = passwordStrength(form.password)
  const strengthColors = ['bg-zinc-300', 'bg-red-500', 'bg-amber-500', 'bg-lime-500', 'bg-emerald-500']

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFormError('')

    const payload = {
      firstName: form.firstName,
      lastName: form.lastName,
      email: form.email,
      password: form.password,
    }
    const parsed = registerSchema.safeParse(payload)
    const errs: Errors = parsed.success ? {} : fieldErrors(parsed.error)
    if (form.confirm !== form.password) {
      errs.confirm = 'Passwords do not match'
    }
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }
    setErrors({})
    setLoading(true)
    try {
      await api.post('/api/v1/auth/register', parsed.data)
      // Account starts unverified — send the user to confirm the emailed code.
      router.push(`/verify-email?email=${encodeURIComponent(parsed.data!.email)}`)
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Registration failed')
      setLoading(false)
    }
  }

  return (
    <AuthShell
      title="Create your account"
      subtitle="New accounts start with the standard user role."
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
        <FormError message={formError} />

        <div className="grid grid-cols-2 gap-3">
          <Field>
            <FieldLabel htmlFor="reg-first">First name</FieldLabel>
            <Input
              id="reg-first"
              autoComplete="given-name"
              required
              value={form.firstName}
              onChange={(e) => set('firstName')(e.target.value)}
              aria-invalid={!!errors.firstName}
            />
            <FieldMessage message={errors.firstName} />
          </Field>
          <Field>
            <FieldLabel htmlFor="reg-last">Last name</FieldLabel>
            <Input
              id="reg-last"
              autoComplete="family-name"
              required
              value={form.lastName}
              onChange={(e) => set('lastName')(e.target.value)}
              aria-invalid={!!errors.lastName}
            />
            <FieldMessage message={errors.lastName} />
          </Field>
        </div>

        <Field>
          <FieldLabel htmlFor="reg-email">Email</FieldLabel>
          <Input
            id="reg-email"
            type="email"
            autoComplete="email"
            required
            value={form.email}
            onChange={(e) => set('email')(e.target.value)}
            placeholder="you@company.com"
            aria-invalid={!!errors.email}
          />
          <FieldMessage message={errors.email} />
        </Field>

        <div>
          <PasswordField
            id="reg-password"
            label="Password"
            value={form.password}
            onChange={set('password')}
            autoComplete="new-password"
            placeholder="At least 8 characters"
            error={errors.password}
          />
          {form.password && (
            <div className="mt-2 flex items-center gap-2">
              <div className="flex flex-1 gap-1">
                {[0, 1, 2, 3].map((i) => (
                  <span
                    key={i}
                    className={cn(
                      'h-1 flex-1 rounded-full transition-colors',
                      i < strength.score ? strengthColors[strength.score] : 'bg-surface-2',
                    )}
                  />
                ))}
              </div>
              <span className="w-14 shrink-0 text-right text-xs text-muted-foreground">
                {strength.label}
              </span>
            </div>
          )}
        </div>

        <PasswordField
          id="reg-confirm"
          label="Confirm password"
          value={form.confirm}
          onChange={set('confirm')}
          autoComplete="new-password"
          placeholder="Re-enter password"
          error={errors.confirm}
        />

        <Button type="submit" size="lg" loading={loading} className="mt-1 w-full">
          Create account
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Sign in
          </Link>
        </p>

        <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
          <CheckCircle weight="fill" className="h-3.5 w-3.5 text-emerald-500" />
          Your data is encrypted and access-controlled.
        </p>
      </form>
    </AuthShell>
  )
}
