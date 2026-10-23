/// <reference types="vite/client" />

/** URL pública del sitio (la define vite.config.ts en el build). */
declare const __SITE_URL__: string

interface ImportMetaEnv {
  readonly VITE_WHATSAPP_NUMBER?: string
  readonly VITE_CONTACT_EMAIL?: string
  readonly VITE_SITE_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
