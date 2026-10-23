import { useSyncExternalStore } from 'react'

/** Escucha una media query de CSS. */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const mql = window.matchMedia(query)
      mql.addEventListener('change', onChange)
      return () => mql.removeEventListener('change', onChange)
    },
    () => window.matchMedia(query).matches,
    () => false,
  )
}

/** Mouse o trackpad (no pantallas táctiles). */
export const useFinePointer = () => useMediaQuery('(hover: hover) and (pointer: fine)')
export const useIsDesktop = () => useMediaQuery('(min-width: 1024px)')
