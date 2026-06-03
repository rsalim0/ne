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
