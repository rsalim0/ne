'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { Plus } from '@phosphor-icons/react/dist/ssr'
import { api, ApiError, fetcher } from '@/lib/api-client'
import { formatDate } from '@/lib/utils'
import type { UserRole } from '@/lib/db/schema'
import { createUserSchema } from '@/lib/validation/user'

// COSS primitives
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Field, FieldLabel, FieldError, FieldDescription } from '@/components/ui/field'
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

// Legacy primitives kept from ui.tsx (no COSS equivalent)
import {
  Alert,
  Badge,
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
  firstName: string
  lastName: string
  email: string
  role: UserRole
  createdAt: string
}

const roleBadge: Record<UserRole, 'red' | 'blue' | 'gray'> = {
  admin: 'red',
  inspector: 'blue',
  user: 'gray',
}

const ROLE_ITEMS = [
  { value: 'admin', label: 'Admin' },
  { value: 'inspector', label: 'Inspector' },
  { value: 'user', label: 'User' },
]

export default function UsersPage() {
  const [page, setPage] = useState(1)
  const [q, setQ] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editRow, setEditRow] = useState<Row | null>(null)
  const [pageError, setPageError] = useState('')

  const params = new URLSearchParams({ page: String(page), limit: '10' })
  if (q) params.set('q', q)
  if (roleFilter) params.set('role', roleFilter)
  const key = `/api/v1/users?${params.toString()}`
  const { data, isLoading, mutate } = useSWR(key, (k: string) => fetcher<Row[]>(k))

  const rows = data?.data ?? []
  const meta = data?.meta

  async function updateRole(id: string, newRole: string) {
    setPageError('')
    try {
      await api.patch(`/api/v1/users/${id}`, { role: newRole })
      mutate()
    } catch (err) {
      setPageError(err instanceof ApiError ? err.message : 'Update failed')
    }
  }

  async function remove(id: string) {
    if (!window.confirm('Delete this user? This cannot be undone.')) return
    setPageError('')
    try {
      await api.delete(`/api/v1/users/${id}`)
      mutate()
    } catch (err) {
      setPageError(err instanceof ApiError ? err.message : 'Delete failed')
    }
  }

  function openCreate() {
    setEditRow(null)
    setDialogOpen(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Users</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage accounts and roles.</p>
        </div>
        <Button type="button" onClick={openCreate}>
          <Plus className="h-4 w-4" /> New user
        </Button>
      </div>

      {pageError && <Alert kind="error">{pageError}</Alert>}

      {/* Create/Edit Dialog */}
      <UserFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editRow={editRow}
        onDone={() => {
          setDialogOpen(false)
          mutate()
        }}
      />

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Input
          className="max-w-xs"
          placeholder="Search name or email..."
          value={q}
          onChange={(e) => { setQ(e.target.value); setPage(1) }}
        />
        <Select
          items={[{ value: '', label: 'All roles' }, ...ROLE_ITEMS]}
          value={roleFilter}
          onValueChange={(v) => { setRoleFilter(v ?? ''); setPage(1) }}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="All roles" />
          </SelectTrigger>
          <SelectPopup>
            <SelectItem value="">All roles</SelectItem>
            {ROLE_ITEMS.map((r) => (
              <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
            ))}
          </SelectPopup>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <Card>
          <CardContent>
            <EmptyState title="No users found" hint="Try adjusting your search or filter." />
          </CardContent>
        </Card>
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
                  <Td className="text-muted-foreground">{u.email}</Td>
                  <Td><Badge color={roleBadge[u.role]}>{u.role}</Badge></Td>
                  <Td className="text-muted-foreground">{formatDate(u.createdAt)}</Td>
                  <Td>
                    <div className="flex items-center justify-end gap-2">
                      <Select
                        items={ROLE_ITEMS}
                        value={u.role}
                        onValueChange={(v) => { if (v) updateRole(u.id, v) }}
                      >
                        <SelectTrigger className="w-[130px]" size="sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectPopup>
                          {ROLE_ITEMS.map((r) => (
                            <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                          ))}
                        </SelectPopup>
                      </Select>
                      <Button
                        type="button"
                        size="sm"
                        variant="destructive-outline"
                        onClick={() => remove(u.id)}
                      >
                        Delete
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
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Create / Edit Dialog                                                        */
/* -------------------------------------------------------------------------- */

type FormState = {
  firstName: string
  lastName: string
  email: string
  password: string
  role: string
}

type FieldErrors = Partial<Record<keyof FormState, string>>

function UserFormDialog({
  open,
  onOpenChange,
  editRow,
  onDone,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  editRow: Row | null
  onDone: () => void
}) {
  const isEdit = editRow !== null

  const [form, setForm] = useState<FormState>({
    firstName: editRow?.firstName ?? '',
    lastName: editRow?.lastName ?? '',
    email: editRow?.email ?? '',
    password: '',
    role: editRow?.role ?? 'user',
  })
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [apiError, setApiError] = useState('')
  const [loading, setLoading] = useState(false)

  // Reset form whenever dialog opens
  function handleOpenChange(next: boolean) {
    if (next) {
      setForm({
        firstName: editRow?.firstName ?? '',
        lastName: editRow?.lastName ?? '',
        email: editRow?.email ?? '',
        password: '',
        role: editRow?.role ?? 'user',
      })
      setFieldErrors({})
      setApiError('')
    }
    onOpenChange(next)
  }

  function set(k: keyof FormState) {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm((f) => ({ ...f, [k]: e.target.value }))
      setFieldErrors((fe) => ({ ...fe, [k]: undefined }))
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setApiError('')

    // Client-side validation with zod
    const payload = isEdit
      ? { firstName: form.firstName, lastName: form.lastName, email: form.email, role: form.role }
      : { ...form, role: form.role || 'user' }

    if (!isEdit) {
      const result = createUserSchema.safeParse(payload)
      if (!result.success) {
        const errs: FieldErrors = {}
        for (const issue of result.error.issues) {
          const key = issue.path[0] as keyof FormState
          if (!errs[key]) errs[key] = issue.message
        }
        setFieldErrors(errs)
        return
      }
    }

    setLoading(true)
    try {
      if (isEdit) {
        await api.patch(`/api/v1/users/${editRow.id}`, {
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          role: form.role,
        })
      } else {
        await api.post('/api/v1/users', payload)
      }
      onDone()
    } catch (err) {
      setApiError(err instanceof ApiError ? err.message : 'Operation failed')
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogPopup showCloseButton>
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit user' : 'New user'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Update name, email, or role for this account.'
              : 'Fill in the details to create a new account.'}
          </DialogDescription>
        </DialogHeader>
        <form className="contents" onSubmit={submit}>
          <DialogPanel>
            <div className="space-y-4">
              {apiError && <Alert kind="error">{apiError}</Alert>}

              <div className="grid gap-4 sm:grid-cols-2">
                {/* First name */}
                <Field invalid={!!fieldErrors.firstName}>
                  <FieldLabel>First name</FieldLabel>
                  <Input
                    value={form.firstName}
                    onChange={set('firstName')}
                    aria-invalid={!!fieldErrors.firstName}
                    autoComplete="given-name"
                  />
                  {fieldErrors.firstName && (
                    <FieldError match>{fieldErrors.firstName}</FieldError>
                  )}
                </Field>

                {/* Last name */}
                <Field invalid={!!fieldErrors.lastName}>
                  <FieldLabel>Last name</FieldLabel>
                  <Input
                    value={form.lastName}
                    onChange={set('lastName')}
                    aria-invalid={!!fieldErrors.lastName}
                    autoComplete="family-name"
                  />
                  {fieldErrors.lastName && (
                    <FieldError match>{fieldErrors.lastName}</FieldError>
                  )}
                </Field>

                {/* Email */}
                <Field invalid={!!fieldErrors.email} className="sm:col-span-2">
                  <FieldLabel>Email</FieldLabel>
                  <Input
                    type="email"
                    value={form.email}
                    onChange={set('email')}
                    aria-invalid={!!fieldErrors.email}
                    autoComplete="email"
                  />
                  {fieldErrors.email && (
                    <FieldError match>{fieldErrors.email}</FieldError>
                  )}
                </Field>

                {/* Password — only for new users */}
                {!isEdit && (
                  <Field invalid={!!fieldErrors.password} className="sm:col-span-2">
                    <FieldLabel>Password</FieldLabel>
                    <Input
                      type="password"
                      value={form.password}
                      onChange={set('password')}
                      aria-invalid={!!fieldErrors.password}
                      autoComplete="new-password"
                    />
                    <FieldDescription>
                      Min 8 characters, must include a letter and a number.
                    </FieldDescription>
                    {fieldErrors.password && (
                      <FieldError match>{fieldErrors.password}</FieldError>
                    )}
                  </Field>
                )}

                {/* Role */}
                <Field className={isEdit ? 'sm:col-span-2' : ''}>
                  <FieldLabel>Role</FieldLabel>
                  <Select
                    items={ROLE_ITEMS}
                    value={form.role}
                    onValueChange={(v) => {
                      if (v) setForm((f) => ({ ...f, role: v }))
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectPopup>
                      {ROLE_ITEMS.map((r) => (
                        <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                      ))}
                    </SelectPopup>
                  </Select>
                </Field>
              </div>
            </div>
          </DialogPanel>
          <DialogFooter>
            <DialogClose render={<Button type="button" variant="ghost">Cancel</Button>} />
            <Button type="submit" loading={loading}>
              {isEdit ? 'Save changes' : 'Create user'}
            </Button>
          </DialogFooter>
        </form>
      </DialogPopup>
    </Dialog>
  )
}
