import { redirect } from 'next/navigation'
import { getServerSession } from '@/lib/auth/session'
import { findUserById } from '@/lib/services/users'
import { DashboardShell } from '@/components/dashboard-shell'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession()
  if (!session) redirect('/login')

  const user = await findUserById(session.userId)
  if (!user) redirect('/login')

  return (
    <DashboardShell
      user={{
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
      }}
    >
      {children}
    </DashboardShell>
  )
}
