import { defineNuxtConfig } from 'nuxt/config';
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineNuxtConfig({
  app: {
    head: {
      link: [
        // Добавляем предзагрузку для ОСНОВНОГО шрифта
        {
          rel: 'preload',
          href: '/fonts/rubik/Rubik-Regular.woff2',
          as: 'font',
          type: 'font/woff2',
          crossorigin: 'anonymous'
        }
      ],
      script: [
        {
          id: 'viewport-init',
          innerHTML: `
            (function() {
              const isMobile = window.innerWidth <= 840;
              document.documentElement.classList.toggle('mobile', isMobile);
              window.addEventListener('resize', () => {
                document.documentElement.classList.toggle('mobile', window.innerWidth <= 840);
              });
            })();
          `,
          type: 'text/javascript',
          // ИСПОЛЬЗУЕМ ПРАВИЛЬНЫЕ СВОЙСТВА
          tagPriority: 'critical',
          processTemplateParams: true // Правильное имя свойства (без вложенного объекта)
        }
      ],
      
      // ПРАВИЛЬНЫЙ ФОРМАТ ДЛЯ NOSCRIPT
      noscript: [
        {
          innerHTML: '<style>.mobile-bottom-nav { display: none; }</style>',
          // ИСПОЛЬЗУЕМ ПРАВИЛЬНОЕ СВОЙСТВО ВМЕСТО body
          tagPosition: 'bodyClose' // Добавляет в конец body
        }
      ]
    }
  },
  
  // Включаем SSR
  ssr: true,

  typescript: {
    typeCheck: false,
    strict: true,
  },

  // Глобальные стили
  css: [
    './app/assets/styles/index.scss', // Основные стили
    'animate.css/animate.min.css', // Анимации
  ],

  vite: {
    plugins: [tsconfigPaths()],
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
    '@pinia/nuxt',
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
      routes: [
    '/',
    '/about',
    '/services',
    '/projects',
    '/contacts',
    '/privacy-policy',
    '/terms-of-service',
    // Страницы с ценами
    '/prices/otdelochnye-raboty',
    '/prices/plumbing'
  ],
  },

  nitro: {
    plugins: [
      '../server/plugins/socket.io.ts'
    ],
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
      '/socket.io/**': {
        cors: true,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Credentials': 'true'
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
      },

      // Редирект со старого прайса
      '/prices/floor': {
        redirect: { to: '/prices/otdelochnye-raboty', statusCode: 301 }
      },
      '/prices/walls': {
        redirect: { to: '/prices/otdelochnye-raboty', statusCode: 301 }
      },
      '/prices/ceiling': {
        redirect: { to: '/prices/otdelochnye-raboty', statusCode: 301 }
      },
      '/prices/other': {
        redirect: { to: '/prices/otdelochnye-raboty', statusCode: 301 }
      },
    }
  },

  // Настройка плагинов
  plugins: [
    '~/plugins/yandexMetrica.js', // Подключение Яндекс.Метрики
    '~/plugins/telegram.client.ts',
    '~/plugins/socket.client.ts',
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
  compatibilityDate: '2025-08-27',

  devtools: {
    enabled: true,
    timeline: {
      enabled: true,
    },
  },
});
