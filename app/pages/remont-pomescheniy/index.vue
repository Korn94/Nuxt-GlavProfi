<!-- app/pages/remont-pomescheniy/index.vue -->
<template>
  <!-- <div class="commercial-repair"> -->
    <!-- Основной контент страницы (ваш компонент с блоками) -->
    <PagesPublicRemontPomescheniyIndex />
    
    <!-- ✅ Калькулятор: простая обёртка без ClientOnly -->
    <!-- <section id="calculator" class="calculator-section">
      <UiCalculator />
    </section> -->
  <!-- </div> -->
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

<style lang="scss" scoped>
@use "@/assets/styles/variables" as *;

.commercial-repair {
  position: relative;
  overflow: hidden;

  .wrap {
    background: $background-dark;
    padding-top: 8em;
    position: relative;
    &::before {
      content: '';
      position: absolute;
      top: 0; left: 0; width: 100%; height: 100%;
      background: radial-gradient(circle at 5% 0%, $blue20 0%, transparent 10%);
      pointer-events: none;
    }
  }

  .calculator-section {
    padding: $spacing-xl 0;
    background: $background-light;
    min-height: 650px; /* Фиксирует место */
    max-width: 800px;
    margin: 5em auto;
  }
}

/* ✅ Плейсхолдер: одинаковый на сервере и клиенте */
.calculator-placeholder {
  position: relative;
  min-height: 400px;
}

.calculator-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 400px;
  color: $text-secondary;
  font-size: 1rem;
  .spinner {
    width: 32px; height: 32px;
    border: 3px solid $border-color;
    border-top-color: $primary;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 12px;
  }
}

@keyframes spin { to { transform: rotate(360deg); } }
</style>