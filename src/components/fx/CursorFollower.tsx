import { motion, useMotionValue, useReducedMotion, useSpring } from 'motion/react'
import { useEffect, useState } from 'react'
import { useFinePointer } from '../../hooks/useMediaQuery'

const INTERACTIVE = 'a, button, [role="button"], [data-cursor], label[for], select, summary, input[type="checkbox"], input[type="radio"]'

/**
 * Aro rose gold que sigue al cursor (el cursor del sistema se conserva).
 * Crece sobre elementos interactivos y muestra una etiqueta en [data-cursor="Ver"].
 */
export function CursorFollower() {
  const fine = useFinePointer()
  const reduce = useReducedMotion()
  const x = useMotionValue(-200)
  const y = useMotionValue(-200)
  const springX = useSpring(x, { stiffness: 520, damping: 42, mass: 0.5 })
  const springY = useSpring(y, { stiffness: 520, damping: 42, mass: 0.5 })
  const [state, setState] = useState({ hover: false, label: '', visible: false })

  useEffect(() => {
    if (!fine || reduce) return
    const onMove = (event: PointerEvent) => {
      x.set(event.clientX)
      y.set(event.clientY)
      setState((s) => (s.visible ? s : { ...s, visible: true }))
    }
    const onOver = (event: PointerEvent) => {
      const target = event.target instanceof Element ? event.target : null
      const interactive = target?.closest(INTERACTIVE)
      const label = target?.closest('[data-cursor]')?.getAttribute('data-cursor') ?? ''
      setState((s) =>
        s.hover === Boolean(interactive) && s.label === label ? s : { ...s, hover: Boolean(interactive), label },
      )
    }
    const onLeave = () => setState((s) => ({ ...s, visible: false }))
    window.addEventListener('pointermove', onMove, { passive: true })
    document.addEventListener('pointerover', onOver, { passive: true })
    document.documentElement.addEventListener('pointerleave', onLeave)
    return () => {
      window.removeEventListener('pointermove', onMove)
      document.removeEventListener('pointerover', onOver)
      document.documentElement.removeEventListener('pointerleave', onLeave)
    }
  }, [fine, reduce, x, y])

  if (!fine || reduce) return null
  const size = state.label ? 86 : state.hover ? 52 : 28
  return (
    <motion.div aria-hidden className="pointer-events-none fixed top-0 left-0 z-95" style={{ x: springX, y: springY }}>
      <motion.div
        className="grid -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-rose/70"
        animate={{
          width: size,
          height: size,
          opacity: state.visible ? 1 : 0,
          backgroundColor: state.label
            ? 'rgba(183,131,157,0.94)'
            : state.hover
              ? 'rgba(183,131,157,0.12)'
              : 'rgba(183,131,157,0)',
        }}
        transition={{ type: 'spring', stiffness: 320, damping: 26 }}
      >
        {state.label && <span className="eyebrow text-[0.6875rem] tracking-[0.22em] text-noir">{state.label}</span>}
      </motion.div>
    </motion.div>
  )
}
