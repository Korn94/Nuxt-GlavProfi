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
          tagPriority: 'critical',
          processTemplateParams: true
        }
      ],
      noscript: [
        {
          innerHTML: '<style>.mobile-bottom-nav { display: none; }</style>',
          tagPosition: 'bodyClose'
        }
      ]
    }
  },

  ssr: true,

  typescript: {
    typeCheck: false,
    strict: true,
  },

  css: [
    './app/assets/styles/index.scss',
    './app/assets/styles/animations-custom.scss',
  ],

  vite: {
    define: {
      global: 'globalThis',
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
    },
    optimizeDeps: {
      include: [
        '@vue/devtools-core',
        '@vue/devtools-kit',
        '@telegram-apps/sdk',
        'socket.io-client',
        'echarts',
        'buffer',
        'drizzle-orm/mysql-core',
        'drizzle-orm',
        'drizzle-orm/mysql2',
        'mysql2/promise',
        'vue-draggable-plus',
      ],
      exclude: ['jsonwebtoken']
    },
    build: {
      rollupOptions: {
        external: ['stream', 'url'],
      },
    },
    plugins: [
      tsconfigPaths(),
      {
        name: 'buffer-polyfill',
        transform(code, id) {
          if (id.includes('socket.io-client')) {
            return {
              code: `import { Buffer } from 'buffer';\n${code}`,
              map: null
            }
          }
          return null
        }
      }
    ],
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: `
            @use 'sass:color';
            @use "@/assets/styles/variables.scss" as *;
            @use "@/assets/styles/calculator-vars.scss" as *;
          `
        }
      }
    },
  },

  modules: [
    '@nuxt/icon',
    '@nuxtjs/sitemap',
    '@pinia/nuxt',
  ],

  // ⚠️ @nuxtjs/sitemap v7. Опции `routes` (v6), `gzip` и `strictNuxtPagePaths` в 7.x
  // НЕ существуют и молча игнорировались — из-за этого в sitemap.xml не попадали
  // /prices/* и /projects/<slug>.
  // • Статические страницы модуль собирает сам из app/pages (nuxt:pages).
  // • Динамические разделы отдаёт источник /api/__sitemap__/urls (server/api/__sitemap__/urls.get.ts).
  sitemap: {
    hostname: process.env.NUXT_PUBLIC_SITE_URL || 'https://glavprofi.ru',
    // Кэш готового sitemap.xml на сервере (сек). Источник URL кэшируется отдельно.
    cacheMaxAgeSeconds: 60 * 60,
    exclude: [
      '/cabinet',
      '/cabinet/**',
      '/login',
      '/api',
      '/api/**',
      '/access-denied',
      '/telegram',
    ],
    sources: ['/api/__sitemap__/urls'],
  },
  
  nitro: {
    preset: 'node-server',
    experimental: {
      websocket: true,
    },
    externals: {
      // trace: true,
      // 🔥 Условная логика: false в dev, true в prod
      trace: process.env.NODE_ENV !== 'development',
      inline: ['jsonwebtoken'],
      external: [
        'mysql2',
        'mysql2/promise',
        'drizzle-orm',
        'drizzle-orm/mysql2',
        'drizzle-orm/mysql-core',
        'sharp',
        'bcryptjs',
        'nodemailer',
        'node-cron',
        'node-telegram-bot-api',
        'socket.io',
        'echarts',
        '@telegram-apps/sdk',
        'zod',
        'lru-cache',
      ],
    },
    typescript: {
      strict: true,
    },
    routeRules: {
      // 🔥 ГЛОБАЛЬНОЕ ПРАВИЛО ДЛЯ SEO: Запрещаем кэширование HTML-страниц
      // Это заставляет Яндекса всегда скачивать свежий HTML с актуальными хэшами JS/CSS
      '/**': {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      },

      '/api/**': {
        cors: true,
        headers: {
          'Access-Control-Allow-Origin': process.env.NODE_ENV === 'production' 
            ? 'https://glavprofi.ru' 
            : 'http://192.168.31.244:3000',
          'Access-Control-Allow-Credentials': 'true',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
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
      // /prices (без категории) раньше отдавал 404 — ведём на основную категорию прайса
      '/prices': {
        redirect: { to: '/prices/otdelochnye-raboty', statusCode: 301 }
      },
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
      '/commerc': {
        redirect: { to: '/remont-pomescheniy', statusCode: 301 }
      },
      // /vidy-rabot — НЕ отдельный хаб. Единственная точка входа в «виды работ» —
      // блок WorksGrid (#works-grid) на /remont-pomescheniy.
      // Правило матчит только точный путь: дочерние /vidy-rabot/<slug> продолжают
      // работать как обычные страницы (cross-linking, canonical, sitemap).
      '/vidy-rabot': {
        redirect: { to: '/remont-pomescheniy', statusCode: 301 }
      },
    }
  },
  // 🔧 DEV-ONLY: физические /uploads/** отдаёт nginx прод-сервера
  // (alias /var/www/glavprofi_ru_usr40/data/www/uploads/), а Nitro этот путь не обслуживает
  // и отвечает 404 "Page not found". В dev проксируем /uploads/** туда же, чтобы URL картинок
  // оставались относительными — идентично продакшену. В прод-сборку правило не попадает
  // (Nuxt мержит $development только при NODE_ENV=development). См. .env → NUXT_DEV_UPLOADS_ORIGIN.
  $development: {
    routeRules: {
      '/uploads/**': {
        proxy: `${(process.env.NUXT_DEV_UPLOADS_ORIGIN || 'https://glavprofi.ru').replace(/\/+$/, '')}/uploads/**`,
      },
    },
  },

  plugins: [
    '~/plugins/yandexMetrica.js',
    '~/plugins/analytics.client.ts',
    '~/plugins/telegram.client.ts',
    '~/plugins/socket.client.ts',
    '~/plugins/buffer.client.ts',
  ],

  runtimeConfig: {
    telegramBotToken: process.env.TELEGRAM_BOT_TOKEN,
    telegramChatId: process.env.TELEGRAM_CHAT_ID,
    email: {
      host: process.env.NUXT_EMAIL_HOST,
      port: Number(process.env.NUXT_EMAIL_PORT) || 465,
      secure: process.env.NUXT_EMAIL_SECURE === 'true',
      user: process.env.NUXT_EMAIL_USER,
      pass: process.env.NUXT_EMAIL_PASS,
      to: process.env.NUXT_EMAIL_TO,
      from: process.env.NUXT_EMAIL_FROM || 'noreply@glavprofi.ru',
    },
    public: {
      yandexMetricaId: process.env.YANDEX_METRICA_ID,
      siteUrl: process.env.NUXT_PUBLIC_SITE_URL || 
        (process.env.NODE_ENV === 'production' 
          ? 'https://glavprofi.ru' 
          : `http://${process.env.NUXT_HOST || '0.0.0.0'}:${process.env.PORT || 3000}`),
      uploadsBaseUrl: process.env.NUXT_PUBLIC_UPLOADS_BASE_URL || '',
      // ✅ P7: единый источник правды для адреса сокет-сервера.
      // Клиент: services/socket.service.ts → resolveSocketUrl()
      // Сервер (dev): server/socket/dev.ts → resolveSocketPort()
      // Переопределение: NUXT_PUBLIC_SOCKET_PORT / NUXT_PUBLIC_SOCKET_URL.
      socketPort: Number(process.env.SOCKET_PORT || process.env.NUXT_PUBLIC_SOCKET_PORT) || 3001,
      // Явный адрес сокет-сервера (если он не на том же origin, например dev-стенд).
      // Пусто → клиент строит адрес сам: prod — window.location, dev — hostname:порт.
      socketUrl: process.env.NUXT_PUBLIC_SOCKET_URL || '',
    },
    private: {
      dbHost: process.env.NUXT_DB_HOST,
      dbPort: Number(process.env.NUXT_DB_PORT),
      dbUser: process.env.NUXT_DB_USER,
      dbPassword: process.env.NUXT_DB_PASSWORD,
      dbName: process.env.NUXT_DB_NAME,
      jwtSecret: process.env.NUXT_JWT_SECRET,
    }
  },

  compatibilityDate: '2026-03-13',

  alias: {
    'shared': '~~/shared',
    'stores': '~~/stores',
    'services': '~~/services',
  },

  devtools: {
    enabled: true,
    timeline: {
      enabled: true,
    },
  },
});
