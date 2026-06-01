<!-- app\pages\prices\[category].vue -->
<template>
  <div class="wrap">
    <PagesPublicPrices
      :categories="categories"
      :active-category="currentSlug"
      @update:active-category="setCategory"
    />

    <UiWidgetsOffer
      title="Делимся своими оптовыми скидками на материал"
      description="Наши клиенты получают лучшие цены на строительные материалы для своего объекта. Так же помогаем в организации закупок и логистики"
      buttonText="Связаться"
    />
  </div>
</template>

<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import { computed } from 'vue'
import { useAsyncData, createError } from 'nuxt/app'
import { usePriceSeo } from '~/composables/usePriceSeo'
import { definePageMeta } from 'node_modules/nuxt/dist/pages/runtime'

// === Интерфейс для страницы прайса ===
interface PricePage {
  id: number
  title: string
  slug: string
  metaDescription?: string
  image?: string
}

const route = useRoute()
const router = useRouter()

definePageMeta({
  middleware: 'auth'
})

// ✅ currentSlug всегда string
const currentSlug = computed<string>(() => {
  const param = route.params.category
  return (Array.isArray(param) ? param[0] : param) || ''
})

// ✅ ИСПРАВЛЕНИЕ: Добавили дженерик <PricePage[]> к useAsyncData
const { data: pagesData, error: pagesError } = await useAsyncData<PricePage[]>(
  'price-pages',
  () => $fetch<PricePage[]>('/api/price/pages')
)

if (pagesError?.value) {
  throw createError({ statusCode: 500, message: 'Ошибка загрузки списка категорий' })
}

// ✅ Теперь pagesData.value имеет тип PricePage[] | null | undefined
// .map работает корректно
const categories = computed(() =>
  pagesData.value?.map(page => ({
    id: page.id,
    name: page.title,
    slug: page.slug
  })) || []
)

// ✅ .find работает корректно
const currentCategory = computed(() =>
  pagesData.value?.find(page => page.slug === currentSlug.value) || null
)

if (!currentCategory.value) {
  throw createError({ statusCode: 404, message: 'Страница не найдена' })
}

const setCategory = (categoryId: string) => {
  router.push({ params: { category: categoryId } })
}

// Вызываем SEO-композабл (он сам загрузит данные и применит useHead)
usePriceSeo(currentSlug.value)
</script>

<style lang="scss" scoped>
.wrap {
  margin: 8em 5px 0;

  @media (max-width: 840px) {
    margin: 2em 5px 0;
  }

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