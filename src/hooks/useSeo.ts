import { useEffect } from 'react'
import { PAGE_META, fullTitle, type PageMeta } from '../../shared/seo'
import { SITE } from '../config/site'

function setMeta(selector: string, attr: 'name' | 'property', key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(selector)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

/**
 * Título, descripción, canonical y Open Graph de la página. Los textos salen de
 * shared/seo.ts (los mismos que usa el build para las vistas previas al compartir).
 */
export function useSeo({ path, ...overrides }: { path: string } & Partial<PageMeta>) {
  const meta: PageMeta = { ...(PAGE_META[path] ?? PAGE_META['/']), ...overrides }
  const title = fullTitle(path, meta)
  const { description, image, noindex = false } = meta

  useEffect(() => {
    const url = `${SITE.url}${path === '/' ? '/' : path}`
    document.title = title
    setMeta('meta[name="description"]', 'name', 'description', description)
    setMeta('meta[property="og:title"]', 'property', 'og:title', title)
    setMeta('meta[property="og:description"]', 'property', 'og:description', description)
    setMeta('meta[property="og:url"]', 'property', 'og:url', url)
    setMeta('meta[property="og:image"]', 'property', 'og:image', `${SITE.url}${image}`)
    setMeta('meta[name="twitter:title"]', 'name', 'twitter:title', title)
    setMeta('meta[name="twitter:description"]', 'name', 'twitter:description', description)
    setMeta('meta[name="twitter:image"]', 'name', 'twitter:image', `${SITE.url}${image}`)
    setMeta('meta[name="robots"]', 'name', 'robots', noindex ? 'noindex, nofollow' : 'index, follow')
    let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
    if (!canonical) {
      canonical = document.createElement('link')
      canonical.rel = 'canonical'
      document.head.appendChild(canonical)
    }
    canonical.href = url
  }, [title, description, image, path, noindex])
}
