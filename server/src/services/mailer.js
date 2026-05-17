import nodemailer from 'nodemailer'

function formatInr(amount) {
  const n = Number(amount)
  if (!Number.isFinite(n)) return '₹0'
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(n)
}

export function isEmailConfigured() {
  return Boolean(
    process.env.SMTP_HOST &&
      process.env.SMTP_PORT &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASS,
  )
}

let transporter

function getTransporter() {
  if (!isEmailConfigured()) return null
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: String(process.env.SMTP_SECURE || '').toLowerCase() === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })
  }
  return transporter
}

export async function sendMail({ to, subject, text, html }) {
  if (String(process.env.EMAIL_ENABLED || 'true').toLowerCase() === 'false') return
  const t = getTransporter()
  if (!t || !to) return
  const from = process.env.EMAIL_FROM || process.env.SMTP_USER
  await t.sendMail({
    from,
    to,
    subject,
    text,
    html: html || text,
  })
}

export { formatInr }
