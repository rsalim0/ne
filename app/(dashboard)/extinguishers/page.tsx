'use client'

import { useState } from 'react'
import useSWR from 'swr'
import Link from 'next/link'
import { Plus } from '@phosphor-icons/react/dist/ssr'
import { api, ApiError, fetcher } from '@/lib/api-client'
import { formatDate } from '@/lib/utils'
import { useUser } from '@/lib/user-context'
import {
  createExtinguisherSchema,
  extinguisherSizeValues,
  extinguisherStatusValues,
  extinguisherTypeValues,
} from '@/lib/validation/extinguisher'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import {
  Select,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPanel,
  DialogPopup,
  DialogTitle,
} from '@/components/ui/dialog'
import { DatePicker } from '@/components/ui/date-picker'
import {
  Alert,
  Badge,
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
  serialNumber: string
  location: string
  type: (typeof extinguisherTypeValues)[number]
  size: (typeof extinguisherSizeValues)[number]
  installationDate: string
  expiryDate: string
  status: (typeof extinguisherStatusValues)[number]
}

const TYPE_LABEL: Record<Row['type'], string> = {
  water: 'Water',
  co2: 'CO₂',
  foam: 'Foam',
  dry_chemical: 'Dry Chemical',
}

const STATUS: Record<Row['status'], { label: string; color: 'green' | 'amber' | 'red' | 'gray' }> =
  {
    active: { label: 'Active', color: 'green' },
    under_maintenance: { label: 'Under maintenance', color: 'amber' },
    expired: { label: 'Expired', color: 'red' },
    decommissioned: { label: 'Decommissioned', color: 'gray' },
  }

const TYPE_ITEMS = extinguisherTypeValues.map((v) => ({ value: v, label: TYPE_LABEL[v] }))
const SIZE_ITEMS = extinguisherSizeValues.map((v) => ({ value: v, label: v }))
const STATUS_ITEMS = extinguisherStatusValues.map((v) => ({ value: v, label: STATUS[v].label }))

const ALL_STATUSES = [{ value: '', label: 'All statuses' }, ...STATUS_ITEMS]
const ALL_TYPES = [{ value: '', label: 'All types' }, ...TYPE_ITEMS]

type FormData = {
  serialNumber: string
  location: string
  type: (typeof extinguisherTypeValues)[number]
  size: (typeof extinguisherSizeValues)[number]
  installationDate: string
  expiryDate: string
  status: (typeof extinguisherStatusValues)[number]
}

type FieldErrors = Partial<Record<keyof FormData | '_cross', string>>

function emptyForm(): FormData {
  return {
    serialNumber: '',
    location: '',
    type: 'water',
    size: '5 lbs',
    installationDate: '',
    expiryDate: '',
    status: 'active',
  }
}

function rowToForm(r: Row): FormData {
  return {
    serialNumber: r.serialNumber,
    location: r.location,
    type: r.type,
    size: r.size,
    installationDate: r.installationDate,
    expiryDate: r.expiryDate,
    status: r.status,
  }
}

