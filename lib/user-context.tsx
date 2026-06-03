'use client'

import { createContext, useContext } from 'react'
import type { UserRole } from '@/lib/db/schema'

export type CurrentUser = {
  id: string
  firstName: string
  lastName: string
  email: string
  role: UserRole
}

const UserContext = createContext<CurrentUser | null>(null)

export function UserProvider({ user, children }: { user: CurrentUser; children: React.ReactNode }) {
  return <UserContext.Provider value={user}>{children}</UserContext.Provider>
}

export function useUser(): CurrentUser {
  const ctx = useContext(UserContext)
  if (!ctx) throw new Error('useUser must be used within <UserProvider>')
  return ctx
}
