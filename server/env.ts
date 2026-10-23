import { STUDIO } from '../shared/business.js'

/**
 * Variables de entorno del servidor. NUNCA se envían al navegador
 * (solo las que empiezan por VITE_ son públicas, y aquí solo se leen).
 * Se leen en cada llamada para que los cambios en Vercel apliquen sin tocar código.
 */
const read = (key: string) => (process.env[key] ?? '').trim()

export const env = {
  get databaseUrl() {
    return read('DATABASE_URL') || read('POSTGRES_URL')
  },
  get isProduction() {
    return read('VERCEL_ENV') === 'production' || read('NODE_ENV') === 'production'
  },
  get siteUrl() {
    const vercelUrl = read('VERCEL_PROJECT_PRODUCTION_URL')
    return (read('VITE_SITE_URL') || (vercelUrl ? `https://${vercelUrl}` : 'http://localhost:5173')).replace(/\/+$/, '')
  },
  /** WhatsApp oficial del estudio (público). */
  get studioWhatsApp() {
    return (read('VITE_WHATSAPP_NUMBER') || STUDIO.whatsapp).replace(/\D/g, '')
  },
  /** Correo donde Manuela recibe las nuevas citas. */
  get studioNotifyEmail() {
    return read('STUDIO_NOTIFY_EMAIL') || read('VITE_CONTACT_EMAIL')
  },
  get publicContactEmail() {
    return read('VITE_CONTACT_EMAIL')
  },
  /** Remitente de los correos. Ej.: "Toro Roso Studio <citas@tudominio.com>". */
  get emailFrom() {
    return read('EMAIL_FROM')
  },
  get resendApiKey() {
    return read('RESEND_API_KEY')
  },
  get smtp() {
    return {
      host: read('SMTP_HOST') || 'smtp.gmail.com',
      port: Number(read('SMTP_PORT') || 465),
      user: read('SMTP_USER'),
      pass: read('SMTP_PASS'),
    }
  },
  /** Único correo con acceso al panel (ej.: el de Manuela). */
  get adminEmail() {
    return read('ADMIN_EMAIL').trim().toLowerCase()
  },
  get adminPassword() {
    return read('ADMIN_PASSWORD')
  },
  get sessionSecret() {
    return read('ADMIN_SESSION_SECRET') || read('ADMIN_PASSWORD')
  },
  /** Secreto con el que Vercel autentica las tareas programadas (recordatorios). */
  get cronSecret() {
    return read('CRON_SECRET')
  },
  /** Google Calendar (opcional): cuenta de servicio con acceso al calendario de Manuela. */
  get google() {
    return {
      calendarId: read('GOOGLE_CALENDAR_ID'),
      clientEmail: read('GOOGLE_SERVICE_ACCOUNT_EMAIL'),
      privateKey: read('GOOGLE_PRIVATE_KEY').replace(/\\n/g, '\n'),
    }
  },
  /** WhatsApp Cloud API (opcional, requiere cuenta de Meta Business y plantillas aprobadas). */
  get whatsappCloud() {
    return {
      token: read('WHATSAPP_CLOUD_TOKEN'),
      phoneNumberId: read('WHATSAPP_CLOUD_PHONE_NUMBER_ID'),
      template: read('WHATSAPP_CLOUD_TEMPLATE'),
      reminderTemplate: read('WHATSAPP_CLOUD_REMINDER_TEMPLATE'),
      language: read('WHATSAPP_CLOUD_TEMPLATE_LANG') || 'es',
      apiVersion: read('WHATSAPP_CLOUD_API_VERSION') || 'v23.0',
    }
  },
}
