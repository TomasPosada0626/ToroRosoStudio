import type { CSSProperties } from 'react'

/**
 * Tamaño de letra para un título de UNA sola palabra en mayúsculas (ej.: "Graduaciones") que debe
 * caber en el ancho de su contenedor sin cortarse. El contenedor necesita la clase `@container`.
 * Cinzel en mayúsculas ocupa ~0.73em por letra; se usa 0.8 para dejar margen.
 */
export const fitWord = (word: string, max: string): CSSProperties => ({
  fontSize: `min(${max}, ${(100 / (0.8 * word.length)).toFixed(2)}cqw)`,
})
