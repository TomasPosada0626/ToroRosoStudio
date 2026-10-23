import { defineConfig, loadEnv, type Plugin, type ViteDevServer } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { PAGE_META, SITEMAP_ROUTES, fullTitle } from './shared/seo'

const escapeHtml = (value: string) =>
  value.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c] ?? c)

/** Copia de index.html con el título, la descripción y la imagen para compartir de una ruta. */
function htmlForRoute(template: string, path: string, siteUrl: string): string {
  const meta = PAGE_META[path]
  const title = escapeHtml(fullTitle(path, meta))
  const description = escapeHtml(meta.description)
  const url = `${siteUrl}${path === '/' ? '/' : path}`
  const image = `${siteUrl}${meta.image}`
  const attr = (pattern: string, value: string) => (html: string) =>
    html.replace(new RegExp(`(${pattern}\\s+(?:content|href)=")[^"]*(")`), (_, start: string, end: string) => start + value + end)
  const steps = [
    (html: string) => html.replace(/<title>[\s\S]*?<\/title>/, () => `<title>${title}</title>`),
    attr('<meta\\s+name="description"', description),
    attr('<link\\s+rel="canonical"', url),
    attr('<meta\\s+property="og:title"', title),
    attr('<meta\\s+property="og:description"', description),
    attr('<meta\\s+property="og:url"', url),
    attr('<meta\\s+property="og:image"', image),
    attr('<meta\\s+property="og:image:alt"', title),
    attr('<meta\\s+name="twitter:title"', title),
    attr('<meta\\s+name="twitter:description"', description),
    attr('<meta\\s+name="twitter:image"', image),
    (html: string) =>
      meta.noindex ? html.replace('</title>', '</title>\n    <meta name="robots" content="noindex, nofollow" />') : html,
    // El logo de la intro solo se precarga en el inicio (la intro no aparece en las demás páginas).
    (html: string) => (path === '/' ? html : html.replace(/\n\s*<link\s+rel="preload"\s+as="image"[^>]*>/, '')),
  ]
  return steps.reduce((html, step) => step(html), template)
}

function resolveSiteUrl(env: Record<string, string>): string {
  const vercelUrl = env.VERCEL_PROJECT_PRODUCTION_URL
  const url = env.VITE_SITE_URL || (vercelUrl ? `https://${vercelUrl}` : 'http://localhost:5173')
  return url.replace(/\/+$/, '')
}

/**
 * Reemplaza __SITE_URL__ en index.html y genera sitemap.xml, robots.txt, 404.html y una
 * página HTML por ruta (vista previa correcta al compartir cada enlace por WhatsApp o redes).
 */
function seoFiles(siteUrl: string): Plugin {
  return {
    name: 'toro-roso:seo-files',
    transformIndexHtml: (html) => html.replaceAll('__SITE_URL__', siteUrl),
    generateBundle() {
      const today = new Date().toISOString().slice(0, 10)
      const urls = SITEMAP_ROUTES.map(
        (path) => `  <url><loc>${siteUrl}${path}</loc><lastmod>${today}</lastmod></url>`,
      ).join('\n')
      this.emitFile({
        type: 'asset',
        fileName: 'sitemap.xml',
        source: `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
      })
      this.emitFile({
        type: 'asset',
        fileName: 'robots.txt',
        source: `User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /api/\n\nSitemap: ${siteUrl}/sitemap.xml\n`,
      })
    },
    closeBundle() {
      const dist = resolve(process.cwd(), 'dist')
      const index = resolve(dist, 'index.html')
      if (!existsSync(index)) return
      // Vercel sirve dist/404.html con estado 404 en rutas desconocidas; React muestra la página 404.
      copyFileSync(index, resolve(dist, '404.html'))
      const template = readFileSync(index, 'utf8')
      for (const path of Object.keys(PAGE_META)) {
        // Con "cleanUrls" (vercel.json), /novias se sirve desde novias.html.
        const file = path === '/' ? index : resolve(dist, `${path.slice(1)}.html`)
        mkdirSync(dirname(file), { recursive: true })
        writeFileSync(file, htmlForRoute(template, path, siteUrl))
      }
    },
  }
}

/**
 * En desarrollo ejecuta las funciones de /api (las mismas que usa Vercel en producción),
 * para que "npm run dev" funcione sin instalar la CLI de Vercel.
 */
function devApi(env: Record<string, string>): Plugin {
  return {
    name: 'toro-roso:dev-api',
    apply: 'serve',
    configureServer(server: ViteDevServer) {
      for (const [key, value] of Object.entries(env)) {
        if (process.env[key] === undefined) process.env[key] = value
      }
      server.middlewares.use(async (req, res, next) => {
        const url = req.url ?? ''
        if (!url.startsWith('/api/')) return next()
        const pathname = url.split('?')[0].replace(/\/+$/, '')
        const file = resolve(process.cwd(), `.${pathname}.ts`)
        res.setHeader('content-type', 'application/json; charset=utf-8')
        if (!/^\/api\/[a-z0-9/-]+$/.test(pathname) || !existsSync(file)) {
          res.statusCode = 404
          res.end(JSON.stringify({ ok: false, error: 'Ruta no encontrada' }))
          return
        }
        try {
          const mod = await server.ssrLoadModule(file)
          const method = req.method ?? 'GET'
          const handler = mod[method]
          if (typeof handler !== 'function') {
            res.statusCode = 405
            res.end(JSON.stringify({ ok: false, error: 'Método no permitido' }))
            return
          }
          const chunks: Buffer[] = []
          for await (const chunk of req) chunks.push(chunk as Buffer)
          const headers = new Headers()
          for (const [key, value] of Object.entries(req.headers)) {
            if (typeof value === 'string') headers.set(key, value)
            else if (Array.isArray(value)) headers.set(key, value.join(', '))
          }
          const request = new Request(`http://${req.headers.host}${url}`, {
            method,
            headers,
            body:
              method === 'GET' || method === 'HEAD' || chunks.length === 0 ? undefined : Buffer.concat(chunks),
          })
          const response: Response = await handler(request)
          res.statusCode = response.status
          response.headers.forEach((value, key) => {
            if (key !== 'set-cookie') res.setHeader(key, value)
          })
          const cookies = response.headers.getSetCookie()
          if (cookies.length) res.setHeader('set-cookie', cookies)
          res.end(Buffer.from(await response.arrayBuffer()))
        } catch (error) {
          server.ssrFixStacktrace(error as Error)
          console.error(error)
          res.statusCode = 500
          res.end(JSON.stringify({ ok: false, error: 'Error interno (desarrollo)' }))
        }
      })
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const siteUrl = resolveSiteUrl(env)
  return {
    plugins: [react(), tailwindcss(), seoFiles(siteUrl), devApi(env)],
    define: {
      __SITE_URL__: JSON.stringify(siteUrl),
    },
    server: { port: 5173 },
    build: {
      target: 'es2022',
      chunkSizeWarningLimit: 700,
    },
  }
})
