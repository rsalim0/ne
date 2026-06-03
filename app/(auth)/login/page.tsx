'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { api, ApiError } from '@/lib/api-client'
import { Alert, Button, Card, CardContent, Field, Input } from '@/components/ui'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await api.post('/api/v1/auth/login', { email, password })
      router.push('/dashboard')
      router.refresh()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Login failed')
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardContent>
        <h1 className="text-lg font-semibold text-foreground">Sign in</h1>
        <p className="mt-1 text-sm text-muted">Access the fire safety console.</p>
        <form onSubmit={onSubmit} className="mt-5 space-y-4">
          {error && <Alert>{error}</Alert>}
          <Field label="Email" htmlFor="email">
            <Input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" />
          </Field>
          <Field label="Password" htmlFor="password">
            <Input id="password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Your password" />
          </Field>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign in'}
          </Button>
        </form>
        <div className="mt-4 flex justify-between text-sm">
          <Link href="/forgot-password" className="text-muted hover:text-foreground">
            Forgot password?
          </Link>
          <Link href="/register" className="font-medium text-accent hover:underline">
            Create account
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
