import { type NextRequest } from 'next/server'
import { withApi } from '@/lib/http/handler'
import { ok } from '@/lib/http/responses'
import { NotFoundError } from '@/lib/http/errors'
import { requireAuth } from '@/lib/auth/rbac'
import { getMaintenanceById } from '@/lib/services/maintenance'

type Ctx = { params: Promise<{ id: string }> }

export const GET = withApi(async (req: NextRequest, { params }: Ctx) => {
  await requireAuth(req)
  const { id } = await params
  const record = await getMaintenanceById(id)
  if (!record) throw new NotFoundError('Maintenance record not found')
  return ok(record)
})
