import { Link, Navigate, useParams } from 'react-router-dom'
import { GlitterDust } from '../components/fx/GlitterDust'
import { Magnetic } from '../components/fx/Magnetic'
import { FadeUp, ImageReveal, Parallax, RevealLines } from '../components/fx/Reveal'
import { SatinCanvas } from '../components/fx/SatinCanvas'
import { CtaSatin } from '../components/sections/CtaSatin'
import { PortfolioGallery } from '../components/sections/PortfolioGallery'
import { Process } from '../components/sections/Process'
import { ButtonLink } from '../components/ui/Button'
import { ArrowRight, ArrowUpRight } from '../components/ui/Icons'
import { SectionHeading } from '../components/ui/SectionHeading'
import { ServiceIcon } from '../components/ui/ServiceIcon'
import { SmartImage } from '../components/ui/SmartImage'
import { Sparkle } from '../components/ui/Sparkle'
import { PRICE_FALLBACK, SERVICE_LIST, findServiceBySlug } from '../config/services'
import { useSeo } from '../hooks/useSeo'
import { fitWord } from '../lib/fitWord'
import NotFound from './NotFound'

export default function ServiceDetail() {
  const { slug } = useParams()
  const service = findServiceBySlug(slug)
  useSeo(
    service
      ? { path: service.path }
      : { path: '/servicios', title: 'Página no encontrada', description: 'La página que buscas no está disponible.', noindex: true },
  )

  if (slug === 'novias') return <Navigate to="/novias" replace />
  if (!service) return <NotFound />

  const others = SERVICE_LIST.filter((s) => s.id !== service.id)

  return (
    <>
      <section className="relative isolate overflow-hidden pt-32 pb-20 md:pt-40 md:pb-28">
        <SatinCanvas className="absolute inset-0 -z-20" intensity={0.7} />
        <div aria-hidden className="absolute inset-0 -z-10 bg-linear-to-b from-noir/30 via-noir/50 to-noir" />
        <GlitterDust className="absolute inset-0 -z-10 h-full w-full" density={0.5} />
        <div className="container-luxe grid grid-cols-1 items-center gap-14 lg:grid-cols-12">
          <div className="@container lg:col-span-7">
            <FadeUp>
              <Link to="/servicios" className="eyebrow flex items-center gap-3 text-rose hover:text-rose-light">
                <Sparkle className="size-2.5" /> Servicios de maquillaje
              </Link>
            </FadeUp>
            <FadeUp delay={0.1} className="mt-8">
              <ServiceIcon id={service.id} size="lg" />
            </FadeUp>
            <h1 className="mt-8 font-display leading-[0.92] tracking-wider text-pearl uppercase" style={fitWord(service.name, '6.6rem')}>
              <RevealLines lines={[service.name]} delay={0.1} />
              <RevealLines
                lines={[service.script]}
                delay={0.25}
                lineClassName="text-metal font-script text-[0.62em] leading-[1.2] normal-case tracking-normal px-[0.1em]"
              />
            </h1>
            <FadeUp delay={0.4}>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-pearl/80">{service.short}</p>
              <p className="mt-6 text-[0.6875rem] tracking-[0.28em] text-rose/90 uppercase">{service.price ?? PRICE_FALLBACK}</p>
            </FadeUp>
            <FadeUp delay={0.55} className="mt-10 flex flex-col gap-4 sm:flex-row">
              <Magnetic>
                <ButtonLink to={`/agenda?servicio=${service.id}`} size="lg" className="w-full sm:w-auto">
                  Consultar disponibilidad <ArrowRight className="size-4" />
                </ButtonLink>
              </Magnetic>
              <ButtonLink to="/servicios" variant="outline" size="lg">
                Todos los servicios
              </ButtonLink>
            </FadeUp>
          </div>
          <div className="lg:col-span-5">
            <ImageReveal delay={0.2} className="mx-auto aspect-3/4 max-w-[440px] rounded-t-full border border-rose/25">
              <Parallax amount={40} className="h-full">
                <SmartImage photo={service.image} priority sizes="(min-width: 1024px) 440px, 90vw" showDemoBadge />
              </Parallax>
            </ImageReveal>
          </div>
        </div>
      </section>

      <section aria-label="Sobre el servicio" className="py-20 md:py-32">
        <div className="container-luxe grid grid-cols-1 gap-14 lg:grid-cols-12">
          <div className="lg:col-span-6">
            <SectionHeading align="left" eyebrow="La experiencia" title="Pensado" script="para tu momento" />
            {service.description.map((paragraph) => (
              <FadeUp key={paragraph}>
                <p className="mt-6 max-w-xl text-lg leading-relaxed text-pearl/80">{paragraph}</p>
              </FadeUp>
            ))}
          </div>
          <div className="lg:col-span-5 lg:col-start-8">
            <FadeUp className="rounded-[1.75rem] border border-line bg-linear-to-b from-plum-900/70 to-noir p-8">
              <p className="eyebrow text-rose">Ideal para</p>
              <ul className="mt-6 flex flex-col">
                {service.idealFor.map((item) => (
                  <li key={item} className="flex items-center gap-4 border-b border-line py-4 text-pearl/85 last:border-0">
                    <Sparkle className="size-3 shrink-0 text-rose" /> {item}
                  </li>
                ))}
              </ul>
            </FadeUp>
          </div>
        </div>
      </section>

      <section aria-label="Galería" className="border-t border-line py-20 md:py-32">
        <div className="container-luxe">
          <SectionHeading eyebrow="Galería" title={service.name} script="inspiración" />
          <div className="mt-12">
            <PortfolioGallery lockedCategory={service.id === 'prueba' ? 'novias' : service.id} />
          </div>
        </div>
      </section>

      <Process />

      <section aria-label="Otros servicios" className="py-20 md:py-32">
        <div className="container-luxe">
          <SectionHeading eyebrow="Explora" title="Otros" script="servicios" />
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {others.map((other, i) => (
              <FadeUp key={other.id} delay={i * 0.08}>
                <Link
                  to={other.path}
                  className="group flex items-center gap-5 rounded-[1.5rem] border border-line p-5 transition hover:border-rose/50 hover:bg-rose/5"
                >
                  <ServiceIcon id={other.id} size="sm" />
                  <span className="flex-1">
                    <span className="block font-display tracking-[0.08em] text-pearl uppercase">{other.name}</span>
                    <span className="text-metal block font-script text-xl leading-none">{other.script}</span>
                  </span>
                  <ArrowUpRight className="size-4 text-rose transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </Link>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      <CtaSatin to={`/agenda?servicio=${service.id}`} />
    </>
  )
}
