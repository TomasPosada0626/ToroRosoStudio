import { useLocation } from 'react-router-dom'
import { GlitterDust } from '../components/fx/GlitterDust'
import { FadeUp } from '../components/fx/Reveal'
import { SatinCanvas } from '../components/fx/SatinCanvas'
import { ButtonLink } from '../components/ui/Button'
import { useSeo } from '../hooks/useSeo'

export default function NotFound() {
  const { pathname } = useLocation()
  useSeo({
    title: 'Página no encontrada',
    description: 'La página que buscas no está disponible.',
    path: pathname,
    noindex: true,
  })
  return (
    <section className="relative isolate grid min-h-svh place-items-center overflow-hidden px-6 pt-24 pb-16 text-center">
      <SatinCanvas className="absolute inset-0 -z-20" intensity={0.95} />
      <GlitterDust className="absolute inset-0 -z-10 h-full w-full" density={0.7} />
      <div>
        <FadeUp>
          <p className="text-outline font-display text-[clamp(7rem,30vw,19rem)] leading-none tracking-[0.06em]" aria-hidden>
            404
          </p>
        </FadeUp>
        <FadeUp delay={0.15}>
          <h1 className="text-metal -mt-[0.35em] font-script text-[clamp(2.4rem,6vw,4.4rem)] leading-tight">
            Este look no existe… todavía
          </h1>
        </FadeUp>
        <FadeUp delay={0.3}>
          <p className="mx-auto mt-6 max-w-md text-pearl/75">
            La página que buscas no está disponible. Vuelve al inicio o agenda tu cita para tu próximo momento.
          </p>
        </FadeUp>
        <FadeUp delay={0.45} className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
          <ButtonLink to="/">Volver al inicio</ButtonLink>
          <ButtonLink to="/agenda" variant="outline">
            Agenda tu cita
          </ButtonLink>
        </FadeUp>
      </div>
    </section>
  )
}
