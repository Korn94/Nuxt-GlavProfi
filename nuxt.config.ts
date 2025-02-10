export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  ssr: false,
  nitro: {
    preset: 'static', // Указывает на статическую генерацию
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

  plugins: [
    '~/plugins/router.scrollBehavior.ts', // Регистрируем плагин
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
        { name: 'keywords', content: 'ремонт, отделка, коммерческие помещения, дизайн, строительство' },
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
  }
});