/**
 * ─────────────────────────────────────────────────────────────────────
 *  FOTOGRAFÍAS
 *
 *  Todas las imágenes actuales son de DEMOSTRACIÓN (bancos libres Pexels
 *  y Unsplash) y se marcan como "Imagen de referencia" en el sitio.
 *  Para usar fotos reales de Toro Roso Studio:
 *   1. Guarda la foto en /public/fotos/ (JPG o WebP, ~1600 px de ancho).
 *   2. Cambia la entrada por:  real('/fotos/mi-foto.webp', 'Descripción')
 *  Las fotos reales dejan de mostrar la etiqueta de referencia.
 * ─────────────────────────────────────────────────────────────────────
 */

export interface Photo {
  src: string
  alt: string
  /** true = imagen ilustrativa, no es un trabajo real del estudio. */
  demo: boolean
  credit?: { source: 'Pexels' | 'Unsplash'; url: string }
  /** Punto focal (CSS object-position). */
  position?: string
}

const pexels = (id: number, alt: string, position?: string): Photo => ({
  src: `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg`,
  alt,
  demo: true,
  credit: { source: 'Pexels', url: `https://www.pexels.com/photo/${id}/` },
  position,
})

const unsplash = (id: string, alt: string, position?: string): Photo => ({
  src: `https://images.unsplash.com/photo-${id}`,
  alt,
  demo: true,
  credit: { source: 'Unsplash', url: 'https://unsplash.com/' },
  position,
})

/** Para fotos propias del estudio guardadas en /public. */
export const real = (src: string, alt: string, position?: string): Photo => ({ src, alt, demo: false, position })

export const PHOTOS = {
  goldGlow: pexels(11336035, 'Retrato editorial de piel luminosa con destellos dorados sobre fondo oscuro', '62% 35%'),
  quinceRoseGold: pexels(17731609, 'Quinceañera con vestido rosa dorado y tiara', '50% 22%'),
  quinceLilac: pexels(17931321, 'Quinceañera con vestido lila y tiara en un salón decorado', '50% 25%'),
  quinceFriends: pexels(15591486, 'Quinceañera celebrando con sus amigas', '50% 35%'),
  quinceCake: pexels(18310611, 'Quinceañera con pastel rosado decorado con mariposas', '50% 30%'),
  redLips: unsplash('1616683693504-3ea7e9ad6fec', 'Retrato glam con labios rojos y cabello cobrizo', '50% 35%'),
  bridePrep: pexels(20593111, 'Maquilladora preparando a una novia antes de la ceremonia, en blanco y negro', '45% 30%'),
  brideVeil: pexels(20399317, 'Novia de espaldas con velo y tocado de perlas, en blanco y negro', '45% 40%'),
  brideWindow: pexels(2085521, 'Novia frente a una ventana luminosa con vestido de encaje', '50% 40%'),
  brideHair: unsplash('1549236177-f9b0031756eb', 'Peinado de novia con tocado floral y vestido de espalda descubierta', '50% 30%'),
  brideRing: pexels(10074790, 'Mano de novia con anillo bajo el velo', '50% 50%'),
  brideBouquet: pexels(10838755, 'Ramo de rosas sostenido por una novia con velo', '50% 50%'),
  socialNude: pexels(16892463, 'Maquillaje social en tonos tierra con labios nude', '50% 30%'),
  socialScarf: pexels(13469411, 'Retrato con labios rojos y pañuelo mostaza', '55% 40%'),
  socialFreckles: pexels(15327096, 'Dos mujeres con maquillaje natural y piel luminosa', '50% 35%'),
  socialAfro: unsplash('1519699047748-de8e457a634e', 'Retrato de belleza con cabello afro sobre fondo rosado', '50% 40%'),
  socialProfile: pexels(26733152, 'Perfil con labios rojos y piel luminosa', '50% 40%'),
  artGlitterLips: pexels(11540032, 'Labios con brillos y pedrería, maquillaje artístico', '50% 50%'),
  artGoldEye: pexels(10791384, 'Maquillaje artístico con brillo dorado bajo el ojo', '50% 45%'),
  artSilver: pexels(11791466, 'Maquillaje artístico con brillo plateado en el rostro', '50% 30%'),
  artFlowers: pexels(10506153, 'Retrato con sombras rosadas rodeado de flores', '50% 40%'),
  artPaper: unsplash('1498842812179-c81beecf902c', 'Labios rosados a través de papel rasgado', '50% 50%'),
  gradSoftGlam: pexels(16534348, 'Maquillaje suave y luminoso para una noche especial', '50% 30%'),
  gradLuminous: pexels(10658350, 'Maquillaje natural con piel luminosa y pestañas definidas', '50% 35%'),
  gradSmoky: pexels(17387800, 'Ahumado en tonos morados con labios nude', '50% 35%'),
  detailLipLiner: pexels(31141637, 'Delineado de labios con pincel, en blanco y negro', '50% 50%'),
  detailEye: pexels(18688854, 'Primer plano de un ojo con pestañas definidas', '50% 45%'),
  detailBrushKit: pexels(12490383, 'Kit profesional de brochas de maquillaje', '50% 50%'),
  detailPalette: pexels(11672344, 'Paleta de sombras cálidas sobre tela borgoña', '50% 50%'),
  detailBraids: pexels(30068114, 'Aplicación de maquillaje en blanco y negro', '50% 35%'),
  detailRoseBrushes: unsplash('1526045478516-99145907023c', 'Brochas de maquillaje en tonos rosa dorado', '50% 50%'),
  artistAtWork: pexels(28743778, 'Maquilladora aplicando maquillaje a una clienta', '40% 35%'),
} satisfies Record<string, Photo>

/** Imágenes del carrusel principal (formato vertical). */
export const HERO_SLIDES: { photo: Photo; label: string }[] = [
  { photo: PHOTOS.goldGlow, label: 'Editorial' },
  { photo: PHOTOS.quinceRoseGold, label: 'Quinceañeras' },
  { photo: PHOTOS.redLips, label: 'Social' },
  { photo: PHOTOS.bridePrep, label: 'Novias' },
]
