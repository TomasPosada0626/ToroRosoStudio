import { FadeUp, ImageReveal, Parallax, ScrollWords } from '../components/fx/Reveal'
import { CtaSatin } from '../components/sections/CtaSatin'
import { MANIFESTO } from '../components/sections/Manifesto'
import { PageHero } from '../components/sections/PageHero'
import { ButtonLink } from '../components/ui/Button'
import { InstagramIcon, MapPin } from '../components/ui/Icons'
import { SectionHeading } from '../components/ui/SectionHeading'
import { SmartImage } from '../components/ui/SmartImage'
import { OrnamentDivider, Sparkle } from '../components/ui/Sparkle'
import { PHOTOS } from '../config/media'
import { SITE } from '../config/site'
import { useSeo } from '../hooks/useSeo'

/* Pilares tomados de la filosofía de la marca: resaltar la esencia, acompañar,
   ayudar a sentirse segura, auténtica y radiante. */
const PILLARS = [
  { title: 'Esencia', text: 'Resaltamos lo que ya te hace única, en lugar de transformarte en alguien más.' },
  { title: 'Acompañamiento', text: 'Estamos contigo en los momentos que merecen ser inolvidables.' },
  { title: 'Seguridad', text: 'Un maquillaje con el que te sientas cómoda y segura de principio a fin.' },
  { title: 'Autenticidad', text: 'Un look que se siente tuyo: auténtico, radiante y fiel a tu estilo.' },
]

export default function Studio() {
  useSeo({ path: '/estudio' })
  const artistName = SITE.artist.name

  return (
    <>
      <PageHero
        eyebrow="El estudio"
        title="La belleza"
        script="está en los detalles"
        intro="Toro Roso Studio nace para acompañarte en los momentos que merecen ser inolvidables."
      />

      <section aria-label="Filosofía" className="relative py-20 md:py-32">
        <div className="container-luxe grid grid-cols-1 items-center gap-14 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <ImageReveal className="mx-auto aspect-4/5 max-w-[480px] rounded-t-full border border-rose/25">
              <Parallax amount={40} className="h-full">
                <SmartImage photo={PHOTOS.detailLipLiner} sizes="(min-width: 1024px) 40vw, 92vw" showDemoBadge />
              </Parallax>
            </ImageReveal>
          </div>
          <div className="lg:col-span-6 lg:col-start-7">
            <FadeUp>
              <p className="eyebrow flex items-center gap-3 text-rose">
                <Sparkle className="size-2.5" /> Nuestra filosofía
              </p>
            </FadeUp>
            <ScrollWords
              text={MANIFESTO}
              highlight={['esencia', 'segura', 'auténtica', 'radiante']}
              className="mt-8 font-display text-[clamp(1.4rem,2.6vw,2.3rem)] leading-[1.4] tracking-[0.02em] text-pearl"
            />
            <FadeUp className="mt-10">
              <OrnamentDivider className="max-w-xs" />
            </FadeUp>
          </div>
        </div>
      </section>

      <section aria-label="Nuestros pilares" className="border-y border-line bg-ink py-20 md:py-32">
        <div className="container-luxe">
          <SectionHeading eyebrow="Lo que nos guía" title="Nuestros" script="pilares" />
          <div className="mt-16 grid gap-px overflow-hidden rounded-[1.75rem] border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
            {PILLARS.map((pillar, i) => (
              <FadeUp key={pillar.title} delay={i * 0.1} className="h-full">
                <div className="group flex h-full flex-col bg-ink p-8 transition-colors duration-500 hover:bg-plum-900">
                  <span className="font-display text-sm text-rose/70 tabular-nums">{String(i + 1).padStart(2, '0')}</span>
                  <h3 className="text-metal mt-10 font-script text-5xl leading-none">{pillar.title}</h3>
                  <p className="mt-5 leading-relaxed text-smoke">{pillar.text}</p>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      <section aria-label="La artista" className="py-20 md:py-32">
        <div className="container-luxe grid grid-cols-1 items-center gap-14 lg:grid-cols-12">
          <div className="lg:col-span-6">
            <SectionHeading
              align="left"
              eyebrow="La artista"
              title={artistName ?? 'Detrás'}
              script={artistName ? 'makeup artist' : 'de cada look'}
            />
            {SITE.artist.bio.length > 0 ? (
              SITE.artist.bio.map((paragraph) => (
                <FadeUp key={paragraph}>
                  <p className="mt-6 max-w-xl text-lg leading-relaxed text-pearl/80">{paragraph}</p>
                </FadeUp>
              ))
            ) : (
              <FadeUp>
                <p className="mt-6 max-w-xl text-lg leading-relaxed text-pearl/80">
                  Conoce el trabajo, el proceso y el día a día de la makeup artist detrás de Toro Roso Studio en su
                  Instagram.
                </p>
              </FadeUp>
            )}
            <FadeUp delay={0.2} className="mt-10 flex flex-col gap-4 sm:flex-row">
              <ButtonLink to={SITE.artist.instagram.url}>
                <InstagramIcon className="size-4" /> {SITE.artist.instagram.handle}
              </ButtonLink>
              <ButtonLink to={SITE.contact.instagram.url} variant="outline">
                {SITE.contact.instagram.handle}
              </ButtonLink>
            </FadeUp>
          </div>
          <div className="lg:col-span-5 lg:col-start-8">
            <FadeUp className="relative overflow-hidden rounded-[1.75rem] border border-rose/25 bg-linear-to-br from-plum-800 via-plum-900 to-noir p-10">
              <MapPin className="size-6 text-rose" />
              <p className="mt-6 font-display text-3xl tracking-[0.06em] text-pearl uppercase">{SITE.location.serviceMode}</p>
              <p className="text-metal mt-1 font-script text-4xl">
                {SITE.location.city}, {SITE.location.region}
              </p>
              <p className="mt-6 leading-relaxed text-smoke">
                Llegamos hasta tu casa o al lugar donde te prepares, para que vivas tu momento con calma y sin
                desplazamientos.
              </p>
              <img
                src="/brand/mark-320.webp"
                alt=""
                width={320}
                height={224}
                className="pointer-events-none absolute -right-10 -bottom-6 w-56 opacity-10"
              />
            </FadeUp>
          </div>
        </div>
      </section>

      <CtaSatin />
    </>
  )
}
