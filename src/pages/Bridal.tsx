import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react'
import { useRef } from 'react'
import { GlitterDust } from '../components/fx/GlitterDust'
import { Magnetic } from '../components/fx/Magnetic'
import { FadeUp, ImageReveal, RevealLines } from '../components/fx/Reveal'
import { useScrollTo } from '../components/providers/SmoothScroll'
import { CtaSatin } from '../components/sections/CtaSatin'
import { PortfolioGallery } from '../components/sections/PortfolioGallery'
import { Button, ButtonLink } from '../components/ui/Button'
import { ArrowRight } from '../components/ui/Icons'
import { SectionHeading } from '../components/ui/SectionHeading'
import { SmartImage } from '../components/ui/SmartImage'
import { Sparkle } from '../components/ui/Sparkle'
import { PHOTOS } from '../config/media'
import { SITE } from '../config/site'
import { useSeo } from '../hooks/useSeo'

const MOMENTS = [
  {
    label: 'Antes de la boda',
    title: 'Tu prueba de maquillaje',
    text: 'Probamos tu look con calma, pensando en tu vestido, tu peinado y las referencias que te inspiran, para que el día de tu boda no haya sorpresas.',
    photo: PHOTOS.brideBouquet,
  },
  {
    label: 'El gran día',
    title: 'Vamos hasta ti',
    text: `Servicio a domicilio en ${SITE.location.city}: llegamos al lugar donde te prepares para que vivas cada momento previo a la ceremonia con calma.`,
    photo: PHOTOS.bridePrep,
  },
  {
    label: 'Tu cortejo',
    title: 'Para quienes te acompañan',
    text: 'Agenda en la misma cita a tu mamá, damas o familia: eliges el procedimiento de cada persona y la agenda calcula el tiempo total.',
    photo: PHOTOS.brideRing,
  },
]

const CHECKLIST = [
  'Fecha y hora de la ceremonia.',
  'Municipio y barrio donde te prepararás.',
  'Cuántas personas se maquillarán y el procedimiento de cada una.',
  'Fotos de tu vestido y del look que te inspira (o de tu prueba de maquillaje, si ya la hiciste).',
  'Alergias o sensibilidades en la piel, si las tienes.',
]

