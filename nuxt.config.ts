import { defineNuxtConfig } from 'nuxt/config';
import { metaTags, linkTags, scriptTags, siteMeta } from './config/meta.config';

export default defineNuxtConfig({
  // Включаем SSR
  ssr: true,

  // Указываем цель как сервер
  target: 'server',

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

  chartjs: {
    autoImport: true,
  },

  // Настройка карты сайта
  sitemap: {
    hostname: process.env.NUXT_PUBLIC_SITE_URL, // Базовый URL сайта
    gzip: true, // Сжатие карты сайта
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

  // Настройка плагинов
  plugins: [
    '~/plugins/yandexMetrica.js', // Подключение Яндекс.Метрики
    '~/plugins/axios.js', // Плагин для axios
  ],

  // Настройка переменных окружения
  runtimeConfig: {
    public: {
      yandexMetricaId: process.env.YANDEX_METRICA_ID, // ID Яндекс.Метрики
    },
  },

  // Дата совместимости
  compatibilityDate: '2025-02-12',

  devtools: {
    timeline: {
      enabled: true,
    },
  },
});