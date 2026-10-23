import { AnimatePresence, motion } from 'motion/react'
import { useState } from 'react'
import { TESTIMONIALS } from '../../config/testimonials'
import { contactLink } from '../../lib/whatsapp'
import { EASE_LUXE, FadeUp } from '../fx/Reveal'
import { ButtonLink } from '../ui/Button'
import { ChevronLeft, ChevronRight } from '../ui/Icons'
import { SectionHeading } from '../ui/SectionHeading'
import { Sparkle } from '../ui/Sparkle'

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-1.5 text-rose" role="img" aria-label={`${rating} de 5 estrellas`}>
      {Array.from({ length: 5 }, (_, i) => (
        <Sparkle key={i} className={i < rating ? 'size-3.5' : 'size-3.5 opacity-25'} />
      ))}
    </div>
  )
}

/** Reseñas reales de clientas. Sin reseñas verificadas, muestra una invitación elegante. */
export function Testimonials() {
  const [index, setIndex] = useState(0)
  const review = contactLink('Hola, Toro Roso Studio ✨ Quiero contarles mi experiencia con su maquillaje.')

  return (
    <section aria-label="Testimonios" className="relative py-20 md:py-36">
      <div className="container-luxe">
        <SectionHeading eyebrow="Testimonios" title="Historias" script="que brillan" />

        {TESTIMONIALS.length === 0 ? (
          <FadeUp className="mx-auto mt-14 max-w-2xl rounded-[2rem] border border-line bg-linear-to-b from-plum-900/70 to-noir px-8 py-14 text-center md:px-14">
            <span aria-hidden className="text-metal block font-display text-7xl leading-none">“</span>
            <p className="mt-2 font-display text-xl tracking-[0.04em] text-pearl md:text-2xl">
              Muy pronto compartiremos aquí las experiencias reales de nuestras clientas.
            </p>
            <p className="mx-auto mt-5 max-w-md text-sm leading-relaxed text-smoke">
              ¿Ya viviste la experiencia Toro Roso Studio? Nos encantaría conocer tu opinión y, con tu autorización,
              compartirla aquí.
            </p>
            <ButtonLink to={review.href} variant="outline" className="mt-9">
              Cuéntanos tu experiencia
            </ButtonLink>
          </FadeUp>
        ) : (
          <FadeUp className="mx-auto mt-14 max-w-3xl text-center">
            <AnimatePresence mode="wait">
              <motion.figure
                key={index}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.6, ease: EASE_LUXE }}
                className="flex flex-col items-center"
              >
                <Stars rating={TESTIMONIALS[index].rating} />
                <blockquote className="mt-8 font-display text-2xl leading-relaxed tracking-[0.02em] text-pearl md:text-3xl">
                  “{TESTIMONIALS[index].quote}”
                </blockquote>
                <figcaption className="mt-8">
                  <span className="text-metal block font-script text-3xl">{TESTIMONIALS[index].name}</span>
                  <span className="mt-1 block text-[0.6875rem] tracking-[0.28em] text-smoke uppercase">
                    {TESTIMONIALS[index].service}
                    {TESTIMONIALS[index].date ? ` · ${TESTIMONIALS[index].date}` : ''}
                  </span>
                </figcaption>
              </motion.figure>
            </AnimatePresence>
            {TESTIMONIALS.length > 1 && (
              <div className="mt-10 flex justify-center gap-3">
                <button
                  type="button"
                  aria-label="Reseña anterior"
                  onClick={() => setIndex((i) => (i - 1 + TESTIMONIALS.length) % TESTIMONIALS.length)}
                  className="grid size-12 place-items-center rounded-full border border-rose/35 hover:border-rose"
                >
                  <ChevronLeft className="size-5" />
                </button>
                <button
                  type="button"
                  aria-label="Reseña siguiente"
                  onClick={() => setIndex((i) => (i + 1) % TESTIMONIALS.length)}
                  className="grid size-12 place-items-center rounded-full border border-rose/35 hover:border-rose"
                >
                  <ChevronRight className="size-5" />
                </button>
              </div>
            )}
          </FadeUp>
        )}
      </div>
    </section>
  )
}
