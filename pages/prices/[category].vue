<template>
  <div>
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
    { property: 'og:url', content: `https://yourdomain.com/prices/${route.params.category}`  },
    { property: 'og:image', content: currentCategory.value.image || 'https://yourdomain.com/images/preview.jpg'  }
  ]
})
</script>

<style lang="scss" scoped>
h1 {
  margin-bottom: 3em;
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
</style>