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
import { computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter, onBeforeRouteLeave } from 'vue-router'
import { createError, useAsyncData } from 'nuxt/app'
import { useAuthStore } from 'stores/auth'
import { usePriceSeo } from '~/composables/usePriceSeo'
import {
  providePriceUI, providePriceData, providePriceEdit,
  type PricePage, type ApiPriceListResponse
} from '~/components/pages/public/prices/composables'

// ========================================
// 🧭 ROUTER & ROUTE
// ========================================
const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const currentSlug = computed<string>(() => {
  const param = route.params.category
  return (Array.isArray(param) ? param[0] : param) || ''
})

// 🛡️ Блокируем запросы к файлам (sourcemap, скрипты)
if (currentSlug.value.includes('.')) {
  throw createError({ statusCode: 404, message: 'Страница не найдена' })
}

// ========================================
// 🛡️ ФЛАГ: компонент ещё смонтирован?
// ========================================
let isComponentMounted = true

// ========================================
// 1️⃣ UI-состояние (синхронно)
// ========================================
providePriceUI()

// ========================================
// 2️⃣ ЗАГРУЗКА ДАННЫХ
// ========================================
const {
  data: pricePayload,
  refresh: refreshData,
  error: priceError
} = await useAsyncData(
  () => `price-${currentSlug.value}`,
  async () => {
    // 🛡️ ЗАЩИТА: прерываем, если компонент размонтирован или slug пустой
    if (!isComponentMounted || !currentSlug.value) {
      return { priceData: null, isAdminUser: false }
    }

    const headers: Record<string, string> = {}
    if (authStore.token) {
      headers.Authorization = `Bearer ${authStore.token}`
    }

    let isAdminUser = false
    try {
      const me = await $fetch<{ user?: { role?: string } }>('/api/me', { headers })
      const role = me?.user?.role
      isAdminUser = role === 'admin' || role === 'manager'
    } catch (err) {
      console.warn('Не удалось проверить роль:', err)
    }

    // 🛡️ Ещё раз проверяем перед тяжёлым запросом
    if (!isComponentMounted) {
      return { priceData: null, isAdminUser: false }
    }

    const priceData = await $fetch<ApiPriceListResponse>(
      `/api/price/list/${currentSlug.value}`, { headers }
    )
    return { priceData, isAdminUser }
  },
  {
    server: true,
    lazy: false,
    // ❌ УБРАЛИ watch: [currentSlug] — это вызывало двойные запросы
    default: () => ({ priceData: null, isAdminUser: false })
  }
)

// ========================================
// 3️⃣ ПЕРЕДАЁМ ГОТОВЫЕ ДАННЫЕ В ПРОВАЙДЕР
// ========================================
providePriceData(pricePayload, refreshData, priceError)

// ========================================
// 4️⃣ СОСТОЯНИЕ РЕДАКТИРОВАНИЯ
// ========================================
const editContext = providePriceEdit()

// ========================================
// ⚠️ ПРЕДУПРЕЖДЕНИЕ О НЕСОХРАНЁННЫХ ИЗМЕНЕНИЯХ
// ========================================
onBeforeRouteLeave((to, from) => {
  if (editContext.hasUnsavedChanges.value) {
    const answer = window.confirm('У вас есть несохранённые изменения. Покинуть страницу?')
    return answer  // ✅ Возвращаем значение (без next())
  }
  return true
})

// ========================================
// 📋 ДАННЫЕ СТРАНИЦЫ (навигация)
// ========================================
const { data: pagesData, error: pagesError } = await useAsyncData<PricePage[]>(
  'price-pages',
  () => $fetch<PricePage[]>('/api/price/pages')
)

if (pagesError.value) {
  throw createError({ statusCode: 500, message: 'Ошибка загрузки списка категорий' })
}

const categories = computed(() =>
  (pagesData.value ?? []).map(page => ({
    id: page.id, name: page.title, slug: page.slug
  }))
)

const currentCategory = computed(() =>
  (pagesData.value ?? []).find(page => page.slug === currentSlug.value) || null
)

if (!currentCategory.value) {
  throw createError({ statusCode: 404, message: 'Страница не найдена' })
}

const setCategory = (categorySlug: string) => {
  router.push({ params: { category: categorySlug } })
}

// ========================================
// 🔍 SEO
// ========================================
usePriceSeo(currentSlug.value, pricePayload, pagesData)

// ========================================
// 🛡️ ЗАЩИТА ОТ СЛУЧАЙНОГО ЗАКРЫТИЯ
// ========================================
// ✅ Объявляем функцию НА УРОВНЕ setup (вне if)
const handleBeforeUnload = (e: BeforeUnloadEvent) => {
  if (editContext.hasUnsavedChanges.value) {
    e.preventDefault()
    e.returnValue = ''
  }
}

// ✅ Регистрируем listener только на клиенте
if (import.meta.client) {
  onMounted(() => window.addEventListener('beforeunload', handleBeforeUnload))
}

// ========================================
// 🧹 ОЧИСТКА ПРИ РАЗМОНТИРОВАНИИ
// ========================================
onUnmounted(() => {
  // 🛡️ Флаг: больше не делаем запросов
  isComponentMounted = false
  
  // 🧹 Очищаем состояние редактирования
  if (editContext.clearAllEditStates) {
    editContext.clearAllEditStates()
  }
  
  // ✅ handleBeforeUnload теперь доступен здесь!
  if (import.meta.client) {
    window.removeEventListener('beforeunload', handleBeforeUnload)
  }
  
  // console.log('[Prices Page] Компонент размонтирован, состояние очищено')
})
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