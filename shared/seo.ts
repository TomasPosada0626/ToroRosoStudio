/**
 * Título, descripción e imagen para compartir de cada página.
 * Lo usan la web (pestaña del navegador) y el build, que genera una página HTML por ruta
 * para que WhatsApp, Instagram y Facebook muestren la vista previa correcta de cada enlace.
 */
export interface PageMeta {
  title: string
  description: string
  /** Imagen para compartir (1200×630), ruta pública. */
  image: string
  noindex?: boolean
}

export const SITE_NAME = 'Toro Roso Studio'

const AREA = 'Servicio a domicilio en Envigado, Antioquia.'

export const PAGE_META: Record<string, PageMeta> = {
  '/': {
    title: 'Toro Roso Studio | Maquillaje profesional a domicilio en Envigado',
    description:
      'Maquillaje profesional para novias, quinceañeras, graduaciones, eventos sociales y maquillaje artístico. Servicio a domicilio en Envigado, Antioquia. Agenda tu cita en línea.',
    image: '/brand/og-image.jpg',
  },
  '/servicios': {
    title: 'Servicios de maquillaje',
    description: `Maquillaje para novias, quinceañeras, eventos sociales, maquillaje artístico y graduaciones. ${AREA}`,
    image: '/brand/og/servicios.jpg',
  },
  '/novias': {
    title: 'Maquillaje para novias en Envigado',
    description: `Maquillaje para novias y prueba de maquillaje: un look personalizado para tu boda y para tu cortejo. ${AREA}`,
    image: '/brand/og/novias.jpg',
  },
  '/servicios/quinceaneras': {
    title: 'Maquillaje para quinceañeras en Envigado',
    description: `Un maquillaje luminoso y acorde a tu edad para celebrar tus quince. ${AREA}`,
    image: '/brand/og/quinceaneras.jpg',
  },
  '/servicios/social': {
    title: 'Maquillaje social en Envigado',
    description: `Maquillaje para cumpleaños, cenas, fiestas, invitadas de boda y eventos especiales. ${AREA}`,
    image: '/brand/og/social.jpg',
  },
  '/servicios/artistico': {
    title: 'Maquillaje artístico en Envigado',
    description: `Maquillaje creativo para sesiones de fotos, fiestas temáticas, shows y contenido para redes. ${AREA}`,
    image: '/brand/og/artistico.jpg',
  },
  '/servicios/graduaciones': {
    title: 'Maquillaje para graduaciones en Envigado',
    description: `Un look sofisticado para tu ceremonia, tus fotos y tu fiesta de grado. ${AREA}`,
    image: '/brand/og/graduaciones.jpg',
  },
  '/portafolio': {
    title: 'Portafolio de maquillaje',
    description: 'Portafolio de Toro Roso Studio: novias, quinceañeras, social, artístico, graduaciones y detalles.',
    image: '/brand/og/portafolio.jpg',
  },
  '/estudio': {
    title: 'El estudio',
    description: `Conoce Toro Roso Studio: maquillaje profesional pensado para resaltar tu esencia en cada momento especial. ${AREA}`,
    image: '/brand/og/estudio.jpg',
  },
  '/agenda': {
    title: 'Agenda tu cita',
    description: `Agenda tu cita de maquillaje en línea: elige el procedimiento de cada persona, la fecha y un horario disponible. ${AREA}`,
    image: '/brand/og/agenda.jpg',
  },
  '/preguntas-frecuentes': {
    title: 'Preguntas frecuentes',
    description: 'Cómo agendar, disponibilidad, servicio a domicilio, prueba de novia y cotizaciones en Toro Roso Studio.',
    image: '/brand/og/preguntas.jpg',
  },
  '/contacto': {
    title: 'Contacto',
    description: `Escríbenos por WhatsApp o Instagram, o agenda tu cita en línea. ${AREA}`,
    image: '/brand/og/contacto.jpg',
  },
  '/privacidad': {
    title: 'Política de privacidad y tratamiento de datos',
    description: 'Cómo Toro Roso Studio trata los datos personales de quienes agendan citas, de acuerdo con la Ley 1581 de 2012.',
    image: '/brand/og-image.jpg',
  },
  '/admin': {
    title: 'Agenda',
    description: 'Panel privado de Toro Roso Studio.',
    image: '/brand/og-image.jpg',
    noindex: true,
  },
}

/** "Novias en Envigado · Toro Roso Studio" (la portada usa su título completo). */
export const fullTitle = (path: string, meta: PageMeta) => (path === '/' ? meta.title : `${meta.title} · ${SITE_NAME}`)

/** Rutas públicas que van al sitemap. */
export const SITEMAP_ROUTES = Object.entries(PAGE_META)
  .filter(([, meta]) => !meta.noindex)
  .map(([path]) => path)
