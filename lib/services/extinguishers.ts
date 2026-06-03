import { and, asc, count, desc, eq, ilike, type SQL } from 'drizzle-orm'
import { db } from '@/lib/db/client'
import {
  fireExtinguishers,
  type ExtinguisherStatus,
  type ExtinguisherType,
  type FireExtinguisher,
  type NewFireExtinguisher,
} from '@/lib/db/schema'

export async function getExtinguisherById(id: string): Promise<FireExtinguisher | null> {
  const [row] = await db.select().from(fireExtinguishers).where(eq(fireExtinguishers.id, id)).limit(1)
  return row ?? null
}

export async function getExtinguisherBySerial(serial: string): Promise<FireExtinguisher | null> {
  const [row] = await db
    .select()
    .from(fireExtinguishers)
    .where(eq(fireExtinguishers.serialNumber, serial))
    .limit(1)
  return row ?? null
}

export async function createExtinguisher(data: NewFireExtinguisher): Promise<FireExtinguisher> {
  const [row] = await db.insert(fireExtinguishers).values(data).returning()
  return row
}

export async function updateExtinguisher(
  id: string,
  patch: Partial<NewFireExtinguisher>
): Promise<FireExtinguisher | null> {
  const [row] = await db
    .update(fireExtinguishers)
    .set(patch)
    .where(eq(fireExtinguishers.id, id))
    .returning()
  return row ?? null
}

export async function deleteExtinguisher(id: string): Promise<boolean> {
  const [row] = await db
    .delete(fireExtinguishers)
    .where(eq(fireExtinguishers.id, id))
    .returning({ id: fireExtinguishers.id })
  return !!row
}

const SORTABLE = {
  serialNumber: fireExtinguishers.serialNumber,
  location: fireExtinguishers.location,
  type: fireExtinguishers.type,
  status: fireExtinguishers.status,
  installationDate: fireExtinguishers.installationDate,
  expiryDate: fireExtinguishers.expiryDate,
  createdAt: fireExtinguishers.createdAt,
} as const

export async function listExtinguishers(params: {
  limit: number
  offset: number
  q?: string
  status?: ExtinguisherStatus
  type?: ExtinguisherType
  sort?: string
  order: 'asc' | 'desc'
}): Promise<{ rows: FireExtinguisher[]; total: number }> {
  const conds: SQL[] = []
  if (params.q) conds.push(ilike(fireExtinguishers.serialNumber, `%${params.q}%`))
  if (params.status) conds.push(eq(fireExtinguishers.status, params.status))
  if (params.type) conds.push(eq(fireExtinguishers.type, params.type))
  const where = conds.length ? and(...conds) : undefined

  const sortCol = SORTABLE[params.sort as keyof typeof SORTABLE] ?? fireExtinguishers.createdAt
  const orderBy = params.order === 'asc' ? asc(sortCol) : desc(sortCol)

  const [rows, totalRows] = await Promise.all([
    db.select().from(fireExtinguishers).where(where).orderBy(orderBy).limit(params.limit).offset(params.offset),
    db.select({ value: count() }).from(fireExtinguishers).where(where),
  ])
  return { rows, total: Number(totalRows[0]?.value ?? 0) }
}
