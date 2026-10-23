import { FAQ } from '../../config/faq'
import { contactLink } from '../../lib/whatsapp'
import { FadeUp } from '../fx/Reveal'
import { Accordion } from '../ui/Accordion'
import { ButtonLink } from '../ui/Button'
import { SectionHeading } from '../ui/SectionHeading'

export function FaqSection({ limit, showMoreLink = true }: { limit?: number; showMoreLink?: boolean }) {
  const items = limit ? FAQ.slice(0, limit) : FAQ
  const ask = contactLink('Hola, Toro Roso Studio ✨ Tengo una pregunta.')
  return (
    <section aria-label="Preguntas frecuentes" className="relative py-20 md:py-36">
      <div className="container-luxe grid grid-cols-1 gap-14 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <SectionHeading
            align="left"
            eyebrow="Resolvemos tus dudas"
            title="Preguntas"
            script="frecuentes"
            intro="Todo lo que necesitas saber antes de agendar."
          />
          <FadeUp delay={0.2} className="mt-10 flex flex-col items-start gap-4">
            {showMoreLink && (
              <ButtonLink to="/preguntas-frecuentes" variant="outline" size="sm">
                Ver todas las preguntas
              </ButtonLink>
            )}
            <ButtonLink to={ask.href} variant="ghost" className="justify-start text-left leading-relaxed whitespace-normal!">
              ¿Otra duda? Escríbenos por {ask.label}
            </ButtonLink>
          </FadeUp>
        </div>
        <FadeUp className="lg:col-span-8">
          <Accordion items={items} />
        </FadeUp>
      </div>
    </section>
  )
}
