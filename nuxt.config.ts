import { defineNuxtConfig } from 'nuxt/config';

/**
 * Микро-трекинг формы: сколько мс форма должна пробыть в кадре, чтобы form_view
 * считался показом (быстрый скролл мимо формы событие не создаёт). Пусто → 1200 мс.
 */
const visitorMicroViewMinMsRaw = process.env.NUXT_PUBLIC_VISITOR_MICRO_VIEW_MIN_MS;
const visitorMicroViewMinMs = visitorMicroViewMinMsRaw ? Number(visitorMicroViewMinMsRaw) : Number.NaN;

/**
 * ⚡ Микро-кэш SSR (Nitro SWR) для публичных страниц, в секундах.
 *
 * По умолчанию ВЫКЛЮЧЕН (`NUXT_HTML_SWR` не задан): включение меняет поведение
 * деплоя — карточки контента из кабинета (цены, кейсы) появляются с задержкой
 * до N секунд, а сразу после `rsync --delete-after` кэшированный HTML может
 * ссылаться на уже удалённые чанки.
 *
 * Включать осознанно: `NUXT_HTML_SWR=60 npm run build` (значение запекается в сборку).
 */
const htmlSwrSeconds = Number(process.env.NUXT_HTML_SWR || 0);
const SWR_ROUTES = [
  '/',
  '/about',
  '/contacts',
  '/projects',
  '/projects/**',
  '/prices/**',
  '/remont-pomescheniy',
  '/remont-pomescheniy/**',
  '/vidy-rabot/**',
];
const swrRouteRules = htmlSwrSeconds > 0
  ? Object.fromEntries(SWR_ROUTES.map((route) => [route, { swr: htmlSwrSeconds }]))
  : {};