export default function Bridal() {
  useSeo({ path: '/novias' })
  const heroRef = useRef<HTMLElement>(null)
  const reduce = useReducedMotion()
  const scrollTo = useScrollTo()
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] })
  const imageY = useTransform(scrollYProgress, [0, 1], ['0%', reduce ? '0%' : '22%'])
  const imageScale = useTransform(scrollYProgress, [0, 1], [reduce ? 1 : 1.08, 1])
  const textY = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : -80])

  return (
    <>
      <section ref={heroRef} className="relative isolate flex min-h-svh items-end overflow-hidden pt-32 pb-20 md:items-center md:pb-0">
        <motion.div className="absolute inset-0 -z-20" style={{ y: imageY, scale: imageScale }}>
          <SmartImage photo={PHOTOS.brideVeil} priority sizes="100vw" baseWidth={1600} className="grayscale-[30%]" />
        </motion.div>
        <div aria-hidden className="absolute inset-0 -z-10 bg-linear-to-r from-noir via-noir/70 to-noir/20" />
        <div aria-hidden className="absolute inset-0 -z-10 bg-linear-to-t from-noir via-transparent to-noir/40" />
        <GlitterDust className="absolute inset-0 -z-10 h-full w-full" density={0.6} />

        <motion.div style={{ y: textY }} className="container-luxe">
          <FadeUp>
            <p className="eyebrow flex items-center gap-3 text-rose">
              <Sparkle className="size-2.5" /> Experiencia novias
            </p>
          </FadeUp>
          <h1 className="mt-4">
            <RevealLines
              lines={['Novias']}
              lineClassName="text-metal font-script text-[clamp(5rem,17vw,13rem)] leading-[1.1] px-[0.05em]"
            />
            <RevealLines
              lines={['Tu día. Tu esencia.', 'Tu historia.']}
              delay={0.2}
              className="-mt-[0.2em]"
              lineClassName="font-display text-[clamp(1.7rem,4.4vw,3.6rem)] leading-[1.05] tracking-[0.05em] text-pearl uppercase"
            />
          </h1>
          <FadeUp delay={0.45}>
            <p className="mt-7 max-w-lg text-lg leading-relaxed text-pearl/80">
              Un maquillaje pensado para verse natural en persona y hermoso en cada fotografía, creado para ti y para el
              estilo de tu boda.
            </p>
          </FadeUp>
          <FadeUp delay={0.6} className="mt-10 flex flex-col gap-4 sm:flex-row">
            <Magnetic>
              <ButtonLink to="/agenda?servicio=novias" size="lg" className="w-full sm:w-auto">
                Consultar disponibilidad <ArrowRight className="size-4" />
              </ButtonLink>
            </Magnetic>
            <Button variant="outline" size="lg" onClick={() => scrollTo('#galeria-novias')}>
              Ver galería
            </Button>
          </FadeUp>
        </motion.div>
      </section>

      <section aria-label="Tu día paso a paso" className="relative py-20 md:py-36">
        <div className="container-luxe">
          <SectionHeading eyebrow="Tu día, paso a paso" title="Cada detalle" script="pensado para ti" />
          <div className="mt-16 grid gap-10 md:grid-cols-3 md:gap-6 lg:gap-10">
            {MOMENTS.map((moment, i) => (
              <FadeUp key={moment.title} delay={i * 0.12}>
                <article className="group">
                  <ImageReveal delay={i * 0.1} className="aspect-4/5 rounded-t-full border border-rose/20">
                    <SmartImage
                      photo={moment.photo}
                      sizes="(min-width: 768px) 30vw, 92vw"
                      baseWidth={720}
                      showDemoBadge
                      className="transition-transform duration-1500 ease-luxe group-hover:scale-105"
                    />
                  </ImageReveal>
                  <p className="mt-7 text-[0.6875rem] tracking-[0.3em] text-rose uppercase">
                    {String(i + 1).padStart(2, '0')} · {moment.label}
                  </p>
                  <h3 className="mt-3 font-display text-2xl tracking-[0.06em] text-pearl uppercase">{moment.title}</h3>
                  <p className="mt-3 leading-relaxed text-smoke">{moment.text}</p>
                </article>
              </FadeUp>
            ))}
          </div>
          <FadeUp className="mt-16 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <ButtonLink to="/agenda?servicio=prueba">
              Agendar mi prueba <ArrowRight className="size-4" />
            </ButtonLink>
            <ButtonLink to="/agenda?servicio=novias" variant="outline">
              Agendar el día de la boda
            </ButtonLink>
          </FadeUp>
        </div>
      </section>

      <section id="galeria-novias" aria-label="Galería de novias" className="scroll-mt-24 border-t border-line py-20 md:py-32">
        <div className="container-luxe">
          <SectionHeading eyebrow="Galería" title="Novias" script="que inspiran" />
          <div className="mt-12">
            <PortfolioGallery lockedCategory="novias" />
          </div>
        </div>
      </section>

      <section aria-label="Antes de agendar" className="relative overflow-hidden border-t border-line bg-ink py-20 md:py-32">
        <div className="container-luxe grid items-center gap-14 lg:grid-cols-2">
          <SectionHeading
            align="left"
            eyebrow="Antes de agendar"
            title="Ten a mano"
            script="estos detalles"
            intro="Con esta información agendamos tu cita más rápido y preparamos un look a tu medida."
          />
          <ol className="flex flex-col">
            {CHECKLIST.map((item, i) => (
              <FadeUp key={item} delay={i * 0.08}>
                <li className="flex items-start gap-5 border-b border-line py-5">
                  <span className="font-display text-sm text-rose tabular-nums">{String(i + 1).padStart(2, '0')}</span>
                  <span className="text-pearl/85">{item}</span>
                </li>
              </FadeUp>
            ))}
          </ol>
        </div>
      </section>

      <CtaSatin
        title={['Tu gran día', 'empieza aquí']}
        text="Elige la fecha de tu boda y un horario disponible. Puedes incluir en la misma cita a quienes te acompañan."
        to="/agenda?servicio=novias"
      />
    </>
  )
}
