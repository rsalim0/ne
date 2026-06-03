'use client'

import { useState } from 'react'
import useSWR from 'swr'
import Link from 'next/link'
import { Plus } from '@phosphor-icons/react/dist/ssr'
import { api, ApiError, fetcher } from '@/lib/api-client'
import { formatDate } from '@/lib/utils'
import { useUser } from '@/lib/user-context'
import {
  extinguisherSizeValues,
  extinguisherStatusValues,
  extinguisherTypeValues,
} from '@/lib/validation/extinguisher'
import {
  Alert, Badge, Button, Card, CardContent, EmptyState, Field, Input, Pagination,
  Select, Skeleton, TBody, Table, Td, Th,
} from '@/components/ui'

type Row = {
  id: string
  serialNumber: string
  location: string
  type: (typeof extinguisherTypeValues)[number]
  size: (typeof extinguisherSizeValues)[number]
  installationDate: string
  expiryDate: string
  status: (typeof extinguisherStatusValues)[number]
}

const TYPE_LABEL: Record<Row['type'], string> = {
  water: 'Water', co2: 'CO₂', foam: 'Foam', dry_chemical: 'Dry Chemical',
}
const STATUS: Record<Row['status'], { label: string; color: 'green' | 'amber' | 'red' | 'gray' }> = {
  active: { label: 'Active', color: 'green' },
  under_maintenance: { label: 'Under maintenance', color: 'amber' },
  expired: { label: 'Expired', color: 'red' },
  decommissioned: { label: 'Decommissioned', color: 'gray' },
}

export default function ExtinguishersPage() {
  const user = useUser()
  const canEdit = user.role === 'admin' || user.role === 'inspector'
  const canDelete = user.role === 'admin'

  const [page, setPage] = useState(1)
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('')
  const [type, setType] = useState('')
  const [editing, setEditing] = useState<Row | 'new' | null>(null)
  const [error, setError] = useState('')

  const params = new URLSearchParams({ page: String(page), limit: '10' })
  if (q) params.set('q', q)
  if (status) params.set('status', status)
  if (type) params.set('type', type)
  const key = `/api/v1/extinguishers?${params.toString()}`
  const { data, isLoading, mutate } = useSWR(key, (k: string) => fetcher<Row[]>(k))

  const rows = data?.data ?? []
  const meta = data?.meta

  async function remove(id: string) {
    if (!window.confirm('Delete this extinguisher record?')) return
    setError('')
    try {
      await api.delete(`/api/v1/extinguishers/${id}`)
      mutate()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Delete failed')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Fire Extinguishers</h1>
          <p className="mt-1 text-sm text-muted">Equipment register and status tracking.</p>
        </div>
        {canEdit && (
          <Button onClick={() => setEditing('new')}>
            <Plus className="h-4 w-4" /> Register
          </Button>
        )}
      </div>

      {error && <Alert>{error}</Alert>}

      {editing && canEdit && (
        <ExtinguisherForm
          initial={editing === 'new' ? null : editing}
          onDone={() => { setEditing(null); mutate() }}
          onCancel={() => setEditing(null)}
        />
      )}

      <div className="flex flex-wrap gap-3">
        <Input className="max-w-xs" placeholder="Search serial number..." value={q} onChange={(e) => { setQ(e.target.value); setPage(1) }} />
        <Select className="max-w-[180px]" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1) }}>
          <option value="">All statuses</option>
          {extinguisherStatusValues.map((s) => <option key={s} value={s}>{STATUS[s].label}</option>)}
        </Select>
        <Select className="max-w-[160px]" value={type} onChange={(e) => { setType(e.target.value); setPage(1) }}>
          <option value="">All types</option>
          {extinguisherTypeValues.map((t) => <option key={t} value={t}>{TYPE_LABEL[t]}</option>)}
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
      ) : rows.length === 0 ? (
        <Card><CardContent><EmptyState title="No extinguishers found" hint={canEdit ? 'Register one to get started.' : 'Try adjusting filters.'} /></CardContent></Card>
      ) : (
        <>
          <Table>
            <thead>
              <tr>
                <Th>Serial</Th><Th>Location</Th><Th>Type</Th><Th>Size</Th><Th>Expiry</Th><Th>Status</Th>
                {canEdit && <Th className="text-right">Actions</Th>}
              </tr>
            </thead>
            <TBody>
              {rows.map((e) => (
                <tr key={e.id}>
                  <Td className="font-medium font-mono text-xs">
                    <Link href={`/extinguishers/${e.id}`} className="hover:text-accent">{e.serialNumber}</Link>
                  </Td>
                  <Td>{e.location}</Td>
                  <Td>{TYPE_LABEL[e.type]}</Td>
                  <Td className="text-muted">{e.size}</Td>
                  <Td className="text-muted">{formatDate(e.expiryDate)}</Td>
                  <Td><Badge color={STATUS[e.status].color}>{STATUS[e.status].label}</Badge></Td>
                  {canEdit && (
                    <Td>
                      <div className="flex items-center justify-end gap-2">
                        <Button size="sm" variant="secondary" onClick={() => setEditing(e)}>Edit</Button>
                        {canDelete && <Button size="sm" variant="danger" onClick={() => remove(e.id)}>Delete</Button>}
                      </div>
                    </Td>
                  )}
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

function ExtinguisherForm({
  initial,
  onDone,
  onCancel,
}: {
  initial: Row | null
  onDone: () => void
  onCancel: () => void
}) {
  const [form, setForm] = useState({
    serialNumber: initial?.serialNumber ?? '',
    location: initial?.location ?? '',
    type: initial?.type ?? 'water',
    size: initial?.size ?? '5 lbs',
    installationDate: initial?.installationDate ?? '',
    expiryDate: initial?.expiryDate ?? '',
    status: initial?.status ?? 'active',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }))

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      if (initial) await api.patch(`/api/v1/extinguishers/${initial.id}`, form)
      else await api.post('/api/v1/extinguishers', form)
      onDone()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Save failed')
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardContent>
        <form onSubmit={submit} className="space-y-4">
          {error && <Alert>{error}</Alert>}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Serial number"><Input value={form.serialNumber} onChange={set('serialNumber')} required /></Field>
            <Field label="Location"><Input value={form.location} onChange={set('location')} required /></Field>
            <Field label="Type">
              <Select value={form.type} onChange={set('type')}>
                {extinguisherTypeValues.map((t) => <option key={t} value={t}>{TYPE_LABEL[t]}</option>)}
              </Select>
            </Field>
            <Field label="Size">
              <Select value={form.size} onChange={set('size')}>
                {extinguisherSizeValues.map((s) => <option key={s} value={s}>{s}</option>)}
              </Select>
            </Field>
            <Field label="Installation date"><Input type="date" value={form.installationDate} onChange={set('installationDate')} required /></Field>
            <Field label="Expiry date"><Input type="date" value={form.expiryDate} onChange={set('expiryDate')} required /></Field>
            <Field label="Status">
              <Select value={form.status} onChange={set('status')}>
                {extinguisherStatusValues.map((s) => <option key={s} value={s}>{STATUS[s].label}</option>)}
              </Select>
            </Field>
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={loading}>{loading ? 'Saving...' : initial ? 'Save changes' : 'Register'}</Button>
            <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
