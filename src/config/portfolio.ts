import { PHOTOS, type Photo } from './media'

/**
 * ─────────────────────────────────────────────────────────────────────
 *  PORTAFOLIO
 *  Agrega, quita o reordena fotos aquí. `shape` define cómo se ve en la
 *  galería tipo revista: 'portrait' (vertical), 'tall' (vertical alta) o
 *  'wide' (horizontal, ocupa dos columnas).
 * ─────────────────────────────────────────────────────────────────────
 */

export type PortfolioCategory = 'novias' | 'quinceaneras' | 'social' | 'artistico' | 'graduaciones' | 'detalles'
export type PortfolioFilter = 'todo' | PortfolioCategory

export const PORTFOLIO_FILTERS: { id: PortfolioFilter; label: string }[] = [
  { id: 'todo', label: 'Todo' },
  { id: 'novias', label: 'Novias' },
  { id: 'quinceaneras', label: 'Quinceañeras' },
  { id: 'social', label: 'Social' },
  { id: 'artistico', label: 'Artístico' },
  { id: 'graduaciones', label: 'Graduaciones' },
  { id: 'detalles', label: 'Ojos y detalles' },
]

export const CATEGORY_LABELS: Record<PortfolioCategory, string> = {
  novias: 'Novias',
  quinceaneras: 'Quinceañeras',
  social: 'Social',
  artistico: 'Artístico',
  graduaciones: 'Graduaciones',
  detalles: 'Ojos y detalles',
}

export interface PortfolioItem {
  id: string
  photo: Photo
  category: PortfolioCategory
  shape: 'portrait' | 'tall' | 'wide'
}

const item = (id: string, photo: Photo, category: PortfolioCategory, shape: PortfolioItem['shape']): PortfolioItem => ({
  id,
  photo,
  category,
  shape,
})

export const PORTFOLIO: PortfolioItem[] = [
  item('p01', PHOTOS.bridePrep, 'novias', 'tall'),
  item('p02', PHOTOS.artGlitterLips, 'artistico', 'wide'),
  item('p03', PHOTOS.socialNude, 'social', 'tall'),
  item('p04', PHOTOS.quinceRoseGold, 'quinceaneras', 'portrait'),
  item('p05', PHOTOS.detailLipLiner, 'detalles', 'wide'),
  item('p06', PHOTOS.redLips, 'social', 'tall'),
  item('p07', PHOTOS.brideVeil, 'novias', 'wide'),
  item('p08', PHOTOS.gradSoftGlam, 'graduaciones', 'portrait'),
  item('p09', PHOTOS.artGoldEye, 'artistico', 'tall'),
  item('p10', PHOTOS.brideHair, 'novias', 'tall'),
  item('p11', PHOTOS.socialAfro, 'social', 'portrait'),
  item('p12', PHOTOS.quinceLilac, 'quinceaneras', 'tall'),
  item('p13', PHOTOS.detailEye, 'detalles', 'portrait'),
  item('p14', PHOTOS.gradLuminous, 'graduaciones', 'portrait'),
  item('p15', PHOTOS.artSilver, 'artistico', 'portrait'),
  item('p16', PHOTOS.brideWindow, 'novias', 'wide'),
  item('p17', PHOTOS.socialScarf, 'social', 'tall'),
  item('p18', PHOTOS.detailBrushKit, 'detalles', 'wide'),
  item('p19', PHOTOS.quinceFriends, 'quinceaneras', 'wide'),
  item('p20', PHOTOS.gradSmoky, 'graduaciones', 'portrait'),
  item('p21', PHOTOS.artPaper, 'artistico', 'tall'),
  item('p22', PHOTOS.brideRing, 'novias', 'portrait'),
  item('p23', PHOTOS.socialFreckles, 'social', 'portrait'),
  item('p24', PHOTOS.detailPalette, 'detalles', 'tall'),
  item('p25', PHOTOS.artFlowers, 'artistico', 'portrait'),
  item('p26', PHOTOS.socialProfile, 'social', 'tall'),
  item('p27', PHOTOS.quinceCake, 'quinceaneras', 'portrait'),
  item('p28', PHOTOS.detailRoseBrushes, 'detalles', 'wide'),
  item('p29', PHOTOS.brideBouquet, 'novias', 'portrait'),
  item('p30', PHOTOS.detailBraids, 'detalles', 'tall'),
  item('p31', PHOTOS.goldGlow, 'artistico', 'tall'),
]

export const isPortfolioFilter = (value: string | null): value is PortfolioFilter =>
  PORTFOLIO_FILTERS.some((f) => f.id === value)
