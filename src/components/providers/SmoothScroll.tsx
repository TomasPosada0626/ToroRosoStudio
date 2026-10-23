import Lenis from 'lenis'
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'

const LenisContext = createContext<Lenis | null>(null)

/** Desplazamiento suave con inercia (respeta "reducir movimiento" del sistema). */
export function SmoothScrollProvider({ children }: { children: ReactNode }) {
  const [lenis, setLenis] = useState<Lenis | null>(null)

  useEffect(() => {
    const instance = new Lenis({ autoRaf: true, lerp: 0.085, stopInertiaOnNavigate: true })
    setLenis(instance)
    return () => {
      instance.destroy()
      setLenis(null)
    }
  }, [])

  return <LenisContext.Provider value={lenis}>{children}</LenisContext.Provider>
}

export const useLenis = () => useContext(LenisContext)

/** Desplaza suavemente hasta un selector, elemento o posición. */
export function useScrollTo() {
  const lenis = useLenis()
  return useCallback(
    (target: string | number | HTMLElement, options: { offset?: number; immediate?: boolean } = {}) => {
      const offset = options.offset ?? -88
      if (lenis) {
        lenis.scrollTo(target, { offset, immediate: options.immediate, force: true })
        return
      }
      const behavior: ScrollBehavior = options.immediate ? 'auto' : 'smooth'
      if (typeof target === 'number') {
        window.scrollTo({ top: target, behavior })
        return
      }
      const el = typeof target === 'string' ? document.querySelector(target) : target
      if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY + offset, behavior })
    },
    [lenis],
  )
}

/** Bloquea el desplazamiento de la página (menús y visores a pantalla completa). */
export function useScrollLock(active: boolean) {
  const lenis = useLenis()
  useEffect(() => {
    if (!active) return
    const html = document.documentElement
    const previous = html.style.overflow
    lenis?.stop()
    html.style.overflow = 'hidden'
    return () => {
      html.style.overflow = previous
      lenis?.start()
    }
  }, [active, lenis])
}
