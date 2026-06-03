'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@/lib/user-context'
import { api, ApiError } from '@/lib/api-client'
import { Alert, Badge, Button, Card, CardContent, CardHeader, CardTitle, Field, Input } from '@/components/ui'

export default function ProfilePage() {
  const user = useUser()
  const router = useRouter()

  const [profile, setProfile] = useState({ firstName: user.firstName, lastName: user.lastName, email: user.email })
  const [profileMsg, setProfileMsg] = useState('')
  const [profileErr, setProfileErr] = useState('')
  const [savingProfile, setSavingProfile] = useState(false)

  const [pw, setPw] = useState({ currentPassword: '', newPassword: '' })
  const [pwMsg, setPwMsg] = useState('')
  const [pwErr, setPwErr] = useState('')
  const [savingPw, setSavingPw] = useState(false)

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault()
    setSavingProfile(true)
    setProfileErr('')
    setProfileMsg('')
    try {
      await api.patch('/api/v1/users/me', profile)
      setProfileMsg('Profile updated.')
      router.refresh()
    } catch (err) {
      setProfileErr(err instanceof ApiError ? err.message : 'Update failed')
    } finally {
      setSavingProfile(false)
    }
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault()
    setSavingPw(true)
    setPwErr('')
    setPwMsg('')
    try {
      await api.post('/api/v1/users/me/change-password', pw)
      setPwMsg('Password changed.')
      setPw({ currentPassword: '', newPassword: '' })
    } catch (err) {
      setPwErr(err instanceof ApiError ? err.message : 'Change failed')
    } finally {
      setSavingPw(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Profile</h1>
        <p className="mt-1 flex items-center gap-2 text-sm text-muted">
          Manage your account.
          <Badge color={user.role === 'admin' ? 'red' : user.role === 'inspector' ? 'blue' : 'gray'}>{user.role}</Badge>
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Personal information</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={saveProfile} className="space-y-4">
              {profileErr && <Alert>{profileErr}</Alert>}
              {profileMsg && <Alert kind="success">{profileMsg}</Alert>}
              <div className="grid grid-cols-2 gap-3">
                <Field label="First name">
                  <Input value={profile.firstName} onChange={(e) => setProfile((p) => ({ ...p, firstName: e.target.value }))} required />
                </Field>
                <Field label="Last name">
                  <Input value={profile.lastName} onChange={(e) => setProfile((p) => ({ ...p, lastName: e.target.value }))} required />
                </Field>
              </div>
              <Field label="Email">
                <Input type="email" value={profile.email} onChange={(e) => setProfile((p) => ({ ...p, email: e.target.value }))} required />
              </Field>
              <Button type="submit" disabled={savingProfile}>
                {savingProfile ? 'Saving...' : 'Save changes'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Change password</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={changePassword} className="space-y-4">
              {pwErr && <Alert>{pwErr}</Alert>}
              {pwMsg && <Alert kind="success">{pwMsg}</Alert>}
              <Field label="Current password">
                <Input type="password" autoComplete="current-password" value={pw.currentPassword} onChange={(e) => setPw((p) => ({ ...p, currentPassword: e.target.value }))} required />
              </Field>
              <Field label="New password">
                <Input type="password" autoComplete="new-password" value={pw.newPassword} onChange={(e) => setPw((p) => ({ ...p, newPassword: e.target.value }))} required placeholder="Min 8 chars, 1 letter, 1 number" />
              </Field>
              <Button type="submit" disabled={savingPw}>
                {savingPw ? 'Saving...' : 'Change password'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
