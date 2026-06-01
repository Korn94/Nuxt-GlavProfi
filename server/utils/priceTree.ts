// server/utils/priceTree.ts
import type { 
  pricePages, 
  priceCategories, 
  priceSubCategories, 
  priceItems, 
  priceItemDetails, 
  priceAdditionalItems 
} from '../db/schema'

// Типы строк таблиц (автоматически из Drizzle)
type Page = typeof pricePages.$inferSelect
type Category = typeof priceCategories.$inferSelect
type SubCategory = typeof priceSubCategories.$inferSelect
type Item = typeof priceItems.$inferSelect
type Detail = typeof priceItemDetails.$inferSelect
type Dopwork = typeof priceAdditionalItems.$inferSelect

// Группированные доп. работы (по label)
export interface DopworkGroup {
  label: string | null
  works: Dopwork[]
}

// Финальная структура дерева
export interface PriceTreeItem extends Item {
  details: Detail[]
  dopworks: DopworkGroup[]
}

export interface PriceTreeSubCategory extends SubCategory {
  items: PriceTreeItem[]
}

export interface PriceTreeCategory extends Category {
  subcategories: PriceTreeSubCategory[]
}

export interface PriceTreePage extends Page {
  categories: PriceTreeCategory[]
}

// Параметры функции
interface TreeParams {
  pages: Page[]
  categories: Category[]
  subcategories: SubCategory[]
  items: Item[]
  details: Detail[]
  dopworks: Dopwork[]
}

/**
 * Собирает плоские массивы из БД в иерархическое дерево прайс-листа.
 * Сортировка уже выполнена на уровне SQL, здесь только вложенность.
 */
export function buildPriceTree({ 
  pages, 
  categories, 
  subcategories, 
  items, 
  details, 
  dopworks 
}: TreeParams): PriceTreePage[] {
  try {
    // Группируем детали по itemId
    const detailsByItem = new Map<number, Detail[]>()
    for (const detail of details) {
      if (!detailsByItem.has(detail.itemId)) {
        detailsByItem.set(detail.itemId, [])
      }
      detailsByItem.get(detail.itemId)!.push(detail)
    }

    // Группируем доп. работы по itemId и label
    const dopworksByItem = new Map<number, DopworkGroup[]>()
    for (const dop of dopworks) {
      if (!dopworksByItem.has(dop.itemId)) {
        dopworksByItem.set(dop.itemId, [])
      }
      const groups = dopworksByItem.get(dop.itemId)!
      const existingGroup = groups.find(g => g.label === dop.label)
      
      if (existingGroup) {
        existingGroup.works.push(dop)
      } else {
        groups.push({ label: dop.label, works: [dop] })
      }
    }

    // Группируем работы по subCategoryId
    const itemsBySubCategory = new Map<number, PriceTreeItem[]>()
    for (const item of items) {
      if (!itemsBySubCategory.has(item.subCategoryId)) {
        itemsBySubCategory.set(item.subCategoryId, [])
      }
      itemsBySubCategory.get(item.subCategoryId)!.push({
        ...item,
        details: detailsByItem.get(item.id) || [],
        dopworks: dopworksByItem.get(item.id) || []
      })
    }

    // Группируем подкатегории по categoryId
    const subcategoriesByCategory = new Map<number, PriceTreeSubCategory[]>()
    for (const sub of subcategories) {
      if (!subcategoriesByCategory.has(sub.categoryId)) {
        subcategoriesByCategory.set(sub.categoryId, [])
      }
      subcategoriesByCategory.get(sub.categoryId)!.push({
        ...sub,
        items: itemsBySubCategory.get(sub.id) || []
      })
    }

    // Группируем категории по pageId
    const categoriesByPage = new Map<number, PriceTreeCategory[]>()
    for (const category of categories) {
      if (!categoriesByPage.has(category.pageId)) {
        categoriesByPage.set(category.pageId, [])
      }
      categoriesByPage.get(category.pageId)!.push({
        ...category,
        subcategories: subcategoriesByCategory.get(category.id) || []
      })
    }

    // Собираем финальное дерево
    return pages.map(page => ({
      ...page,
      categories: categoriesByPage.get(page.id) || []
    }))
  } catch (error) {
    console.error('❌ Ошибка сборки дерева прайс-листа:', error)
    throw new Error('Не удалось построить структуру прайс-листа')
  }
}
