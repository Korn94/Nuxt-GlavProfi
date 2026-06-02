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
import { computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute, useRouter, onBeforeRouteLeave } from 'vue-router'
import { createError, useAsyncData } from 'nuxt/app'
import { usePriceSeo } from '~/composables/usePriceSeo'
import {
  providePriceUI,
  providePriceData,
  providePriceEdit,
  type PricePage
} from '~/components/pages/public/prices/composables'

// ========================================
// 🎯 ИНИЦИАЛИЗАЦИЯ ПРОВАЙДЕРОВ
// ========================================
// 
// Порядок больше не критичен, так как providePriceEdit
// инжектит usePriceData() только в обработчиках событий.
//
// ========================================

// 1️⃣ UI-состояние
providePriceUI()

// 2️⃣ Данные прайса (БЕЗ await!)
providePriceData()

// 3️⃣ Состояние редактирования
const editContext = providePriceEdit()

// ========================================
// ⚠️ ПРЕДУПРЕЖДЕНИЕ О НЕСОХРАНЁННЫХ ИЗМЕНЕНИЯХ
// ========================================
onBeforeRouteLeave((to, from, next) => {
  if (editContext.hasUnsavedChanges.value) {
    const answer = window.confirm(
      'У вас есть несохранённые изменения. Вы уверены, что хотите покинуть страницу?'
    )
    next(answer)
  } else {
    next()
  }
})

// ========================================
// 🧭 ROUTER & ROUTE
// ========================================

const route = useRoute()
const router = useRouter()

// ========================================
// 📋 ДАННЫЕ СТРАНИЦЫ
// ========================================

// Текущий slug из параметров роута
const currentSlug = computed<string>(() => {
  const param = route.params.category
  return (Array.isArray(param) ? param[0] : param) || ''
})

// Загружаем список страниц прайса для навигации
const { data: pagesData, error: pagesError } = await useAsyncData<PricePage[]>(
  'price-pages',
  () => $fetch<PricePage[]>('/api/price/pages')
)

// Обработка ошибки загрузки страниц
if (pagesError.value) {
  throw createError({
    statusCode: 500,
    message: 'Ошибка загрузки списка категорий'
  })
}

// Список категорий для навигации (верхний таб-бар)
const categories = computed(() =>
  pagesData.value?.map(page => ({
    id: page.id,
    name: page.title,
    slug: page.slug
  })) || []
)

// Текущая страница (для 404 если slug не найден)
const currentCategory = computed(() =>
  pagesData.value?.find(page => page.slug === currentSlug.value) || null
)

// Если slug невалидный — 404
if (!currentCategory.value) {
  throw createError({
    statusCode: 404,
    message: 'Страница не найдена'
  })
}

// ========================================
// 🧭 ОБРАБОТКА НАВИГАЦИИ
// ========================================

/**
 * Переключение между категориями прайса (через роутер).
 */
const setCategory = (categorySlug: string) => {
  router.push({ params: { category: categorySlug } })
}

// ========================================
// 🔍 SEO (useHead + JSON-LD)
// ========================================

// Вызываем SEO-композабл — он сам загрузит данные и применит useHead
usePriceSeo(currentSlug.value)

// ========================================
// 🛡️ ДОПОЛНИТЕЛЬНАЯ ЗАЩИТА (опционально)
// ========================================

// Предупреждение при закрытии вкладки/перезагрузке страницы
if (import.meta.client) {
  const handleBeforeUnload = (e: BeforeUnloadEvent) => {
    if (editContext.hasUnsavedChanges.value) {
      e.preventDefault()
      e.returnValue = ''
    }
  }

  onMounted(() => {
    window.addEventListener('beforeunload', handleBeforeUnload)
  })

  onUnmounted(() => {
    window.removeEventListener('beforeunload', handleBeforeUnload)
  })
}
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