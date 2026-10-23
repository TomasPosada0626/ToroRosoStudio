import { motion, useScroll, useSpring } from 'motion/react'
import { useRef } from 'react'
import { BOOKING_RULES } from '../../../shared/booking-rules'
import { SITE } from '../../config/site'
import { FadeUp } from '../fx/Reveal'
import { Calendar, Check, MapPin, Users } from '../ui/Icons'
import { SectionHeading } from '../ui/SectionHeading'

const STEPS = [
  {
    icon: Users,
    title: 'Elige tu servicio',
    text: 'Indica cuántas personas se maquillarán y el procedimiento de cada una.',
  },
  {
    icon: Calendar,
    title: 'Escoge fecha y hora',
    text: 'El calendario te muestra en tiempo real los horarios disponibles.',
  },
  {
    icon: Check,
    title: 'Recibe tu confirmación',
    text:
      BOOKING_RULES.approval === 'manual'
        ? 'Tu horario queda apartado al instante y Manuela te confirma la cita.'
        : 'Tu horario queda reservado y recibes tu código de cita.',
  },
  {
    icon: MapPin,
    title: 'Llegamos a ti',
    text: `Servicio a domicilio en ${SITE.location.city}, para que vivas tu momento sin prisas.`,
  },
]

export function Process() {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 80%', 'end 60%'] })
  const line = useSpring(scrollYProgress, { stiffness: 90, damping: 25 })

  return (
    <section aria-label="Cómo agendar" className="relative overflow-hidden border-y border-line bg-ink py-20 md:py-36">
      <div aria-hidden className="absolute inset-0 bg-[radial-gradient(50%_60%_at_50%_0%,rgba(112,70,95,0.22),transparent)]" />
      <div className="container-luxe relative">
        <SectionHeading eyebrow="Así de fácil" title="Agenda" script="en cuatro pasos" />
        <div ref={ref} className="relative mt-20">
          <div aria-hidden className="absolute top-8 right-[12%] left-[12%] hidden h-px bg-rose/15 lg:block">
            <motion.div className="bg-metal h-full origin-left" style={{ scaleX: line }} />
          </div>
          <ol className="grid gap-12 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
            {STEPS.map((step, i) => (
              <FadeUp key={step.title} delay={i * 0.12}>
                <li className="relative flex flex-col items-center text-center">
                  <span className="relative grid size-16 place-items-center rounded-full border border-rose/40 bg-noir text-rose shadow-[0_0_40px_-10px_rgba(183,131,157,0.5)]">
                    <step.icon className="size-6" />
                    <span className="absolute -top-2 -right-2 grid size-7 place-items-center rounded-full bg-metal font-display text-[0.6875rem] text-noir">
                      {i + 1}
                    </span>
                  </span>
                  <h3 className="mt-7 font-display text-lg tracking-[0.1em] text-pearl uppercase">{step.title}</h3>
                  <p className="mt-3 max-w-[16rem] text-sm leading-relaxed text-smoke">{step.text}</p>
                </li>
              </FadeUp>
            ))}
          </ol>
        </div>
      </div>
    </section>
  )
}
