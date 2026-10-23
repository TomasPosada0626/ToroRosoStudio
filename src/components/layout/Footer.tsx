import { Link } from 'react-router-dom'
import { SERVICE_LIST } from '../../config/services'
import { SITE, hasEmail, hasWhatsApp } from '../../config/site'
import { waLink } from '../../lib/whatsapp'
import { FadeUp } from '../fx/Reveal'
import { Magnetic } from '../fx/Magnetic'
import { useScrollTo } from '../providers/SmoothScroll'
import { ArrowUpRight, InstagramIcon, Mail, MapPin, WhatsAppIcon } from '../ui/Icons'
import { LogoShine } from '../ui/Logo'
import { OrnamentDivider } from '../ui/Sparkle'

const EXPLORE = [
  { label: 'Inicio', to: '/' },
  { label: 'Servicios', to: '/servicios' },
  { label: 'Novias', to: '/novias' },
  { label: 'Portafolio', to: '/portafolio' },
  { label: 'El Estudio', to: '/estudio' },
  { label: 'Agenda tu cita', to: '/agenda' },
]

const heading = 'eyebrow mb-6 text-rose'
const item = 'text-sm text-smoke transition-colors duration-300 hover:text-pearl'

export function Footer() {
  const scrollTo = useScrollTo()
  const whatsapp = waLink('Hola, Toro Roso Studio ✨')
  return (
    <footer id="pie" className="relative overflow-hidden border-t border-line bg-noir pt-24 md:pt-32">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-96 bg-[radial-gradient(55%_100%_at_50%_0%,rgba(112,70,95,0.38),transparent)]"
      />
      <div className="container-luxe relative">
        <FadeUp className="flex flex-col items-center text-center">
          <p className="text-metal font-script text-4xl md:text-6xl">¿Lista para tu momento?</p>
          <Link
            to="/agenda"
            data-cursor="Agendar"
            className="group mt-3 font-display text-[clamp(2.4rem,9.5vw,8rem)] leading-none tracking-[0.04em] uppercase"
          >
            <span className="text-outline transition-colors duration-700 group-hover:text-rose/90">Agenda</span>{' '}
            <span className="text-pearl transition-colors duration-700 group-hover:text-rose-light">tu cita</span>
          </Link>
          <OrnamentDivider className="mt-10" />
        </FadeUp>

        <div className="mt-20 grid gap-12 md:grid-cols-12 md:gap-8">
          <div className="md:col-span-4">
            <LogoShine className="w-52" sizes="208px" />
            <p className="mt-6 max-w-xs text-sm leading-relaxed text-smoke">
              Maquillaje profesional para novias, quinceañeras, graduaciones, eventos sociales y maquillaje artístico.
            </p>
            <a
              href={SITE.contact.instagram.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex items-center gap-3 rounded-full border border-rose/30 px-5 py-2.5 text-xs tracking-[0.2em] text-pearl uppercase transition hover:border-rose hover:text-rose-light"
            >
              <InstagramIcon className="size-4" /> {SITE.contact.instagram.handle}
            </a>
          </div>

          <nav aria-label="Explorar" className="md:col-span-2">
            <p className={heading}>Explora</p>
            <ul className="flex flex-col gap-3">
              {EXPLORE.map((link) => (
                <li key={link.to}>
                  <Link to={link.to} className={item}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Servicios" className="md:col-span-3">
            <p className={heading}>Servicios</p>
            <ul className="flex flex-col gap-3">
              {SERVICE_LIST.map((s) => (
                <li key={s.id}>
                  <Link to={s.path} className={item}>
                    Maquillaje · {s.name}
                  </Link>
                </li>
              ))}
              <li>
                <Link to="/preguntas-frecuentes" className={item}>
                  Preguntas frecuentes
                </Link>
              </li>
            </ul>
          </nav>

          <div className="md:col-span-3">
            <p className={heading}>Contacto</p>
            <ul className="flex flex-col gap-4 text-sm text-smoke">
              <li className="flex items-start gap-3">
                <MapPin className="mt-0.5 size-4 shrink-0 text-rose" />
                <span>
                  {SITE.location.city}, {SITE.location.region}
                  <span className="block text-xs text-smoke/80">{SITE.location.serviceMode}</span>
                </span>
              </li>
              {hasWhatsApp() && whatsapp && (
                <li>
                  <a href={whatsapp} target="_blank" rel="noopener noreferrer" className={`flex items-center gap-3 ${item}`}>
                    <WhatsAppIcon className="size-4 text-rose" /> WhatsApp
                  </a>
                </li>
              )}
              {hasEmail() && (
                <li>
                  <a href={`mailto:${SITE.contact.email}`} className={`flex items-center gap-3 ${item}`}>
                    <Mail className="size-4 text-rose" /> {SITE.contact.email}
                  </a>
                </li>
              )}
              <li>
                <a href={SITE.artist.instagram.url} target="_blank" rel="noopener noreferrer" className={`flex items-center gap-3 ${item}`}>
                  <InstagramIcon className="size-4 text-rose" /> {SITE.artist.instagram.handle}
                  <span className="text-xs text-smoke/70">· la artista</span>
                </a>
              </li>
              {SITE.contact.hours && <li className="text-xs">{SITE.contact.hours}</li>}
            </ul>
          </div>
        </div>

        <div className="mt-16 flex flex-col-reverse items-center justify-between gap-6 border-t border-line py-8 text-xs text-smoke md:flex-row">
          <p>
            © {new Date().getFullYear()} {SITE.name} · {SITE.location.city}, {SITE.location.region}
          </p>
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2">
            <Link to="/privacidad" className="hover:text-pearl">
              Privacidad y tratamiento de datos
            </Link>
            <Link to="/contacto" className="hover:text-pearl">
              Contacto
            </Link>
          </div>
          <Magnetic>
            <button
              type="button"
              onClick={() => scrollTo(0, { offset: 0 })}
              className="flex items-center gap-2 tracking-[0.2em] uppercase hover:text-pearl"
            >
              Volver arriba <ArrowUpRight className="size-3.5 -rotate-45" />
            </button>
          </Magnetic>
        </div>
      </div>

      <div aria-hidden className="pointer-events-none select-none overflow-hidden">
        <p className="text-outline translate-y-[22%] text-center font-display text-[21vw] leading-[0.8] whitespace-nowrap">
          TORO ROSO
        </p>
      </div>
    </footer>
  )
}
