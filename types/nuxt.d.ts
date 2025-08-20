// types/nuxt.d.ts

import { SitemapConfig } from '@nuxtjs/sitemap'

declare module 'nuxt/schema' {
  interface NuxtConfig {
    sitemap?: SitemapConfig
  }
}

// Чтобы файл не оставался "неиспользованным"
export {}