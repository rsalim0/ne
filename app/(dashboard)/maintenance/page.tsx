'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { Wrench } from '@phosphor-icons/react/dist/ssr'
import { api, ApiError, fetcher } from '@/lib/api-client'
import { formatDate } from '@/lib/utils'
import { createMaintenanceSchema } from '@/lib/validation/maintenance'

// COSS primitives
import { Button } from '@/components/ui/button'
import { Field, FieldLabel, FieldError } from '@/components/ui/field'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectPopup,
  SelectItem,
} from '@/components/ui/select'
import {
  Dialog,
  DialogPopup,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogPanel,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog'
import { DatePicker } from '@/components/ui/date-picker'
import { Textarea } from '@/components/ui/textarea'

// Legacy primitives from ui.tsx (no COSS equivalent)
import {
  Alert,
  Card,
  CardContent,
  EmptyState,
  Pagination,
  Skeleton,
  TBody,
  Table,
  Td,
  Th,
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
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editRow, setEditRow] = useState<Row | null>(null)

  const params = new URLSearchParams({ page: String(page), limit: '10' })
  if (from) params.set('from', from)
  if (to) params.set('to', to)
  const key = `/api/v1/maintenance?${params.toString()}`
  const { data, isLoading, mutate } = useSWR(key, (k: string) => fetcher<Row[]>(k))
  const rows = data?.data ?? []
  const meta = data?.meta

  function openCreate() {
    setEditRow(null)
    setDialogOpen(true)
  }

  function openEdit(row: Row) {
    setEditRow(row)
    setDialogOpen(true)
  }

  function handleDone() {
    setDialogOpen(false)
    setEditRow(null)
    mutate()
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Maintenance</h1>
          <p className="mt-1 text-sm text-muted">Log activities and review maintenance history.</p>
        </div>
        <Button onClick={openCreate}>
          <Wrench className="h-4 w-4" /> Log maintenance
        </Button>
      </div>

      {/* Date filters */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-muted">From</span>
          <DatePicker
            value={from}
            onChange={(v) => { setFrom(v); setPage(1) }}
            placeholder="Start date"
            className="w-44"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-muted">To</span>
          <DatePicker
            value={to}
            onChange={(v) => { setTo(v); setPage(1) }}
            placeholder="End date"
            className="w-44"
          />
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
              <tr>
                <Th>Extinguisher</Th>
                <Th>Date</Th>
                <Th>Actions taken</Th>
                <Th>Conditions noted</Th>
                <Th>Inspector</Th>
                <Th className="text-right">Edit</Th>
              </tr>
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
                  <Td className="text-muted">
                    {r.inspectorFirstName ? `${r.inspectorFirstName} ${r.inspectorLastName}` : '—'}
                  </Td>
                  <Td>
                    <div className="flex justify-end">
                      <Button size="sm" variant="outline" onClick={() => openEdit(r)}>
                        Edit
                      </Button>
                    </div>
                  </Td>
                </tr>
              ))}
            </TBody>
          </Table>
          <Pagination page={meta?.page ?? 1} totalPages={meta?.totalPages ?? 1} onPage={setPage} />
        </>
      )}

      <MaintenanceDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editRow={editRow}
        onDone={handleDone}
      />
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Dialog form                                                          */
/* ------------------------------------------------------------------ */

type FormState = {
  extinguisherId: string
  actionsTaken: string
  maintenanceDate: string
  conditionsNoted: string
}

type FieldErrors = Partial<Record<keyof FormState, string>>

