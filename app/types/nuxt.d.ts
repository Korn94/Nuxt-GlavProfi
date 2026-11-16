// types/nuxt.d.ts

import type { Server } from 'socket.io'

declare module 'nuxt/schema' {
  // ⚠️ Ключ `sitemap` здесь НЕ описываем: его тип генерирует сам модуль
  // (@nuxtjs/sitemap v9 → `Partial<ModuleOptions>` в .nuxt/types/modules.d.ts).
  // Раньше тут стоял `SitemapConfig`, которого в пакете нет ни в v7, ни в v9.
  interface PublicRuntimeConfig {
    uploadsBaseUrl: string
  }
}

// Чтобы файл не оставался "неиспользованным"
export {}

declare module 'nitropack' {
  interface NitroApp {
    io?: Server
    ioSend?: (event: string, data: any) => void
  }
}
