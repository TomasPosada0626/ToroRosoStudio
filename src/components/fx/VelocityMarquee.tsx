import {
  motion,
  useAnimationFrame,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  useVelocity,
} from 'motion/react'
import { Fragment, useRef } from 'react'
import { cn } from '../../lib/cn'
import { Sparkle } from '../ui/Sparkle'

const wrap = (min: number, max: number, value: number) => {
  const range = max - min
  return ((((value - min) % range) + range) % range) + min
}

/**
 * Cinta de texto infinita que se acelera y cambia de sentido con la velocidad del scroll.
 */
export function VelocityMarquee({
  items,
  baseVelocity = -1.6,
  className,
  itemClassName,
}: {
  items: string[]
  baseVelocity?: number
  className?: string
  itemClassName?: string
}) {
  const reduce = useReducedMotion()
  const baseX = useMotionValue(0)
  const { scrollY } = useScroll()
  const velocity = useSpring(useVelocity(scrollY), { damping: 50, stiffness: 380 })
  const factor = useTransform(velocity, [0, 1000], [0, 4], { clamp: false })
  const x = useTransform(baseX, (v) => `${wrap(-25, -50, v)}%`)
  const direction = useRef(1)

  useAnimationFrame((_, delta) => {
    if (reduce) return
    let moveBy = direction.current * baseVelocity * (delta / 1000)
    const f = factor.get()
    if (f < 0) direction.current = -1
    else if (f > 0) direction.current = 1
    moveBy += direction.current * moveBy * f
    baseX.set(baseX.get() + moveBy)
  })

  const row = (
    <>
      {items.map((item, i) => (
        <Fragment key={i}>
          <span className={cn('whitespace-nowrap', itemClassName)}>{item}</span>
          <Sparkle className="mx-[0.6em] size-[0.42em] shrink-0 text-rose" />
        </Fragment>
      ))}
    </>
  )

  return (
    <div className={cn('flex overflow-hidden', className)} aria-label={items.join(', ')} role="marquee">
      <motion.div className="flex shrink-0 items-center" style={{ x }} aria-hidden>
        {row}
        {row}
        {row}
        {row}
      </motion.div>
    </div>
  )
}
