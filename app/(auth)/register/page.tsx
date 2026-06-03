'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { api, ApiError } from '@/lib/api-client'
import { Alert, Button, Card, CardContent, Field, Input } from '@/components/ui'

export default function RegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }))

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await api.post('/api/v1/auth/register', form)
      await api.post('/api/v1/auth/login', { email: form.email, password: form.password })
      router.push('/dashboard')
      router.refresh()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Registration failed')
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardContent>
        <h1 className="text-lg font-semibold text-foreground">Create account</h1>
        <p className="mt-1 text-sm text-muted">New accounts start with the standard user role.</p>
        <form onSubmit={onSubmit} className="mt-5 space-y-4">
          {error && <Alert>{error}</Alert>}
          <div className="grid grid-cols-2 gap-3">
            <Field label="First name" htmlFor="firstName">
              <Input id="firstName" required value={form.firstName} onChange={set('firstName')} />
            </Field>
            <Field label="Last name" htmlFor="lastName">
              <Input id="lastName" required value={form.lastName} onChange={set('lastName')} />
            </Field>
          </div>
          <Field label="Email" htmlFor="email">
            <Input id="email" type="email" autoComplete="email" required value={form.email} onChange={set('email')} placeholder="you@company.com" />
          </Field>
          <Field label="Password" htmlFor="password">
            <Input id="password" type="password" autoComplete="new-password" required value={form.password} onChange={set('password')} placeholder="Min 8 chars, 1 letter, 1 number" />
          </Field>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Creating...' : 'Create account'}
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-muted">
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-accent hover:underline">
            Sign in
          </Link>
        </p>
      </CardContent>
    </Card>
  )
}
