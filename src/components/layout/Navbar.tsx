import { AnimatePresence, motion, useMotionValueEvent, useScroll } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import type { ServiceId } from '../../../shared/booking-rules'
import { SERVICE_LIST, SERVICES } from '../../config/services'
import { SITE } from '../../config/site'
import { cn } from '../../lib/cn'
import { contactLink } from '../../lib/whatsapp'
import { EASE_CURTAIN, EASE_LUXE } from '../fx/Reveal'
import { SatinCanvas } from '../fx/SatinCanvas'
import { useScrollLock } from '../providers/SmoothScroll'
import { ButtonLink } from '../ui/Button'
import { ArrowUpRight, ChevronDown, InstagramIcon, WhatsAppIcon } from '../ui/Icons'
import { LogoLockup } from '../ui/Logo'
import { ServiceIcon } from '../ui/ServiceIcon'
import { SmartImage } from '../ui/SmartImage'
import { Sparkle } from '../ui/Sparkle'

const LINKS = [
  { label: 'Novias', to: '/novias' },
  { label: 'Portafolio', to: '/portafolio' },
  { label: 'El Estudio', to: '/estudio' },
  { label: 'Contacto', to: '/contacto' },
]

const linkClass = (active: boolean) =>
  cn(
    'relative flex items-center gap-1.5 px-3.5 py-2 text-[0.6875rem] font-medium tracking-[0.26em] uppercase transition-colors duration-300 xl:px-4',
    'after:absolute after:inset-x-3.5 after:-bottom-0.5 after:h-px after:origin-center after:bg-rose after:transition-transform after:duration-500 after:ease-luxe xl:after:inset-x-4',
    active ? 'text-pearl after:scale-x-100' : 'text-pearl/75 hover:text-pearl after:scale-x-0 hover:after:scale-x-100',
  )

