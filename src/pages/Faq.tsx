import { FadeUp } from '../components/fx/Reveal'
import { CtaSatin } from '../components/sections/CtaSatin'
import { PageHero } from '../components/sections/PageHero'
import { Accordion } from '../components/ui/Accordion'
import { ButtonLink } from '../components/ui/Button'
import { FAQ } from '../config/faq'
import { useSeo } from '../hooks/useSeo'
import { contactLink } from '../lib/whatsapp'

export default function Faq() {
  const ask = contactLink('Hola, Toro Roso Studio ✨ Tengo una pregunta.')
  useSeo({ path: '/preguntas-frecuentes' })
  return (
    <>
      <PageHero eyebrow="Resolvemos tus dudas" title="Preguntas" script="frecuentes" />
      <section aria-label="Preguntas" className="pb-24 md:pb-32">
        <div className="container-luxe mx-auto max-w-4xl">
          <FadeUp>
            <Accordion items={FAQ} />
          </FadeUp>
          <FadeUp className="mt-14 flex flex-col items-center gap-5 text-center">
            <p className="text-metal font-script text-4xl">¿Tienes otra pregunta?</p>
            <ButtonLink to={ask.href} variant="outline">
              Escríbenos por {ask.label}
            </ButtonLink>
          </FadeUp>
        </div>
      </section>
      <CtaSatin />
    </>
  )
}
