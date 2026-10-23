import { env } from './env.js'

export interface EmailMessage {
  to: string
  subject: string
  html: string
  text: string
  replyTo?: string
  ics?: { filename: string; content: string; method: 'PUBLISH' | 'CANCEL' }
}

/**
 * Proveedores soportados (se usa el primero configurado):
 *  1. Resend (RESEND_API_KEY + EMAIL_FROM) — requiere un dominio verificado.
 *  2. SMTP, p. ej. Gmail con contraseña de aplicación (SMTP_USER + SMTP_PASS).
 */
export function emailConfigured(): boolean {
  return Boolean((env.resendApiKey && env.emailFrom) || (env.smtp.user && env.smtp.pass))
}

export async function sendEmail(message: EmailMessage): Promise<boolean> {
  try {
    if (env.resendApiKey && env.emailFrom) {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${env.resendApiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: env.emailFrom,
          to: [message.to],
          subject: message.subject,
          html: message.html,
          text: message.text,
          ...(message.replyTo ? { reply_to: message.replyTo } : {}),
          ...(message.ics
            ? {
                attachments: [
                  { filename: message.ics.filename, content: Buffer.from(message.ics.content, 'utf8').toString('base64') },
                ],
              }
            : {}),
        }),
      })
      if (!response.ok) {
        console.error('[email] Resend respondió', response.status, await response.text())
        return false
      }
      return true
    }

    const { host, port, user, pass } = env.smtp
    if (user && pass) {
      const { createTransport } = await import('nodemailer')
      const transporter = createTransport({ host, port, secure: port === 465, auth: { user, pass } })
      await transporter.sendMail({
        from: env.emailFrom || `Toro Roso Studio <${user}>`,
        to: message.to,
        subject: message.subject,
        html: message.html,
        text: message.text,
        replyTo: message.replyTo,
        attachments: message.ics
          ? [
              {
                filename: message.ics.filename,
                content: message.ics.content,
                contentType: `text/calendar; charset=utf-8; method=${message.ics.method}`,
              },
            ]
          : undefined,
      })
      return true
    }
    return false
  } catch (error) {
    console.error('[email] No se pudo enviar el correo:', error)
    return false
  }
}
