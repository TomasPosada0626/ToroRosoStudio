import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'

const STORAGE_KEY = 'trs:intro-seen'

interface IntroState {
  /** La intro ya terminó (o no corresponde mostrarla). */
  done: boolean
  /** Debe mostrarse la intro en esta visita. */
  play: boolean
  finish: () => void
}

const IntroContext = createContext<IntroState>({ done: true, play: false, finish: () => {} })

/** Solo en la portada: quien llega por un enlace directo (ej. /agenda desde Instagram) entra sin esperar. */
function shouldPlayIntro(): boolean {
  if (typeof window === 'undefined') return false
  if (window.location.pathname !== '/') return false
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false
  try {
    return sessionStorage.getItem(STORAGE_KEY) !== '1'
  } catch {
    return true
  }
}

/** Controla la intro animada: una vez por sesión del navegador. */
export function IntroProvider({ children }: { children: ReactNode }) {
  const [play] = useState(shouldPlayIntro)
  const [done, setDone] = useState(!play)

  const finish = useCallback(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, '1')
    } catch {
      /* almacenamiento no disponible: la intro simplemente puede repetirse */
    }
    setDone(true)
  }, [])

  const value = useMemo(() => ({ done, play, finish }), [done, play, finish])
  return <IntroContext.Provider value={value}>{children}</IntroContext.Provider>
}

export const useIntro = () => useContext(IntroContext)
