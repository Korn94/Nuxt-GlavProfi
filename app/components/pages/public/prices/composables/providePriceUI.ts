// app/components/pages/public/prices/composables/providePriceUI.ts
/**
 * Провайдер UI-состояния прайс-листа.
 * 
 * Отвечает за:
 * - Состояние аккордеонов (открытые/закрытые подкатегории и вложенные элементы)
 * - Поиск по работам
 * - Фильтрацию по активным работам (для админа)
 * - Автоматический сброс UI-состояния при смене категории (slug)
 * 
 * ВАЖНО: Должен инициализироваться ПЕРВЫМ, до providePriceData и providePriceEdit,
 * так как они инжектят его для автооткрытия аккордеонов при добавлении элементов.
 */

import { ref, computed, watch, provide, inject, type Ref, type ComputedRef } from 'vue'
import { useRoute } from 'vue-router'

// ========================================
// 🔑 КЛЮЧ ДЛЯ PROVIDE/INJECT
// ========================================

export const PRICE_UI_KEY = Symbol('priceUI')

// ========================================
// 📋 ТИП КОНТЕКСТА
// ========================================

export interface PriceUIContext {
  /** Открытые подкатегории: subcategoryId → true */
  openSubcategories: Ref<Record<number, boolean>>
  
  /** Открытые вложенные элементы работ: itemId → true */
  openSubItems: Ref<Record<number, boolean>>
  
  /** Строка поиска */
  searchQuery: Ref<string>
  
  /** Фильтр по конкретной работе (для админа): 'all' | categoryId */
  activeWork: Ref<string | number>
  
  /** Вычисляемое: активен ли поиск */
  isSearching: ComputedRef<boolean>
  
  /** Переключить состояние аккордеона подкатегории */
  toggleSubcategory: (id: number) => void
  
  /** Переключить состояние вложенных элементов работы */
  toggleSubItems: (id: number) => void
  
  /** Открыть аккордеон подкатегории (принудительно) */
  openSubcategory: (id: number) => void
  
  /** Открыть вложенные элементы работы (принудительно) */
  openSubItemsFor: (id: number) => void
  
  /** Очистить поиск */
  clearSearch: () => void
  
  /** Сбросить всё UI-состояние (используется при смене slug) */
  resetUIState: () => void
}

// ========================================
// 🏗️ ПРОВЕЙДЕР
// ========================================

/**
 * Инициализирует UI-контекст прайс-листа.
 * Автоматически сбрасывает состояние при смене категории (slug).
 */
export function providePriceUI(): PriceUIContext {
  const route = useRoute()
  
  // ========================================
  // 📊 РЕАКТИВНОЕ СОСТОЯНИЕ
  // ========================================
  
  const openSubcategories = ref<Record<number, boolean>>({})
  const openSubItems = ref<Record<number, boolean>>({})
  const searchQuery = ref('')
  const activeWork = ref<string | number>('all')
  
  // ========================================
  // 🧮 ВЫЧИСЛЯЕМЫЕ СВОЙСТВА
  // ========================================
  
  const isSearching = computed(() => searchQuery.value.trim().length > 0)
  
  // ========================================
  // 🎯 МЕТОДЫ
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
  
  /** Полный сброс UI-состояния */
  const resetUIState = () => {
    openSubcategories.value = {}
    openSubItems.value = {}
    searchQuery.value = ''
    activeWork.value = 'all'
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
  watch(currentSlug, (newSlug, oldSlug) => {
    if (newSlug !== oldSlug && oldSlug !== undefined) {
      console.log(`🔄 Смена категории: ${oldSlug} → ${newSlug}, сбрасываем UI-состояние`)
      resetUIState()
    }
  })
  
  // ========================================
  // 🎁 ПУБЛИЧНЫЙ API
  // ========================================
  
  const context: PriceUIContext = {
    openSubcategories,
    openSubItems,
    searchQuery,
    activeWork,
    isSearching,
    
    toggleSubcategory,
    toggleSubItems,
    openSubcategory,
    openSubItemsFor,
    clearSearch,
    resetUIState
  }
  
  provide(PRICE_UI_KEY, context)
  
  return context
}

// ========================================
// 📥 ХУК ДЛЯ ПОЛУЧЕНИЯ КОНТЕКСТА
// ========================================

/**
 * Получает UI-контекст прайса, предоставленный родителем.
 * 
 * @throws Если контекст не был предоставлен
 */
export function usePriceUI(): PriceUIContext {
  const context = inject<PriceUIContext>(PRICE_UI_KEY)
  if (!context) {
    throw new Error(
      'usePriceUI: контекст не найден. ' +
      'Убедитесь, что providePriceUI() вызван в родительском компоненте.'
    )
  }
  return context
}
