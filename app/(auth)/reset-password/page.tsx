'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, CheckCircle, WarningCircle } from '@phosphor-icons/react/dist/ssr'
import { api, ApiError } from '@/lib/api-client'
import { resetPasswordSchema } from '@/lib/validation/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Field, FieldLabel } from '@/components/ui/field'

type Errors = Record<string, string>

export default function ResetPasswordPage() {
  const [token, setToken] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [done, setDone] = useState(false)
  const [errors, setErrors] = useState<Errors>({})
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Read ?token=... on the client to avoid a Suspense boundary requirement.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time read of the URL token on mount
    setToken(new URLSearchParams(window.location.search).get('token') ?? '')
  }, [])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    const parsed = resetPasswordSchema.safeParse({ token, password })
    const errs: Errors = {}
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] ?? '')
        if (key && !errs[key]) errs[key] = issue.message
      }
    }
    if (confirm !== password) errs.confirm = 'Passwords do not match'
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }
    setErrors({})
    setLoading(true)
    try {
      await api.post('/api/v1/auth/reset-password', { token, password })
      setDone(true)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Reset failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">
        Set a new password
      </h1>

      {done ? (
        <div className="mt-5 flex flex-col gap-4">
          <div className="flex items-start gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/8 px-3 py-2.5 text-sm text-emerald-700 dark:text-emerald-300">
            <CheckCircle weight="fill" className="mt-0.5 h-4 w-4 shrink-0" />
            <span>Your password has been reset.</span>
          </div>
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
          >
            Continue to sign in <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="mt-5 flex flex-col gap-4" noValidate>
          {error && (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/8 px-3 py-2 text-sm text-destructive-foreground"
            >
              <WarningCircle weight="fill" className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
          <Field>
            <FieldLabel htmlFor="token">Reset token</FieldLabel>
            <Input
              id="token"
              required
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Paste token from email"
              aria-invalid={!!errors.token}
            />
            {errors.token && <p className="text-xs text-destructive-foreground">{errors.token}</p>}
          </Field>
          <Field>
            <FieldLabel htmlFor="password">New password</FieldLabel>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              aria-invalid={!!errors.password}
            />
            {errors.password && (
              <p className="text-xs text-destructive-foreground">{errors.password}</p>
            )}
          </Field>
          <Field>
            <FieldLabel htmlFor="confirm">Confirm new password</FieldLabel>
            <Input
              id="confirm"
              type="password"
              autoComplete="new-password"
              required
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Re-enter password"
              aria-invalid={!!errors.confirm}
            />
            {errors.confirm && (
              <p className="text-xs text-destructive-foreground">{errors.confirm}</p>
            )}
          </Field>
          <Button type="submit" size="lg" loading={loading} className="w-full">
            Reset password
          </Button>
        </form>
      )}
    </div>
  )
}
