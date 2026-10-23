/*
 * Modo liviano: en celulares de gama baja, con ahorro de datos o cuando la animación no
 * logra mantener la fluidez, los efectos (satén y brillo) quedan como imagen fija.
 * Así la página carga más rápido y gasta menos batería, sin perder la estética.
 */

type Listener = () => void
const listeners = new Set<Listener>()

function detectLowPower(): boolean {
  if (typeof navigator === 'undefined') return false
  const nav = navigator as Navigator & { connection?: { saveData?: boolean }; deviceMemory?: number }
  if (nav.connection?.saveData) return true
  if (typeof nav.deviceMemory === 'number' && nav.deviceMemory <= 2) return true
  return typeof nav.hardwareConcurrency === 'number' && nav.hardwareConcurrency <= 2
}

let lowPower = detectLowPower()

export const isLowPower = () => lowPower

/** Activa el modo liviano en toda la página (lo llaman los efectos si detectan que van lentos). */
export function enableLowPower() {
  if (lowPower) return
  lowPower = true
  listeners.forEach((listener) => listener())
}

export function onLowPower(listener: Listener): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

/**
 * Vigila la fluidez de una animación: si el promedio de los primeros cuadros es lento
 * (menos de ~30 fps), activa el modo liviano.
 */
export function createFrameMonitor(sampleSize = 90) {
  let last = 0
  let total = 0
  let count = 0
  return (now: number) => {
    if (lowPower || count >= sampleSize) return
    if (last) {
      const delta = now - last
      // Pausas largas (pestaña oculta, scroll fuera de pantalla) no cuentan.
      if (delta < 250) {
        total += delta
        count++
        if (count === sampleSize && total / count > 34) enableLowPower()
      }
    }
    last = now
  }
}