export default defineNuxtConfig({
  app: {
    head: {
      link: [
        // Предзагрузка ОСНОВНЫХ шрифтов первого экрана.
        // ⚠️ Раньше здесь был только Rubik-Regular, хотя H1 набран font-weight: 700 —
        // браузер стартовал загрузку Bold позже, и заголовок «перещёлкивался»
        // с системного шрифта на Rubik уже после первой отрисовки.
        // Оба файла всё равно нужны странице, поэтому preload — чистая экономия времени.
        {
          rel: 'preload',
          href: '/fonts/rubik/Rubik-Regular.woff2',
          as: 'font',
          type: 'font/woff2',
          crossorigin: 'anonymous'
        },
        {
          rel: 'preload',
          href: '/fonts/rubik/Rubik-Bold.woff2',
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
    // ⚠️ kp.scss (конструктор КП) здесь БОЛЬШЕ НЕТ: он нужен только /offers/**
    // и подключается в app/components/pages/public/offers/kp/KpPage.vue.
    // Глобально он уезжал в entry-CSS каждой публичной страницы.
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
        // echarts собирается модульно (см. app/lib/echarts.ts) — прогреваем именно эти входы.
        'echarts/core',
        'echarts/charts',
        'echarts/components',
        'echarts/renderers',
        'buffer',
        'vue-draggable-plus',
      ],
      exclude: ['jsonwebtoken']
    },
    build: {
      rolldownOptions: {
        external: ['stream', 'url'],
        output: {
          codeSplitting: {
            groups: [
              // zrender — рендерер echarts (~196 КБ). Выносим отдельным чанком, чтобы
              // ни один чанк не превышал порог предупреждения Vite (500 КБ):
              // модульный echarts без сплита — 587 КБ, со сплитом — 379 КБ + 196 КБ.
              // Оба грузятся параллельно и только на страницах с графиками.
              { name: 'zrender', test: /node_modules[\\/]zrender[\\/]/ },
            ],
          },
        },
      },
    },
    plugins: [
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

  // 🎨 Иконки (@nuxt/icon v2)
  // ⚠️ Без этой секции клиентский бандл иконок пустой (`init() {}`), и все иконки,
  // отрендеренные ТОЛЬКО на клиенте (шапка/мобильное меню — они client-only),
  // тянутся с `api.iconify.design` отдельным сторонним запросом в рантайме.
  // `scan: true` вырезает в клиентский бандл только реально используемые иконки
  // (лимит 256 КБ — страховка от раздувания).
  // `serverBundle.collections` — только используемые коллекции: раньше в Nitro
  // уезжали ВСЕ установленные @iconify-json/* (~40 МБ JSON в памяти процесса).
  icon: {
    clientBundle: {
      scan: true,
      sizeLimitKb: 256,
    },
    serverBundle: {
      collections: ['mdi', 'material-symbols', 'solar', 'ph', 'bx', 'bxl', 'lucide', 'weui'],
    },
  },

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
      // ⚡ Микро-кэш SSR (только если задан NUXT_HTML_SWR при сборке)
      ...swrRouteRules,

      // 🔥 ПУБЛИЧНЫЕ HTML-страницы
      // Раньше здесь стояло `no-store`, и это:
      //   • полностью отключало bfcache в Chrome/Firefox → «назад» = полная перезагрузка;
      //   • запрещало любой кэш на прокси/CDN, хотя HTML одинаков для всех
      //     (шапка рендерится на клиенте, персональных данных в разметке нет).
      // `max-age=0, must-revalidate` оставляет свежесть (каждый заход — 304), но кэш разрешён.
      '/**': {
        headers: {
          'Cache-Control': 'public, max-age=0, must-revalidate'
        }
      },

      // 🔒 Кабинет и служебные страницы — не кэшируем и не индексируем
      '/cabinet': {
        cors: true,
        headers: {
          'Cache-Control': 'private, no-store',
          'X-Robots-Tag': 'noindex, nofollow',
        }
      },
      '/cabinet/**': {
        headers: {
          'Cache-Control': 'private, no-store',
          'X-Robots-Tag': 'noindex, nofollow',
        }
      },
      '/login': {
        cors: true,
        headers: {
          'Cache-Control': 'private, no-store',
          'X-Robots-Tag': 'noindex, nofollow',
        }
      },

      '/api/**': {
        cors: true,
        headers: {
          // ⚠️ Правило `/**` выше отдаёт `public, …` — для API это недопустимо:
          // ответы могут содержать данные пользователя. Явно запрещаем кэш.
          'Cache-Control': 'private, no-store',
          'Access-Control-Allow-Origin': process.env.NODE_ENV === 'production' 
            ? 'https://glavprofi.ru' 
            : 'http://192.168.31.244:3000',
          'Access-Control-Allow-Credentials': 'true',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
      },
      // Диагностика переименована: /cabinet/testpage → /cabinet/diagnostics
      // (старые закладки админов продолжают работать)
      '/cabinet/testpage': {
        redirect: { to: '/cabinet/diagnostics', statusCode: 301 }
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
    // ⚡ .client-суффикс обязателен: скрипт метрики работает только в браузере,
    // раньше плагин собирался и в серверный бандл (лишний вес + мёртвый код).
    '~/plugins/yandexMetrica.client.js',
    '~/plugins/analytics.client.ts',
    '~/plugins/telegram.client.ts',
    '~/plugins/socket.client.ts',
    '~/plugins/buffer.client.ts',
  ],

  runtimeConfig: {
    // 📅 Дата-время сборки (ISO). Запекается в бандл при `nuxt build`
    // (значение вычисляется в момент сборки, не в рантайме).
    // Используется в /llms.txt и /llms-full.txt как «Сайт собран: … (МСК)».
    buildTime: new Date().toISOString(),
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
      // 📊 Google Analytics 4 (G-XXXXXXX). Пусто → GA не загружается вообще.
      // Переопределяется в рантайме через NUXT_PUBLIC_GA_ID (без пересборки).
      // ⚠️ gtag.js = 532 КБ (183 КБ gzip), поэтому грузится ЛЕНИВО и только в prod —
      // см. app/plugins/analytics.client.ts. В <head> тега нет намеренно.
      googleAnalyticsId: process.env.NUXT_PUBLIC_GA_ID || '',
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
      // 📊 Микро-трекинг форм (form_view / form_focus / form_typing) — см.
      // app/composables/visitor/trackerFormMicro.ts. Включён по умолчанию;
      // выключить полностью: NUXT_PUBLIC_VISITOR_MICRO_TRACKING=false.
      visitorMicroTracking: process.env.NUXT_PUBLIC_VISITOR_MICRO_TRACKING !== 'false',
      // Опциональный allowlist подписей форм (как source у form_open), через запятую:
      // NUXT_PUBLIC_VISITOR_MICRO_SOURCES="Футер — обратный звонок,Hero-форма: Офисы"
      visitorMicroSources: process.env.NUXT_PUBLIC_VISITOR_MICRO_SOURCES || '',
      // Сколько мс форма должна пробыть в кадре, чтобы form_view считался показом.
      // Защита от спама «вовлечений» при обычном пролистывании страницы: 0 — сразу.
      visitorMicroViewMinMs: Number.isFinite(visitorMicroViewMinMs) && visitorMicroViewMinMs >= 0
        ? visitorMicroViewMinMs
        : 1200,
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
