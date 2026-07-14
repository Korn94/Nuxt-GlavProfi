<!-- app/pages/projects/index.vue -->
<template>
  <PagesPublicProjects />
</template>

<script setup>
// === 1. Мета-теги ===
useSeoMeta({
  title: 'Портфолио: реализованные коммерческие объекты | ГлавПрофи',
  description: 'Реальные кейсы ремонта офисов, клиник, магазинов и производств в Рязани. Площади, сроки, выполненные работы — без рендеров и маркетинговых обещаний.',
  ogTitle: 'Портфолио ГлавПрофи — 250+ коммерческих объектов',
  ogDescription: 'Ремонт офисов, клиник, магазинов, производств. Фиксированная смета, сроки по договору, гарантия 3 года.',
  ogImage: 'https://glavprofi.ru/og-remont-kommercheskih.jpg',
})

// === 2. Structured Data: CollectionPage + ItemList ===
useHead({
  script: [
    {
      type: 'application/ld+json',
      children: JSON.stringify({
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'CollectionPage',
            name: 'Портфолио ГлавПрофи',
            description: 'Реализованные проекты ремонта коммерческой недвижимости',
            url: 'https://glavprofi.ru/projects',
            isPartOf: { '@type': 'WebSite', name: 'ГлавПрофи', url: 'https://glavprofi.ru' }
          },
          {
            '@type': 'ItemList',
            name: 'Реализованные объекты',
            description: 'Галерея выполненных работ по ремонту коммерческих помещений',
            numberOfItems: 252,
            itemListOrder: 'https://schema.org/ItemListOrderDescending'
          }
        ]
      })
    }
  ]
})
</script>