export function Navbar() {
  const { pathname } = useLocation()
  const { scrollY } = useScroll()
  const [scrolled, setScrolled] = useState(false)
  const [hidden, setHidden] = useState(false)
  const [megaOpen, setMegaOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const closeTimer = useRef<number | undefined>(undefined)
  const megaButton = useRef<HTMLButtonElement>(null)

  useMotionValueEvent(scrollY, 'change', (y) => {
    const previous = scrollY.getPrevious() ?? 0
    setScrolled(y > 30)
    setHidden(y > 520 && y > previous + 2 && !megaOpen && !mobileOpen)
    if (y < previous - 2) setHidden(false)
  })

  useEffect(() => {
    setMegaOpen(false)
    setMobileOpen(false)
  }, [pathname])

  useEffect(() => {
    if (!megaOpen && !mobileOpen) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      if (megaOpen) {
        setMegaOpen(false)
        megaButton.current?.focus()
      }
      setMobileOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [megaOpen, mobileOpen])

  // Con el menú móvil abierto, el resto de la página no recibe foco.
  useEffect(() => {
    for (const id of ['contenido', 'pie']) document.getElementById(id)?.toggleAttribute('inert', mobileOpen)
  }, [mobileOpen])

  const openMega = () => {
    window.clearTimeout(closeTimer.current)
    setMegaOpen(true)
  }
  const closeMegaSoon = () => {
    closeTimer.current = window.setTimeout(() => setMegaOpen(false), 180)
  }

  const solid = (scrolled || megaOpen) && !mobileOpen

  return (
    <>
      <motion.header
        className="fixed inset-x-0 top-0 z-50"
        animate={{ y: hidden ? '-110%' : '0%' }}
        transition={{ duration: 0.55, ease: EASE_LUXE }}
      >
        <div
          className={cn(
            'border-b transition-[background-color,border-color,backdrop-filter] duration-500',
            solid ? 'glass border-line' : 'border-transparent bg-linear-to-b from-noir/75 via-noir/25 to-transparent',
          )}
        >
          <nav aria-label="Principal" className="container-luxe flex h-18 items-center justify-between gap-6 md:h-20">
            <Link to="/" aria-label="Toro Roso Studio, ir al inicio" className="shrink-0">
              <LogoLockup />
            </Link>

            <ul className="hidden items-center lg:flex">
              <li onMouseEnter={openMega} onMouseLeave={closeMegaSoon}>
                <button
                  ref={megaButton}
                  type="button"
                  aria-expanded={megaOpen}
                  aria-controls="mega-servicios"
                  onClick={() => setMegaOpen((open) => !open)}
                  className={linkClass(pathname.startsWith('/servicios') || megaOpen)}
                >
                  Servicios
                  <ChevronDown className={cn('size-3.5 transition-transform duration-500', megaOpen && 'rotate-180')} />
                </button>
              </li>
              {LINKS.map((link) => (
                <li key={link.to}>
                  <NavLink to={link.to} className={({ isActive }) => linkClass(isActive)}>
                    {link.label}
                  </NavLink>
                </li>
              ))}
            </ul>

            <div className="flex items-center gap-3">
              <span className="hidden sm:block">
                <ButtonLink to="/agenda" size="sm">
                  Agenda tu cita
                </ButtonLink>
              </span>
              <button
                type="button"
                className="grid size-11 place-items-center rounded-full border border-rose/30 lg:hidden"
                aria-expanded={mobileOpen}
                aria-controls="menu-movil"
                aria-label={mobileOpen ? 'Cerrar menú' : 'Abrir menú'}
                onClick={() => setMobileOpen((open) => !open)}
              >
                <span className="relative block h-2.5 w-5">
                  <span
                    className={cn(
                      'absolute left-0 h-px w-full bg-pearl transition-all duration-500 ease-luxe',
                      mobileOpen ? 'top-1/2 rotate-45' : 'top-0',
                    )}
                  />
                  <span
                    className={cn(
                      'absolute left-0 h-px bg-pearl transition-all duration-500 ease-luxe',
                      mobileOpen ? 'top-1/2 w-full -rotate-45' : 'top-full w-3/5',
                    )}
                  />
                </span>
              </button>
            </div>
          </nav>
        </div>
        <MegaMenu open={megaOpen} onEnter={openMega} onLeave={closeMegaSoon} />
      </motion.header>
      <MobileMenu open={mobileOpen} onClose={() => setMobileOpen(false)} />
    </>
  )
}

function MegaMenu({ open, onEnter, onLeave }: { open: boolean; onEnter: () => void; onLeave: () => void }) {
  const [active, setActive] = useState<ServiceId>('novias')
  const service = SERVICES[active]
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          id="mega-servicios"
          onMouseEnter={onEnter}
          onMouseLeave={onLeave}
          className="absolute inset-x-0 top-full hidden lg:block"
          initial={{ clipPath: 'inset(0% 0% 100% 0%)' }}
          animate={{ clipPath: 'inset(0% 0% 0% 0%)' }}
          exit={{ clipPath: 'inset(0% 0% 100% 0%)' }}
          transition={{ duration: 0.6, ease: EASE_CURTAIN }}
        >
          {/* Fondo opaco: el clip-path de la animación impide usar desenfoque de vidrio aquí. */}
          <div className="border-b border-line bg-[linear-gradient(180deg,#0e0710,#09050a)] shadow-[0_40px_80px_-30px_rgba(0,0,0,0.9)]">
            <div className="container-luxe grid grid-cols-12 items-center gap-10 py-10">
              <div className="col-span-3">
                <p className="eyebrow flex items-center gap-2 text-rose">
                  <Sparkle className="size-2.5" /> Servicios de maquillaje
                </p>
                <p className="text-metal mt-4 font-script text-4xl leading-tight">Elegancia para cada ocasión</p>
                <p className="mt-4 text-sm leading-relaxed text-smoke">
                  Cinco experiencias pensadas para cada momento. Servicio a domicilio en {SITE.location.city}.
                </p>
                <div className="mt-6 flex flex-col gap-3 text-[0.6875rem] tracking-[0.24em] uppercase">
                  <Link to="/servicios" className="flex items-center gap-2 text-pearl hover:text-rose-light">
                    Ver todos los servicios <ArrowUpRight className="size-3.5" />
                  </Link>
                  <Link to="/preguntas-frecuentes" className="flex items-center gap-2 text-smoke hover:text-rose-light">
                    Preguntas frecuentes <ArrowUpRight className="size-3.5" />
                  </Link>
                </div>
              </div>

              <ul className="col-span-5 flex flex-col">
                {SERVICE_LIST.map((s, i) => (
                  <motion.li
                    key={s.id}
                    initial={{ opacity: 0, x: -14 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.12 + i * 0.05, duration: 0.6, ease: EASE_LUXE }}
                  >
                    <Link
                      to={s.path}
                      onMouseEnter={() => setActive(s.id)}
                      onFocus={() => setActive(s.id)}
                      className={cn(
                        'group flex items-center gap-5 rounded-2xl px-3 py-2.5 transition-colors duration-300',
                        active === s.id ? 'bg-rose/8' : 'hover:bg-rose/5',
                      )}
                    >
                      <ServiceIcon id={s.id} size="sm" />
                      <span className="flex-1">
                        <span className="block font-display text-lg tracking-[0.08em] text-pearl uppercase">{s.name}</span>
                        <span className="text-metal block font-script text-xl leading-none">{s.script}</span>
                      </span>
                      <ArrowUpRight
                        className={cn(
                          'size-4 text-rose transition-all duration-500',
                          active === s.id ? 'translate-x-0 opacity-100' : '-translate-x-2 opacity-0',
                        )}
                      />
                    </Link>
                  </motion.li>
                ))}
              </ul>

              <div className="col-span-4 flex justify-center">
                <div className="relative aspect-4/5 w-full max-w-[17rem] overflow-hidden rounded-t-full border border-rose/25">
                  <AnimatePresence mode="popLayout" initial={false}>
                    <motion.div
                      key={service.id}
                      className="absolute inset-0"
                      initial={{ opacity: 0, scale: 1.08 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.7, ease: EASE_LUXE }}
                    >
                      <SmartImage photo={service.image} sizes="272px" baseWidth={540} />
                    </motion.div>
                  </AnimatePresence>
                  <div className="absolute inset-0 bg-linear-to-t from-noir/85 via-transparent to-transparent" />
                  <p className="absolute inset-x-0 bottom-5 text-center text-xs leading-relaxed text-pearl/90 px-6">
                    {service.short}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

const MOBILE_LINKS = [
  { label: 'Inicio', to: '/' },
  { label: 'Servicios', to: '/servicios' },
  { label: 'Novias', to: '/novias' },
  { label: 'Portafolio', to: '/portafolio' },
  { label: 'El Estudio', to: '/estudio' },
  { label: 'Preguntas', to: '/preguntas-frecuentes' },
  { label: 'Contacto', to: '/contacto' },
]

function MobileMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  useScrollLock(open)
  const contact = contactLink('Hola, Toro Roso Studio ✨ Quiero información para una cita.')
  const firstLink = useRef<HTMLAnchorElement>(null)

  useEffect(() => {
    if (open) window.setTimeout(() => firstLink.current?.focus(), 350)
  }, [open])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          id="menu-movil"
          role="dialog"
          aria-modal="true"
          aria-label="Menú"
          className="fixed inset-0 z-40 lg:hidden"
          initial={{ clipPath: 'circle(0% at calc(100% - 2.6rem) 2.3rem)' }}
          animate={{ clipPath: 'circle(150% at calc(100% - 2.6rem) 2.3rem)' }}
          exit={{ clipPath: 'circle(0% at calc(100% - 2.6rem) 2.3rem)' }}
          transition={{ duration: 0.85, ease: EASE_CURTAIN }}
        >
          <SatinCanvas className="absolute inset-0" intensity={0.85} />
          <div className="absolute inset-0 bg-noir/45" />
          <div data-lenis-prevent className="relative flex h-full flex-col overflow-y-auto px-6 pt-26 pb-[max(2rem,env(safe-area-inset-bottom))]">
            <nav aria-label="Menú principal">
              <ul className="flex flex-col">
                {MOBILE_LINKS.map((link, i) => (
                  <li key={link.to} className="overflow-hidden">
                    <motion.div
                      initial={{ y: '100%' }}
                      animate={{ y: '0%' }}
                      transition={{ delay: 0.25 + i * 0.05, duration: 0.8, ease: EASE_LUXE }}
                    >
                      <NavLink
                        ref={i === 0 ? firstLink : undefined}
                        to={link.to}
                        end
                        onClick={onClose}
                        className={({ isActive }) =>
                          cn(
                            'flex items-baseline gap-4 py-1.5 font-display text-[2.1rem] tracking-[0.06em] uppercase',
                            isActive ? 'text-metal' : 'text-pearl',
                          )
                        }
                      >
                        <span className="font-sans text-[0.6875rem] tracking-[0.2em] text-rose/70">
                          {String(i + 1).padStart(2, '0')}
                        </span>
                        {link.label}
                      </NavLink>
                    </motion.div>
                  </li>
                ))}
              </ul>
            </nav>

            <motion.div
              className="mt-8 flex gap-3 overflow-x-auto no-scrollbar"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.65, duration: 0.6 }}
            >
              {SERVICE_LIST.map((s) => (
                <Link key={s.id} to={s.path} onClick={onClose} className="flex shrink-0 flex-col items-center gap-2">
                  <ServiceIcon id={s.id} size="sm" />
                  <span className="text-[0.6875rem] tracking-[0.18em] text-smoke uppercase">{s.name}</span>
                </Link>
              ))}
            </motion.div>

            <motion.div
              className="mt-auto pt-10"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.75, duration: 0.7, ease: EASE_LUXE }}
            >
              <ButtonLink to="/agenda" size="lg" className="w-full" onClick={onClose}>
                Agenda tu cita
              </ButtonLink>
              <div className="mt-6 flex items-center justify-between text-[0.6875rem] tracking-[0.2em] text-smoke uppercase">
                <a href={SITE.contact.instagram.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-rose-light">
                  <InstagramIcon className="size-4" /> {SITE.contact.instagram.handle}
                </a>
                <a href={contact.href} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-rose-light">
                  {contact.channel === 'whatsapp' ? <WhatsAppIcon className="size-4" /> : <InstagramIcon className="size-4" />}
                  {contact.channel === 'whatsapp' ? 'WhatsApp' : 'Mensaje'}
                </a>
              </div>
              <p className="mt-5 text-center text-[0.6875rem] tracking-[0.32em] text-rose/70 uppercase">
                {SITE.location.city} · {SITE.location.region}
              </p>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
