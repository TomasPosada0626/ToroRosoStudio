import { SERVICE_IDS, type ServiceId } from '../../shared/booking-rules'
import { PHOTOS, type Photo } from './media'

/**
 * ─────────────────────────────────────────────────────────────────────
 *  SERVICIOS · los cinco servicios oficiales de Toro Roso Studio
 *  (Novias, Quinceañera, Social, Artístico y Graduación) + la prueba de
 *  maquillaje para novias, que se agenda pero vive dentro de "Novias".
 *
 *  Las duraciones para la agenda están en /shared/booking-rules.ts.
 *  `price`: déjalo en `null` para mostrar "Consulta disponibilidad y
 *  cotización", o escribe el texto exacto (ej.: 'Desde $000.000').
 * ─────────────────────────────────────────────────────────────────────
 */

export interface ServiceContent {
  id: ServiceId
  /** Ruta propia del servicio. */
  path: string
  /** false = se agenda, pero no aparece como servicio aparte en menús y páginas. */
  listed: boolean
  name: string
  /** Frase en caligrafía que acompaña el nombre. */
  script: string
  short: string
  description: string[]
  idealFor: string[]
  /** Opciones del campo "Tipo de evento" en la agenda. */
  eventTypes: string[]
  image: Photo
  price: string | null
}

export const SERVICES: Record<ServiceId, ServiceContent> = {
  novias: {
    id: 'novias',
    path: '/novias',
    listed: true,
    name: 'Novias',
    script: 'Tu gran día',
    short: 'Una experiencia personalizada para que te sientas tú misma en el día más especial de tu vida.',
    description: [
      'Diseñamos un maquillaje que acompañe tu vestido, tu peinado y el estilo de tu boda: pensado para verse natural en persona y hermoso en cada fotografía.',
      'Antes del gran día puedes agendar tu prueba de maquillaje, y el día de la boda vamos hasta el lugar donde te estés preparando para que vivas cada momento con calma.',
    ],
    idealFor: ['Prueba de maquillaje', 'Boda religiosa', 'Boda civil', 'Sesión de fotos preboda', 'Cortejo y familia de la novia'],
    eventTypes: ['Boda religiosa', 'Boda civil', 'Sesión preboda', 'Cortejo o familia', 'Otro'],
    image: PHOTOS.brideHair,
    price: null,
  },
  prueba: {
    id: 'prueba',
    path: '/novias',
    listed: false,
    name: 'Prueba de novia',
    script: 'Antes del gran día',
    short: 'Probamos tu look de novia con calma para que el día de tu boda no haya sorpresas.',
    description: [
      'Probamos el maquillaje con tus referencias, tu vestido y tu peinado en mente, y ajustamos cada detalle hasta que el look se sienta tuyo.',
    ],
    idealFor: ['Antes de la boda religiosa', 'Antes de la boda civil'],
    eventTypes: ['Prueba para boda religiosa', 'Prueba para boda civil', 'Otro'],
    image: PHOTOS.bridePrep,
    price: null,
  },
  quinceaneras: {
    id: 'quinceaneras',
    path: '/servicios/quinceaneras',
    listed: true,
    name: 'Quinceañeras',
    script: 'Tus quince',
    short: 'Un maquillaje pensado para celebrar una etapa única: luminoso, fresco y acorde a tu edad.',
    description: [
      'Creamos un look que realce tu belleza sin perder la frescura de tus quince, en armonía con tu vestido, tu tema y la decoración de tu fiesta.',
      'Cuéntanos cómo imaginas tu noche y diseñamos juntas el maquillaje que te hará brillar en cada momento.',
    ],
    idealFor: ['Fiesta de quince', 'Sesión de fotos', 'Ceremonia o misa', 'Mamá y damas de honor'],
    eventTypes: ['Fiesta de quince', 'Sesión de fotos', 'Ceremonia', 'Otro'],
    image: PHOTOS.quinceRoseGold,
    price: null,
  },
  social: {
    id: 'social',
    path: '/servicios/social',
    listed: true,
    name: 'Social',
    script: 'Para cada ocasión',
    short: 'Para celebraciones, cenas, fiestas y todas las ocasiones especiales en las que quieres brillar.',
    description: [
      'Desde un acabado natural y luminoso hasta un glam de noche: adaptamos el maquillaje a tu estilo, a tu outfit y al tipo de evento.',
      'Ideal para que llegues lista, segura y radiante, sin preocuparte por nada más.',
    ],
    idealFor: ['Cumpleaños', 'Cenas y fiestas', 'Invitadas de boda', 'Bautizos y primeras comuniones', 'Eventos corporativos'],
    eventTypes: ['Cumpleaños', 'Fiesta o cena', 'Invitada de boda', 'Evento corporativo', 'Otro'],
    image: PHOTOS.socialNude,
    price: null,
  },
  artistico: {
    id: 'artistico',
    path: '/servicios/artistico',
    listed: true,
    name: 'Artístico',
    script: 'Arte en tu piel',
    short: 'Maquillaje creativo para sesiones, fiestas temáticas, shows y conceptos que se salen de lo común.',
    description: [
      'Llevamos tu idea a la piel con color, brillo, texturas y técnica: conceptos creativos para fotografía, escenarios y celebraciones temáticas.',
      'Comparte tus referencias y construimos un look con carácter propio.',
    ],
    idealFor: ['Sesiones de fotos', 'Fiestas temáticas y Halloween', 'Shows y presentaciones', 'Contenido para redes'],
    eventTypes: ['Sesión de fotos', 'Fiesta temática', 'Show o presentación', 'Contenido para redes', 'Otro'],
    image: PHOTOS.artGoldEye,
    price: null,
  },
  graduaciones: {
    id: 'graduaciones',
    path: '/servicios/graduaciones',
    listed: true,
    name: 'Graduaciones',
    script: 'Tu logro',
    short: 'Un look sofisticado para celebrar uno de los momentos más importantes de tu vida.',
    description: [
      'Un maquillaje elegante que se ve impecable en la ceremonia, en las fotos de grado y durante toda la celebración.',
      'Lo diseñamos según tu estilo y el horario de tu evento, para que solo pienses en disfrutar tu logro.',
    ],
    idealFor: ['Ceremonia de grado', 'Fiesta de graduación', 'Fotos de grado', 'Prom'],
    eventTypes: ['Ceremonia de grado', 'Fiesta de graduación', 'Fotos de grado', 'Prom', 'Otro'],
    image: PHOTOS.gradSoftGlam,
    price: null,
  },
}

/** Los cinco servicios oficiales (menús, páginas y vitrinas). */
export const SERVICE_LIST: ServiceContent[] = SERVICE_IDS.map((id) => SERVICES[id]).filter((s) => s.listed)

/** Todo lo que se puede agendar, en el orden de la agenda (incluye la prueba de novia). */
export const BOOKABLE_SERVICES: ServiceContent[] = SERVICE_IDS.map((id) => SERVICES[id])

export const PRICE_FALLBACK = 'Consulta disponibilidad y cotización'

export function findServiceBySlug(slug: string | undefined): ServiceContent | undefined {
  return SERVICE_LIST.find((s) => s.id === slug)
}
