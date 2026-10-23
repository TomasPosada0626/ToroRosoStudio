import { STUDIO } from '../../shared/business'

/**
 * ─────────────────────────────────────────────────────────────────────
 *  DATOS DEL NEGOCIO · Toro Roso Studio
 *  Edita este archivo para actualizar contacto, redes y textos legales.
 *
 *  ⚠️ PENDIENTES ANTES DE PUBLICAR (no se inventaron):
 *   - Correo oficial   → variable VITE_CONTACT_EMAIL
 *   - Historia de la maquilladora → `artist.bio`
 * ─────────────────────────────────────────────────────────────────────
 */

const env = import.meta.env

export const SITE = {
  name: 'Toro Roso Studio',
  tagline: 'Elegancia para cada ocasión',
  description:
    'Maquillaje profesional a domicilio para novias, quinceañeras, graduaciones, eventos sociales y maquillaje artístico en Envigado, Antioquia.',
  url: __SITE_URL__,

  location: {
    city: 'Envigado',
    region: 'Antioquia',
    country: 'Colombia',
    /** Tomado de la biografía oficial de Instagram. */
    serviceMode: 'Servicio a domicilio',
  },

  contact: {
    /** WhatsApp oficial: +57 322 493 5632. Puede reemplazarse con VITE_WHATSAPP_NUMBER. */
    whatsapp: (env.VITE_WHATSAPP_NUMBER || STUDIO.whatsapp).replace(/\D/g, ''),
    email: (env.VITE_CONTACT_EMAIL ?? '').trim(),
    instagram: { handle: '@tororosostudio', url: STUDIO.instagram },
    /** Mensaje directo de Instagram. */
    instagramDm: 'https://ig.me/m/tororosostudio',
    /** Debe coincidir con `weeklyHours` en shared/booking-rules.ts. `null` = no se muestra. */
    hours: 'Todos los días, de 8:00 a. m. a 8:00 p. m. · última cita 6:00 p. m.' as string | null,
  },

  /** La artista detrás de la marca (handle tomado de la biografía oficial de Instagram). */
  artist: {
    /** Nombre para mostrar. `null` = se muestra solo el usuario de Instagram. */
    name: 'Manuela' as string | null,
    instagram: { handle: '@manuelatororoso', url: 'https://www.instagram.com/manuelatororoso/' },
    /** Párrafos con la historia real de la maquilladora. Vacío = no se muestra la sección de biografía. */
    bio: [] as string[],
  },

  legal: {
    responsible: 'Toro Roso Studio',
    privacyUpdated: '22 de octubre de 2026',
  },
} as const

export const hasWhatsApp = () => SITE.contact.whatsapp.length >= 10
export const hasEmail = () => SITE.contact.email.includes('@')
