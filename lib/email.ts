import nodemailer from 'nodemailer'
import { getConfig } from '@/lib/config'
import { logger } from '@/lib/logger'

export type EmailMessage = {
  to: string
  subject: string
  text: string
  html?: string
}

/**
 * Send an email if SMTP is configured; otherwise log it (dev fallback) so flows
 * like password recovery remain testable without an email provider.
 */
export async function sendEmail(msg: EmailMessage): Promise<void> {
  const cfg = getConfig()
  if (!cfg.SMTP_HOST) {
    logger.info({ to: msg.to, subject: msg.subject, text: msg.text }, '[email:dev] SMTP not configured — not sent')
    return
  }
  const transport = nodemailer.createTransport({
    host: cfg.SMTP_HOST,
    port: cfg.SMTP_PORT ?? 587,
    secure: (cfg.SMTP_PORT ?? 587) === 465,
    auth: cfg.SMTP_USER ? { user: cfg.SMTP_USER, pass: cfg.SMTP_PASS } : undefined,
  })
  await transport.sendMail({
    from: cfg.SMTP_FROM ?? 'no-reply@fems.local',
    to: msg.to,
    subject: msg.subject,
    text: msg.text,
    html: msg.html,
  })
}

/** Branded HTML wrapper for a one-time code email. */
function otpHtml(opts: { heading: string; intro: string; code: string; ttlMinutes: number }): string {
  return `
  <div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;color:#18181b">
    <div style="font-size:13px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:#dc2626">FEMS · Fire Safety Console</div>
    <h1 style="font-size:20px;margin:16px 0 8px">${opts.heading}</h1>
    <p style="font-size:14px;line-height:1.6;color:#52525b;margin:0 0 24px">${opts.intro}</p>
    <div style="font-size:34px;font-weight:700;letter-spacing:.4em;text-align:center;padding:18px 0;background:#f4f4f5;border-radius:12px;color:#18181b">${opts.code}</div>
    <p style="font-size:13px;line-height:1.6;color:#71717a;margin:24px 0 0">
      This code expires in ${opts.ttlMinutes} minutes. If you didn't request it, you can safely ignore this email.
    </p>
  </div>`
}

/** Send the account-confirmation OTP. */
export async function sendVerificationOtp(to: string, code: string, ttlMinutes = 15): Promise<void> {
  await sendEmail({
    to,
    subject: `${code} is your FEMS verification code`,
    text: `Your FEMS account confirmation code is ${code}. It expires in ${ttlMinutes} minutes.`,
    html: otpHtml({
      heading: 'Confirm your account',
      intro: 'Enter this code to verify your email address and finish setting up your FEMS account.',
      code,
      ttlMinutes,
    }),
  })
}

/** Send the password-reset OTP. */
export async function sendPasswordResetOtp(to: string, code: string, ttlMinutes = 15): Promise<void> {
  await sendEmail({
    to,
    subject: `${code} is your FEMS password reset code`,
    text: `Your FEMS password reset code is ${code}. It expires in ${ttlMinutes} minutes.`,
    html: otpHtml({
      heading: 'Reset your password',
      intro: 'Enter this code to choose a new password for your FEMS account.',
      code,
      ttlMinutes,
    }),
  })
}
