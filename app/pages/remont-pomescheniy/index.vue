<!-- app/pages/remont-pomescheniy/index.vue -->
<template>
  <PagesPublicRemontPomescheniyIndex />
</template>

<script setup>
// === 1. Базовые мета-теги (переопределяют глобальные из app.vue) ===
useSeoMeta({
  // Title: главный ключ + город + бренд (до 60 символов)
  title: 'Ремонт коммерческих помещений под ключ в Рязани | ГлавПрофи',
  
  // Description: продающий текст с ключами (до 160 символов)
  description: 'Ремонт офисов, складов, магазинов, производств в Рязани. Собственные бригады, договор, смета без скрытых доплат. Гарантия 3 года. Бесплатный выезд инженера.',
  
  // Open Graph (переопределяет глобальный)
  ogTitle: 'Ремонт коммерческих помещений под ключ | ГлавПрофи',
  ogDescription: 'Ремонт офисов, складов, магазинов. Договор, фиксированная смета, гарантия. Работаем с 2014 года.',
  ogImage: 'https://glavprofi.ru/og-remont-kommercheskih.jpg',
})

// === 2. Structured Data (Schema.org) — JSON-LD ===
useHead({
  script: [
    {
      type: 'application/ld+json',
      children: JSON.stringify({
        '@context': 'https://schema.org',
        '@graph': [
          // Услуга: ремонт коммерческих помещений
          {
            '@type': 'Service',
            name: 'Ремонт коммерческих помещений под ключ',
            serviceType: 'Ремонт и отделка коммерческой недвижимости',
            provider: {
              '@type': 'LocalBusiness',
              name: 'ГлавПрофи',
              image: 'https://glavprofi.ru/logo.png',
              telephone: '+7-900-123-45-67',
              priceRange: '₽₽₽',
              address: {
                '@type': 'PostalAddress',
                addressLocality: 'Рязань',
                addressCountry: 'RU'
              },
              areaServed: { '@type': 'City', name: 'Рязань' }
            },
            areaServed: { '@type': 'City', name: 'Рязань' },
            // Связь с под-страницами типов помещений
            hasOfferCatalog: {
              '@type': 'OfferCatalog',
              name: 'Типы помещений',
              itemListElement: [
                { '@type': 'OfferCatalog', name: 'Офисы', itemOffered: { '@type': 'Service', name: 'Ремонт офисов' } },
                { '@type': 'OfferCatalog', name: 'Склады', itemOffered: { '@type': 'Service', name: 'Ремонт складов' } },
                { '@type': 'OfferCatalog', name: 'Магазины', itemOffered: { '@type': 'Service', name: 'Ремонт магазинов' } },
                { '@type': 'OfferCatalog', name: 'Производство', itemOffered: { '@type': 'Service', name: 'Ремонт производственных помещений' } }
              ]
            }
          },
          // FAQ (если на странице есть аккордеон с вопросами)
          {
            '@type': 'FAQPage',
            mainEntity: [
              {
                '@type': 'Question',
                name: 'Работаете ли вы по безналичному расчету с НДС?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'Да. Работаем с юридическими лицами и ИП: с НДС и без. Предоставляем полный пакет закрывающих документов (КС-2, КС-3, счета-фактуры).'
                }
              },
              {
                '@type': 'Question',
                name: 'Как фиксируются изменения в ходе работ?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'Любые дополнительные работы согласовываем письменно: вы получаете смету на изменение, утверждаете — только потом начинаем. Никаких «сюрпризов» в финальном акте.'
                }
              },
              {
                '@type': 'Question',
                name: 'Можно ли начать работы до подписания полного договора?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'Да. Если нужно стартовать срочно, можем начать с протокола о намерениях или договора на предмонтажные работы (замер, аудит, демонтаж). Основной договор подписываем в процессе.'
                }
              }
            ]
          }
        ]
      })
    }
  ]
})
</script>