<template>
  <div class="wrap">
    <h1>Цены на ремонт помещений - <span>2025</span></h1>
    <UIElementsOffer 
      title="Не тратьте время на изучение прайс-листа!"
      description="Отправьте запрос — мы сами всё посчитаем быстро и бесплатно"
      buttonText="Заказать расчет"
    />

    <PagesPrices 
      :categories="categories" 
      :active-category="route.params.category" 
      @update:active-category="setCategory" 
    />

    <UIElementsOffer 
      title="Делимся своими оптовыми скидками на материал"
      description="Наши клиенты получают лучшие цены на строительные материалы для своего объекта. Так же помогаем в организации закупок и логистики"
      buttonText="Связаться"
    />

    <!-- <PagesHomePageCall /> -->
    <!-- <PagesHomePageCalc /> -->
  </div>
</template>

<script setup>
import { useRoute } from 'vue-router'
import { useRouter } from 'vue-router'
import { useAsyncData, createError, useHead } from '#app'

const route = useRoute()
const router = useRouter()

definePageMeta({
  middleware: 'auth'
})

// Загрузка данных о страницах цен
const { data, error } = await useAsyncData('price-pages', () =>
  $fetch('/api/price/pages')
)

// Проверка ошибки загрузки
if (error?.value) {
  throw createError({ 
    statusCode: 500, 
    message: 'Ошибка загрузки данных' 
  })
}

const filteredData = computed(() => {
  return data.value?.find(page => page.slug === route.params.category) || {}
})

// Извлечение категорий из данных
const categories = computed(() => {
  return data.value?.map(page => ({
    id: page.id,
    name: page.title,
    slug: page.slug
  })) || []
})

// Найдите текущую категорию по slug
const currentCategory = computed(() => {
  return data.value?.find(page => page.slug === route.params.category) || null
})

// Проверка существования текущей категории
if (!currentCategory.value) {
  throw createError({ statusCode: 404, message: 'Страница не найдена' })
}

// Обработчик смены категории
const setCategory = (categoryId) => {
  router.push({ params: { category: categoryId } })
}

// Установка метатегов
useHead({
  title: currentCategory.value.metaTitle,
  meta: [
    { name: 'description', content: currentCategory.value.metaDescription },
    { property: 'og:title', content: currentCategory.value.metaTitle },
    { property: 'og:description', content: currentCategory.value.metaDescription },
    { property: 'og:url', content: `https://yourdomain.com/prices/${route.params.category}` },
    { property: 'og:image', content: currentCategory.value.image || 'https://yourdomain.com/images/preview.jpg' }
  ],
  script: [
    {
      type: 'application/ld+json',
      key: 'price-schema',
      innerHTML: () => {
        // Проверяем, есть ли данные
        if (!data.value) return ''

        // Находим текущую страницу (категорию)
        const page = data.value.find(p => p.slug === route.params.category)
        if (!page) return ''

        const services = []

        // Проходим по всем категориям, подкатегориям и работам
        for (const category of page.categories || []) {
          for (const subcategory of category.subcategories || []) {
            for (const item of subcategory.items || []) {
              // Основная работа
              services.push({
                '@type': 'Offer',
                'itemOffered': {
                  '@type': 'Service',
                  'name': item.name
                },
                'price': parseFloat(item.price) || 0,
                'priceCurrency': 'RUB',
                'unitCode': 'MTR'
              })

              // Детали (например, "грунтовка", "шпаклёвка")
              for (const detail of item.details || []) {
                services.push({
                  '@type': 'Offer',
                  'itemOffered': {
                    '@type': 'Service',
                    'name': detail.name
                  },
                  'price': parseFloat(detail.price) || 0,
                  'priceCurrency': 'RUB',
                  'availability': 'https://schema.org/InStock'
                })
              }

              // Дополнительные работы (например, "демонтаж")
              for (const dopwork of item.dopworks || []) {
                services.push({
                  '@type': 'Offer',
                  'itemOffered': {
                    '@type': 'Service',
                    'name': dopwork.dopwork
                  },
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
          'name': currentCategory.value.metaTitle,
          'description': currentCategory.value.metaDescription,
          'provider': {
            '@type': 'Organization',
            'name': 'РемонтПрофи' // ← замените на имя вашей компании
          },
          'areaServed': 'Россия', // ← можно уточнить: Москва, СПб и т.д.
          'hasOfferCatalog': {
            '@type': 'OfferCatalog',
            'name': `Прайс-лист на ${currentCategory.value.title}`,
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
  margin: 0 5px;

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