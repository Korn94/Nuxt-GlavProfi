// stores\price\usePriceDataStore.ts
/**
 * 📊 Data-стор раздела прайс-листа.
 *
 * Отвечает за:
 * - Хранение реактивного дерева прайса (полученного из useAsyncData на странице)
 * - CRUD операции с оптимистичными обновлениями (мгновенная реакция UI + откат при ошибке)
 * - Drag & Drop (изменение порядка элементов)
 * - Копирование названий в буфер обмена
 * - Интеграцию с UI-стором (автооткрытие аккордеонов при добавлении элементов)
 *
 * ВАЖНО: Это "чистый" State Manager. Он НЕ делает HTTP-запросов для первичной загрузки.
 * Все данные передаются через метод `setData()` со страницы [category].vue,
 * где вызов useAsyncData находится в правильном месте для работы Nuxt Suspense.
 */

import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useAuthStore } from 'stores/auth'
import { usePriceUIStore } from './usePriceUIStore'
import type {
  PriceCategory,
  PriceSubcategory,
  PriceWorkItem,
  PriceDetailItem,
  PriceDopworkItem,
  PriceEntity,
  NewWorkForm,
  NewDetailForm,
  NewDopworkForm,
  ReorderItem,
  ApiPriceListResponse,
  ApiCreateResponse,
  ApiUpdateResponse,
  ApiDeleteResponse,
  PricePayload,
} from './types'

