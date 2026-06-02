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
import { useCurrentUser } from '~/composables/useCurrentUser'
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
  // 🧑 ПОЛУЧЕНИЕ ТЕКУЩЕГО ПОЛЬЗОВАТЕЛЯ
  // ========================================
  const { data: currentUserData } = useCurrentUser()

  // ========================================
  // 🔐 ВСПОМОГАТЕЛЬНАЯ ФУНКЦИЯ: определение роли
  // ========================================
  /**
   * 🆕 Берёт роль с приоритетом:
   * 1. authStore.user.role (гидратируется синхронно из куки — доступно сразу!)
   * 2. currentUserData.value.user.role (если /api/me уже завершился)
   *
   * Это решает проблему гонки состояний при SSR.
   */
  const getUserRole = (): string | undefined => {
    return authStore.user?.role ?? currentUserData.value?.user?.role
  }

  const isRoleAdmin = (role?: string): boolean => {
    return role === 'admin' || role === 'manager'
  }

  // ========================================
  // 📥 ЗАГРУЗКА ДАННЫХ ПРАЙСА
  // ========================================
  const {
    data: pricePayload,
    refresh: refreshData,
    error: priceError,
  } = useAsyncData(
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

      // 🆕 Используем умный геттер роли (authStore → useCurrentUser)
      const role = getUserRole()
      const isAdminUser = isRoleAdmin(role)

      console.log(
        `🔐 useAsyncData [price-${slug}]: роль="${role}", isAdminUser=${isAdminUser}, токен=${authStore.token ? '✅' : '❌'}`
      )

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

  // ========================================
  // 🔄 АВТООБНОВЛЕНИЕ ПРИ ЗАВЕРШЕНИИ АВТОРИЗАЦИИ
  // ========================================
  /**
   * 🆕 КРИТИЧЕСКИ ВАЖНО!
   *
   * Когда authStore.init() завершится (загрузит user из /api/auth/check),
   * мы пересчитываем isAdmin и обновляем dataStore.
   *
   * Это нужно потому что при первом SSR-рендере:
   * - authStore.user.role берётся из куки (быстро, но без полной проверки)
   * - useCurrentUser делает запрос к /api/me (медленнее)
   * - init() в authStore делает /api/auth/check (самый надёжный источник)
   *
   * Любой из этих источников может "дозагрузить" правильную роль,
   * и мы должны это отразить в UI.
   */
  watch(
    () => authStore.user?.role,
    (newRole, oldRole) => {
      if (newRole && newRole !== oldRole) {
        const isAdminUser = isRoleAdmin(newRole)
        console.log(
          `🔄 authStore.user.role обновился: "${oldRole}" → "${newRole}", isAdmin=${isAdminUser}`
        )

        // Обновляем флаг в dataStore напрямую
        dataStore.setData({
          priceData: pricePayload.value?.priceData ?? null,
          isAdminUser,
        })
      }
    },
    { immediate: false } // Не запускаем сразу — ждём реального изменения
  )

  // Дополнительный watch на currentUserData (для полноты картины)
  watch(
    () => currentUserData.value?.user?.role,
    (newRole) => {
      // Только если authStore ещё не дал роль, и useCurrentUser принёс новую
      if (newRole && !authStore.user?.role) {
        const isAdminUser = isRoleAdmin(newRole)
        console.log(
          `🔄 currentUserData.role обновился: "${newRole}", isAdmin=${isAdminUser}`
        )
        dataStore.setData({
          priceData: pricePayload.value?.priceData ?? null,
          isAdminUser,
        })
      }
    }
  )

  // ========================================
  // 🎯 ОБРАБОТКА ОШИБОК
  // ========================================
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

  // ========================================
  // 🛡️ ЗАЩИТА ОТ ПОТЕРИ ДАННЫХ
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
