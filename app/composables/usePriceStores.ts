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
import { useCurrentUser } from '~/composables/useCurrentUser' // ← ДОБАВИТЬ
import type { ApiPriceListResponse, PricePage } from 'stores/price/types'

export function usePriceStores() {
  const route = useRoute()
  const router = useRouter()
  const authStore = useAuthStore()

  const uiStore = usePriceUIStore()
  const dataStore = usePriceDataStore()
  const editStore = usePriceEditStore()

  const currentSlug = computed<string>(() => {
    const param = route.params.category
    return (Array.isArray(param) ? param[0] : param) || ''
  })

  if (currentSlug.value.includes('.')) {
    throw createError({ statusCode: 404, message: 'Страница не найдена' })
  }

  let isComponentMounted = true

  // ========================================
  // 🧑 ПОЛУЧЕНИЕ ТЕКУЩЕГО ПОЛЬЗОВАТЕЛЯ (ГЛОБАЛЬНЫЙ КЭШ)
  // ========================================
  // ✅ Этот запрос выполнится ОДИН раз за всю сессию.
  // При переходе между категориями прайса Nuxt вернёт кэшированный результат.
  const { data: currentUserData } = useCurrentUser()

  // ========================================
  // 📥 ЗАГРУЗКА ДАННЫХ ПРАЙСА (useAsyncData + transform)
  // ========================================
  const {
    data: pricePayload,
    refresh: refreshData,
    error: priceError,
  } = useAsyncData(
    // ✅ Статический ключ на основе route.params (не computed!)
    `price-${String(route.params.category)}`,
    async () => {
      const slug = String(route.params.category)
      if (!slug || slug.includes('.')) {
        return { priceData: null, isAdminUser: false }
      }

      const headers: Record<string, string> = {}
      if (authStore.token) {
        headers.Authorization = `Bearer ${authStore.token}`
      }

      const role = currentUserData.value?.user?.role
      const isAdminUser = role === 'admin' || role === 'manager'

      const priceData = await $fetch<ApiPriceListResponse>(
        `/api/price/list/${slug}`,
        { headers },
      )

      return { priceData, isAdminUser }
    },
    {
      server: true,
      lazy: false,
      default: () => ({ priceData: null, isAdminUser: false }),
      dedupe: 'defer',
      transform: (payload) => {
        dataStore.setData(payload)
        return payload
      },
    },
  )

  // ❌ УДАЛИТЬ ВЕСЬ ЭТОТ БЛОК:
  // watch(pricePayload, newData => { ... })
  // ↑ Он дублировал transform и вызывал лишние setData

  watch(
    priceError,
    (err) => {
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
    {
      server: true,
      lazy: false,
    },
  )

  if (pagesError.value) {
    throw createError({ statusCode: 500, message: 'Ошибка загрузки списка категорий' })
  }

  const setCategory = (categorySlug: string) => {
    router.push({ params: { category: categorySlug } })
  }

  onBeforeRouteLeave((to, from) => {
    if (editStore.hasUnsavedChanges) {
      const answer = window.confirm(
        'У вас есть несохранённые изменения. Покинуть страницу?',
      )
      return answer
    }
    return true
  })

  const handleBeforeUnload = (e: BeforeUnloadEvent) => {
    if (editStore.hasUnsavedChanges) {
      e.preventDefault()
      e.returnValue = ''
    }
  }

  if (import.meta.client) {
    onMounted(() => window.addEventListener('beforeunload', handleBeforeUnload))
  }

  onUnmounted(() => {
    isComponentMounted = false
    console.log('[usePriceStores] Размонтирование — сброс всех Pinia-сторов')

    uiStore.resetUIState()
    // ❌ УБРАЛИ dataStore.setData(null)
    editStore.clearAllEditStates()

    if (import.meta.client) {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  })

  return {
    pricePayload,
    priceError,
    refreshData,
    pagesData,
    pagesError,
    currentSlug,
    setCategory,
  }
}