export const usePriceDataStore = defineStore('price-data', () => {
  // ========================================
  // 📊 РЕАКТИВНОЕ СОСТОЯНИЕ
  // ========================================
  /** Реактивное дерево категорий прайса */
  const works = ref<PriceCategory[]>([])
  /** Текущий пользователь — админ/менеджер? */
  const isAdmin = ref(false)
  /** Флаг загрузки */
  const isLoading = ref(false)
  /** Сообщение об ошибке загрузки */
  const errorMessage = ref('')
  /** Функция перезагрузки данных (передаётся со страницы, сохраняет связь с useAsyncData) */
  let _refreshFn: (() => Promise<void>) | null = null

  // ========================================
  // 🛠️ ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
  // ========================================

  /**
   * Глубокое клонирование объекта (для создания snapshot при оптимистичных обновлениях).
   */
  function deepClone<T>(obj: T): T {
    return JSON.parse(JSON.stringify(obj))
  }

  /**
   * Парсит цену из формы (string | number) в формат для БД.
   */
  function parsePrice(price: string | number): number {
    if (typeof price === 'number') return price
    const parsed = String(price).replace(',', '.').replace(/\s+/g, '')
    const num = parseFloat(parsed)
    if (isNaN(num)) throw new Error('Цена должна быть числом')
    return num
  }

  /**
   * Получение заголовков для API-запросов (включая авторизацию).
   */
  function getApiHeaders(): Record<string, string> {
    const authStore = useAuthStore()
    const headers: Record<string, string> = {}
    if (authStore.token) {
      headers.Authorization = `Bearer ${authStore.token}`
    }
    return headers
  }

  // ========================================
  // 🔄 ПРИЁМ ДАННЫХ СО СТРАНИЦЫ
  // ========================================

  /**
   * Преобразует ответ API во внутреннюю структуру с UI-полями.
   */
  function transformPriceData(data: ApiPriceListResponse | null): PriceCategory[] {
    if (!data?.categories) return []

    return data.categories.map((category): PriceCategory => ({
      ...category,
      subcategories: (category.subcategories || []).map((subcategory): PriceSubcategory => ({
        ...subcategory,
        items: (subcategory.items || []).map((item): PriceWorkItem => ({
          ...item,
          type: 'item',
          isCopied: false,
          details: (item.details || []).map((detail): PriceDetailItem => ({
            ...detail,
            unit: detail.unit || item.unit,
            type: 'detail',
            isCopied: false,
          })),
          dopworks: (item.dopworks || []).map((dopwork): PriceDopworkItem => ({
            ...dopwork,
            type: 'dopwork',
            isCopied: false,
          })),
        })),
      })),
    }))
  }

  /**
   * Принимает данные из useAsyncData со страницы [category].vue.
   * Заполняет `works` и `isAdmin` до первого рендеринга (и на сервере, и на клиенте).
   */
  const setData = (payload: PricePayload | null | undefined, refreshFn?: () => Promise<void>) => {
    if (refreshFn) {
      _refreshFn = refreshFn
    }

    if (payload?.priceData) {
      works.value = transformPriceData(payload.priceData)
      isAdmin.value = payload.isAdminUser
    } else {
      // Очищаем данные, если payload сброшен (например, при уходе со страницы)
      works.value = []
      isAdmin.value = false
    }
  }

  /**
   * Обработка ошибки загрузки (приходит со страницы).
   */
  const setError = (err: any) => {
    if (err) {
      errorMessage.value = err.message || err.statusMessage || 'Ошибка загрузки данных'
    } else {
      errorMessage.value = ''
    }
  }

  // ========================================
  // 🎯 CRUD: ОБЩИЙ ПАТТЕРН ОПТИМИСТИЧНОГО ОБНОВЛЕНИЯ
  // ========================================

  /**
   * Универсальная обёртка для оптимистичных обновлений.
   * 1. Создаёт snapshot текущего состояния
   * 2. Мгновенно применяет изменения в UI
   * 3. Делает API-запрос
   * 4. При ошибке — откатывает к snapshot
   */
  async function optimisticUpdate(
    actionName: string,
    applyOptimistic: () => void,
    apiCall: () => Promise<any>,
    onSuccess?: () => void,
  ) {
    const snapshot = deepClone(works.value)
    applyOptimistic()

    try {
      const result = await apiCall()
      console.log(`✅ ${actionName}: успешно`)
      if (onSuccess) onSuccess()
      return result
    } catch (err: any) {
      console.error(`❌ ${actionName}: откат`, err)
      works.value = snapshot
      throw err
    }
  }

  // ========================================
  // 🔍 ПОИСК ЭЛЕМЕНТОВ В ДЕРЕВЕ
  // ========================================

  const findCategory = (id: number) => works.value.find(c => c.id === id)

  const findSubcategory = (id: number): PriceSubcategory | null => {
    for (const category of works.value) {
      const sub = category.subcategories.find(s => s.id === id)
      if (sub) return sub
    }
    return null
  }

  const findItem = (id: number): PriceWorkItem | null => {
    for (const category of works.value) {
      for (const subcategory of category.subcategories) {
        const item = subcategory.items.find(i => i.id === id)
        if (item) return item
      }
    }
    return null
  }

  const findDetail = (
    id: number,
  ): { detail: PriceDetailItem; parent: PriceWorkItem } | null => {
    for (const category of works.value) {
      for (const subcategory of category.subcategories) {
        for (const item of subcategory.items) {
          const detail = item.details.find(d => d.id === id)
          if (detail) return { detail, parent: item }
        }
      }
    }
    return null
  }

  const findDopwork = (
    id: number,
  ): { dopwork: PriceDopworkItem; parent: PriceWorkItem } | null => {
    for (const category of works.value) {
      for (const subcategory of category.subcategories) {
        for (const item of subcategory.items) {
          const dopwork = item.dopworks.find(d => d.id === id)
          if (dopwork) return { dopwork, parent: item }
        }
      }
    }
    return null
  }

  // ========================================
  // ✏️ UPDATE методы
  // ========================================

  const updateCategory = async (id: number, data: Partial<PriceCategory>) => {
    await optimisticUpdate(
      `Обновление категории #${id}`,
      () => {
        const cat = findCategory(id)
        if (cat) Object.assign(cat, data)
      },
      () =>
        $fetch<ApiUpdateResponse<PriceCategory>>(`/api/price/categories/${id}`, {
          method: 'PUT',
          body: data,
          headers: getApiHeaders(),
        }),
    )
  }

  const updateSubcategory = async (id: number, data: Partial<PriceSubcategory>) => {
    await optimisticUpdate(
      `Обновление подкатегории #${id}`,
      () => {
        const sub = findSubcategory(id)
        if (sub) Object.assign(sub, data)
      },
      () =>
        $fetch<ApiUpdateResponse<PriceSubcategory>>(`/api/price/subcategories/${id}`, {
          method: 'PUT',
          body: data,
          headers: getApiHeaders(),
        }),
    )
  }

  const updateItem = async (id: number, data: Partial<PriceWorkItem>) => {
    await optimisticUpdate(
      `Обновление работы #${id}`,
      () => {
        const item = findItem(id)
        if (item) Object.assign(item, data)
      },
      () =>
        $fetch<ApiUpdateResponse<PriceWorkItem>>(`/api/price/items/${id}`, {
          method: 'PUT',
          body: {
            ...data,
            price: data.price !== undefined ? parsePrice(data.price) : undefined,
          },
          headers: getApiHeaders(),
        }),
    )
  }

  const updateDetail = async (id: number, data: Partial<PriceDetailItem>) => {
    await optimisticUpdate(
      `Обновление детали #${id}`,
      () => {
        const found = findDetail(id)
        if (found) Object.assign(found.detail, data)
      },
      () =>
        $fetch<ApiUpdateResponse<PriceDetailItem>>(`/api/price/details/${id}`, {
          method: 'PUT',
          body: {
            ...data,
            price: data.price !== undefined ? parsePrice(data.price) : undefined,
          },
          headers: getApiHeaders(),
        }),
    )
  }

  const updateDopwork = async (id: number, data: Partial<PriceDopworkItem>) => {
    await optimisticUpdate(
      `Обновление доп. работы #${id}`,
      () => {
        const found = findDopwork(id)
        if (found) Object.assign(found.dopwork, data)
      },
      () =>
        $fetch<ApiUpdateResponse<PriceDopworkItem>>(`/api/price/dopworks/${id}`, {
          method: 'PUT',
          body: {
            ...data,
            price: data.price !== undefined ? parsePrice(data.price) : undefined,
          },
          headers: getApiHeaders(),
        }),
    )
  }

  // ========================================
  // ➕ ADD методы
  // ========================================

  let tempIdCounter = -1

  const addCategory = async (pageId: number, name: string) => {
    const tempId = tempIdCounter--

    await optimisticUpdate(
      `Добавление категории "${name}"`,
      () => {
        works.value.push({
          id: tempId,
          pageId,
          name,
          order: works.value.length,
          subcategories: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        })
      },
      () =>
        $fetch<ApiCreateResponse>('/api/price/categories', {
          method: 'POST',
          body: { pageId, name },
          headers: getApiHeaders(),
        }),
      () => {
        _refreshFn?.()
      },
    )
  }

  const addSubcategory = async (categoryId: number, name: string) => {
    const category = findCategory(categoryId)
    if (!category) throw new Error('Категория не найдена')

    const tempId = tempIdCounter--

    await optimisticUpdate(
      `Добавление подкатегории "${name}"`,
      () => {
        category.subcategories.push({
          id: tempId,
          categoryId,
          name,
          order: category.subcategories.length,
          items: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        })
      },
      () =>
        $fetch<ApiCreateResponse>('/api/price/subcategories', {
          method: 'POST',
          body: { categoryId, name },
          headers: getApiHeaders(),
        }),
      () => {
        _refreshFn?.()
      },
    )
  }

  const addItem = async (subcategoryId: number, form: NewWorkForm) => {
    const subcategory = findSubcategory(subcategoryId)
    if (!subcategory) throw new Error('Подкатегория не найдена')

    const price = parsePrice(form.price)
    const tempId = tempIdCounter--

    await optimisticUpdate(
      `Добавление работы "${form.name}"`,
      () => {
        subcategory.items.push({
          id: tempId,
          subCategoryId: subcategoryId,
          name: form.name,
          unit: form.unit,
          price,
          order: subcategory.items.length,
          type: 'item',
          isCopied: false,
          details: [],
          dopworks: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        })
      },
      () =>
        $fetch<ApiCreateResponse>('/api/price/items', {
          method: 'POST',
          body: {
            subCategoryId: subcategoryId,
            name: form.name,
            unit: form.unit,
            price: price.toString(),
          },
          headers: getApiHeaders(),
        }),
      () => {
        // ✅ Автооткрытие подкатегории через прямой вызов UI-стора
        usePriceUIStore().openSubcategory(subcategoryId)
        _refreshFn?.()
      },
    )
  }

  const addDetail = async (itemId: number, form: NewDetailForm) => {
    const item = findItem(itemId)
    if (!item) throw new Error('Работа не найдена')

    const price = parsePrice(form.price)
    const tempId = tempIdCounter--

    await optimisticUpdate(
      `Добавление детали "${form.name}"`,
      () => {
        item.details.push({
          id: tempId,
          itemId,
          name: form.name,
          unit: form.unit || item.unit,
          price,
          order: item.details.length,
          type: 'detail',
          isCopied: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
      },
      () =>
        $fetch<ApiCreateResponse>('/api/price/details', {
          method: 'POST',
          body: {
            itemId,
            name: form.name,
            unit: form.unit,
            price: price.toString(),
          },
          headers: getApiHeaders(),
        }),
      () => {
        // ✅ Автооткрытие вложенных элементов работы
        usePriceUIStore().openSubItemsFor(itemId)
        _refreshFn?.()
      },
    )
  }

  const addDopwork = async (itemId: number, form: NewDopworkForm) => {
    const item = findItem(itemId)
    if (!item) throw new Error('Работа не найдена')

    const price = parsePrice(form.price)
    const tempId = tempIdCounter--

    await optimisticUpdate(
      `Добавление доп. работы "${form.dopwork}"`,
      () => {
        item.dopworks.push({
          id: tempId,
          itemId,
          label: form.label || null,
          dopwork: form.dopwork,
          unit: form.unit || item.unit,
          price,
          order: item.dopworks.length,
          type: 'dopwork',
          isCopied: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
      },
      () =>
        $fetch<ApiCreateResponse>('/api/price/dopworks', {
          method: 'POST',
          body: {
            itemId,
            label: form.label || null,
            dopwork: form.dopwork,
            unit: form.unit,
            price: price.toString(),
          },
          headers: getApiHeaders(),
        }),
      () => {
        // ✅ Автооткрытие вложенных элементов работы
        usePriceUIStore().openSubItemsFor(itemId)
        _refreshFn?.()
      },
    )
  }

  // ========================================
  // 🗑️ REMOVE методы
  // ========================================

  const removeCategory = async (id: number) => {
    await optimisticUpdate(
      `Удаление категории #${id}`,
      () => {
        const index = works.value.findIndex(c => c.id === id)
        if (index !== -1) works.value.splice(index, 1)
      },
      () =>
        $fetch<ApiDeleteResponse>(`/api/price/categories/${id}`, {
          method: 'DELETE',
          headers: getApiHeaders(),
        }),
    )
  }

  const removeSubcategory = async (id: number) => {
    await optimisticUpdate(
      `Удаление подкатегории #${id}`,
      () => {
        for (const category of works.value) {
          const index = category.subcategories.findIndex(s => s.id === id)
          if (index !== -1) {
            category.subcategories.splice(index, 1)
            break
          }
        }
      },
      () =>
        $fetch<ApiDeleteResponse>(`/api/price/subcategories/${id}`, {
          method: 'DELETE',
          headers: getApiHeaders(),
        }),
    )
  }

  const removeItem = async (id: number) => {
    await optimisticUpdate(
      `Удаление работы #${id}`,
      () => {
        for (const category of works.value) {
          for (const subcategory of category.subcategories) {
            const index = subcategory.items.findIndex(i => i.id === id)
            if (index !== -1) {
              subcategory.items.splice(index, 1)
              return
            }
          }
        }
      },
      () =>
        $fetch<ApiDeleteResponse>(`/api/price/items/${id}`, {
          method: 'DELETE',
          headers: getApiHeaders(),
        }),
    )
  }

  const removeDetail = async (id: number) => {
    await optimisticUpdate(
      `Удаление детали #${id}`,
      () => {
        for (const category of works.value) {
          for (const subcategory of category.subcategories) {
            for (const item of subcategory.items) {
              const index = item.details.findIndex(d => d.id === id)
              if (index !== -1) {
                item.details.splice(index, 1)
                return
              }
            }
          }
        }
      },
      () =>
        $fetch<ApiDeleteResponse>(`/api/price/details/${id}`, {
          method: 'DELETE',
          headers: getApiHeaders(),
        }),
    )
  }

  const removeDopwork = async (id: number) => {
    await optimisticUpdate(
      `Удаление доп. работы #${id}`,
      () => {
        for (const category of works.value) {
          for (const subcategory of category.subcategories) {
            for (const item of subcategory.items) {
              const index = item.dopworks.findIndex(d => d.id === id)
              if (index !== -1) {
                item.dopworks.splice(index, 1)
                return
              }
            }
          }
        }
      },
      () =>
        $fetch<ApiDeleteResponse>(`/api/price/dopworks/${id}`, {
          method: 'DELETE',
          headers: getApiHeaders(),
        }),
    )
  }

  // ========================================
  // 🔀 REORDER (Drag & Drop)
  // ========================================

  const reorderItems = async (entity: PriceEntity, items: ReorderItem[]) => {
    if (items.length === 0) return

    await optimisticUpdate(
      `Изменение порядка: ${entity} (${items.length} шт.)`,
      () => {
        const orderMap = new Map(items.map(i => [i.id, i.order]))

        const applyOrder = <T extends { id: number; order: number }>(arr: T[]) => {
          for (const item of arr) {
            const newOrder = orderMap.get(item.id)
            if (newOrder !== undefined) {
              item.order = newOrder
            }
          }
          arr.sort((a, b) => a.order - b.order)
        }

        switch (entity) {
          case 'categories':
            applyOrder(works.value)
            break
          case 'subcategories':
            for (const cat of works.value) applyOrder(cat.subcategories)
            break
          case 'items':
            for (const cat of works.value) {
              for (const sub of cat.subcategories) applyOrder(sub.items)
            }
            break
          case 'details':
            for (const cat of works.value) {
              for (const sub of cat.subcategories) {
                for (const item of sub.items) applyOrder(item.details)
              }
            }
            break
          case 'dopworks':
            for (const cat of works.value) {
              for (const sub of cat.subcategories) {
                for (const item of sub.items) applyOrder(item.dopworks)
              }
            }
            break
        }
      },
      () =>
        $fetch<{ success: true; updatedCount: number }>(`/api/price/${entity}/reorder`, {
          method: 'POST',
          body: { items },
          headers: getApiHeaders(),
        }),
    )
  }

  // ========================================
  // 📋 КОПИРОВАНИЕ В БУФЕР
  // ========================================

  const fallbackCopy = (text: string, item: PriceWorkItem | PriceDetailItem | PriceDopworkItem) => {
    const textArea = document.createElement('textarea')
    textArea.value = text
    textArea.style.cssText = 'position:fixed;opacity:0'
    document.body.appendChild(textArea)
    textArea.focus()
    textArea.select()

    try {
      document.execCommand('copy')
      item.isCopied = true
      setTimeout(() => {
        item.isCopied = false
      }, 3000)
    } catch (err) {
      console.error('Ошибка резервного копирования:', err)
    } finally {
      document.body.removeChild(textArea)
    }
  }

  const copyToClipboard = (
    item: PriceWorkItem | PriceDetailItem | PriceDopworkItem,
  ) => {
    let textToCopy = ''
    if (item.type === 'item' || item.type === 'detail') {
      textToCopy = item.name
    } else if (item.type === 'dopwork') {
      const dopItem = item as PriceDopworkItem
      textToCopy = [dopItem.label, dopItem.dopwork].filter(Boolean).join(' ')
    }
    if (!textToCopy) return

    const markCopied = () => {
      item.isCopied = true
      setTimeout(() => {
        item.isCopied = false
      }, 3000)
    }

    if (import.meta.client && navigator.clipboard?.writeText) {
      navigator.clipboard
        .writeText(textToCopy)
        .then(markCopied)
        .catch(err => {
          console.error('Ошибка копирования:', err)
          fallbackCopy(textToCopy, item)
        })
    } else if (import.meta.client) {
      fallbackCopy(textToCopy, item)
    }
  }

  // ========================================
  // 🔄 ПЕРЕЗАГРУЗКА ДАННЫХ
  // ========================================

  const refresh = async () => {
    await _refreshFn?.()
  }

  // ========================================
  // 🎁 ПУБЛИЧНЫЙ API
  // ========================================

  return {
    // Состояние
    works,
    isAdmin,
    isLoading,
    errorMessage,

    // Инициализация со страницы
    setData,
    setError,

    // Update
    updateCategory,
    updateSubcategory,
    updateItem,
    updateDetail,
    updateDopwork,

    // Add
    addCategory,
    addSubcategory,
    addItem,
    addDetail,
    addDopwork,

    // Remove
    removeCategory,
    removeSubcategory,
    removeItem,
    removeDetail,
    removeDopwork,

    // Служебные
    reorderItems,
    copyToClipboard,
    refresh,
  }
})
