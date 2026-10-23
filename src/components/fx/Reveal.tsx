import { motion, useReducedMotion, useScroll, useTransform, type MotionValue } from 'motion/react'
import { useRef, type ReactNode } from 'react'
import { cn } from '../../lib/cn'

export const EASE_LUXE = [0.22, 1, 0.36, 1] as const
export const EASE_CURTAIN = [0.76, 0, 0.24, 1] as const
const VIEWPORT = { once: true, margin: '0px 0px -12% 0px' } as const

type Tag = 'h1' | 'h2' | 'h3' | 'p' | 'div' | 'span'

/**
 * Líneas que emergen desde una máscara, una tras otra (titulares editoriales).
 * Con `show` se controla manualmente (ej.: el hero espera a que termine la intro).
 */
export function RevealLines({
  lines,
  as: Component = 'span',
  className,
  lineClassName,
  delay = 0,
  stagger = 0.09,
  show,
}: {
  lines: ReactNode[]
  as?: Tag
  className?: string
  lineClassName?: string
  delay?: number
  stagger?: number
  show?: boolean
}) {
  const trigger =
    show === undefined
      ? { whileInView: { y: '0%' }, viewport: VIEWPORT }
      : { animate: { y: show ? '0%' : '110%' } }
  return (
    <Component className={className}>
      {lines.map((line, i) => (
        <span key={i} className="block overflow-hidden pt-[0.06em] pb-[0.14em] -mb-[0.14em]">
          <motion.span
            className={cn('block', lineClassName)}
            initial={{ y: '110%' }}
            {...trigger}
            transition={{ duration: 1.1, ease: EASE_LUXE, delay: delay + i * stagger }}
          >
            {line}
          </motion.span>
        </span>
      ))}
    </Component>
  )
}

/** Aparición suave hacia arriba al entrar en pantalla. */
export function FadeUp({
  children,
  className,
  delay = 0,
  y = 28,
  show,
}: {
  children: ReactNode
  className?: string
  delay?: number
  y?: number
  show?: boolean
}) {
  const trigger =
    show === undefined
      ? { whileInView: { opacity: 1, y: 0 }, viewport: VIEWPORT }
      : { animate: show ? { opacity: 1, y: 0 } : { opacity: 0, y } }
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      {...trigger}
      transition={{ duration: 0.95, ease: EASE_LUXE, delay }}
    >
      {children}
    </motion.div>
  )
}

/** Imagen que se descubre como un telón, con un leve zoom de salida. */
export function ImageReveal({
  children,
  className,
  delay = 0,
  from = 'bottom',
}: {
  children: ReactNode
  className?: string
  delay?: number
  from?: 'bottom' | 'left' | 'top'
}) {
  const reduce = useReducedMotion()
  const hidden =
    from === 'bottom' ? 'inset(100% 0% 0% 0%)' : from === 'left' ? 'inset(0% 100% 0% 0%)' : 'inset(0% 0% 100% 0%)'
  if (reduce) return <div className={cn('overflow-hidden', className)}>{children}</div>
  return (
    <motion.div
      className={cn('overflow-hidden', className)}
      initial={{ clipPath: hidden }}
      whileInView={{ clipPath: 'inset(0% 0% 0% 0%)' }}
      viewport={VIEWPORT}
      transition={{ duration: 1.35, ease: EASE_CURTAIN, delay }}
    >
      <motion.div
        className="h-full w-full"
        initial={{ scale: 1.22 }}
        whileInView={{ scale: 1 }}
        viewport={VIEWPORT}
        transition={{ duration: 1.9, ease: EASE_LUXE, delay }}
      >
        {children}
      </motion.div>
    </motion.div>
  )
}

/** Desplazamiento vertical a distinta velocidad que el scroll. */
export function Parallax({ children, className, amount = 60 }: { children: ReactNode; className?: string; amount?: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const reduce = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const y = useTransform(scrollYProgress, [0, 1], reduce ? [0, 0] : [-amount, amount])
  return (
    <div ref={ref} className={cn('relative overflow-hidden', className)}>
      <motion.div className="absolute inset-x-0" style={{ y, top: -amount, bottom: -amount }}>
        {children}
      </motion.div>
    </div>
  )
}

/** Texto cuyas palabras se iluminan a medida que se lee con el scroll. */
export function ScrollWords({
  text,
  className,
  highlight = [],
}: {
  text: string
  className?: string
  /** Palabras que se destacan en caligrafía metálica. */
  highlight?: string[]
}) {
  const ref = useRef<HTMLParagraphElement>(null)
  const reduce = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 85%', 'end 50%'] })
  const words = text.split(' ')
  const isHighlighted = (word: string) => highlight.includes(word.replace(/[.,:;]/g, '').toLowerCase())
  return (
    <p ref={ref} className={className}>
      {words.map((word, i) => (
        <Word
          key={i}
          progress={scrollYProgress}
          range={[i / words.length, (i + 1) / words.length]}
          still={Boolean(reduce)}
          highlighted={isHighlighted(word)}
        >
          {word}
        </Word>
      ))}
    </p>
  )
}

function Word({
  children,
  progress,
  range,
  still,
  highlighted,
}: {
  children: string
  progress: MotionValue<number>
  range: [number, number]
  still: boolean
  highlighted: boolean
}) {
  const opacity = useTransform(progress, range, still ? [1, 1] : [0.13, 1])
  return (
    <>
      <motion.span
        style={{ opacity }}
        className={highlighted ? 'font-script text-metal text-[1.35em] leading-[0.8] normal-case tracking-normal' : undefined}
      >
        {children}
      </motion.span>{' '}
    </>
  )
}
