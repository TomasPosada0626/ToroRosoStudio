import { motion, useScroll, useSpring } from 'motion/react'

/** Fina línea rose gold que indica el avance de lectura. */
export function ScrollProgress() {
  const { scrollYProgress } = useScroll()
  const scaleX = useSpring(scrollYProgress, { stiffness: 140, damping: 30, mass: 0.4 })
  return (
    <motion.div
      aria-hidden
      className="bg-metal pointer-events-none fixed inset-x-0 top-0 z-60 h-[2px] origin-left"
      style={{ scaleX }}
    />
  )
}
