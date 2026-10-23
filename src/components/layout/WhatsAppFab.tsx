import { AnimatePresence, motion, useMotionValueEvent, useScroll } from 'motion/react'
import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { SITE } from '../../config/site'
import { contactLink, contextualGreeting } from '../../lib/whatsapp'
import { InstagramIcon, WhatsAppIcon } from '../ui/Icons'

/** Accesos flotantes: WhatsApp (principal) e Instagram, cada uno a su propio canal. */
export function WhatsAppFab() {
  const { pathname } = useLocation()
  const { scrollY } = useScroll()
  const [visible, setVisible] = useState(false)
  useMotionValueEvent(scrollY, 'change', (y) => setVisible(y > 480))

  if (pathname.startsWith('/agenda')) return null
  const chat = contactLink(contextualGreeting(pathname))

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed right-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-40 flex flex-col items-end gap-3 md:right-8 md:bottom-8"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          transition={{ type: 'spring', stiffness: 260, damping: 24 }}
        >
          <a
            href={SITE.contact.instagram.url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram de Toro Roso Studio"
            className="group flex items-center gap-3"
          >
            <span className="glass pointer-events-none hidden translate-x-3 rounded-full border border-line px-4 py-2 text-[0.6875rem] tracking-[0.2em] text-pearl uppercase opacity-0 transition duration-500 group-hover:translate-x-0 group-hover:opacity-100 md:block">
              Instagram
            </span>
            <span className="grid size-11 place-items-center rounded-full border border-rose/40 bg-noir/90 text-rose backdrop-blur transition duration-500 group-hover:border-rose group-hover:text-rose-light">
              <InstagramIcon className="size-5" />
            </span>
          </a>
          <a
            href={chat.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={chat.channel === 'whatsapp' ? 'Escríbenos por WhatsApp' : 'Escríbenos por Instagram'}
            className="group flex items-center gap-3"
          >
            <span className="glass pointer-events-none hidden translate-x-3 rounded-full border border-line px-4 py-2 text-[0.6875rem] tracking-[0.2em] text-pearl uppercase opacity-0 transition duration-500 group-hover:translate-x-0 group-hover:opacity-100 md:block">
              {chat.channel === 'whatsapp' ? '¿Hablamos por WhatsApp?' : 'Escríbenos'}
            </span>
            <span className="relative grid size-14 place-items-center rounded-full border border-rose/50 bg-noir/90 text-rose shadow-[0_12px_40px_-12px_rgba(183,131,157,0.7)] backdrop-blur transition duration-500 group-hover:border-rose group-hover:text-rose-light">
              <span className="absolute inset-0 animate-pulse-soft rounded-full border border-rose/25" />
              {chat.channel === 'whatsapp' ? <WhatsAppIcon className="size-6" /> : <InstagramIcon className="size-6" />}
            </span>
          </a>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
