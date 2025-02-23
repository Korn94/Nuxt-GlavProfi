import { defineNuxtConfig } from 'nuxt/config';

export default defineNuxtConfig({
  // Включаем SSR
  ssr: true,
  target: 'server', // Указываем цель как сервер

  // Настройка Nitro для SSR
  nitro: {
    preset: 'node-server', // Используем Node.js сервер для SSR
    prerender: {
      crawlLinks: true, // Автоматически находит ссылки для предварительной генерации
      routes: [
        '/',
        '/prices/floor',
        '/prices/walls',
        '/prices/ceiling',
        '/prices/plumbing',
        '/prices/electricity',
        '/prices/other',
        '/projects/1',
        '/projects/2',
        '/projects/3',
        '/projects/4',
        '/projects/5',
        '/projects/6',
        '/projects/7',
        '/projects/8',
        '/projects/9',
        '/projects/10',
        '/projects/11',
        '/projects/12',
      ],
    },
  },

  // Настройка маршрутизации
  router: {
    options: {
      hashMode: false, // Использование history mode вместо hash mode
    },
  },

  // Глобальные стили
  css: [
    '~/assets/styles/index.scss', // Основные стили
    'animate.css/animate.min.css', // Анимации
  ],

  // Модули
  modules: [
    '@nuxt/icon', // Иконки
    '@nuxtjs/sitemap', // Карта сайта
  ],

  // Настройка карты сайта
  sitemap: {
    hostname: process.env.NUXT_PUBLIC_SITE_URL, // Базовый URL сайта
    gzip: true, // Сжатие карты сайта
  },

  // Настройка мета-тегов и SEO
  app: {
    head: {
      htmlAttrs: {
        lang: 'ru', // Язык сайта
      },
      titleTemplate: '%s - Рязань и область | Главпрофи', // Шаблон заголовка
      meta: [
        { charset: 'utf-8' }, // Кодировка
        { name: 'viewport', content: 'width=device-width, initial-scale=1' }, // Адаптивность
        { name: 'description', content: 'Профессиональный ремонт и отделка коммерческих помещений под любые задачи и масштабы. Высокое качество и индивидуальный подход.' }, // Описание
        { name: 'author', content: 'ГлавПрофи' }, // Автор
        { name: 'robots', content: 'index, follow' }, // Индексация
        { name: 'keywords', content: 'ремонт, отделка, строительство, дизайн, коммерческие помещения, офисы, склады, магазины, аптеки, ангары, капитальный ремонт, косметический ремонт, ремонт под ключ, отделочные работы, строительные работы, дизайн помещений, строительство в Рязани, ремонт в Рязани, ремонт в Рязанской области, ГлавПрофи, Глав Профи, ремонт офиса под ключ в Рязани, отделка торговых помещений в Рязанской области, капитальный ремонт складских помещений, дизайн интерьера коммерческих помещений, ремонт с использованием современных материалов, ремонт с гарантией до 3 лет, профессиональная отделка помещений, оптовая закупка материалов, собственные бригады рабочих, бесплатный выезд замерщика' }, // Ключевые слова
        { property: 'og:title', content: 'Главпрофи - Ремонт и отделка коммерческих помещений' }, // Open Graph заголовок
        { property: 'og:description', content: 'Профессиональный ремонт и отделка коммерческих помещений под любые задачи и масштабы. Высокое качество и индивидуальный подход.' }, // Open Graph описание
        { property: 'og:image', content: 'https://glavprofi.ru/images/og-image.jpg' }, // Open Graph изображение
        { property: 'og:url', content: 'https://glavprofi.ru/' }, // Open Graph URL
        { property: 'og:type', content: 'website' }, // Добавлено: Тип контента
      ],
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }, // Фавикон
        { rel: 'canonical', href: 'https://glavprofi.ru/' }, // Канонический URL
      ],
    },
  },

  // Настройка плагинов
  plugins: [
    '~/plugins/yandexMetrica.js', // Подключение Яндекс.Метрики
  ],

  // Настройка переменных окружения
  runtimeConfig: {
    public: {
      yandexMetricaId: process.env.YANDEX_METRICA_ID, // ID Яндекс.Метрики
    },
  },

  // Дата совместимости
  compatibilityDate: '2025-02-12',
});