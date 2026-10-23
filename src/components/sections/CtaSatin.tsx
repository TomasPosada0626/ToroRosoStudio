import { BOOKING_RULES } from '../../../shared/booking-rules'
import { GlitterDust } from '../fx/GlitterDust'
import { Magnetic } from '../fx/Magnetic'
import { FadeUp, RevealLines } from '../fx/Reveal'
import { SatinCanvas } from '../fx/SatinCanvas'
import { ButtonLink } from '../ui/Button'
import { ArrowRight } from '../ui/Icons'
import { Sparkle } from '../ui/Sparkle'

/** Cierre de impacto sobre satén: "Tu próximo momento comienza aquí". */
export function CtaSatin({
  title = ['Tu próximo momento', 'comienza aquí'],
  text = BOOKING_RULES.approval === 'manual'
    ? 'Elige el procedimiento de cada persona, la fecha y un horario disponible: tu horario queda apartado al instante.'
    : 'Elige el procedimiento de cada persona, la fecha y un horario disponible: tu cita queda reservada al instante.',
  to = '/agenda',
}: {
  title?: string[]
  text?: string
  to?: string
}) {
  return (
    <section aria-label="Agenda tu cita" className="relative isolate overflow-hidden py-28 md:py-44">
      <SatinCanvas className="absolute inset-0 -z-20" intensity={1.05} scale={2.1} />
      <div aria-hidden className="absolute inset-0 -z-10 bg-[radial-gradient(60%_70%_at_50%_50%,rgba(5,5,5,0.55),transparent)]" />
      <GlitterDust className="absolute inset-0 -z-10 h-full w-full" density={0.7} />
      <div className="container-luxe flex flex-col items-center text-center">
        <FadeUp>
          <p className="eyebrow flex items-center gap-3 text-rose-light">
            <Sparkle className="size-2.5" /> Agenda en línea <Sparkle className="size-2.5" />
          </p>
        </FadeUp>
        <h2 className="mt-6 font-display text-[clamp(2.1rem,6vw,5.2rem)] leading-[0.98] tracking-[0.04em] text-pearl uppercase">
          <RevealLines lines={title} />
        </h2>
        <RevealLines
          lines={['Agenda tu cita']}
          delay={0.25}
          className="mt-1"
          lineClassName="text-metal animate-shimmer font-script text-[clamp(2.6rem,6vw,4.6rem)] leading-[1.2] px-[0.2em]"
        />
        <FadeUp delay={0.3}>
          <p className="mx-auto mt-6 max-w-lg text-pearl/80">{text}</p>
        </FadeUp>
        <FadeUp delay={0.45} className="mt-10">
          <Magnetic>
            <ButtonLink to={to} size="lg">
              Agenda tu cita <ArrowRight className="size-4" />
            </ButtonLink>
          </Magnetic>
        </FadeUp>
      </div>
    </section>
  )
}
