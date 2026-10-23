import { useSearchParams } from 'react-router-dom'
import { isServiceId } from '../../shared/booking-rules'
import { BookingWizard } from '../components/booking/BookingWizard'
import { GlitterDust } from '../components/fx/GlitterDust'
import { FadeUp, RevealLines } from '../components/fx/Reveal'
import { SatinCanvas } from '../components/fx/SatinCanvas'
import { InstagramIcon, WhatsAppIcon } from '../components/ui/Icons'
import { Sparkle } from '../components/ui/Sparkle'
import { SITE, hasWhatsApp } from '../config/site'
import { useSeo } from '../hooks/useSeo'
import { waLink } from '../lib/whatsapp'

const STEPS = ['Elige el procedimiento de cada persona', 'Escoge fecha y horario disponible', 'Recibe tu confirmación']

export default function Booking() {
  const [params] = useSearchParams()
  const requested = params.get('servicio')
  const initialService = isServiceId(requested) ? requested : undefined
  const whatsapp = waLink('Hola, Toro Roso Studio ✨ Prefiero agendar mi cita por WhatsApp.')

  useSeo({ path: '/agenda' })

  return (
    <>
      <section className="relative isolate overflow-hidden pt-36 pb-16 md:pt-44 md:pb-20">
        <SatinCanvas className="absolute inset-0 -z-20" intensity={0.75} />
        <div aria-hidden className="absolute inset-0 -z-10 bg-linear-to-b from-noir/30 via-noir/50 to-noir" />
        <GlitterDust className="absolute inset-0 -z-10 h-full w-full" density={0.5} />
        <div className="container-luxe text-center">
          <FadeUp>
            <p className="eyebrow flex items-center justify-center gap-3 text-rose">
              <Sparkle className="size-2.5" /> Agenda en línea <Sparkle className="size-2.5" />
            </p>
          </FadeUp>
          <h1 className="mt-6 font-display text-[clamp(2.2rem,6.4vw,5.4rem)] leading-[0.98] tracking-[0.04em] text-pearl uppercase">
            <RevealLines lines={['Tu próximo momento', 'comienza aquí']} />
          </h1>
          <RevealLines
            lines={['Agenda tu cita']}
            delay={0.25}
            lineClassName="text-metal animate-shimmer font-script text-[clamp(2.6rem,6vw,4.4rem)] leading-[1.2] px-[0.2em]"
          />
          <FadeUp delay={0.35}>
            <ol className="mx-auto mt-10 flex max-w-3xl flex-col items-center justify-center gap-3 text-[0.6875rem] tracking-[0.24em] text-pearl/80 uppercase md:flex-row md:gap-8">
              {STEPS.map((step, i) => (
                <li key={step} className="flex items-center gap-3">
                  <span className="bg-metal grid size-6 place-items-center rounded-full font-display text-[0.6875rem] text-noir">
                    {i + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
          </FadeUp>
        </div>
      </section>

      <section aria-label="Formulario de agenda" className="pb-24 md:pb-32">
        <div className="container-luxe">
          <div className="rounded-[2rem] border border-line bg-linear-to-b from-ink to-noir p-5 sm:p-8 md:p-12">
            <BookingWizard initialService={initialService} />
          </div>
          <FadeUp className="mt-10 flex flex-col items-center gap-4 text-center text-sm text-smoke md:flex-row md:justify-center">
            <span>¿Prefieres escribirnos directamente?</span>
            <span className="flex gap-3">
              {hasWhatsApp() && whatsapp && (
                <a
                  href={whatsapp}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border border-rose/30 px-4 py-2 text-pearl transition hover:border-rose"
                >
                  <WhatsAppIcon className="size-4 text-rose" /> WhatsApp
                </a>
              )}
              <a
                href={SITE.contact.instagramDm}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-rose/30 px-4 py-2 text-pearl transition hover:border-rose"
              >
                <InstagramIcon className="size-4 text-rose" /> Instagram
              </a>
            </span>
          </FadeUp>
        </div>
      </section>
    </>
  )
}
