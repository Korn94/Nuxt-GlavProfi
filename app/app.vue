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

// Применяем глобальные мета-теги
useHead({
  htmlAttrs: {
    lang: 'ru'
  },
  titleTemplate: siteMeta.titleTemplate,
  meta: metaTags,
  link: linkTags,
  script: scriptTags
});
</script>