function MaintenanceDialog({
  open,
  onOpenChange,
  editRow,
  onDone,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  editRow: Row | null
  onDone: () => void
}) {
  const isEdit = editRow !== null
  const { data } = useSWR(
    open ? '/api/v1/extinguishers?limit=100&sort=serialNumber&order=asc' : null,
    (k: string) => fetcher<ExtOpt[]>(k)
  )
  const options = data?.data ?? []

  const [form, setForm] = useState<FormState>({
    extinguisherId: '',
    actionsTaken: '',
    maintenanceDate: '',
    conditionsNoted: '',
  })
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [apiError, setApiError] = useState('')
  const [loading, setLoading] = useState(false)

  function handleOpenChange(v: boolean) {
    if (v) {
      // Pre-fill when editing
      setForm({
        extinguisherId: '',
        actionsTaken: isEdit && editRow ? editRow.actionsTaken : '',
        maintenanceDate: isEdit && editRow ? editRow.maintenanceDate : '',
        conditionsNoted: isEdit && editRow ? (editRow.conditionsNoted ?? '') : '',
      })
      setFieldErrors({})
      setApiError('')
    }
    onOpenChange(v)
  }

  function set<K extends keyof FormState>(k: K, v: FormState[K]) {
    setForm((f) => ({ ...f, [k]: v }))
    if (fieldErrors[k]) setFieldErrors((e) => ({ ...e, [k]: undefined }))
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setApiError('')
    setFieldErrors({})

    const payload = {
      extinguisherId: form.extinguisherId,
      actionsTaken: form.actionsTaken,
      maintenanceDate: form.maintenanceDate,
      conditionsNoted: form.conditionsNoted || undefined,
    }

    // Client-side validation
    const result = createMaintenanceSchema.safeParse(payload)
    if (!result.success) {
      const errs: FieldErrors = {}
      for (const issue of result.error.issues) {
        const key = issue.path[0] as keyof FormState
        if (key && !errs[key]) errs[key] = issue.message
      }
      setFieldErrors(errs)
      return
    }

    setLoading(true)
    try {
      if (isEdit && editRow) {
        await api.patch(`/api/v1/maintenance/${editRow.id}`, payload)
      } else {
        await api.post('/api/v1/maintenance', payload)
      }
      onDone()
    } catch (err) {
      setApiError(err instanceof ApiError ? err.message : 'Save failed')
      setLoading(false)
    }
  }

  const extItems = options.map((o) => ({
    value: o.id,
    label: `${o.serialNumber} — ${o.location}`,
  }))

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogPopup className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Maintenance Record' : 'Log Maintenance'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Update the details of this maintenance record.'
              : 'Record a completed maintenance activity for an extinguisher.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="contents">
          <DialogPanel className="grid gap-4 sm:grid-cols-2">
            {apiError && (
              <div className="sm:col-span-2">
                <Alert>{apiError}</Alert>
              </div>
            )}

            {/* Extinguisher */}
            <div className="sm:col-span-2">
              <Field>
                <FieldLabel>Extinguisher</FieldLabel>
                <Select
                  items={extItems}
                  value={form.extinguisherId}
                  onValueChange={(v) => set('extinguisherId', v)}
                >
                  <SelectTrigger className="w-full" aria-invalid={!!fieldErrors.extinguisherId}>
                    <SelectValue placeholder="Select extinguisher..." />
                  </SelectTrigger>
                  <SelectPopup>
                    {extItems.map((o) => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectPopup>
                </Select>
                {fieldErrors.extinguisherId && (
                  <FieldError match>{fieldErrors.extinguisherId}</FieldError>
                )}
              </Field>
            </div>

            {/* Maintenance Date — past/today only (work already performed) */}
            <div className="sm:col-span-2">
              <Field>
                <FieldLabel>Date of action</FieldLabel>
                <DatePicker
                  value={form.maintenanceDate}
                  onChange={(v) => set('maintenanceDate', v)}
                  placeholder="Pick a date"
                  disableFuture
                  invalid={!!fieldErrors.maintenanceDate}
                  className="w-full"
                />
                {fieldErrors.maintenanceDate && (
                  <FieldError match>{fieldErrors.maintenanceDate}</FieldError>
                )}
              </Field>
            </div>

            {/* Actions Taken */}
            <div className="sm:col-span-2">
              <Field>
                <FieldLabel>Actions taken</FieldLabel>
                <Textarea
                  value={form.actionsTaken}
                  onChange={(e) => set('actionsTaken', (e.target as HTMLTextAreaElement).value)}
                  placeholder="e.g. Recharged, pressure-tested, replaced safety pin"
                  aria-invalid={!!fieldErrors.actionsTaken}
                />
                {fieldErrors.actionsTaken && (
                  <FieldError match>{fieldErrors.actionsTaken}</FieldError>
                )}
              </Field>
            </div>

            {/* Conditions Noted */}
            <div className="sm:col-span-2">
              <Field>
                <FieldLabel>Conditions noted <span className="text-muted-foreground font-normal">(optional)</span></FieldLabel>
                <Textarea
                  value={form.conditionsNoted}
                  onChange={(e) => set('conditionsNoted', (e.target as HTMLTextAreaElement).value)}
                  placeholder="e.g. Minor corrosion on bracket"
                  aria-invalid={!!fieldErrors.conditionsNoted}
                />
                {fieldErrors.conditionsNoted && (
                  <FieldError match>{fieldErrors.conditionsNoted}</FieldError>
                )}
              </Field>
            </div>
          </DialogPanel>

          <DialogFooter>
            <DialogClose render={<Button type="button" variant="ghost">Cancel</Button>} />
            <Button type="submit" loading={loading}>
              {isEdit ? 'Save changes' : 'Log maintenance'}
            </Button>
          </DialogFooter>
        </form>
      </DialogPopup>
    </Dialog>
  )
}
