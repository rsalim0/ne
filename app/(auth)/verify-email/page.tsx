'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, WarningCircle, EnvelopeSimple } from '@phosphor-icons/react/dist/ssr'
import { api, ApiError } from '@/lib/api-client'
import { Button } from '@/components/ui/button'
import { Field, FieldLabel } from '@/components/ui/field'
import { OtpCodeInput } from '@/components/ui/otp-code-input'

const RESEND_COOLDOWN = 30

export default function VerifyEmailPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [loading, setLoading] = useState(false)
  const [cooldown, setCooldown] = useState(0)

  // Read ?email=... on the client to avoid a Suspense boundary requirement.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time read of the URL param on mount
    setEmail(new URLSearchParams(window.location.search).get('email') ?? '')
  }, [])

  // Resend cooldown ticker.
  useEffect(() => {
    if (cooldown <= 0) return
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [cooldown])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setNotice('')
    if (code.length !== 6) {
      setError('Enter the 6-digit code')
      return
    }
    setLoading(true)
    try {
      await api.post('/api/v1/auth/verify-email', { email, code })
      // Verification auto-signs-in via the httpOnly cookie.
      router.push('/dashboard')
      router.refresh()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Verification failed')
      setLoading(false)
    }
  }

  async function onResend() {
    if (cooldown > 0) return
    setError('')
    setNotice('')
    try {
      await api.post('/api/v1/auth/resend-otp', { email })
      setNotice('A new code is on its way.')
      setCooldown(RESEND_COOLDOWN)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not resend code')
    }
  }

  return (
    <div>
      <div className="mb-6">
        <span className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-accent text-accent-foreground">
          <EnvelopeSimple weight="fill" className="h-5 w-5" />
        </span>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Confirm your email</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          We sent a 6-digit code to{' '}
          <span className="font-medium text-foreground">{email || 'your email'}</span>. Enter it
          below to activate your account.
        </p>
      </div>

      <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
        {error && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/8 px-3 py-2 text-sm text-destructive-foreground"
          >
            <WarningCircle weight="fill" className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {notice && (
          <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/8 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-300">
            {notice}
          </div>
        )}

        <Field>
          <FieldLabel htmlFor="otp">Verification code</FieldLabel>
          <OtpCodeInput id="otp" value={code} onChange={setCode} error={!!error} autoFocus />
        </Field>

        <Button type="submit" size="lg" loading={loading} className="w-full">
          Verify & continue
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          Didn&apos;t get it?{' '}
          <button
            type="button"
            onClick={onResend}
            disabled={cooldown > 0}
            className="font-medium text-primary hover:underline disabled:cursor-not-allowed disabled:text-muted-foreground disabled:no-underline"
          >
            {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'}
          </button>
        </p>
      </form>

      <Link
        href="/login"
        className="mt-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to sign in
      </Link>
    </div>
  )
}
