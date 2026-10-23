import { motion, useReducedMotion, useSpring } from 'motion/react'
import { useRef, type PointerEvent, type ReactNode } from 'react'
import { cn } from '../../lib/cn'

/** El contenido se deja atraer suavemente por el cursor (solo con mouse). */
export function Magnetic({
  children,
  strength = 0.3,
  className,
}: {
  children: ReactNode
  strength?: number
  className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const reduce = useReducedMotion()
  const spring = { stiffness: 200, damping: 16, mass: 0.5 }
  const x = useSpring(0, spring)
  const y = useSpring(0, spring)

  const onMove = (event: PointerEvent<HTMLDivElement>) => {
    if (reduce || event.pointerType !== 'mouse' || !ref.current) return
    const rect = ref.current.getBoundingClientRect()
    x.set((event.clientX - (rect.left + rect.width / 2)) * strength)
    y.set((event.clientY - (rect.top + rect.height / 2)) * strength)
  }
  const reset = () => {
    x.set(0)
    y.set(0)
  }

  return (
    <motion.div
      ref={ref}
      className={cn('inline-block', className)}
      style={{ x, y }}
      onPointerMove={onMove}
      onPointerLeave={reset}
    >
      {children}
    </motion.div>
  )
}
