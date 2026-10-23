import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react'
import { useRef } from 'react'
import { PHOTOS } from '../../config/media'
import { FadeUp, ScrollWords } from '../fx/Reveal'
import { SmartImage } from '../ui/SmartImage'
import { OrnamentDivider, Sparkle } from '../ui/Sparkle'

export const MANIFESTO =
  'En Toro Roso Studio creemos que el maquillaje va más allá de transformar una apariencia: se trata de resaltar tu esencia, acompañarte en momentos especiales y ayudarte a sentirte segura, auténtica y radiante.'

export function Manifesto() {
  const ref = useRef<HTMLElement>(null)
  const reduce = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const leftY = useTransform(scrollYProgress, [0, 1], reduce ? [0, 0] : [120, -160])
  const rightY = useTransform(scrollYProgress, [0, 1], reduce ? [0, 0] : [200, -220])

  return (
    <section ref={ref} aria-labelledby="manifiesto" className="relative overflow-hidden py-24 md:py-48">
      <motion.div style={{ y: leftY }} className="absolute top-24 -left-10 hidden w-48 xl:block 2xl:left-10 2xl:w-56">
        <div className="aspect-3/4 overflow-hidden rounded-t-full border border-rose/20 opacity-80">
          <SmartImage photo={PHOTOS.detailEye} sizes="224px" baseWidth={360} />
        </div>
      </motion.div>
      <motion.div style={{ y: rightY }} className="absolute top-56 -right-8 hidden w-44 xl:block 2xl:right-12 2xl:w-52">
        <div className="aspect-3/4 overflow-hidden rounded-b-full border border-rose/20 opacity-80">
          <SmartImage photo={PHOTOS.detailPalette} sizes="208px" baseWidth={360} />
        </div>
      </motion.div>

      <div className="container-luxe relative">
        <FadeUp className="flex justify-center">
          <p id="manifiesto" className="eyebrow flex items-center gap-3 text-rose">
            <Sparkle className="size-2.5" /> Nuestra esencia <Sparkle className="size-2.5" />
          </p>
        </FadeUp>
        <ScrollWords
          text={MANIFESTO}
          highlight={['esencia', 'segura', 'auténtica', 'radiante']}
          className="mx-auto mt-10 max-w-5xl text-center font-display text-[clamp(1.55rem,3.5vw,3.1rem)] leading-[1.32] tracking-[0.02em] text-pearl"
        />
        <FadeUp className="mt-14 flex flex-col items-center gap-5">
          <OrnamentDivider />
          <p className="text-metal font-script text-3xl">Toro Roso Studio</p>
        </FadeUp>
      </div>
    </section>
  )
}
