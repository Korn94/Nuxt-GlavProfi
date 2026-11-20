<!-- app/pages/about.vue -->
<template>
  <PagesPublicAbout />
</template>

<script setup lang="ts">
const config = useRuntimeConfig()

const siteUrl = String(config.public.siteUrl || 'https://glavprofi.ru').replace(/\/$/, '')
const aboutUrl = `${siteUrl}/about`

const description = 'ГлавПрофи — компания с опытом работы с 2014 года. Специализируемся на ремонте и отделке коммерческих помещений под ключ. Узнайте больше о нашей команде, опыте и подходе к работе'

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'AboutPage',
      '@id': `${aboutUrl}#webpage`,
      url: aboutUrl,
      name: 'О компании ГлавПрофи',
      description,
      inLanguage: 'ru-RU',
      isPartOf: { '@id': `${siteUrl}/#website` },
      about: { '@id': `${siteUrl}/#organization` },
      breadcrumb: { '@id': `${aboutUrl}#breadcrumb` }
    },
    {
      '@type': 'BreadcrumbList',
      '@id': `${aboutUrl}#breadcrumb`,
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Главная',
          item: siteUrl
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'О компании',
          item: aboutUrl
        }
      ]
    }
  ]
}

useHead({
  title: 'О компании — ремонт коммерческих помещений в Рязани',
  meta: [
    { name: 'description', content: description },
    { name: 'keywords', content: 'о компании ГлавПрофи, ремонт коммерческих помещений Рязань, отделка под ключ, ремонт офисов, магазинов, складов, клиник, салонов, фитнес-клубов' },
    { property: 'og:title', content: 'О компании ГлавПрофи — более 250 проектов с 2014 года' },
    { property: 'og:description', content: description }
  ],
  script: [
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify(jsonLd)
    }
  ]
})
</script>
