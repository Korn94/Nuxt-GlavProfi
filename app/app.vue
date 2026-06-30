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

const route = useRoute();
const config = useRuntimeConfig();

// Формируем путь БЕЗ trailing slash
let cleanPath = route.path;
if (cleanPath.endsWith('/')) {
  cleanPath = cleanPath.slice(0, -1); // убираем последний слеш
}

// Формируем полный URL текущей страницы — БЕЗ слеша на конце
const currentPageUrl = `${config.public.siteUrl}${cleanPath}`;

// JSON-LD разметка (Organization + WebSite)
const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': `${config.public.siteUrl}/#organization`,
      name: 'ГлавПрофи',
      url: config.public.siteUrl,
      logo: `${config.public.siteUrl}/og-image.jpg`,
      description: 'Ремонт и отделка коммерческих помещений под ключ в Рязани и области',
      address: {
        '@type': 'PostalAddress',
        addressLocality: 'Рязань',
        addressRegion: 'Рязанская область',
        addressCountry: 'RU'
      },
      contactPoint: {
        '@type': 'ContactPoint',
        telephone: '+7-910-909-69-47',
        contactType: 'customer service'
      }
    },
    {
      '@type': 'WebSite',
      '@id': `${config.public.siteUrl}/#website`,
      url: config.public.siteUrl,
      name: 'ГлавПрофи — Ремонт коммерческих помещений',
      description: 'Ремонт и отделка коммерческих помещений под ключ в Рязани и области',
      inLanguage: 'ru',
      publisher: {
        '@id': `${config.public.siteUrl}/#organization`
      }
    }
  ]
};

useHead({
  htmlAttrs: {
    lang: 'ru'
  },
  titleTemplate: '%s | ГлавПрофи',
  meta: [
    // Глобальные мета из config
    ...metaTags,
    // Динамический og:url
    { property: 'og:url', content: currentPageUrl },
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
    // Динамический canonical URL
    { rel: 'canonical', href: currentPageUrl }
  ],
  script: [
    ...scriptTags,
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify(jsonLd)
    }
  ]
});
</script>