import { AnimatePresence, motion } from 'motion/react'
import { useEffect } from 'react'
import { EASE_CURTAIN, EASE_LUXE } from '../fx/Reveal'
import { SatinCanvas } from '../fx/SatinCanvas'
import { useIntro } from '../providers/Intro'
import { useScrollLock } from '../providers/SmoothScroll'
import { LogoShine } from '../ui/Logo'

/** Intro de marca (una vez por sesión): el logo emerge sobre satén y el telón se levanta. */
export function Preloader() {
  const { play, done, finish } = useIntro()
  useScrollLock(play && !done)

  useEffect(() => {
    if (!play || done) return
    let cancelled = false
    const minimum = new Promise((resolve) => setTimeout(resolve, 1300))
    const fonts = document.fonts?.ready ?? Promise.resolve()
    const maximum = new Promise((resolve) => setTimeout(resolve, 3000))
    Promise.race([Promise.all([minimum, fonts]), maximum]).then(() => {
      if (!cancelled) finish()
    })
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' || event.key === 'Enter') finish()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      cancelled = true
      window.removeEventListener('keydown', onKey)
    }
  }, [play, done, finish])

  return (
    <AnimatePresence>
      {play && !done && (
        <motion.div
          key="intro"
          role="status"
          aria-label="Cargando Toro Roso Studio"
          onClick={finish}
          className="fixed inset-0 z-100 grid cursor-pointer place-items-center bg-noir"
          initial={{ clipPath: 'inset(0% 0% 0% 0%)' }}
          exit={{ clipPath: 'inset(0% 0% 100% 0%)' }}
          transition={{ duration: 0.9, ease: EASE_CURTAIN }}
        >
          <SatinCanvas className="absolute inset-0" intensity={0.7} speed={1.4} />
          <div className="absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_50%,transparent,rgba(5,5,5,0.85))]" />
          <div className="relative flex flex-col items-center px-6">
            <motion.div
              className="w-[min(78vw,440px)]"
              initial={{ opacity: 0, scale: 0.9, filter: 'blur(16px)' }}
              animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
              transition={{ duration: 1, ease: EASE_LUXE }}
            >
              <LogoShine eager />
            </motion.div>
            <motion.p
              className="text-metal mt-6 font-script text-3xl md:text-4xl"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45, duration: 0.8, ease: EASE_LUXE }}
            >
              Elegancia para cada ocasión
            </motion.p>
            <div className="mt-9 h-px w-44 overflow-hidden bg-rose/15">
              <motion.div
                className="h-full origin-left bg-linear-to-r from-rose/40 via-rose-light to-rose"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 1.2, ease: 'easeInOut' }}
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
