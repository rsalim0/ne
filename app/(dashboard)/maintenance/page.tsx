'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { Wrench } from '@phosphor-icons/react/dist/ssr'
import { api, ApiError, fetcher } from '@/lib/api-client'
import { formatDate } from '@/lib/utils'
import {
  Alert, Button, Card, CardContent, EmptyState, Field, Input, Pagination,
  Select, Skeleton, TBody, Table, Td, Textarea, Th,
} from '@/components/ui'

type Row = {
  id: string
  actionsTaken: string
  maintenanceDate: string
  conditionsNoted: string | null
  extinguisherSerial: string | null
  extinguisherLocation: string | null
  inspectorFirstName: string | null
  inspectorLastName: string | null
}
type ExtOpt = { id: string; serialNumber: string; location: string }

export default function MaintenancePage() {
  const [page, setPage] = useState(1)
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState('')

  const params = new URLSearchParams({ page: String(page), limit: '10' })
  if (from) params.set('from', from)
  if (to) params.set('to', to)
  const key = `/api/v1/maintenance?${params.toString()}`
  const { data, isLoading, mutate } = useSWR(key, (k: string) => fetcher<Row[]>(k))
  const rows = data?.data ?? []
  const meta = data?.meta

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Maintenance</h1>
          <p className="mt-1 text-sm text-muted">Log activities and review maintenance history.</p>
        </div>
        <Button onClick={() => setShowForm((s) => !s)}>
          <Wrench className="h-4 w-4" /> Log maintenance
        </Button>
      </div>

      {error && <Alert>{error}</Alert>}

      {showForm && <MaintenanceForm onDone={() => { setShowForm(false); mutate() }} onCancel={() => setShowForm(false)} />}

      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted">From</label>
          <Input type="date" className="max-w-[170px]" value={from} onChange={(e) => { setFrom(e.target.value); setPage(1) }} />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted">To</label>
          <Input type="date" className="max-w-[170px]" value={to} onChange={(e) => { setTo(e.target.value); setPage(1) }} />
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
      ) : rows.length === 0 ? (
        <Card><CardContent><EmptyState title="No maintenance records" hint="Log an activity to build history." /></CardContent></Card>
      ) : (
        <>
          <Table>
            <thead>
              <tr><Th>Extinguisher</Th><Th>Date</Th><Th>Actions taken</Th><Th>Conditions noted</Th><Th>Inspector</Th></tr>
            </thead>
            <TBody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <Td>
                    <span className="block font-mono text-xs font-medium">{r.extinguisherSerial ?? '—'}</span>
                    <span className="block text-xs text-muted">{r.extinguisherLocation}</span>
                  </Td>
                  <Td className="whitespace-nowrap text-muted">{formatDate(r.maintenanceDate)}</Td>
                  <Td className="max-w-xs">{r.actionsTaken}</Td>
                  <Td className="max-w-xs text-muted">{r.conditionsNoted ?? '—'}</Td>
                  <Td className="text-muted">{r.inspectorFirstName ? `${r.inspectorFirstName} ${r.inspectorLastName}` : '—'}</Td>
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

function MaintenanceForm({ onDone, onCancel }: { onDone: () => void; onCancel: () => void }) {
  const { data } = useSWR('/api/v1/extinguishers?limit=100&sort=serialNumber&order=asc', (k: string) => fetcher<ExtOpt[]>(k))
  const options = data?.data ?? []
  const [form, setForm] = useState({ extinguisherId: '', actionsTaken: '', maintenanceDate: '', conditionsNoted: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await api.post('/api/v1/maintenance', {
        extinguisherId: form.extinguisherId,
        actionsTaken: form.actionsTaken,
        maintenanceDate: form.maintenanceDate,
        conditionsNoted: form.conditionsNoted || undefined,
      })
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
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Extinguisher">
              <Select value={form.extinguisherId} onChange={(e) => setForm((f) => ({ ...f, extinguisherId: e.target.value }))} required>
                <option value="">Select extinguisher...</option>
                {options.map((o) => <option key={o.id} value={o.id}>{o.serialNumber} — {o.location}</option>)}
              </Select>
            </Field>
            <Field label="Date of action"><Input type="date" value={form.maintenanceDate} onChange={(e) => setForm((f) => ({ ...f, maintenanceDate: e.target.value }))} required /></Field>
          </div>
          <Field label="Actions taken">
            <Textarea value={form.actionsTaken} onChange={(e) => setForm((f) => ({ ...f, actionsTaken: e.target.value }))} required placeholder="e.g. Recharged, pressure-tested, replaced safety pin" />
          </Field>
          <Field label="Conditions noted (optional)">
            <Textarea value={form.conditionsNoted} onChange={(e) => setForm((f) => ({ ...f, conditionsNoted: e.target.value }))} placeholder="e.g. Minor corrosion on bracket" />
          </Field>
          <div className="flex gap-2">
            <Button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Log maintenance'}</Button>
            <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
