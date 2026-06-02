// app/composables/usePriceStores.ts
/**
 * 🎯 Оркестратор Pinia-сторов раздела прайс-листа.
 *
 * Единая точка инициализации для страницы [category].vue:
 * - Создаёт все 3 Pinia-стора (UI, Data, Edit)
 * - Загружает данные через useAsyncData (в правильном месте для Nuxt Suspense)
 * - Передаёт данные в DataStore через setData()
 * - Регистрирует ВСЕ cleanup-хуки:
 *   • onBeforeRouteLeave — предупреждение при несохранённых изменениях
 *   • beforeunload — защита от закрытия вкладки
 *   • onUnmounted — полный сброс всех сторов (размонтирование)
 *
 * Итог: страница [category].vue превращается в "тонкий" компонент
 * без знаний о внутренностях Pinia или lifecycle-хуках.
 */

import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter, onBeforeRouteLeave } from 'vue-router'
import { useAsyncData, createError } from 'nuxt/app'
import { useAuthStore } from 'stores/auth'
import { usePriceUIStore } from 'stores/price/usePriceUIStore'
import { usePriceDataStore } from 'stores/price/usePriceDataStore'
import { usePriceEditStore } from 'stores/price/usePriceEditStore'
import type { ApiPriceListResponse, PricePage } from 'stores/price/types'

/**
 * Главный composable страницы прайс-листа.
 * Вызывается один раз в setup() компонента [category].vue.
 */
export function usePriceStores() {
  // ========================================
  // 🧭 ROUTER & ROUTE
  // ========================================
  const route = useRoute()
  const router = useRouter()
  const authStore = useAuthStore()

  // ========================================
  // 🏪 ИНИЦИАЛИЗАЦИЯ STORES (порядок не важен — Pinia!)
  // ========================================
  const uiStore = usePriceUIStore()
  const dataStore = usePriceDataStore()
  const editStore = usePriceEditStore()

  // ========================================
  // 📍 SLUG ТЕКУЩЕЙ КАТЕГОРИИ
  // ========================================
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
  // 📥 ЗАГРУЗКА ДАННЫХ ПРАЙСА (useAsyncData + transform)
  // ========================================
  const {
    data: pricePayload,
    refresh: refreshData,
    error: priceError,
  } = useAsyncData(
    () => `price-${currentSlug.value}`,
    async () => {
      // 🛡️ УБРАЛИ проверку isComponentMounted — она мешала перезапуску
      if (!currentSlug.value) {
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

      const priceData = await $fetch<ApiPriceListResponse>(
        `/api/price/list/${currentSlug.value}`,
        { headers },
      )

      return { priceData, isAdminUser }
    },
    {
      server: true,
      lazy: false,
      watch: [currentSlug], // ← КЛЮЧЕВОЕ ИЗМЕНЕНИЕ: перезапуск при смене slug
      default: () => ({ priceData: null, isAdminUser: false }),
      transform: (payload) => {
        dataStore.setData(payload)
        return payload
      },
    },
  )

  // ========================================
  // 🔄 СИНХРОНИЗАЦИЯ С DATA STORE (для клиентских обновлений)
  // ========================================
  // БЕЗ immediate: true, чтобы не затирать данные, загруженные через transform.
  // Watch нужен только для клиентских обновлений (refresh(), изменение slug).
  watch(
    pricePayload,
    newData => {
      if (newData) {
        // refreshData доступен здесь (после возврата из useAsyncData)
        dataStore.setData(newData, refreshData)
      } else {
        dataStore.setData(null)
      }
    },
  )

  watch(
    priceError,
    err => {
      dataStore.setError(err)
    },
    { immediate: true },
  )

  // ========================================
  // 📥 ЗАГРУЗКА СПИСКА СТРАНИЦ (навигация)
  // ========================================
  const { data: pagesData, error: pagesError } = useAsyncData<PricePage[]>(
    'price-pages',
    () => $fetch<PricePage[]>('/api/price/pages'),
  )

  if (pagesError.value) {
    throw createError({ statusCode: 500, message: 'Ошибка загрузки списка категорий' })
  }

  // ========================================
  // 🧭 НАВИГАЦИЯ ПО КАТЕГОРИЯМ
  // ========================================
  const setCategory = (categorySlug: string) => {
    router.push({ params: { category: categorySlug } })
  }

  // ========================================
  // ⚠️ ПРЕДУПРЕЖДЕНИЕ О НЕСОХРАНЁННЫХ ИЗМЕНЕНИЯХ
  // ========================================
  onBeforeRouteLeave((to, from) => {
    if (editStore.hasUnsavedChanges) {
      const answer = window.confirm(
        'У вас есть несохранённые изменения. Покинуть страницу?',
      )
      return answer
    }
    return true
  })

  // ========================================
  // 🛡️ ЗАЩИТА ОТ СЛУЧАЙНОГО ЗАКРЫТИЯ ВКЛАДКИ
  // ========================================
  const handleBeforeUnload = (e: BeforeUnloadEvent) => {
    if (editStore.hasUnsavedChanges) {
      e.preventDefault()
      e.returnValue = ''
    }
  }

  if (import.meta.client) {
    onMounted(() => window.addEventListener('beforeunload', handleBeforeUnload))
  }

  // ========================================
  // 🧹 РАЗМОНТИРОВАНИЕ: полный сброс всех сторов
  // ========================================
  onUnmounted(() => {
    // 🛡️ Флаг: больше не делаем запросов
    isComponentMounted = false

    console.log('[usePriceStores] Размонтирование — сброс всех Pinia-сторов')

    // 🎨 UI Store — сброс аккордеонов, поиска, фильтров
    uiStore.resetUIState()

    // 📊 Data Store — очистка дерева данных (через setData(null))
    dataStore.setData(null)

    // ✏️ Edit Store — сброс всех форм редактирования и добавления
    editStore.clearAllEditStates()

    // 🛡️ Удаление глобального listener
    if (import.meta.client) {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  })

  // ========================================
  // 🎁 ПУБЛИЧНЫЙ API ДЛЯ СТРАНИЦЫ
  // ========================================
  return {
    // Данные
    pricePayload,
    priceError,
    refreshData,
    pagesData,
    pagesError,

    // Роутинг
    currentSlug,
    setCategory,
  }
}
