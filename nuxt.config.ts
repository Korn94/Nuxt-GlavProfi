import { defineNuxtConfig } from 'nuxt/config';
import tsconfigPaths from 'vite-tsconfig-paths'
import { existsSync, readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'

/**
 * ⚠️ Воркэраунд для https://github.com/nuxt/icon/issues/571
 * (@nuxt/icon@2.6.2 + @iconify/vue@5.0.5: клиент игнорирует локальный провайдер
 * /api/_nuxt_icon и ходит на api.iconify.design / api2.iconify.design).
 *
 * Флаг НЕ хардкодим, а считаем по реальному коду установленных пакетов:
 *  - в сломанном @nuxt/icon есть сравнение с фиксированным списком хостов
 *    (`DEFAULT_RESOURCES = ["https://api.iconify.design"]`);
 *    фикс (PR #574) матчит `api*.iconify.design` и этот маркер убирает;
 *  - баг проявляется только если у @iconify/vue дефолтных хостов не ровно один.
 *
 * Как только оба условия перестанут выполняться — воркэраунд отключится сам,
 * а сборка напомнит удалить app/plugins/iconify-local-provider.client.ts.
 */
const ICON_BROKEN_CHECK_MARKER = 'DEFAULT_RESOURCES = ["https://api.iconify.design"]'
const ICONIFY_VUE_DEFAULTS_RE = /configStorage\[""\]\s*=\s*createAPIConfig\(\{\s*resources:\s*(\[[^\]]*\])/

/** Путь к файлу внутри пакета (@nuxt/icon → dist/runtime/iconify-config.js). */
function resolvePackageFile(pkg: string, file: string): string | null {
  try {
    return join(dirname(createRequire(import.meta.url).resolve(pkg)), file)
  } catch {
    const fallback = join(process.cwd(), 'node_modules', pkg, 'dist', file)
    return existsSync(fallback) ? fallback : null
  }
}

function needsIconProviderWorkaround(): boolean {
  try {
    const iconRuntimeFile = resolvePackageFile('@nuxt/icon', 'runtime/iconify-config.js')
    if (!iconRuntimeFile) {
      console.warn(
        '[icon] Не найден runtime @nuxt/icon — воркэраунд локального Iconify-провайдера включён принудительно.'
      )
      return true
    }

    const moduleSource = readFileSync(iconRuntimeFile, 'utf-8')

    if (!moduleSource.includes(ICON_BROKEN_CHECK_MARKER)) {
      console.warn(
        '[icon] @nuxt/icon уже содержит фикс #571 (PR #574) — воркэраунд отключён.\n' +
        '[icon] Можно удалить app/plugins/iconify-local-provider.client.ts, флаг iconProviderWorkaround\n' +
        '[icon] из nuxt.config.ts и @iconify/vue из dependencies.'
      )
      return false
    }

    const iconifyVueFile = resolvePackageFile('@iconify/vue', 'iconify.mjs')
    if (iconifyVueFile) {
      const iconifySource = readFileSync(iconifyVueFile, 'utf-8')
      const defaultsRaw = iconifySource.match(ICONIFY_VUE_DEFAULTS_RE)?.[1]
      const defaultResources: string[] = defaultsRaw ? JSON.parse(defaultsRaw) : []
      // Баг есть только при рассинхроне дефолтов @iconify/vue с ожиданием модуля.
      if (defaultResources.length === 1 && defaultResources[0] === 'https://api.iconify.design') {
        return false
      }
    }

    return true
  } catch (error) {
    // Не смогли проверить — считаем, что баг есть (безопаснее, чем потерять иконки).
    console.warn(
      '[icon] Не удалось проверить runtime @nuxt/icon — воркэраунд локального Iconify-провайдера включён принудительно.',
      error
    )
    return true
  }
}

const iconProviderWorkaround = needsIconProviderWorkaround()

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

  // ⚠️ Nuxt 4.6+ резолвит css-энтри как module id, а не относительно nuxt.config:
  // относительные пути './app/...' падают в dev с "Failed to resolve import"
  // (и дают warning NUXT_B5025 при сборке). Поэтому — alias-форма: ~ = app/ (srcDir).
  css: [
    '~/assets/styles/index.scss',
    '~/assets/styles/animations-custom.scss',
    // Стили коммерческих предложений (конструктор КП): app/components/pages/public/offers/kp
    '~/assets/styles/kp.scss',
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

  // 🌐 Адрес сайта для <loc> в sitemap.xml (nuxt-site-config → site.url).
  // ⚠️ Опции `sitemap.hostname` НЕ существует ни в v7, ни в v9 — она молча
  // игнорировалась, и модуль подставлял адрес из заголовка Host запроса.
  site: {
    url: process.env.NUXT_PUBLIC_SITE_URL || 'https://glavprofi.ru',
  },

  // ⚠️ @nuxtjs/sitemap v9. Опции `routes` (v6), `gzip` и `strictNuxtPagePaths`
  // НЕ существуют и молча игнорировались — из-за этого в sitemap.xml не попадали
  // /prices/* и /projects/<slug>.
  // • Статические страницы модуль собирает сам из app/pages (nuxt:pages).
  // • Динамические разделы отдаёт источник /api/__sitemap__/urls (server/api/__sitemap__/urls.get.ts).
  sitemap: {
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
      // /offers/** — коммерческие предложения (app/pages/offers): сметы для конкретных
      // клиентов, не для индексации. Страницы уже отдают robots noindex, nofollow;
      // здесь убираем их из карты сайта. Паттерн покрывает и /offers, и все вложенные.
      '/offers/**',
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
      // ⚠️ Воркэраунд бага @nuxt/icon #571 — см. app/plugins/iconify-local-provider.client.ts.
      // Вычисляется выше по коду установленных пакетов; выключается сам после апгрейда.
      iconProviderWorkaround,
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
