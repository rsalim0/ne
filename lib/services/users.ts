import { and, asc, count, desc, eq, ilike, or, type SQL } from 'drizzle-orm'
import { db } from '@/lib/db/client'
import { users, type User, type UserRole } from '@/lib/db/schema'

export type SafeUser = Omit<User, 'passwordHash'>

export function toSafeUser(u: User): SafeUser {
  const { passwordHash: _omit, ...rest } = u
  return rest
}

export async function findUserByEmail(email: string): Promise<User | null> {
  const [u] = await db.select().from(users).where(eq(users.email, email)).limit(1)
  return u ?? null
}

export async function findUserById(id: string): Promise<User | null> {
  const [u] = await db.select().from(users).where(eq(users.id, id)).limit(1)
  return u ?? null
}

export async function insertUser(data: {
  firstName: string
  lastName: string
  email: string
  passwordHash: string
  role?: UserRole
}): Promise<SafeUser> {
  const [u] = await db.insert(users).values(data).returning()
  return toSafeUser(u)
}

export async function updateUserById(
  id: string,
  patch: Partial<Pick<User, 'firstName' | 'lastName' | 'email' | 'role'>>
): Promise<SafeUser | null> {
  const [u] = await db.update(users).set(patch).where(eq(users.id, id)).returning()
  return u ? toSafeUser(u) : null
}

export async function deleteUserById(id: string): Promise<boolean> {
  const [u] = await db.delete(users).where(eq(users.id, id)).returning({ id: users.id })
  return !!u
}

export async function setUserPassword(id: string, passwordHash: string): Promise<void> {
  await db.update(users).set({ passwordHash }).where(eq(users.id, id))
}

const SORTABLE = {
  createdAt: users.createdAt,
  firstName: users.firstName,
  lastName: users.lastName,
  email: users.email,
} as const

export async function listUsers(params: {
  limit: number
  offset: number
  q?: string
  role?: UserRole
  sort?: string
  order: 'asc' | 'desc'
}): Promise<{ rows: SafeUser[]; total: number }> {
  const conds: SQL[] = []
  if (params.q) {
    const like = `%${params.q}%`
    conds.push(
      or(ilike(users.firstName, like), ilike(users.lastName, like), ilike(users.email, like))!
    )
  }
  if (params.role) conds.push(eq(users.role, params.role))
  const where = conds.length ? and(...conds) : undefined

  const sortCol = SORTABLE[params.sort as keyof typeof SORTABLE] ?? users.createdAt
  const orderBy = params.order === 'asc' ? asc(sortCol) : desc(sortCol)

  const [rows, totalRows] = await Promise.all([
    db.select().from(users).where(where).orderBy(orderBy).limit(params.limit).offset(params.offset),
    db.select({ value: count() }).from(users).where(where),
  ])
  return { rows: rows.map(toSafeUser), total: Number(totalRows[0]?.value ?? 0) }
}
