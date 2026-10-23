import { motion, useReducedMotion, useScroll, useSpring, useTransform } from 'motion/react'
import { useLayoutEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { PRICE_FALLBACK, SERVICE_LIST, type ServiceContent } from '../../config/services'
import { useIsDesktop } from '../../hooks/useMediaQuery'
import { cn } from '../../lib/cn'
import { FadeUp } from '../fx/Reveal'
import { ButtonLink } from '../ui/Button'
import { ArrowUpRight } from '../ui/Icons'
import { SectionHeading } from '../ui/SectionHeading'
import { ServiceIcon } from '../ui/ServiceIcon'
import { SmartImage } from '../ui/SmartImage'

function ServiceCard({ service, index, className }: { service: ServiceContent; index: number; className?: string }) {
  return (
    <article
      className={cn(
        'group relative shrink-0 overflow-hidden rounded-t-[14rem] border border-rose/20 bg-plum-900 shadow-[0_30px_80px_-40px_rgba(0,0,0,0.9)]',
        className,
      )}
    >
      <SmartImage
        photo={service.image}
        sizes="(min-width: 1024px) 400px, 82vw"
        baseWidth={720}
        className="transition-transform duration-1600 ease-luxe group-hover:scale-[1.06]"
      />
      <div aria-hidden className="absolute inset-0 bg-linear-to-t from-noir via-noir/55 to-transparent" />
      <div aria-hidden className="absolute inset-[10px] rounded-t-[14rem] border border-rose/15" />
      <div className="absolute inset-x-0 bottom-0 p-6 md:p-8">
        <div className="flex items-center justify-between">
          <ServiceIcon id={service.id} size="sm" />
          <span className="font-display text-sm text-rose/80 tabular-nums">{String(index + 1).padStart(2, '0')}</span>
        </div>
        <h3 className="mt-5 font-display text-[1.9rem] leading-none tracking-[0.08em] text-pearl uppercase">{service.name}</h3>
        <p className="text-metal -mt-0.5 font-script text-[2rem] leading-tight">{service.script}</p>
        <p className="mt-3 text-sm leading-relaxed text-pearl/75">{service.short}</p>
        <p className="mt-4 text-[0.6875rem] tracking-[0.26em] text-rose/80 uppercase">{service.price ?? PRICE_FALLBACK}</p>
        <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3">
          <ButtonLink to={`/agenda?servicio=${service.id}`} size="sm">
            Consultar disponibilidad
          </ButtonLink>
          <Link
            to={service.path}
            className="flex items-center gap-1.5 text-[0.6875rem] tracking-[0.24em] text-pearl/80 uppercase transition hover:text-rose-light"
          >
            Ver más <ArrowUpRight className="size-3.5" />
          </Link>
        </div>
      </div>
    </article>
  )
}

const HEADING = (
  <SectionHeading
    align="left"
    eyebrow="Elegancia para cada ocasión"
    title="Servicios"
    script="de Maquillaje"
    intro="Un look para cada historia. Cinco experiencias pensadas para que llegues a tu momento sintiéndote tú, con servicio a domicilio."
  />
)

/** Escritorio: scroll horizontal anclado. Móvil y movimiento reducido: carrusel táctil. */
export function ServicesShowcase() {
  const desktop = useIsDesktop()
  const reduce = useReducedMotion()
  return desktop && !reduce ? <PinnedServices /> : <SwipeServices />
}

function PinnedServices() {
  const sectionRef = useRef<HTMLElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const [distance, setDistance] = useState(0)

  useLayoutEffect(() => {
    const track = trackRef.current
    if (!track) return
    const measure = () => setDistance(Math.max(0, track.scrollWidth - window.innerWidth))
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(track)
    window.addEventListener('resize', measure)
    return () => {
      observer.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [])

  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ['start start', 'end end'] })
  const x = useTransform(scrollYProgress, [0, 1], [0, -distance])
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 30 })

  return (
    <section id="servicios" ref={sectionRef} className="relative" style={{ height: `calc(100vh + ${distance}px)` }}>
      <div className="sticky top-0 flex h-screen flex-col justify-center overflow-hidden">
        <motion.div ref={trackRef} style={{ x }} className="flex w-max items-center gap-8 pr-[8vw] pl-[clamp(1rem,4.5vw,3.5rem)]">
          <div className="w-[min(34vw,520px)] shrink-0 pr-6">{HEADING}</div>
          {SERVICE_LIST.map((service, i) => (
            <ServiceCard key={service.id} service={service} index={i} className="h-[min(74vh,660px)] w-[min(27vw,410px)]" />
          ))}
          <div className="flex w-[min(26vw,380px)] shrink-0 flex-col items-start gap-6 pl-6">
            <p className="text-metal font-script text-5xl leading-tight">¿No sabes cuál elegir?</p>
            <p className="text-smoke">
              Cuéntanos sobre tu evento y te ayudamos a encontrar el look ideal para ti.
            </p>
            <ButtonLink to="/servicios" variant="outline">
              Ver todos los servicios
            </ButtonLink>
          </div>
        </motion.div>
        <div className="container-luxe mt-10">
          <div className="h-px w-full overflow-hidden bg-rose/15">
            <motion.div className="bg-metal h-full origin-left" style={{ scaleX: progress }} />
          </div>
        </div>
      </div>
    </section>
  )
}

function SwipeServices() {
  return (
    <section id="servicios" className="relative py-20 md:py-32">
      <div className="container-luxe">{HEADING}</div>
      <FadeUp className="mt-12">
        <div
          className="no-scrollbar flex snap-x snap-mandatory gap-5 overflow-x-auto px-[clamp(1rem,4.5vw,3.5rem)] pb-4"
          data-lenis-prevent-horizontal
        >
          {SERVICE_LIST.map((service, i) => (
            <ServiceCard
              key={service.id}
              service={service}
              index={i}
              className="h-[min(78svh,600px)] w-[min(82vw,380px)] snap-center"
            />
          ))}
        </div>
        <p className="mt-4 text-center text-[0.6875rem] tracking-[0.3em] text-smoke uppercase">Desliza para ver más →</p>
      </FadeUp>
    </section>
  )
}
