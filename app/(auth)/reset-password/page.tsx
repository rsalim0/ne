'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { api, ApiError } from '@/lib/api-client'
import { Alert, Button, Card, CardContent, Field, Input } from '@/components/ui'

export default function ResetPasswordPage() {
  const [token, setToken] = useState('')
  const [password, setPassword] = useState('')
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Read ?token=... on the client to avoid a Suspense boundary requirement.
  useEffect(() => {
    setToken(new URLSearchParams(window.location.search).get('token') ?? '')
  }, [])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
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
    <Card>
      <CardContent>
        <h1 className="text-lg font-semibold text-foreground">Set a new password</h1>
        {done ? (
          <div className="mt-4 space-y-3">
            <Alert kind="success">Your password has been reset.</Alert>
            <Link href="/login" className="block text-sm text-accent hover:underline">
              Continue to sign in
            </Link>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="mt-5 space-y-4">
            {error && <Alert>{error}</Alert>}
            <Field label="Reset token" htmlFor="token">
              <Input id="token" required value={token} onChange={(e) => setToken(e.target.value)} placeholder="Paste token from email" />
            </Field>
            <Field label="New password" htmlFor="password">
              <Input id="password" type="password" autoComplete="new-password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min 8 chars, 1 letter, 1 number" />
            </Field>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Saving...' : 'Reset password'}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  )
}
