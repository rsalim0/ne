'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { Plus } from '@phosphor-icons/react/dist/ssr'
import { api, ApiError, fetcher } from '@/lib/api-client'
import { formatDate } from '@/lib/utils'
import type { UserRole } from '@/lib/db/schema'
import {
  Alert,
  Badge,
  Button,
  Card,
  CardContent,
  EmptyState,
  Field,
  Input,
  Pagination,
  Select,
  Skeleton,
  TBody,
  Table,
  Td,
  Th,
} from '@/components/ui'

type Row = {
  id: string
  firstName: string
  lastName: string
  email: string
  role: UserRole
  createdAt: string
}

const roleBadge: Record<UserRole, 'red' | 'blue' | 'gray'> = { admin: 'red', inspector: 'blue', user: 'gray' }

export default function UsersPage() {
  const [page, setPage] = useState(1)
  const [q, setQ] = useState('')
  const [role, setRole] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [error, setError] = useState('')

  const params = new URLSearchParams({ page: String(page), limit: '10' })
  if (q) params.set('q', q)
  if (role) params.set('role', role)
  const key = `/api/v1/users?${params.toString()}`
  const { data, isLoading, mutate } = useSWR(key, (k: string) => fetcher<Row[]>(k))

  const rows = data?.data ?? []
  const meta = data?.meta

  async function updateRole(id: string, newRole: string) {
    setError('')
    try {
      await api.patch(`/api/v1/users/${id}`, { role: newRole })
      mutate()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Update failed')
    }
  }

  async function remove(id: string) {
    if (!window.confirm('Delete this user? This cannot be undone.')) return
    setError('')
    try {
      await api.delete(`/api/v1/users/${id}`)
      mutate()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Delete failed')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Users</h1>
          <p className="mt-1 text-sm text-muted">Manage accounts and roles.</p>
        </div>
        <Button onClick={() => setShowCreate((s) => !s)}>
          <Plus className="h-4 w-4" /> New user
        </Button>
      </div>

      {error && <Alert>{error}</Alert>}

      {showCreate && <CreateUserForm onDone={() => { setShowCreate(false); mutate() }} />}

      <div className="flex flex-wrap gap-3">
        <Input
          className="max-w-xs"
          placeholder="Search name or email..."
          value={q}
          onChange={(e) => { setQ(e.target.value); setPage(1) }}
        />
        <Select className="max-w-[160px]" value={role} onChange={(e) => { setRole(e.target.value); setPage(1) }}>
          <option value="">All roles</option>
          <option value="admin">Admin</option>
          <option value="inspector">Inspector</option>
          <option value="user">User</option>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
        </div>
      ) : rows.length === 0 ? (
        <Card><CardContent><EmptyState title="No users found" hint="Try adjusting your search or filter." /></CardContent></Card>
      ) : (
        <>
          <Table>
            <thead>
              <tr>
                <Th>Name</Th>
                <Th>Email</Th>
                <Th>Role</Th>
                <Th>Created</Th>
                <Th className="text-right">Actions</Th>
              </tr>
            </thead>
            <TBody>
              {rows.map((u) => (
                <tr key={u.id}>
                  <Td className="font-medium">{u.firstName} {u.lastName}</Td>
                  <Td className="text-muted">{u.email}</Td>
                  <Td><Badge color={roleBadge[u.role]}>{u.role}</Badge></Td>
                  <Td className="text-muted">{formatDate(u.createdAt)}</Td>
                  <Td>
                    <div className="flex items-center justify-end gap-2">
                      <Select
                        className="max-w-[130px] py-1 text-xs"
                        value={u.role}
                        onChange={(e) => updateRole(u.id, e.target.value)}
                      >
                        <option value="admin">Admin</option>
                        <option value="inspector">Inspector</option>
                        <option value="user">User</option>
                      </Select>
                      <Button size="sm" variant="danger" onClick={() => remove(u.id)}>Delete</Button>
                    </div>
                  </Td>
                </tr>
              ))}
            </TBody>
          </Table>
          <Pagination page={meta?.page ?? 1} totalPages={meta?.totalPages ?? 1} onPage={setPage} />
        </>
      )}
    </div>
  )
}

function CreateUserForm({ onDone }: { onDone: () => void }) {
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '', role: 'user' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }))

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await api.post('/api/v1/users', form)
      onDone()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Create failed')
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardContent>
        <form onSubmit={submit} className="space-y-4">
          {error && <Alert>{error}</Alert>}
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="First name"><Input value={form.firstName} onChange={set('firstName')} required /></Field>
            <Field label="Last name"><Input value={form.lastName} onChange={set('lastName')} required /></Field>
            <Field label="Email"><Input type="email" value={form.email} onChange={set('email')} required /></Field>
            <Field label="Password"><Input type="password" value={form.password} onChange={set('password')} required placeholder="Min 8 chars" /></Field>
            <Field label="Role">
              <Select value={form.role} onChange={set('role')}>
                <option value="user">User</option>
                <option value="inspector">Inspector</option>
                <option value="admin">Admin</option>
              </Select>
            </Field>
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={loading}>{loading ? 'Creating...' : 'Create user'}</Button>
            <Button type="button" variant="secondary" onClick={onDone}>Cancel</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
