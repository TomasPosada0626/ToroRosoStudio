import { PHOTOS } from '../../config/media'
import { FadeUp, ImageReveal, Parallax } from '../fx/Reveal'
import { ButtonLink } from '../ui/Button'
import { ArrowRight } from '../ui/Icons'
import { SectionHeading } from '../ui/SectionHeading'
import { SmartImage } from '../ui/SmartImage'
import { Sparkle } from '../ui/Sparkle'

const POINTS = [
  'Diseñamos tu look según tu vestido, tu peinado y el estilo de tu boda.',
  'Vamos hasta donde te estés preparando: servicio a domicilio.',
  'Agenda también a tu mamá, damas o familia en la misma cita.',
]

export function BridalFeature() {
  return (
    <section aria-label="Experiencia novias" className="relative py-20 md:py-36">
      <div className="container-luxe grid grid-cols-1 items-center gap-14 lg:grid-cols-12 lg:gap-10">
        <div className="relative lg:col-span-6">
          <ImageReveal className="relative mx-auto aspect-4/5 w-full max-w-[560px] rounded-t-full">
            <Parallax amount={50} className="h-full">
              <SmartImage photo={PHOTOS.brideVeil} sizes="(min-width: 1024px) 560px, 92vw" showDemoBadge />
            </Parallax>
          </ImageReveal>
          <div aria-hidden className="absolute -top-4 left-1/2 hidden h-[calc(100%+2rem)] w-[calc(100%+2rem)] max-w-[592px] -translate-x-1/2 rounded-t-full border border-rose/20 md:block" />
          <FadeUp delay={0.4} className="absolute -right-2 bottom-10 hidden rounded-2xl border border-line glass px-6 py-5 md:block lg:-right-10">
            <p className="text-metal font-script text-3xl leading-none">Sí, acepto</p>
            <p className="mt-2 text-[0.6875rem] tracking-[0.26em] text-smoke uppercase">Experiencia novias</p>
          </FadeUp>
        </div>

        <div className="lg:col-span-5 lg:col-start-8">
          <SectionHeading
            align="left"
            eyebrow="Para el día más esperado"
            title="Novias"
            script="Tu gran día"
            intro="Una experiencia personalizada para que te sientas tú misma, desde la preparación hasta el último momento de la celebración."
          />
          <ul className="mt-10 flex flex-col gap-5">
            {POINTS.map((point, i) => (
              <FadeUp key={point} delay={0.1 * i}>
                <li className="flex items-start gap-4 border-b border-line pb-5 text-pearl/85">
                  <Sparkle className="mt-1.5 size-3 shrink-0 text-rose" />
                  {point}
                </li>
              </FadeUp>
            ))}
          </ul>
          <FadeUp delay={0.3} className="mt-10 flex flex-col gap-4 sm:flex-row">
            <ButtonLink to="/novias">
              Descubre la experiencia <ArrowRight className="size-4" />
            </ButtonLink>
            <ButtonLink to="/agenda?servicio=novias" variant="outline">
              Consultar disponibilidad
            </ButtonLink>
          </FadeUp>
        </div>
      </div>
    </section>
  )
}
