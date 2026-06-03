'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@/lib/user-context'
import { api, ApiError } from '@/lib/api-client'
import { changePasswordSchema } from '@/lib/validation/auth'

// COSS primitives
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Field, FieldLabel, FieldError, FieldDescription } from '@/components/ui/field'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'

// Legacy primitives kept from ui.tsx (no COSS equivalent)
import { Alert, Badge } from '@/components/ui'

type ProfileForm = { firstName: string; lastName: string; email: string }
type ProfileErrors = Partial<Record<keyof ProfileForm, string>>

type PwForm = { currentPassword: string; newPassword: string; confirmPassword: string }
type PwErrors = Partial<Record<keyof PwForm, string>>

export default function ProfilePage() {
  const user = useUser()
  const router = useRouter()

  /* ── Personal info ─────────────────────────────────────────────────────── */
  const [profile, setProfile] = useState<ProfileForm>({
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
  })
  const [profileErrors, setProfileErrors] = useState<ProfileErrors>({})
  const [profileMsg, setProfileMsg] = useState('')
  const [profileErr, setProfileErr] = useState('')
  const [savingProfile, setSavingProfile] = useState(false)

  function setProfileField(k: keyof ProfileForm) {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      setProfile((p) => ({ ...p, [k]: e.target.value }))
      setProfileErrors((pe) => ({ ...pe, [k]: undefined }))
    }
  }

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault()
    setProfileErr('')
    setProfileMsg('')

    // Basic client-side validation
    const errs: ProfileErrors = {}
    if (!profile.firstName.trim()) errs.firstName = 'Required'
    if (!profile.lastName.trim()) errs.lastName = 'Required'
    if (!profile.email.trim()) errs.email = 'Required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email)) errs.email = 'Invalid email address'
    if (Object.keys(errs).length) { setProfileErrors(errs); return }

    setSavingProfile(true)
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

  /* ── Change password ───────────────────────────────────────────────────── */
  const [pw, setPw] = useState<PwForm>({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [pwErrors, setPwErrors] = useState<PwErrors>({})
  const [pwMsg, setPwMsg] = useState('')
  const [pwErr, setPwErr] = useState('')
  const [savingPw, setSavingPw] = useState(false)

  function setPwField(k: keyof PwForm) {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      setPw((p) => ({ ...p, [k]: e.target.value }))
      setPwErrors((pe) => ({ ...pe, [k]: undefined }))
    }
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault()
    setPwErr('')
    setPwMsg('')

    // Validate with zod changePasswordSchema
    const result = changePasswordSchema.safeParse({
      currentPassword: pw.currentPassword,
      newPassword: pw.newPassword,
    })

    const errs: PwErrors = {}
    if (!result.success) {
      for (const issue of result.error.issues) {
        const key = issue.path[0] as keyof PwForm
        if (!errs[key]) errs[key] = issue.message
      }
    }
    // Confirm password client-side check
    if (pw.newPassword && pw.confirmPassword && pw.newPassword !== pw.confirmPassword) {
      errs.confirmPassword = 'Passwords do not match'
    }
    if (!pw.confirmPassword) {
      errs.confirmPassword = 'Please confirm your new password'
    }

    if (Object.keys(errs).length) { setPwErrors(errs); return }

    setSavingPw(true)
    try {
      await api.post('/api/v1/users/me/change-password', {
        currentPassword: pw.currentPassword,
        newPassword: pw.newPassword,
      })
      setPwMsg('Password changed.')
      setPw({ currentPassword: '', newPassword: '', confirmPassword: '' })
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
        <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
          Manage your account.
          <Badge color={user.role === 'admin' ? 'red' : user.role === 'inspector' ? 'blue' : 'gray'}>
            {user.role}
          </Badge>
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* ── Personal information ──────────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle>Personal information</CardTitle>
            <CardDescription>Update your name and email address.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={saveProfile} className="space-y-4">
              {profileErr && <Alert kind="error">{profileErr}</Alert>}
              {profileMsg && <Alert kind="success">{profileMsg}</Alert>}

              <div className="grid grid-cols-2 gap-3">
                <Field invalid={!!profileErrors.firstName}>
                  <FieldLabel>First name</FieldLabel>
                  <Input
                    value={profile.firstName}
                    onChange={setProfileField('firstName')}
                    aria-invalid={!!profileErrors.firstName}
                    autoComplete="given-name"
                  />
                  {profileErrors.firstName && (
                    <FieldError match>{profileErrors.firstName}</FieldError>
                  )}
                </Field>

                <Field invalid={!!profileErrors.lastName}>
                  <FieldLabel>Last name</FieldLabel>
                  <Input
                    value={profile.lastName}
                    onChange={setProfileField('lastName')}
                    aria-invalid={!!profileErrors.lastName}
                    autoComplete="family-name"
                  />
                  {profileErrors.lastName && (
                    <FieldError match>{profileErrors.lastName}</FieldError>
                  )}
                </Field>
              </div>

              <Field invalid={!!profileErrors.email}>
                <FieldLabel>Email</FieldLabel>
                <Input
                  type="email"
                  value={profile.email}
                  onChange={setProfileField('email')}
                  aria-invalid={!!profileErrors.email}
                  autoComplete="email"
                />
                {profileErrors.email && (
                  <FieldError match>{profileErrors.email}</FieldError>
                )}
              </Field>

              <Button type="submit" loading={savingProfile}>
                Save changes
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* ── Change password ───────────────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle>Change password</CardTitle>
            <CardDescription>Keep your account secure with a strong password.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={changePassword} className="space-y-4">
              {pwErr && <Alert kind="error">{pwErr}</Alert>}
              {pwMsg && <Alert kind="success">{pwMsg}</Alert>}

              <Field invalid={!!pwErrors.currentPassword}>
                <FieldLabel>Current password</FieldLabel>
                <Input
                  type="password"
                  autoComplete="current-password"
                  value={pw.currentPassword}
                  onChange={setPwField('currentPassword')}
                  aria-invalid={!!pwErrors.currentPassword}
                />
                {pwErrors.currentPassword && (
                  <FieldError match>{pwErrors.currentPassword}</FieldError>
                )}
              </Field>

              <Field invalid={!!pwErrors.newPassword}>
                <FieldLabel>New password</FieldLabel>
                <Input
                  type="password"
                  autoComplete="new-password"
                  value={pw.newPassword}
                  onChange={setPwField('newPassword')}
                  aria-invalid={!!pwErrors.newPassword}
                />
                <FieldDescription>
                  Minimum 8 characters — must include at least one letter and one number.
                </FieldDescription>
                {pwErrors.newPassword && (
                  <FieldError match>{pwErrors.newPassword}</FieldError>
                )}
              </Field>

              <Field invalid={!!pwErrors.confirmPassword}>
                <FieldLabel>Confirm new password</FieldLabel>
                <Input
                  type="password"
                  autoComplete="new-password"
                  value={pw.confirmPassword}
                  onChange={setPwField('confirmPassword')}
                  aria-invalid={!!pwErrors.confirmPassword}
                />
                {pwErrors.confirmPassword && (
                  <FieldError match>{pwErrors.confirmPassword}</FieldError>
                )}
              </Field>

              <Button type="submit" loading={savingPw}>
                Change password
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
