import { defineNuxtConfig } from 'nuxt/config'

export default defineNuxtConfig({
  ssr: false,
  nitro: {
    // preset: 'static', // Указывает на статическую генерацию
    prerender: {
      routes: ['/projects/1', '/projects/2', '/projects/3', '/projects/4', '/projects/5', '/projects/6', '/projects/7', '/projects/8', '/projects/9', '/projects/10', '/projects/11', '/projects/12'], // Укажите все возможные маршруты - генерация для индексации страниц
    }
  },

  router: {
    options: {
      hashMode: false, // Использование history mode вместо hash mode
    },
  },

  css: [
    '~/assets/styles/index.scss',
    // Анимация для появления блоков
    'animate.css/animate.min.css',
  ],

  modules: [
    '@nuxt/icon',
    '@nuxtjs/sitemap'
  ],

  runtimeConfig: {
    public: {
      yandexMetricaId: process.env.YANDEX_METRICA_ID,
    },
  },

  plugins: [
    '~/plugins/yandexMetrica.js',
  ],

  app: {
    head: {
      htmlAttrs: {
        lang: 'ru',
      },
      titleTemplate: '%s - Рязань и область | Главпрофи',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'Профессиональный ремонт и отделка коммерческих помещений под любые задачи и масштабы. Высокое качество и индивидуальный подход.' },
        { name: 'author', content: 'ГлавПрофи' },
        { name: 'robots', content: 'index, follow'},
        { name: 'keywords',
          content: 'ремонт, отделка, строительство, дизайн, коммерческие помещения, офисы, склады, магазины, аптеки, ангары, капитальный ремонт, косметический ремонт, ремонт под ключ, отделочные работы, строительные работы, дизайн помещений, строительство в Рязани, ремонт в Рязани, ремонт в Рязанской области, ГлавПрофи, Глав Профи, ремонт офиса под ключ в Рязани, отделка торговых помещений в Рязанской области, капитальный ремонт складских помещений, дизайн интерьера коммерческих помещений, ремонт с использованием современных материалов, ремонт с гарантией до 3 лет, профессиональная отделка помещений, оптовая закупка материалов, собственные бригады рабочих, бесплатный выезд замерщика'},
        { property: 'og:title', content: 'Главпрофи - Ремонт и отделка коммерческих помещений' },
        { property: 'og:description', content: 'Профессиональный ремонт и отделка коммерческих помещений под любые задачи и масштабы. Высокое качество и индивидуальный подход.' },
        { property: 'og:image', content: 'https://glavprofi.ru/images/og-image.jpg' },
        { property: 'og:url', content: 'https://glavprofi.ru/' },
      ],
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
        { rel: 'canonical', href: 'https://glavprofi.ru/' }
      ]
    }
  },

  compatibilityDate: '2025-02-12'
});