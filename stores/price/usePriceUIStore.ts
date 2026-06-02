// stores\price\usePriceUIStore.ts
/**
 * 🎨 UI-стор раздела прайс-листа.
 *
 * Отвечает за:
 * - Состояние аккордеонов (открытые/закрытые подкатегории и вложенные элементы)
 * - Поиск по работам
 * - Фильтрацию по активным работам (для админа)
 * - 🆕 Переключатель режима "админ / обычный пользователь"
 * - Автоматический сброс UI-состояния при смене категории (slug)
 *
 * 💾 СОХРАНЕНИЕ В LOCALSTORAGE:
 * Состояние isAdminView сохраняется между сессиями, чтобы админу
 * не приходилось каждый раз включать режим редактирования вручную.
 */
import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { useRoute } from 'vue-router'

// ========================================
// 🔑 КОНСТАНТЫ
// ========================================
const STORAGE_KEY_ADMIN_VIEW = 'price-admin-view'

/**
 * Читает сохранённое состояние из localStorage (безопасно для SSR).
 * Возвращает `true` по умолчанию (админы сразу видят кнопки).
 */
function readAdminViewFromStorage(): boolean {
  if (import.meta.server) return true
  try {
    const stored = localStorage.getItem(STORAGE_KEY_ADMIN_VIEW)
    if (stored === null) return true
    return stored === 'true'
  } catch {
    return true
  }
}

export const usePriceUIStore = defineStore('price-ui', () => {
  // ========================================
  // 🧭 ROUTER (для watch на смену slug)
  // ========================================
  const route = useRoute()

  // ========================================
  // 📊 РЕАКТИВНОЕ СОСТОЯНИЕ
  // ========================================
  /** Открытые подкатегории: subcategoryId → true */
  const openSubcategories = ref<Record<number, boolean>>({})

  /** Открытые вложенные элементы работ: itemId → true */
  const openSubItems = ref<Record<number, boolean>>({})

  /** Строка поиска */
  const searchQuery = ref('')

  /** Фильтр по конкретной работе (для админа): 'all' | categoryId */
  const activeWork = ref<string | number>('all')

  /**
   * 🆕 Локальный переключатель показа админских кнопок.
   * Активен ТОЛЬКО для пользователей с ролью admin/manager.
   * Позволяет быстро переключаться между режимом редактирования и режимом просмотра.
   */
  const isAdminView = ref<boolean>(readAdminViewFromStorage())

  // ========================================
  // 💾 СОХРАНЕНИЕ СОСТОЯНИЯ В LOCALSTORAGE
  // ========================================
  watch(isAdminView, (newValue) => {
    if (import.meta.server) return
    try {
      localStorage.setItem(STORAGE_KEY_ADMIN_VIEW, String(newValue))
    } catch (err) {
      console.error('💾 Не удалось сохранить состояние режима просмотра:', err)
    }
  })

  // ========================================
  // 🧮 GETTERS (вычисляемые свойства)
  // ========================================
  /** Активен ли сейчас поиск? */
  const isSearching = computed(() => searchQuery.value.trim().length > 0)

  // ========================================
  // 🎯 ACTIONS (методы)
  // ========================================

  /**
   * Переключает состояние аккордеона подкатегории.
   * При активном поиске всегда открывает (чтобы показать результаты).
   */
  const toggleSubcategory = (id: number) => {
    if (isSearching.value) {
      // Во время поиска не даём закрыть — это сломает UX
      openSubcategories.value[id] = true
    } else {
      openSubcategories.value[id] = !openSubcategories.value[id]
    }
  }

  /**
   * Переключает состояние вложенных элементов работы (детали + доп. работы).
   */
  const toggleSubItems = (id: number) => {
    if (openSubItems.value[id]) {
      delete openSubItems.value[id]
    } else {
      openSubItems.value[id] = true
    }
  }

  /** Принудительно открывает аккордеон подкатегории */
  const openSubcategory = (id: number) => {
    openSubcategories.value[id] = true
  }

  /** Принудительно открывает вложенные элементы работы */
  const openSubItemsFor = (id: number) => {
    openSubItems.value[id] = true
  }

  /** Очищает строку поиска */
  const clearSearch = () => {
    searchQuery.value = ''
  }

  /**
   * Полный сброс UI-состояния.
   * ⚠️ НЕ сбрасывает isAdminView — это личное предпочтение пользователя.
   */
  const resetUIState = () => {
    openSubcategories.value = {}
    openSubItems.value = {}
    searchQuery.value = ''
    activeWork.value = 'all'
    // ℹ️ isAdminView остаётся нетронутым
  }

  /**
   * 🆕 Переключение режима просмотра (админ / обычный пользователь).
   * Используется плавающей FAB-кнопкой в правом нижнем углу.
   */
  const toggleAdminView = () => {
    isAdminView.value = !isAdminView.value
    console.log(
      `👁️ Режим просмотра: ${isAdminView.value ? 'Админ (редактирование)' : 'Обычный пользователь'}`
    )
  }

  // ========================================
  // 🔄 СБРОС ПРИ СМЕНЕ SLUG
  // ========================================
  // Вычисляемый slug из параметров роута
  const currentSlug = computed(() => {
    const param = route.params.category
    return (Array.isArray(param) ? param[0] : param) || ''
  })

  // Watch на изменение slug — сбрасываем UI при переходе между категориями
  // watch(currentSlug, (newSlug, oldSlug) => {
  //   if (newSlug !== oldSlug && oldSlug !== undefined) {
  //     console.log(`🔄 Смена категории: ${oldSlug} → ${newSlug}, сбрасываем UI-состояние`)
  //     resetUIState()
  //   }
  // })

  // ========================================
  // 🎁 ПУБЛИЧНЫЙ API
  // ========================================
  return {
    // Состояние
    openSubcategories,
    openSubItems,
    searchQuery,
    activeWork,
    isAdminView, // 🆕
    // Getters
    isSearching,
    // Actions
    toggleSubcategory,
    toggleSubItems,
    openSubcategory,
    openSubItemsFor,
    clearSearch,
    resetUIState,
    toggleAdminView, // 🆕
  }
})
