import { useSearchParams } from 'react-router-dom'
import { CtaSatin } from '../components/sections/CtaSatin'
import { PageHero } from '../components/sections/PageHero'
import { PortfolioGallery } from '../components/sections/PortfolioGallery'
import { isPortfolioFilter, type PortfolioFilter } from '../config/portfolio'
import { useSeo } from '../hooks/useSeo'

export default function Portfolio() {
  const [params, setParams] = useSearchParams()
  const category = params.get('categoria')
  const filter: PortfolioFilter = isPortfolioFilter(category) ? category : 'todo'

  useSeo({ path: '/portafolio' })

  const changeFilter = (next: PortfolioFilter) => {
    setParams(next === 'todo' ? {} : { categoria: next }, { replace: true, preventScrollReset: true })
  }

  return (
    <>
      <PageHero
        eyebrow="Portafolio"
        title="Momentos"
        script="que brillan"
        intro="Una galería editorial de cada estilo. Selecciona una categoría y toca cualquier imagen para verla en grande."
      />
      <section aria-label="Galería" className="pb-24 md:pb-36">
        <div className="container-luxe">
          <PortfolioGallery filter={filter} onFilterChange={changeFilter} />
        </div>
      </section>
      <CtaSatin title={['¿Te imaginas', 'tu próximo look?']} />
    </>
  )
}
