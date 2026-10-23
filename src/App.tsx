import { Analytics } from '@vercel/analytics/react'
import { AnimatePresence, MotionConfig } from 'motion/react'
import { Suspense, lazy, useCallback, useEffect } from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'
import { CursorFollower } from './components/fx/CursorFollower'
import { Footer } from './components/layout/Footer'
import { Navbar } from './components/layout/Navbar'
import { Page } from './components/layout/Page'
import { Preloader } from './components/layout/Preloader'
import { ScrollProgress } from './components/layout/ScrollProgress'
import { WhatsAppFab } from './components/layout/WhatsAppFab'
import { IntroProvider } from './components/providers/Intro'
import { SmoothScrollProvider, useLenis } from './components/providers/SmoothScroll'
import Home from './pages/Home'

const pages = {
  services: () => import('./pages/Services'),
  serviceDetail: () => import('./pages/ServiceDetail'),
  bridal: () => import('./pages/Bridal'),
  portfolio: () => import('./pages/Portfolio'),
  studio: () => import('./pages/Studio'),
  booking: () => import('./pages/Booking'),
  faq: () => import('./pages/Faq'),
  contact: () => import('./pages/Contact'),
  privacy: () => import('./pages/Privacy'),
  notFound: () => import('./pages/NotFound'),
}

const Services = lazy(pages.services)
const ServiceDetail = lazy(pages.serviceDetail)
const Bridal = lazy(pages.bridal)
const Portfolio = lazy(pages.portfolio)
const Studio = lazy(pages.studio)
const Booking = lazy(pages.booking)
const Faq = lazy(pages.faq)
const Contact = lazy(pages.contact)
const Privacy = lazy(pages.privacy)
const NotFound = lazy(pages.notFound)
const Admin = lazy(() => import('./pages/Admin'))

export default function App() {
  return (
    <MotionConfig reducedMotion="user">
      <IntroProvider>
        <SmoothScrollProvider>
          <Shell />
        </SmoothScrollProvider>
      </IntroProvider>
      {/* Estadísticas anónimas y sin cookies (Vercel Web Analytics); el panel privado no se mide. */}
      <Analytics beforeSend={(event) => (new URL(event.url).pathname.startsWith('/admin') ? null : event)} />
    </MotionConfig>
  )
}

function Shell() {
  const location = useLocation()
  const lenis = useLenis()

  // Precarga el resto de páginas cuando el navegador está libre: la navegación se siente instantánea.
  useEffect(() => {
    const preload = () => Object.values(pages).forEach((load) => void load())
    // Safari no tiene requestIdleCallback.
    if (typeof window.requestIdleCallback === 'function') {
      const id = window.requestIdleCallback(preload, { timeout: 4000 })
      return () => window.cancelIdleCallback(id)
    }
    const timer = setTimeout(preload, 2500)
    return () => clearTimeout(timer)
  }, [])

  // Enlaces con ancla (#seccion) que llegan desde otra página.
  useEffect(() => {
    if (!location.hash) return
    const timer = window.setTimeout(() => {
      const target = document.querySelector(location.hash)
      if (target instanceof HTMLElement) {
        if (lenis) lenis.scrollTo(target, { offset: -88 })
        else target.scrollIntoView()
      }
    }, 900)
    return () => window.clearTimeout(timer)
  }, [location.hash, location.pathname, lenis])

  const scrollToTop = useCallback(() => {
    lenis?.scrollTo(0, { immediate: true, force: true })
    window.scrollTo(0, 0)
  }, [lenis])

  if (location.pathname.startsWith('/admin')) {
    return (
      <Suspense fallback={<div className="min-h-dvh bg-noir" />}>
        <Admin />
      </Suspense>
    )
  }

  return (
    <div className="grain">
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-110 focus:rounded-full focus:bg-pearl focus:px-5 focus:py-3 focus:text-sm focus:text-noir"
      >
        Saltar al contenido
      </a>
      <Preloader />
      <ScrollProgress />
      <Navbar />
      <main id="contenido">
        <AnimatePresence mode="wait" initial={false} onExitComplete={scrollToTop}>
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<Page><Home /></Page>} />
            <Route path="/servicios" element={<Page><Services /></Page>} />
            <Route path="/servicios/:slug" element={<Page><ServiceDetail /></Page>} />
            <Route path="/novias" element={<Page><Bridal /></Page>} />
            <Route path="/portafolio" element={<Page><Portfolio /></Page>} />
            <Route path="/estudio" element={<Page><Studio /></Page>} />
            <Route path="/agenda" element={<Page><Booking /></Page>} />
            <Route path="/preguntas-frecuentes" element={<Page><Faq /></Page>} />
            <Route path="/contacto" element={<Page><Contact /></Page>} />
            <Route path="/privacidad" element={<Page><Privacy /></Page>} />
            <Route path="*" element={<Page><NotFound /></Page>} />
          </Routes>
        </AnimatePresence>
      </main>
      <Footer />
      <WhatsAppFab />
      <CursorFollower />
    </div>
  )
}
