<template>
  <div class="wrap">
    <!-- <h1>Цены на ремонт помещений - <span>2025</span></h1> -->
    <UiWidgetsOffer 
      title="Не тратьте время на изучение прайс-листа!"
      description="Отправьте запрос — мы сами всё посчитаем быстро и бесплатно"
      buttonText="Заказать расчет"
    />

    <PagesPublicPrices 
      :categories="categories" 
      :active-category="route.params.category" 
      @update:active-category="setCategory" 
    />

    <UiWidgetsOffer 
      title="Делимся своими оптовыми скидками на материал"
      description="Наши клиенты получают лучшие цены на строительные материалы для своего объекта. Так же помогаем в организации закупок и логистики"
      buttonText="Связаться"
    />
  </div>
</template>

<script setup>
import { useRoute } from 'vue-router'
import { useRouter } from 'vue-router'
import { computed } from 'vue'
import { useAsyncData, createError, useHead } from '#app'

const route = useRoute()
const router = useRouter()

definePageMeta({
  middleware: 'auth'
})

// Загрузка данных о страницах цен (для навигации)
const { data: pagesData, error: pagesError } = await useAsyncData('price-pages', () =>
  $fetch('/api/price/pages')
)

// Проверка ошибки загрузки списка категорий
if (pagesError?.value) {
  throw createError({ 
    statusCode: 500, 
    message: 'Ошибка загрузки списка категорий' 
  })
}

// --- НОВОЕ: Жестко заданный маппинг URL -> Title ---
const categoryTitles = {
  'otdelochnye-raboty': 'Цены на отделочные работы - 2025',
  'plumbing': 'Цены на ремонт сантехники - 2025',
  'electricity': 'Цены на ремонт электрики - 2025',
}

// Получаем title для текущей категории
const pageTitle = computed(() => {
  return categoryTitles[route.params.category] || 'Цены на ремонт - 2025 | ГлавПрофи'
})
// --- КОНЕЦ НОВОГО КОДА ---

// Извлечение категорий из данных (для навигации)
const categories = computed(() => {
  return pagesData.value?.map(page => ({
    id: page.id,
    name: page.title,
    slug: page.slug
  })) || []
})

// Найдите текущую категорию по slug (для данных прайса)
const currentCategory = computed(() => {
  return pagesData.value?.find(page => page.slug === route.params.category) || null
})

// Проверка существования текущей категории
if (!currentCategory.value) {
  throw createError({ statusCode: 404, message: 'Страница не найдена' })
}

// Обработчик смены категории
const setCategory = (categoryId) => {
  router.push({ params: { category: categoryId } })
}

// --- НОВОЕ: Используем pageTitle в useHead ---
useHead({
  title: pageTitle,
  meta: [
    // Используем описание из API, если есть, иначе fallback
    { name: 'description', content: currentCategory.value?.metaDescription || 'Актуальные цены 2025 на ремонт помещений. Составим смету бесплатно.' },
    { property: 'og:title', content: pageTitle },
    { property: 'og:description', content: currentCategory.value?.metaDescription || 'Актуальные цены 2025 на ремонт помещений. Составим смету бесплатно.' },
    { property: 'og:image', content: currentCategory.value?.image || 'https://glavprofi.ru/images/og-image.jpg' },
    { property: 'og:url', content: `https://glavprofi.ru/prices/${route.params.category}` },
    { property: 'og:type', content: 'website' },
    { name: 'author', content: 'ГлавПрофи' },
    { name: 'robots', content: 'index, follow' },
    { name: 'keywords', content: 'ремонт, отделка, коммерческие помещения, Рязань' },
    { name: 'yandex-verification', content: '20069298ebe4c5a9' },
    { name: 'google-site-verification', content: 'LKcZiHnWxVZA1TiAOOcActZaanDDvdxFhs4pEELAsak' },
  ],
  link: [
    { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
    { rel: 'canonical', href: `https://glavprofi.ru/prices/${route.params.category}` },
  ],
  script: [
    {
      type: 'application/ld+json',
      key: 'price-schema',
      innerHTML: () => {
        if (!pagesData.value) return ''
        const page = pagesData.value.find(p => p.slug === route.params.category)
        if (!page) return ''

        const services = []
        for (const category of page.categories || []) {
          for (const subcategory of category.subcategories || []) {
            for (const item of subcategory.items || []) {
              services.push({
                '@type': 'Offer',
                'itemOffered': { '@type': 'Service', 'name': item.name },
                'price': parseFloat(item.price) || 0,
                'priceCurrency': 'RUB',
                'availability': 'https://schema.org/InStock'
              })

              for (const detail of item.details || []) {
                services.push({
                  '@type': 'Offer',
                  'itemOffered': { '@type': 'Service', 'name': detail.name },
                  'price': parseFloat(detail.price) || 0,
                  'priceCurrency': 'RUB',
                  'availability': 'https://schema.org/InStock'
                })
              }

              for (const dopwork of item.dopworks || []) {
                services.push({
                  '@type': 'Offer',
                  'itemOffered': { '@type': 'Service', 'name': dopwork.dopwork },
                  'price': parseFloat(dopwork.price) || 0,
                  'priceCurrency': 'RUB',
                  'availability': 'https://schema.org/InStock'
                })
              }
            }
          }
        }

        return JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'Service',
          'serviceType': 'Ремонтные работы',
          'name': pageTitle.value, // Используем статичный title
          'description': currentCategory.value?.metaDescription || 'Актуальные цены 2025 на ремонт помещений. Составим смету бесплатно.',
          'provider': { '@type': 'Organization', 'name': 'ГлавПрофи' },
          'areaServed': 'Россия, Рязань',
          'hasOfferCatalog': {
            '@type': 'OfferCatalog',
            'name': `Прайс-лист на ${currentCategory.value?.title || 'ремонт'}`,
            'itemListElement': services
          }
        })
      }
    }
  ]
})
</script>

<style lang="scss" scoped>
.wrap {
  margin: 10em 5px 0;

  h1 {
    margin-bottom: 3em;
    text-align: center;
  }
  
  button {
    padding: 10px 20px;
    min-width: 150px;
    margin-top: 1.5em;
    background: linear-gradient(to right, #00c3f5, #00a3d3);
    color: white;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    transition: background 0.3s ease;
    
    &:hover {
      background: #00a3d3;
    }
  }
}
</style>