/*
 * Imágenes responsivas. Pexels y Unsplash redimensionan y convierten a WebP/AVIF al vuelo;
 * las fotos propias (en /public) se sirven tal cual.
 */

const isPexels = (src: string) => src.includes('images.pexels.com')
const isUnsplash = (src: string) => src.includes('images.unsplash.com')

export function imageUrl(src: string, width: number): string {
  if (isPexels(src)) return `${src}?auto=compress&cs=tinysrgb&fm=webp&w=${width}`
  if (isUnsplash(src)) return `${src}?auto=format&fit=crop&q=70&w=${width}`
  return src
}

export function imageSrcSet(src: string, widths: readonly number[]): string | undefined {
  if (!isPexels(src) && !isUnsplash(src)) return undefined
  return widths.map((w) => `${imageUrl(src, w)} ${w}w`).join(', ')
}

export const DEFAULT_WIDTHS = [360, 540, 720, 960, 1280, 1600] as const
