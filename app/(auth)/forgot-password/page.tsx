'use client'

import { useState } from 'react'
import Link from 'next/link'
import { api, ApiError } from '@/lib/api-client'
import { Alert, Button, Card, CardContent, Field, Input } from '@/components/ui'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [devToken, setDevToken] = useState<string | undefined>()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await api.post<{ message: string; devResetToken?: string }>(
        '/api/v1/auth/forgot-password',
        { email }
      )
      setDevToken(res.data.devResetToken)
      setSent(true)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Request failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardContent>
        <h1 className="text-lg font-semibold text-foreground">Reset password</h1>
        {sent ? (
          <div className="mt-4 space-y-3">
            <Alert kind="success">If an account exists for that email, a reset link has been sent.</Alert>
            {devToken && (
              <p className="text-sm text-muted">
                Dev mode link:{' '}
                <Link href={`/reset-password?token=${devToken}`} className="text-accent hover:underline">
                  reset your password
                </Link>
              </p>
            )}
            <Link href="/login" className="block text-sm text-accent hover:underline">
              Back to sign in
            </Link>
          </div>
        ) : (
          <>
            <p className="mt-1 text-sm text-muted">We will email you a link to set a new password.</p>
            <form onSubmit={onSubmit} className="mt-5 space-y-4">
              {error && <Alert>{error}</Alert>}
              <Field label="Email" htmlFor="email">
                <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" />
              </Field>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Sending...' : 'Send reset link'}
              </Button>
            </form>
            <Link href="/login" className="mt-4 block text-center text-sm text-muted hover:text-foreground">
              Back to sign in
            </Link>
          </>
        )}
      </CardContent>
    </Card>
  )
}
