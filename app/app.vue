<!-- app.vue -->
<template>
  <div>
    <NuxtRouteAnnouncer />
    <NuxtLoadingIndicator />
    <NuxtLayout />
    <UiNotificationsContainer />
  </div>
</template>

<script setup>
// Импортируем конфигурацию мета
import { siteMeta, metaTags, linkTags, scriptTags } from '~/config/meta.config';
import { useActivityTracker } from '~/composables/useActivityTracker';
import { useVisitorTracker } from '~/composables/useVisitorTracker';
import { buildOrganizationSchema, organizationId } from '~/utils/organizationSchema';
import { toLlmsMarkdownPath } from '~/utils/llmsMarkdown';

// ============================================
// ✅ ГЛОБАЛЬНЫЙ ТРЕКИНГ АКТИВНОСТИ / AFK
// ============================================
// Монтируется в корневом компоненте → работает на ВСЕХ маршрутах: публичный
// лендинг, страницы услуг, кабинет. Раньше жил только в app/layouts/cabinet.vue,
// из-за чего авторизованный пользователь на публичной странице создавал сессию
// (её поднимает plugins/socket.client.ts), но события activity / activity:afk /
// tab:navigate не уходили и он «висел онлайн» до закрытия вкладки.
// Только клиент: на SSR слушателей/таймеров быть не должно (app.vue выполняется и на сервере).
if (process.client) {
  useActivityTracker();
  // ✅ Трекинг посетителей публичного сайта (анонимных) — для карточки
  // «Посетители сайта» на /cabinet/online. Авторизованных пропускает сам трекер.
  useVisitorTracker();
}

const route = useRoute();
const config = useRuntimeConfig();

// Путь БЕЗ trailing slash. computed, а не const: app.vue монтируется один раз
// на всё приложение, и без реактивности canonical/og:url/link оставались бы
// от первой загруженной страницы при клиентской навигации.
const cleanPath = computed(() => {
  const path = route.path;
  return path.endsWith('/') ? path.slice(0, -1) : path; // убираем последний слеш
});

// Формируем полный URL текущей страницы — БЕЗ слеша на конце
const currentPageUrl = computed(() => `${config.public.siteUrl}${cleanPath.value}`);

// Markdown-версия страницы (llmstxt.org v2). null — если для этого URL её нет:
// ссылку rel="alternate" в этом случае НЕ выводим, чтобы не вести в 404.
// Списки `.md`-страниц собираются из данных — см. ~/utils/llmsMarkdown.
const markdownPath = computed(() => toLlmsMarkdownPath(route.path));

// JSON-LD разметка (GeneralContractor + WebSite).
// 🏗️ Узел организации собирается единым builder'ом — он же используется на страницах
// услуг (usePageSeo / useWorkTypeSeo / использование в прайсе), поэтому `@id`
// #organization везде описывается одинаково и не конфликтует.
const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    buildOrganizationSchema(config.public.siteUrl),
    {
      '@type': 'WebSite',
      '@id': `${config.public.siteUrl}/#website`,
      url: config.public.siteUrl,
      name: 'ГлавПрофи — Ремонт коммерческих помещений',
      description: 'Ремонт и отделка коммерческих помещений под ключ в Рязани и области',
      inLanguage: 'ru',
      publisher: {
        '@id': organizationId(config.public.siteUrl)
      }
    }
  ]
};

// useHead с функцией-геттером: head пересобирается при смене route,
// поэтому canonical/og:url/alternate не «залипают» на первой странице.
useHead(() => ({
  htmlAttrs: {
    lang: 'ru'
  },
  titleTemplate: '%s | ГлавПрофи',
  meta: [
    // Глобальные мета из config
    ...metaTags,
    // Динамический og:url
    { property: 'og:url', content: currentPageUrl.value },
    // При необходимости можно добавить og:type здесь или на страницах
    { property: 'og:type', content: 'website' },
    // og:image глобально
    { property: 'og:image', content: `${config.public.siteUrl}/og-image.jpg` },
    { property: 'og:image:width', content: '1200' },
    { property: 'og:image:height', content: '630' },
    { property: 'og:locale', content: 'ru_RU' },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: 'ГлавПрофи — Ремонт коммерческих помещений' },
    { name: 'twitter:description', content: 'Ремонт и отделка коммерческих помещений под ключ в Рязани и области' },
    { name: 'twitter:image', content: `${config.public.siteUrl}/og-image.jpg` },
  ],
  link: [
    // Глобальные ссылки (favicon)
    ...linkTags,
    // 🤖 llmstxt.org (v2): страница сообщает, где лежит описание сайта для ИИ-агентов.
    // Сам /llms.txt генерируется из БД (server/routes/llms.txt.ts). Тот же адрес отдаётся
    // HTTP-заголовком Link на HTML-ответах — server/plugins/llms-link-header.ts.
    { rel: 'describedby', type: 'text/plain', href: `${config.public.siteUrl}/llms.txt` },
    // 📄 Markdown-версия этой же страницы (`<url>.md`): только если она существует.
    // Списки `.md`-страниц собираются из данных — ~/utils/llmsMarkdown.ts,
    // отдаёт её server/middleware/llms-markdown.ts.
    ...(markdownPath.value
      ? [{ rel: 'alternate', type: 'text/markdown', href: `${config.public.siteUrl}${markdownPath.value}` }]
      : []),
    // Динамический canonical URL
    { rel: 'canonical', href: currentPageUrl.value }
  ],
  script: [
    ...scriptTags,
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify(jsonLd)
    }
  ]
}));
</script>