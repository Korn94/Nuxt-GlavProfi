<!-- app.vue -->
<template>
  <div>
    <NuxtRouteAnnouncer />
    <NuxtLoadingIndicator />
    <NuxtLayout />
  </div>
</template>

<script setup>
// Импортируем конфигурацию мета
import { siteMeta, metaTags, linkTags, scriptTags } from '~/config/meta.config';

const route = useRoute();
const config = useRuntimeConfig();

// Формируем путь БЕЗ trailing slash
let cleanPath = route.path;
if (cleanPath.endsWith('/')) {
  cleanPath = cleanPath.slice(0, -1); // убираем последний слеш
}

// Формируем полный URL текущей страницы — БЕЗ слеша на конце
const currentPageUrl = `${config.public.siteUrl}${cleanPath}`;

useHead({
  htmlAttrs: {
    lang: 'ru'
  },
  titleTemplate: siteMeta.titleTemplate,
  meta: [
    // Глобальные мета из config
    ...metaTags,
    // Динамический og:url
    { property: 'og:url', content: currentPageUrl },
    // При необходимости можно добавить og:type здесь или на страницах
    { property: 'og:type', content: 'website' }
  ],
  link: [
    // Глобальные ссылки (favicon)
    ...linkTags,
    // Динамический canonical URL
    { rel: 'canonical', href: currentPageUrl }
  ],
  script: scriptTags
});
</script>