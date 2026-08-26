// app/components/pages/public/remontPomescheniy/workTypes/composables/usePriceRawFetcher.ts
import { useFetch } from 'nuxt/app'
import type { PriceApiResponse, DBPriceItem } from '~/types/calculator'

/**
 * 📋 Загружает СЫРЫЕ данные прайс-листа без нормализации.
 * 
 * Использует тот же ключ кэша, что и ~/composables/calculator/usePriceFetcher —
 * Nuxt автоматически переиспользует уже загруженные данные, повторного запроса не будет.
 */
export function usePriceRawFetcher() {
  const { data, pending, error, refresh } = useFetch<PriceApiResponse>(
    '/api/price/calc/otdelochnye-raboty',
    {
      key: 'price-fetcher-calculator',
      watch: false,
    }
  )

  /**
   * 🔢 Безопасное получение поля order из позиции прайс-листа.
   * Поле есть в БД, но может быть не объявлено в типе DBPriceItem.
   */
  const getOrder = (item: DBPriceItem): number => {
    const raw = (item as any).order
    const num = Number(raw)
    return isNaN(num) ? 0 : num
  }

  /**
   * Возвращает массив работ конкретной подкатегории по её ID.
   */
  function getItemsBySubCategoryId(subCategoryId: number): DBPriceItem[] {
    if (!data.value?.categories) return []

    for (const category of data.value.categories) {
      for (const sub of category.subcategories || []) {
        if (sub.id === subCategoryId) {
          return [...(sub.items || [])].sort((a, b) => getOrder(a) - getOrder(b))
        }
      }
    }
    return []
  }

  /**
   * Возвращает работы нескольких подкатегорий, сгруппированные по ним.
   */
  function getItemsBySubCategoryIds(
    ids: number[]
  ): Array<{ subCategoryId: number; subCategoryName: string; items: DBPriceItem[] }> {
    if (!data.value?.categories) return []

    const groups: Array<{ subCategoryId: number; subCategoryName: string; items: DBPriceItem[] }> = []

    for (const category of data.value.categories) {
      for (const sub of category.subcategories || []) {
        if (ids.includes(sub.id) && sub.items?.length) {
          groups.push({
            subCategoryId: sub.id,
            subCategoryName: sub.name,
            items: [...sub.items].sort((a, b) => getOrder(a) - getOrder(b)),
          })
        }
      }
    }
    return groups
  }

  /**
   * Поиск одной работы по ID (глобально по всем категориям).
   */
  function findItemById(itemId: number): DBPriceItem | undefined {
    if (!data.value?.categories) return undefined

    for (const category of data.value.categories) {
      for (const sub of category.subcategories || []) {
        const found = (sub.items || []).find((item) => item.id === itemId)
        if (found) return found
      }
    }
    return undefined
  }

  return {
    data,
    pending,
    error,
    refresh,
    getItemsBySubCategoryId,
    getItemsBySubCategoryIds,
    findItemById,
  }
}
