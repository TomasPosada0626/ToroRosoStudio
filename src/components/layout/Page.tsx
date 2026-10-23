import { motion, useReducedMotion } from 'motion/react'
import { Suspense, type ReactNode } from 'react'
import { EASE_CURTAIN } from '../fx/Reveal'

/**
 * Envoltura de cada página con transición de telón ciruela:
 * al salir, un telón sube y cubre la pantalla; al entrar, se retira hacia arriba.
 */
export function Page({ children }: { children: ReactNode }) {
  const reduce = useReducedMotion()
  return (
    <>
      <motion.div
        initial={{ opacity: reduce ? 0 : 1 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: reduce ? 0 : 1, transition: { duration: reduce ? 0.15 : 0.7 } }}
      >
        <Suspense fallback={<div className="min-h-dvh" />}>{children}</Suspense>
      </motion.div>
      {!reduce && (
        <>
          <motion.div
            aria-hidden
            className="pointer-events-none fixed inset-0 z-80 origin-top border-b border-rose/40 bg-[linear-gradient(180deg,#160b15,#0b070a)]"
            initial={{ scaleY: 1 }}
            animate={{ scaleY: 0, transition: { duration: 0.85, ease: EASE_CURTAIN, delay: 0.05 } }}
            exit={{ scaleY: 0 }}
          />
          <motion.div
            aria-hidden
            className="pointer-events-none fixed inset-0 z-80 origin-bottom border-t border-rose/40 bg-[linear-gradient(0deg,#160b15,#0b070a)]"
            initial={{ scaleY: 0 }}
            animate={{ scaleY: 0 }}
            exit={{ scaleY: 1, transition: { duration: 0.65, ease: EASE_CURTAIN } }}
          />
        </>
      )}
    </>
  )
}
