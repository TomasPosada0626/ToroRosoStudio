/**
 * Reseñas de clientas. Agrega SOLO reseñas reales y con autorización de la clienta.
 * Mientras la lista esté vacía, el sitio muestra una invitación elegante a dejar la primera.
 *
 * Ejemplo de formato:
 *   { name: 'Laura G.', service: 'Novias', rating: 5, quote: 'Texto real de la reseña…', date: 'Noviembre 2026' }
 */
export interface Testimonial {
  /** Nombre o iniciales autorizadas por la clienta. */
  name: string
  service: string
  /** De 1 a 5. */
  rating: number
  quote: string
  date?: string
}

export const TESTIMONIALS: Testimonial[] = []
