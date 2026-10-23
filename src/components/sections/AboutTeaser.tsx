import { PHOTOS } from '../../config/media'
import { FadeUp, ImageReveal, Parallax } from '../fx/Reveal'
import { ButtonLink } from '../ui/Button'
import { SectionHeading } from '../ui/SectionHeading'
import { SmartImage } from '../ui/SmartImage'

export function AboutTeaser() {
  return (
    <section aria-label="Sobre Toro Roso Studio" className="relative py-20 md:py-36">
      <div className="container-luxe grid grid-cols-1 items-center gap-14 lg:grid-cols-12">
        <div className="order-2 lg:order-1 lg:col-span-6">
          <SectionHeading
            align="left"
            eyebrow="El estudio"
            title="La belleza"
            script="está en los detalles"
            intro="Cada trazo cuenta. Nuestro trabajo es resaltar lo que ya te hace única, para que te sientas segura, auténtica y radiante en cada momento."
          />
          <FadeUp delay={0.25} className="mt-10 flex flex-col gap-4 sm:flex-row">
            <ButtonLink to="/estudio">Conoce el estudio</ButtonLink>
            <ButtonLink to="/servicios" variant="outline">
              Descubre los servicios
            </ButtonLink>
          </FadeUp>
        </div>
        <div className="relative order-1 lg:order-2 lg:col-span-6 lg:col-start-7">
          <ImageReveal from="left" className="aspect-5/4 rounded-[2rem]">
            <Parallax amount={40} className="h-full">
              <SmartImage photo={PHOTOS.detailLipLiner} sizes="(min-width: 1024px) 50vw, 92vw" showDemoBadge />
            </Parallax>
          </ImageReveal>
          <FadeUp
            delay={0.35}
            className="absolute -bottom-10 -left-4 w-36 overflow-hidden rounded-t-full border-4 border-noir md:w-48 lg:-left-16"
          >
            <div className="aspect-3/4">
              <SmartImage photo={PHOTOS.detailRoseBrushes} sizes="192px" baseWidth={360} />
            </div>
          </FadeUp>
        </div>
      </div>
    </section>
  )
}
