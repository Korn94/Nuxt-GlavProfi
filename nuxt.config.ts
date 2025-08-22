import { defineNuxtConfig } from 'nuxt/config';
import { metaTags, linkTags, scriptTags, siteMeta } from './config/meta.config';

export default defineNuxtConfig({
  // Включаем SSR
  ssr: true,

  // Указываем цель как сервер
  // target: 'server',

  // Настройка маршрутизации
  router: {
    options: {
      hashMode: false, // Использование history mode вместо hash mode
    },
  },

  typescript: {
    typeCheck: false,
    strict: true,
  },

  // Глобальные стили
  css: [
    '~/assets/styles/index.scss', // Основные стили
    'animate.css/animate.min.css', // Анимации
  ],

  vite: {
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: '@use "@/assets/styles/variables.scss" as *;'
        }
      }
    },
  },

  // Модули
  modules: [
    '@nuxt/icon', // Иконки
    '@nuxtjs/sitemap', // Карта сайта
  ],

  // chartjs: {
  //   autoImport: true,
  // },

  // Настройка карты сайта
  sitemap: {
    hostname: process.env.NUXT_PUBLIC_SITE_URL,
    gzip: true,
      exclude: [
      '/cabinet',
      '/cabinet/**',
      '/login',
      '/api',
      '/api/**',
      '/access-denied',
      '/telegram',
      '/projects/create',
    ],
  },

  // Настройка мета-тегов и SEO
  app: {
    head: {
      htmlAttrs: {
        lang: 'ru'
      },
      titleTemplate: siteMeta.titleTemplate,
      meta: metaTags,
      link: linkTags,
      script: scriptTags
    }
  },

  nitro: {
    typescript: {
      // Можно указать другие настройки, если нужно
      strict: true,
    },
    routeRules: {
      '/api/**': {
        cors: true,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Credentials': 'true',
          // 'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          // 'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
      },
      '/cabinet': {
        cors: true,
        headers: {
          'X-Robots-Tag': 'noindex, nofollow',
        }
      },
      '/login': {
        cors: true,
        headers: {
          'X-Robots-Tag': 'noindex, nofollow',
        }
      },
      '/cabinet/**': {
        headers: {
          'X-Robots-Tag': 'noindex, nofollow',
        }
      }
    }
  },

  // Настройка плагинов
  plugins: [
    '~/plugins/yandexMetrica.js', // Подключение Яндекс.Метрики
    // '~/plugins/auth.client.ts'
  ],

  // Настройка переменных окружения
  runtimeConfig: {
    public: {
      yandexMetricaId: process.env.YANDEX_METRICA_ID, // ID Яндекс.Метрики
      siteUrl: process.env.NUXT_PUBLIC_SITE_URL || "http://localhost:3000",
      telegramBotToken: process.env.TELEGRAM_BOT_TOKEN,
      telegramChatId: process.env.TELEGRAM_CHAT_ID
    },
    private: {
      dbHost: process.env.DB_HOST,
      dbPort: process.env.DB_PORT,
      dbUser: process.env.DB_USER,
      dbPassword: process.env.DB_PASSWORD,
      dbName: process.env.DB_NAME,
      jwtSecret: process.env.JWT_SECRET
    }
  },

  // Дата совместимости
  compatibilityDate: '2025-02-12',

  devtools: {
    enabled: true,
    timeline: {
      enabled: true,
    },
  },
});
