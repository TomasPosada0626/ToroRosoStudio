import { FadeUp, ImageReveal, Parallax, RevealLines } from '../components/fx/Reveal'
import { useScrollTo } from '../components/providers/SmoothScroll'
import { CtaSatin } from '../components/sections/CtaSatin'
import { PageHero } from '../components/sections/PageHero'
import { ButtonLink } from '../components/ui/Button'
import { ArrowUpRight } from '../components/ui/Icons'
import { ServiceIcon } from '../components/ui/ServiceIcon'
import { SmartImage } from '../components/ui/SmartImage'
import { OrnamentDivider, Sparkle } from '../components/ui/Sparkle'
import { PRICE_FALLBACK, SERVICE_LIST, type ServiceContent } from '../config/services'
import { useSeo } from '../hooks/useSeo'
import { cn } from '../lib/cn'
import { fitWord } from '../lib/fitWord'

export default function Services() {
  const scrollTo = useScrollTo()
  useSeo({ path: '/servicios' })

  return (
    <>
      <PageHero
        eyebrow="Elegancia para cada ocasión"
        title="Servicios"
        script="de Maquillaje"
        intro="Cinco experiencias pensadas para que llegues a tu momento sintiéndote tú. Servicio a domicilio en Envigado, Antioquia."
      >
        <FadeUp delay={0.35} className="mt-14 flex flex-wrap justify-center gap-x-8 gap-y-8 md:gap-x-12">
          {SERVICE_LIST.map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              onClick={(event) => {
                event.preventDefault()
                scrollTo(`#${s.id}`)
              }}
              className="group flex flex-col items-center gap-3"
            >
              <ServiceIcon id={s.id} size="lg" className="transition duration-500 group-hover:-translate-y-1 group-hover:border-rose" />
              <span className="text-[0.6875rem] tracking-[0.26em] text-pearl uppercase">{s.name}</span>
            </a>
          ))}
        </FadeUp>
        <FadeUp delay={0.5} className="mt-14 flex justify-center">
          <OrnamentDivider />
        </FadeUp>
      </PageHero>

      {SERVICE_LIST.map((service, i) => (
        <ServiceRow key={service.id} service={service} index={i} reverse={i % 2 === 1} />
      ))}

      <section className="border-t border-line py-20">
        <FadeUp className="container-luxe mx-auto max-w-3xl text-center">
          <p className="eyebrow flex items-center justify-center gap-3 text-rose">
            <Sparkle className="size-2.5" /> Cotizaciones
          </p>
          <p className="mt-6 font-display text-2xl leading-relaxed tracking-[0.03em] text-pearl md:text-3xl">
            Cada servicio se cotiza según el tipo de maquillaje, la fecha, la ubicación y el número de personas.
          </p>
          <p className="mt-5 text-smoke">Agenda tu cita y te compartiremos la cotización por WhatsApp.</p>
        </FadeUp>
      </section>

      <CtaSatin />
    </>
  )
}

function ServiceRow({ service, index, reverse }: { service: ServiceContent; index: number; reverse: boolean }) {
  return (
    <section id={service.id} aria-labelledby={`${service.id}-titulo`} className="scroll-mt-24 border-t border-line py-20 md:py-28">
      <div className="container-luxe grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-10">
        <div className={cn('lg:col-span-5', reverse && 'lg:order-2 lg:col-start-8')}>
          <ImageReveal className="mx-auto aspect-4/5 max-w-[500px] rounded-t-full">
            <Parallax amount={40} className="h-full">
              <SmartImage photo={service.image} sizes="(min-width: 1024px) 40vw, 92vw" showDemoBadge />
            </Parallax>
          </ImageReveal>
        </div>
        <div className={cn('@container lg:col-span-6', reverse ? 'lg:order-1 lg:col-start-1' : 'lg:col-start-7')}>
          <FadeUp className="flex items-center gap-4">
            <ServiceIcon id={service.id} />
            <span className="font-display text-sm text-rose/75 tabular-nums">{String(index + 1).padStart(2, '0')} / 05</span>
          </FadeUp>
          <h2
            id={`${service.id}-titulo`}
            className="mt-7 font-display leading-[0.95] tracking-wider text-pearl uppercase"
            style={fitWord(service.name, '4.4rem')}
          >
            <RevealLines lines={[service.name]} />
            <RevealLines
              lines={[service.script]}
              delay={0.12}
              lineClassName="text-metal font-script text-[0.7em] leading-[1.2] normal-case tracking-normal px-[0.1em]"
            />
          </h2>
          {service.description.map((paragraph) => (
            <FadeUp key={paragraph} delay={0.1}>
              <p className="mt-5 max-w-xl leading-relaxed text-pearl/80">{paragraph}</p>
            </FadeUp>
          ))}
          <FadeUp delay={0.2}>
            <p className="mt-8 text-[0.6875rem] tracking-[0.3em] text-rose uppercase">Ideal para</p>
            <ul className="mt-4 flex flex-wrap gap-2">
              {service.idealFor.map((item) => (
                <li key={item} className="rounded-full border border-rose/25 px-4 py-2 text-xs text-pearl/85">
                  {item}
                </li>
              ))}
            </ul>
            <p className="mt-8 text-[0.6875rem] tracking-[0.26em] text-smoke uppercase">{service.price ?? PRICE_FALLBACK}</p>
            <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
              <ButtonLink to={`/agenda?servicio=${service.id}`}>Consultar disponibilidad</ButtonLink>
              <ButtonLink to={service.path} variant="ghost">
                Ver experiencia completa <ArrowUpRight className="size-4" />
              </ButtonLink>
            </div>
          </FadeUp>
        </div>
      </div>
    </section>
  )
}
