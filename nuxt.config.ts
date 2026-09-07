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

  sitemap: {
    hostname: process.env.NUXT_PUBLIC_SITE_URL,
    gzip: true,
    strictNuxtPagePaths: false,
    exclude: [
      '/cabinet',
      '/cabinet/**',
      '/login',
      '/api',
      '/api/**',
      '/access-denied',
      '/telegram',
    ],
    routes: [
      '/',
      '/about',
      '/contacts',
      '/projects',
      '/projects/ddx',
      '/projects/zerno',
      '/projects/klinika-alma',
      '/projects/fora-bank',
      '/privacy-policy',
      '/terms-of-service',
      '/prices/otdelochnye-raboty',
      '/prices/plumbing',
      '/prices/electricity',
      '/remont-pomescheniy/ofisy',
      '/remont-pomescheniy/magaziny',
      '/remont-pomescheniy/sklady',
      '/remont-pomescheniy/angary',
      '/remont-pomescheniy/kliniki',
      '/remont-pomescheniy/fasady',
      '/remont-pomescheniy/fitness',
      '/remont-pomescheniy/proizvodstvo',
      '/remont-pomescheniy/salony',
      '/remont-pomescheniy/mopy',
      '/remont-pomescheniy/banki',
    ],
  },
  
  nitro: {
    preset: 'node-server',
    experimental: {
      websocket: true,
    },
    externals: {
      trace: true,
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
    plugins: [
      './plugins/socket.io.ts'
    ],
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