export default function ExtinguishersPage() {
  const user = useUser()
  const canEdit = user.role === 'admin' || user.role === 'inspector'
  const canDelete = user.role === 'admin'

  const [page, setPage] = useState(1)
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('')
  const [type, setType] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Row | null>(null)
  const [deleteError, setDeleteError] = useState('')

  const params = new URLSearchParams({ page: String(page), limit: '10' })
  if (q) params.set('q', q)
  if (status) params.set('status', status)
  if (type) params.set('type', type)
  const key = `/api/v1/extinguishers?${params.toString()}`
  const { data, isLoading, mutate } = useSWR(key, (k: string) => fetcher<Row[]>(k))

  const rows = data?.data ?? []
  const meta = data?.meta

  function openCreate() {
    setEditing(null)
    setDialogOpen(true)
  }

  function openEdit(row: Row) {
    setEditing(row)
    setDialogOpen(true)
  }

  async function remove(id: string) {
    if (!window.confirm('Delete this extinguisher record?')) return
    setDeleteError('')
    try {
      await api.delete(`/api/v1/extinguishers/${id}`)
      mutate()
    } catch (err) {
      setDeleteError(err instanceof ApiError ? err.message : 'Delete failed')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Fire Extinguishers</h1>
          <p className="mt-1 text-sm text-muted-foreground">Equipment register and status tracking.</p>
        </div>
        {canEdit && (
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" /> Register
          </Button>
        )}
      </div>

      {deleteError && <Alert>{deleteError}</Alert>}

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Input
          className="max-w-xs"
          placeholder="Search serial number…"
          value={q}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            setQ(e.target.value)
            setPage(1)
          }}
        />
        <div className="w-[180px]">
          <Select
            items={ALL_STATUSES}
            value={status}
            onValueChange={(v) => {
              setStatus(v ?? '')
              setPage(1)
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectPopup>
              {ALL_STATUSES.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectPopup>
          </Select>
        </div>
        <div className="w-[160px]">
          <Select
            items={ALL_TYPES}
            value={type}
            onValueChange={(v) => {
              setType(v ?? '')
              setPage(1)
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="All types" />
            </SelectTrigger>
            <SelectPopup>
              {ALL_TYPES.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectPopup>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <div className="bg-card text-card-foreground border rounded-2xl">
          <div className="px-5 py-4">
            <EmptyState
              title="No extinguishers found"
              hint={canEdit ? 'Register one to get started.' : 'Try adjusting filters.'}
            />
          </div>
        </div>
      ) : (
        <>
          <Table>
            <thead>
              <tr>
                <Th>Serial</Th>
                <Th>Location</Th>
                <Th>Type</Th>
                <Th>Size</Th>
                <Th>Expiry</Th>
                <Th>Status</Th>
                {canEdit && <Th className="text-right">Actions</Th>}
              </tr>
            </thead>
            <TBody>
              {rows.map((e) => (
                <tr key={e.id}>
                  <Td className="font-medium font-mono text-xs">
                    <Link href={`/extinguishers/${e.id}`} className="hover:text-primary">
                      {e.serialNumber}
                    </Link>
                  </Td>
                  <Td>{e.location}</Td>
                  <Td>{TYPE_LABEL[e.type]}</Td>
                  <Td className="text-muted-foreground">{e.size}</Td>
                  <Td className="text-muted-foreground">{formatDate(e.expiryDate)}</Td>
                  <Td>
                    <Badge color={STATUS[e.status].color}>{STATUS[e.status].label}</Badge>
                  </Td>
                  {canEdit && (
                    <Td>
                      <div className="flex items-center justify-end gap-2">
                        <Button size="sm" variant="outline" onClick={() => openEdit(e)}>
                          Edit
                        </Button>
                        {canDelete && (
                          <Button size="sm" variant="destructive" onClick={() => remove(e.id)}>
                            Delete
                          </Button>
                        )}
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

      {/* Create / Edit Dialog */}
      {canEdit && (
        <ExtinguisherDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          initial={editing}
          onDone={() => {
            setDialogOpen(false)
            mutate()
          }}
        />
      )}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  ExtinguisherDialog                                                         */
/* -------------------------------------------------------------------------- */

function ExtinguisherDialog({
  open,
  onOpenChange,
  initial,
  onDone,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  initial: Row | null
  onDone: () => void
}) {
  const isEdit = initial !== null

  const [form, setForm] = useState<FormData>(() =>
    initial ? rowToForm(initial) : emptyForm()
  )
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [apiError, setApiError] = useState('')
  const [loading, setLoading] = useState(false)

  // Reset form when dialog opens with a new initial value
  function handleOpenChange(next: boolean) {
    if (next) {
      setForm(initial ? rowToForm(initial) : emptyForm())
      setFieldErrors({})
      setApiError('')
    }
    onOpenChange(next)
  }

  function setField<K extends keyof FormData>(key: K, value: FormData[K]) {
    setForm((f) => ({ ...f, [key]: value }))
    // Clear field error on change
    setFieldErrors((fe) => {
      const next = { ...fe }
      delete next[key]
      return next
    })
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setApiError('')

    // Zod validation
    const parsed = createExtinguisherSchema.safeParse(form)
    if (!parsed.success) {
      const errs: FieldErrors = {}
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof FormData
        if (key && !errs[key]) errs[key] = issue.message
      }
      setFieldErrors(errs)
      return
    }

    // Cross-field: expiryDate must be after installationDate
    if (
      parsed.data.installationDate &&
      parsed.data.expiryDate &&
      parsed.data.expiryDate <= parsed.data.installationDate
    ) {
      setFieldErrors({ _cross: 'Expiry date must be after the installation date.' })
      return
    }

    setLoading(true)
    try {
      if (isEdit && initial) {
        await api.patch(`/api/v1/extinguishers/${initial.id}`, parsed.data)
      } else {
        await api.post('/api/v1/extinguishers', parsed.data)
      }
      onDone()
    } catch (err) {
      setApiError(err instanceof ApiError ? err.message : 'Save failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogPopup className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit extinguisher' : 'Register extinguisher'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Update the details for this extinguisher.'
              : 'Add a new extinguisher to the equipment register.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="contents">
          <DialogPanel className="grid gap-4 sm:grid-cols-2">
            {apiError && <div className="sm:col-span-2"><Alert>{apiError}</Alert></div>}
            {fieldErrors._cross && (
              <div className="sm:col-span-2">
                <Alert>{fieldErrors._cross}</Alert>
              </div>
            )}

            {/* Serial Number */}
            <Field>
              <FieldLabel>Serial number</FieldLabel>
              <Input
                value={form.serialNumber}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setField('serialNumber', e.target.value)
                }
                placeholder="e.g. EXT-2024-001"
                aria-invalid={!!fieldErrors.serialNumber}
              />
              {fieldErrors.serialNumber && (
                <FieldError match>{fieldErrors.serialNumber}</FieldError>
              )}
            </Field>

            {/* Location */}
            <Field>
              <FieldLabel>Location</FieldLabel>
              <Input
                value={form.location}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setField('location', e.target.value)
                }
                placeholder="e.g. Building A, Floor 2"
                aria-invalid={!!fieldErrors.location}
              />
              {fieldErrors.location && (
                <FieldError match>{fieldErrors.location}</FieldError>
              )}
            </Field>

            {/* Type */}
            <Field>
              <FieldLabel>Type</FieldLabel>
              <Select
                items={TYPE_ITEMS}
                value={form.type}
                onValueChange={(v) =>
                  setField('type', v as FormData['type'])
                }
              >
                <SelectTrigger className="w-full" aria-invalid={!!fieldErrors.type}>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectPopup>
                  {TYPE_ITEMS.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectPopup>
              </Select>
              {fieldErrors.type && <FieldError match>{fieldErrors.type}</FieldError>}
            </Field>

            {/* Size */}
            <Field>
              <FieldLabel>Size</FieldLabel>
              <Select
                items={SIZE_ITEMS}
                value={form.size}
                onValueChange={(v) =>
                  setField('size', v as FormData['size'])
                }
              >
                <SelectTrigger className="w-full" aria-invalid={!!fieldErrors.size}>
                  <SelectValue placeholder="Select size" />
                </SelectTrigger>
                <SelectPopup>
                  {SIZE_ITEMS.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectPopup>
              </Select>
              {fieldErrors.size && <FieldError match>{fieldErrors.size}</FieldError>}
            </Field>

            {/* Installation Date */}
            <Field>
              <FieldLabel>Installation date</FieldLabel>
              <DatePicker
                value={form.installationDate}
                onChange={(v) => setField('installationDate', v)}
                disableFuture
                invalid={!!fieldErrors.installationDate}
                placeholder="Select installation date"
              />
              {fieldErrors.installationDate && (
                <FieldError match>{fieldErrors.installationDate}</FieldError>
              )}
            </Field>

            {/* Expiry Date */}
            <Field>
              <FieldLabel>Expiry date</FieldLabel>
              <DatePicker
                value={form.expiryDate}
                onChange={(v) => setField('expiryDate', v)}
                disablePast
                invalid={!!fieldErrors.expiryDate}
                placeholder="Select expiry date"
              />
              {fieldErrors.expiryDate && (
                <FieldError match>{fieldErrors.expiryDate}</FieldError>
              )}
            </Field>

            {/* Status */}
            <Field>
              <FieldLabel>Status</FieldLabel>
              <Select
                items={STATUS_ITEMS}
                value={form.status}
                onValueChange={(v) =>
                  setField('status', v as FormData['status'])
                }
              >
                <SelectTrigger className="w-full" aria-invalid={!!fieldErrors.status}>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectPopup>
                  {STATUS_ITEMS.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectPopup>
              </Select>
              {fieldErrors.status && <FieldError match>{fieldErrors.status}</FieldError>}
            </Field>
          </DialogPanel>

          <DialogFooter>
            <DialogClose render={<Button type="button" variant="ghost">Cancel</Button>} />
            <Button type="submit" loading={loading}>
              {isEdit ? 'Save changes' : 'Register'}
            </Button>
          </DialogFooter>
        </form>
      </DialogPopup>
    </Dialog>
  )
}
