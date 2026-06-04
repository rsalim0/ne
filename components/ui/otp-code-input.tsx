'use client'

import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

/**
 * Single-field 6-digit code entry. Sanitizes to numeric input, supports
 * one-time-code autofill (iOS/Android SMS + email code suggestions), and styles
 * the value as a spaced verification code.
 */
export function OtpCodeInput({
  id,
  value,
  onChange,
  error,
  autoFocus,
}: {
  id: string
  value: string
  onChange: (v: string) => void
  error?: boolean
  autoFocus?: boolean
}) {
  return (
    <Input
      id={id}
      inputMode="numeric"
      autoComplete="one-time-code"
      pattern="\d{6}"
      maxLength={6}
      required
      autoFocus={autoFocus}
      value={value}
      onChange={(e) => onChange(e.target.value.replace(/\D/g, '').slice(0, 6))}
      aria-invalid={!!error}
      aria-label="6-digit code"
      placeholder="······"
      className={cn('[&_input]:text-center [&_input]:text-lg [&_input]:font-semibold [&_input]:tracking-[0.5em]')}
    />
  )
}
