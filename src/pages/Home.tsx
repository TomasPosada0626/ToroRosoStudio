import { VelocityMarquee } from '../components/fx/VelocityMarquee'
import { AboutTeaser } from '../components/sections/AboutTeaser'
import { BridalFeature } from '../components/sections/BridalFeature'
import { CtaSatin } from '../components/sections/CtaSatin'
import { FaqSection } from '../components/sections/FaqSection'
import { Hero } from '../components/sections/Hero'
import { Manifesto } from '../components/sections/Manifesto'
import { PortfolioGallery } from '../components/sections/PortfolioGallery'
import { Process } from '../components/sections/Process'
import { ServicesShowcase } from '../components/sections/ServicesShowcase'
import { Testimonials } from '../components/sections/Testimonials'
import { FadeUp } from '../components/fx/Reveal'
import { ButtonLink } from '../components/ui/Button'
import { SectionHeading } from '../components/ui/SectionHeading'
import { TESTIMONIALS } from '../config/testimonials'
import { useSeo } from '../hooks/useSeo'

export default function Home() {
  useSeo({ path: '/' })

  return (
    <>
      <Hero />

      <VelocityMarquee
        items={['Novias', 'Quinceañeras', 'Social', 'Artístico', 'Graduaciones', 'Servicio a domicilio', 'Envigado · Antioquia']}
        className="border-y border-line bg-ink py-6 md:py-8"
        itemClassName="font-display text-[clamp(1.5rem,3.8vw,3.1rem)] tracking-[0.08em] text-pearl/90 uppercase"
      />

      <Manifesto />
      <ServicesShowcase />
      <BridalFeature />

      <section id="portafolio" aria-label="Portafolio" className="scroll-mt-20 py-20 md:py-36">
        <div className="container-luxe">
          <SectionHeading
            eyebrow="Portafolio"
            title="Momentos"
            script="que brillan"
            intro="Una mirada editorial a cada estilo: de la novia clásica al maquillaje artístico."
          />
          <div className="mt-12">
            <PortfolioGallery limit={12} />
          </div>
          <FadeUp className="mt-14 flex justify-center">
            <ButtonLink to="/portafolio" variant="outline">
              Ver portafolio completo
            </ButtonLink>
          </FadeUp>
        </div>
      </section>

      <Process />

      <VelocityMarquee
        items={['Elegancia para cada ocasión', 'Tu belleza', 'Tu esencia', 'Tu momento']}
        baseVelocity={1.2}
        className="py-10 md:py-14"
        itemClassName="text-metal font-script text-[clamp(2.4rem,6vw,5rem)] leading-[1.3] px-2"
      />

      <AboutTeaser />
      {/* Sin reseñas reales todavía, la sección no se muestra en la portada. */}
      {TESTIMONIALS.length > 0 && <Testimonials />}
      <FaqSection limit={5} />
      <CtaSatin />
    </>
  )
}
