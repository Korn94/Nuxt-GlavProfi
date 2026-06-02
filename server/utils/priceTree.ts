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

// ========================================
// 🌳 ФИНАЛЬНАЯ СТРУКТУРА ДЕРЕВА
// ========================================

/**
 * Работа с вложенными деталями и доп. работами.
 * 
 * ВАЖНО: dopworks возвращаются ПЛОСКИМ массивом (без группировки по label).
 * Группировка по label делается на клиенте в UI-слое, если нужна.
 */
export interface PriceTreeItem extends Item {
  details: Detail[]
  dopworks: Dopwork[]  // ← ПЛОСКИЙ МАССИВ (было DopworkGroup[])
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

// ========================================
// 📥 ПАРАМЕТРЫ ФУНКЦИИ
// ========================================

interface TreeParams {
  pages: Page[]
  categories: Category[]
  subcategories: SubCategory[]
  items: Item[]
  details: Detail[]
  dopworks: Dopwork[]
}

// ========================================
// 🏗️ СБОРКА ДЕРЕВА
// ========================================

/**
 * Собирает плоские массивы из БД в иерархическое дерево прайс-листа.
 * Сортировка уже выполнена на уровне SQL, здесь только вложенность.
 * 
 * @returns Массив страниц с вложенными категориями → подкатегориями → работами
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
    // ========================================
    // 1. Группируем детали по itemId
    // ========================================
    const detailsByItem = new Map<number, Detail[]>()
    for (const detail of details) {
      if (!detailsByItem.has(detail.itemId)) {
        detailsByItem.set(detail.itemId, [])
      }
      detailsByItem.get(detail.itemId)!.push(detail)
    }

    // ========================================
    // 2. Группируем доп. работы по itemId (ПЛОСКИЙ МАССИВ)
    // ========================================
    const dopworksByItem = new Map<number, Dopwork[]>()
    for (const dop of dopworks) {
      if (!dopworksByItem.has(dop.itemId)) {
        dopworksByItem.set(dop.itemId, [])
      }
      dopworksByItem.get(dop.itemId)!.push(dop)
    }

    // ========================================
    // 3. Группируем работы по subCategoryId
    // ========================================
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

    // ========================================
    // 4. Группируем подкатегории по categoryId
    // ========================================
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

    // ========================================
    // 5. Группируем категории по pageId
    // ========================================
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

    // ========================================
    // 6. Собираем финальное дерево
    // ========================================
    return pages.map(page => ({
      ...page,
      categories: categoriesByPage.get(page.id) || []
    }))
  } catch (error) {
    console.error('❌ Ошибка сборки дерева прайс-листа:', error)
    throw new Error('Не удалось построить структуру прайс-листа')
  }
}
