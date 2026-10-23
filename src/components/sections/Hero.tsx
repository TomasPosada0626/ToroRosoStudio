import { AnimatePresence, motion, useReducedMotion, useScroll, useTransform } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { HERO_SLIDES } from '../../config/media'
import { SITE } from '../../config/site'
import { cn } from '../../lib/cn'
import { GlitterDust } from '../fx/GlitterDust'
import { Magnetic } from '../fx/Magnetic'
import { EASE_CURTAIN, EASE_LUXE, FadeUp, RevealLines } from '../fx/Reveal'
import { RotatingBadge } from '../fx/RotatingBadge'
import { SatinCanvas } from '../fx/SatinCanvas'
import { useIntro } from '../providers/Intro'
import { useScrollTo } from '../providers/SmoothScroll'
import { Button, ButtonLink } from '../ui/Button'
import { ArrowRight, Pause, Play } from '../ui/Icons'
import { SmartImage } from '../ui/SmartImage'
import { Sparkle } from '../ui/Sparkle'

const SLIDE_MS = 6500

export function Hero() {
  const { done } = useIntro()
  const reduce = useReducedMotion()
  const scrollTo = useScrollTo()
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const sectionRef = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ['start start', 'end start'] })
  const archY = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : 140])
  const textY = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : -70])
  const fade = useTransform(scrollYProgress, [0, 0.85], [1, 0])

  const autoplay = done && !paused && !reduce
  useEffect(() => {
    if (!autoplay) return
    const timer = window.setTimeout(() => setIndex((i) => (i + 1) % HERO_SLIDES.length), SLIDE_MS)
    return () => window.clearTimeout(timer)
  }, [index, autoplay])

  const slide = HERO_SLIDES[index]

  return (
    <section ref={sectionRef} aria-label="Presentación" className="relative isolate overflow-hidden">
      <SatinCanvas className="absolute inset-0 -z-30" intensity={0.78} />
      <div
        aria-hidden
        className="absolute inset-0 -z-20 bg-[radial-gradient(75%_65%_at_22%_48%,rgba(5,5,5,0.88),rgba(5,5,5,0.35)_60%,transparent)]"
      />
      <div aria-hidden className="absolute inset-x-0 bottom-0 -z-20 h-40 bg-linear-to-t from-noir to-transparent" />
      <GlitterDust className="absolute inset-0 -z-10 h-full w-full" />

      <div className="container-luxe grid min-h-svh grid-cols-1 items-center gap-16 pt-32 pb-28 lg:grid-cols-12 lg:gap-10 lg:pt-28">
        <motion.div style={{ y: textY, opacity: fade }} className="relative lg:col-span-7">
          <FadeUp show={done} delay={0.05}>
            <p className="eyebrow flex items-center gap-3 text-rose">
              <Sparkle className="size-2.5" />
              Makeup artist · {SITE.location.city}, {SITE.location.region}
            </p>
          </FadeUp>

          <h1 className="mt-7 font-display text-[clamp(2.5rem,6.3vw,6rem)] leading-[0.98] font-normal tracking-[0.04em] whitespace-nowrap text-pearl uppercase">
            <RevealLines show={done} delay={0.15} lines={['Tu belleza.', 'Tu esencia.']} />
            <RevealLines
              show={done}
              delay={0.38}
              lines={['Tu momento.']}
              className="-mt-[0.08em]"
              lineClassName="text-metal animate-shimmer font-script text-[1.22em] leading-[1.12] normal-case tracking-normal pr-[0.15em]"
            />
          </h1>

          <FadeUp show={done} delay={0.7}>
            <p className="mt-7 max-w-lg text-[1.06rem] leading-relaxed text-pearl/80 md:text-lg">
              Maquillaje profesional diseñado para realzar tu esencia y acompañarte en los momentos que merecen ser
              inolvidables.
            </p>
          </FadeUp>

          <FadeUp show={done} delay={0.85} className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
            <Magnetic>
              <ButtonLink to="/agenda" size="lg" className="w-full sm:w-auto">
                Agenda tu cita <ArrowRight className="size-4" />
              </ButtonLink>
            </Magnetic>
            <Button variant="outline" size="lg" onClick={() => scrollTo('#portafolio')}>
              Explorar portafolio
            </Button>
          </FadeUp>

          <FadeUp show={done} delay={1} className="mt-12 hidden items-center gap-6 text-[0.6875rem] tracking-[0.3em] text-smoke uppercase sm:flex">
            <span>Novias</span>
            <Sparkle className="size-2 text-rose" />
            <span>Quinceañeras</span>
            <Sparkle className="size-2 text-rose" />
            <span>Social</span>
            <Sparkle className="size-2 text-rose" />
            <span>Artístico</span>
            <Sparkle className="size-2 text-rose" />
            <span>Graduaciones</span>
          </FadeUp>
        </motion.div>

        <motion.div style={{ y: archY }} className="relative lg:col-span-5">
          <motion.div
            className="relative mx-auto aspect-3/4 w-[min(80vw,430px)] lg:w-full lg:max-w-[440px]"
            initial={{ opacity: 0, y: 60 }}
            animate={done ? { opacity: 1, y: 0 } : { opacity: 0, y: 60 }}
            transition={{ duration: 1.4, ease: EASE_LUXE, delay: 0.3 }}
          >
            <div aria-hidden className="absolute -inset-3 rounded-t-full border border-rose/30 md:-inset-4" />
            <div aria-hidden className="absolute -inset-7 hidden rounded-t-full border border-rose/10 md:block" />
            <div className="relative h-full overflow-hidden rounded-t-full bg-plum-900 shadow-[0_40px_120px_-30px_rgba(112,70,95,0.6)]">
              <AnimatePresence initial={false}>
                <motion.div
                  key={index}
                  className="absolute inset-0"
                  initial={{ clipPath: 'inset(100% 0% 0% 0%)', zIndex: 2 }}
                  animate={{ clipPath: 'inset(0% 0% 0% 0%)', zIndex: 2 }}
                  exit={{ zIndex: 1, opacity: 0.99, transition: { duration: 1.5 } }}
                  transition={{ duration: 1.4, ease: EASE_CURTAIN }}
                >
                  <motion.div
                    className="h-full w-full"
                    initial={{ scale: reduce ? 1 : 1.16 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 9, ease: 'linear' }}
                  >
                    <SmartImage
                      photo={slide.photo}
                      priority={index === 0}
                      sizes="(min-width: 1024px) 440px, 80vw"
                      baseWidth={960}
                    />
                  </motion.div>
                </motion.div>
              </AnimatePresence>
              <div
                aria-hidden
                className="absolute inset-0 z-3 bg-[linear-gradient(180deg,rgba(112,70,95,0.18),rgba(22,11,21,0.1)_45%,rgba(5,5,5,0.55))] mix-blend-multiply"
              />
              <div aria-hidden className="absolute inset-0 z-3 bg-linear-to-t from-noir/75 via-transparent to-transparent" />
              <div className="absolute inset-x-0 bottom-6 z-4 flex h-16 flex-col items-center justify-end text-center">
                <AnimatePresence mode="wait" initial={false}>
                  <motion.p
                    key={index}
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0, transition: { delay: 0.55, duration: 0.8, ease: EASE_LUXE } }}
                    exit={{ opacity: 0, y: -8, transition: { duration: 0.3 } }}
                    className="flex flex-col items-center gap-1"
                  >
                    <span className="text-metal font-script text-4xl">{slide.label}</span>
                    {slide.photo.demo && (
                      <span className="text-[0.6875rem] tracking-[0.26em] text-pearl/50 uppercase">Imagen de referencia</span>
                    )}
                  </motion.p>
                </AnimatePresence>
              </div>
            </div>
            {/* En celular va en la esquina superior (fuera del arco) para no tapar el nombre de la foto. */}
            <RotatingBadge className="absolute -top-6 -right-4 z-10 size-28 md:top-auto md:right-auto md:-bottom-12 md:-left-14 md:size-36" />
          </motion.div>

          <div className="mt-16 flex items-center justify-center gap-5 lg:mt-14">
            {HERO_SLIDES.map((s, i) => (
              <button
                key={s.label}
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Mostrar imagen ${i + 1}: ${s.label}`}
                aria-current={i === index}
                className="group flex flex-col gap-2 py-2"
              >
                <span
                  className={cn(
                    'text-[0.6875rem] tracking-[0.25em] uppercase transition-colors',
                    i === index ? 'text-pearl' : 'text-smoke/60 group-hover:text-smoke',
                  )}
                >
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className="relative block h-px w-10 overflow-hidden bg-rose/20 md:w-14">
                  <motion.span
                    key={`${index}-${autoplay}`}
                    className="absolute inset-0 origin-left bg-rose"
                    initial={{ scaleX: i < index ? 1 : 0 }}
                    animate={{ scaleX: i <= index ? 1 : 0 }}
                    transition={{ duration: i === index && autoplay ? SLIDE_MS / 1000 : 0.3, ease: 'linear' }}
                  />
                </span>
              </button>
            ))}
            <button
              type="button"
              onClick={() => setPaused((p) => !p)}
              aria-label={paused ? 'Reanudar presentación' : 'Pausar presentación'}
              className="ml-1 grid size-9 place-items-center rounded-full border border-rose/30 text-rose transition hover:border-rose"
            >
              {paused ? <Play className="size-3.5" /> : <Pause className="size-3.5" />}
            </button>
          </div>
        </motion.div>
      </div>

      <motion.div
        aria-hidden
        style={{ opacity: fade }}
        className="pointer-events-none absolute bottom-8 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-3 md:flex"
      >
        <span className="text-[0.6875rem] tracking-[0.4em] text-smoke uppercase">Desliza</span>
        <span className="relative h-12 w-px overflow-hidden bg-rose/20">
          <span className="absolute inset-x-0 top-0 h-1/3 animate-scroll-dot bg-rose" />
        </span>
      </motion.div>
    </section>
  )
}
