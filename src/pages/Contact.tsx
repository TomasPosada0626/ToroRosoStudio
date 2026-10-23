import type { ComponentType, ReactNode, SVGProps } from 'react'
import { FadeUp } from '../components/fx/Reveal'
import { CtaSatin } from '../components/sections/CtaSatin'
import { FaqSection } from '../components/sections/FaqSection'
import { PageHero } from '../components/sections/PageHero'
import { ArrowUpRight, Calendar, Clock, InstagramIcon, Mail, MapPin, WhatsAppIcon } from '../components/ui/Icons'
import { SITE, hasEmail, hasWhatsApp } from '../config/site'
import { useSeo } from '../hooks/useSeo'
import { waLink } from '../lib/whatsapp'

function Channel({
  icon: Icon,
  label,
  value,
  href,
  note,
}: {
  icon: ComponentType<SVGProps<SVGSVGElement>>
  label: string
  value: ReactNode
  href?: string
  note?: string
}) {
  const content = (
    <>
      <span className="grid size-12 shrink-0 place-items-center rounded-full border border-rose/35 text-rose transition duration-500 group-hover:border-rose group-hover:bg-rose/10 sm:size-14">
        <Icon className="size-6" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[0.6875rem] tracking-[0.3em] text-rose uppercase">{label}</span>
        <span className="mt-2 block font-display text-lg tracking-[0.04em] break-words text-pearl sm:text-xl md:text-2xl">
          {value}
        </span>
        {note && <span className="mt-1 block text-sm text-smoke">{note}</span>}
      </span>
      {href && <ArrowUpRight className="size-5 shrink-0 text-rose transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />}
    </>
  )
  const className =
    'group flex h-full items-center gap-4 rounded-[1.75rem] border border-line bg-linear-to-b from-plum-900/60 to-noir p-5 transition duration-500 hover:border-rose/45 sm:gap-6 sm:p-7'
  return href ? (
    <a href={href} target={href.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer" className={className}>
      {content}
    </a>
  ) : (
    <div className={className}>{content}</div>
  )
}

export default function Contact() {
  useSeo({ path: '/contacto' })
  const whatsapp = waLink('Hola, Toro Roso Studio ✨ Quiero información para una cita.')

  return (
    <>
      <PageHero
        eyebrow="Contacto"
        title="Hablemos"
        script="de tu momento"
        intro="Escríbenos por nuestros canales oficiales o agenda directamente en línea."
      />
      <section aria-label="Canales de contacto" className="pb-24 md:pb-32">
        <div className="container-luxe grid grid-cols-1 gap-5 md:grid-cols-2">
          <FadeUp>
            <Channel icon={Calendar} label="Agenda en línea" value="Agenda tu cita" href="/agenda" note="Elige fecha y horario disponible." />
          </FadeUp>
          {hasWhatsApp() && whatsapp && (
            <FadeUp delay={0.05}>
              <Channel icon={WhatsAppIcon} label="WhatsApp" value="Escríbenos" href={whatsapp} note="Respuesta directa del estudio." />
            </FadeUp>
          )}
          <FadeUp delay={0.1}>
            <Channel
              icon={InstagramIcon}
              label="Instagram"
              value={SITE.contact.instagram.handle}
              href={SITE.contact.instagram.url}
              note="Trabajos, novedades y mensajes directos."
            />
          </FadeUp>
          <FadeUp delay={0.15}>
            <Channel
              icon={InstagramIcon}
              label="La artista"
              value={SITE.artist.instagram.handle}
              href={SITE.artist.instagram.url}
              note="El día a día detrás de cada look."
            />
          </FadeUp>
          {hasEmail() && (
            <FadeUp delay={0.2}>
              <Channel icon={Mail} label="Correo" value={SITE.contact.email} href={`mailto:${SITE.contact.email}`} />
            </FadeUp>
          )}
          <FadeUp delay={0.25}>
            <Channel
              icon={MapPin}
              label="Ubicación"
              value={`${SITE.location.city}, ${SITE.location.region}`}
              note={`${SITE.location.serviceMode}. Si tu evento es en otro municipio, cuéntanos al agendar.`}
            />
          </FadeUp>
          {SITE.contact.hours && (
            <FadeUp delay={0.3}>
              <Channel icon={Clock} label="Horario de atención" value={SITE.contact.hours} />
            </FadeUp>
          )}
        </div>
      </section>
      <FaqSection limit={4} />
      <CtaSatin />
    </>
  )
}
