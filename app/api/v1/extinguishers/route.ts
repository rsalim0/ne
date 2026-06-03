import { after, type NextRequest } from 'next/server'
import { withApi, readJson, getClientIp } from '@/lib/http/handler'
import { created, paginated } from '@/lib/http/responses'
import { ConflictError } from '@/lib/http/errors'
import { parsePageParams } from '@/lib/http/pagination'
import { requireAuth, requireRole } from '@/lib/auth/rbac'
import { createExtinguisher, getExtinguisherBySerial, listExtinguishers } from '@/lib/services/extinguishers'
import { createExtinguisherSchema } from '@/lib/validation/extinguisher'
import { writeAuditLog } from '@/lib/audit'
import type { ExtinguisherStatus, ExtinguisherType } from '@/lib/db/schema'

export const GET = withApi(async (req: NextRequest) => {
  await requireAuth(req)
  const params = parsePageParams(req.nextUrl)
  const sp = req.nextUrl.searchParams
  const { rows, total } = await listExtinguishers({
    ...params,
    status: (sp.get('status') as ExtinguisherStatus) || undefined,
    type: (sp.get('type') as ExtinguisherType) || undefined,
  })
  return paginated(rows, { page: params.page, limit: params.limit, total })
})

export const POST = withApi(async (req: NextRequest) => {
  const ctx = await requireRole(req, 'admin', 'inspector')
  const body = createExtinguisherSchema.parse(await readJson(req))

  if (await getExtinguisherBySerial(body.serialNumber)) {
    throw new ConflictError('An extinguisher with this serial number already exists')
  }

  const ext = await createExtinguisher(body)
  after(() =>
    writeAuditLog({
      actorUserId: ctx.userId,
      action: 'extinguisher.create',
      entityType: 'extinguisher',
      entityId: ext.id,
      ip: getClientIp(req),
    })
  )
  return created(ext)
})
