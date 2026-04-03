// types/nuxt.d.ts

import { SitemapConfig } from '@nuxtjs/sitemap'
import type { Server } from 'socket.io'

declare module 'nuxt/schema' {
  interface NuxtConfig {
    sitemap?: SitemapConfig
  }
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
