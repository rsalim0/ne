import nodemailer from 'nodemailer'

async function main() {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM } = process.env
  console.log(`Host=${SMTP_HOST} Port=${SMTP_PORT} User=${SMTP_USER} From=${SMTP_FROM}`)
  const port = Number(SMTP_PORT ?? 587)
  const transport = nodemailer.createTransport({
    host: SMTP_HOST,
    port,
    secure: port === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  })
  await transport.verify()
  console.log('✅ SMTP connection + auth OK')

  if (process.argv.includes('--send')) {
    const to = process.argv[process.argv.indexOf('--send') + 1] ?? SMTP_USER!
    const info = await transport.sendMail({
      from: SMTP_FROM ?? SMTP_USER!,
      to,
      subject: 'FEMS SMTP test ✔',
      text: 'If you can read this, FEMS can send OTP emails via Gmail.',
    })
    console.log(`✅ Test email sent to ${to} (messageId=${info.messageId})`)
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ SMTP check failed:', err.message)
    process.exit(1)
  })
