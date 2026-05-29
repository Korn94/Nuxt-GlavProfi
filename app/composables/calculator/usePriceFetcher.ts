// app/composables/calculator/usePriceFetcher.ts
import { computed } from 'vue'
import { useFetch } from 'nuxt/app'
import type {
  CalculatorSection,
  NormalizedWorkItem,
  DBPriceItem,
  PriceApiResponse
} from '~/types/calculator'
import { UNIT_MAP } from '~/types/calculator'

// =============================================================================
// 🎯 МАППИНГ 1: category_id → секция (САМЫЙ НАДЁЖНЫЙ ИСТОЧНИК)
// Основан на реальных ID из таблицы price_categories (page_id = 7, "Отделка")
// =============================================================================
const CATEGORY_ID_TO_SECTION: Record<number, CalculatorSection | 'demolition' | 'mixed'> = {
  41: 'demolition',  // 1. Демонтаж и подготовка → определяется по sub_category_id / itemName
  42: 'partitions',  // 2. Устройство перегородок
  43: 'floor',       // 3. Стяжка и выравнивание полов
  44: 'mixed',       // 4. Штукатурка стен и потолков → walls / ceiling
  45: 'mixed',       // 5. Шпаклёвка стен и потолков → walls / ceiling
  46: 'walls',       // 6. Финишная отделка (покраска, обои, декоративка)
  47: 'mixed',       // 7. Укладка плитки → walls / floor
  48: 'floor',       // 8. Напольные покрытия
  49: 'ceiling',     // 9. Потолки
  50: 'walls'        // 10. Облицовка стен (ГКЛ, панели, зеркала, короба)
} as const

// =============================================================================
// 🎯 МАППИНГ 2: sub_category_id → секция (для "смешанных" категорий)
// Используется когда категория содержит работы разных поверхностей
// =============================================================================
const SUBCATEGORY_ID_TO_SECTION: Record<number, CalculatorSection> = {
  // --- Категория 41 (Демонтаж) ---
  223: 'floor',       // Демонтаж напольных покрытий
  224: 'walls',       // Демонтаж отделки (стены)
  225: 'ceiling',     // Демонтаж потолков
  226: 'walls',       // Демонтаж плитки (по умолчанию стены; пол/стены уточняется по itemName)
  227: 'walls',       // Подготовка помещения к ремонту (общая)
  366: 'partitions',  // Демонтаж стен и перегородок
  367: 'walls',       // Демонтаж проёмов (двери, окна)
  369: 'floor',       // Демонтаж оснований и стяжек

  // --- Категория 44 (Штукатурка) ---
  241: 'walls',       // Очистка и подготовка
  242: 'walls',       // Грунтовка
  323: 'walls',       // Армирование
  324: 'walls',       // Гипсовая штукатурка стен
  325: 'walls',       // Цементно-песчаная штукатурка
  326: 'walls',       // Откосы и проёмы
  327: 'walls',       // Специальные виды штукатурки (огнезащита и т.п.)
  328: 'ceiling',     // Гипсовая штукатурка потолков
  329: 'ceiling',     // Заделка стыков и трещин (плиты перекрытия)

  // --- Категория 45 (Шпаклёвка) ---
  250: 'walls',       // Грунтовка
  251: 'walls',       // Стартовая шпаклёвка
  252: 'walls',       // Финишная шпаклёвка (есть потолочные — уточняется по itemName)
  253: 'walls',       // Откосы и проёмы
  254: 'walls',       // Стыки и углы
  255: 'walls',       // Шлифовка

  // --- Категория 47 (Плитка) ---
  257: 'walls',       // Грунтовка под плитку (универсальная)
  258: 'floor',       // Укладка напольной плитки
  259: 'walls',       // Укладка настенной плитки
  260: 'walls',       // Крупноформатная плитка (LVT, ректификат) — по умолчанию стены
  261: 'floor',       // Плитка на лестницы, ступени, откосы
  262: 'walls',       // Укладка мозаики
  263: 'walls',       // Резка и фигурная обработка (универсальная)
  264: 'walls',       // Затирка швов (универсальная)
  368: 'walls'        // Плинтус / Сапожок из плитки
} as const

// =============================================================================
// 🎯 МАППИНГ 3: ключевые слова → секция (фоллбэк)
// Используется ТОЛЬКО если не сработали categoryId и subCategoryId
// =============================================================================
const KEYWORD_TO_SECTION: Record<string, CalculatorSection> = {
  // =========================================================================
  // 🟫 ПОЛ
  // =========================================================================
  'пол': 'floor',
  'стяжк': 'floor',
  'наливн': 'floor',
  'гидроизол': 'floor',
  'ламинат': 'floor',
  'линолеум': 'floor',
  'spc': 'floor',
  'винил': 'floor',
  'коврол': 'floor',
  'плинтус': 'floor',
  'паркет': 'floor',
  'лаг': 'floor',
  'осб': 'floor',
  'доск': 'floor',
  'пробк': 'floor',
  'резин': 'floor',
  'спорт': 'floor',
  'напольн': 'floor',
  'ступен': 'floor',
  'лестниц': 'floor',

  // =========================================================================
  // 🟦 СТЕНЫ
  // =========================================================================
  'стен': 'walls',
  'штукатур': 'walls',
  'шпаклёв': 'walls',
  'шпаклев': 'walls',
  'грунтов': 'walls',
  'шлифов': 'walls',
  'покраск': 'walls',
  'обо': 'walls',
  'декоратив': 'walls',
  'гкл': 'walls',
  'панел': 'walls',
  'зеркал': 'walls',
  'плитк': 'walls',
  'керамо': 'walls',
  'сапожк': 'walls',
  'микродекор': 'walls',
  'колор': 'walls',
  'колеровк': 'walls',
  'график': 'walls',
  'фактур': 'walls',
  'венециан': 'walls',
  'короед': 'walls',
  'бархат': 'walls',
  'шелк': 'walls',
  'шёлк': 'walls',
  'жидк': 'walls',
  'отделк': 'walls',
  'финишн': 'walls',
  'обшивк': 'walls',
  'облицов': 'walls',
  'откос': 'walls',
  'настенн': 'walls',
  'мозаик': 'walls',

  // =========================================================================
  // 🟨 ПОТОЛОК
  // =========================================================================
  'потолок': 'ceiling',
  'потолк': 'ceiling',
  'потол': 'ceiling',
  'армстронг': 'ceiling',
  'реечн': 'ceiling',
  'подвесн': 'ceiling',
  'светильник': 'ceiling',
  'точечн': 'ceiling',
  'побелк': 'ceiling',
  'натяжн': 'ceiling',
  'закладн': 'ceiling',
  'люк': 'ceiling',
  'грильят': 'ceiling',

  // =========================================================================
  // 🟧 ПЕРЕГОРОДКИ
  // =========================================================================
  'перегородк': 'partitions',
  'короб': 'partitions',        // ГКЛ-короба для труб
  'проем': 'partitions',        // Арочные/фигурные проёмы
  'проём': 'partitions',
  'кирпич': 'partitions',       // Кладка перегородок из кирпича
  'блок': 'partitions',         // Газоблок, пеноблок
  'газоблок': 'partitions',
  'пеноблок': 'partitions',
  'пгп': 'partitions',          // Гипсовые пазогребневые плиты
  'звуко': 'partitions',        // Звукоизоляция перегородок
  'теплоизол': 'partitions',
  'утеплит': 'partitions',      // Минвата в каркас перегородки
  'демпфер': 'partitions',      // Демпферная лента
  'вибро': 'partitions',        // Вибродемпфирующая мембрана
  'усилен': 'partitions',       // Усиленные перегородки
  'каркас': 'partitions',       // Каркас перегородок
  'кладк': 'partitions'         // Кладка из блоков
} as const

// =============================================================================
// 🔍 Функция определения секции с приоритетом источников
// =============================================================================
/**
 * 🎯 Определяет секцию работы по трём уровням приоритета:
 *   1. categoryId (из БД) — самый надёжный
 *   2. subCategoryId (из БД) — для смешанных категорий
 *   3. Ключевые слова в itemName — фоллбэк
 */
function resolveSection(
  itemName: string,
  categoryName: string,
  categoryId?: number,
  subCategoryId?: number
): CalculatorSection | null {
  const nameLower = itemName.toLowerCase()

  // =========================================================================
  // УРОВЕНЬ 1: categoryId
  // =========================================================================
  if (categoryId !== undefined) {
    const categorySection = CATEGORY_ID_TO_SECTION[categoryId]

    if (categorySection && categorySection !== 'demolition' && categorySection !== 'mixed') {
      return categorySection
    }

    // --- Демонтаж (41): определяем по subCategoryId или itemName ---
    if (categorySection === 'demolition') {
      if (subCategoryId && SUBCATEGORY_ID_TO_SECTION[subCategoryId]) {
        const demoSection = SUBCATEGORY_ID_TO_SECTION[subCategoryId]

        // Специальный случай: "Демонтаж плитки" (226) — уточняем по itemName
        if (subCategoryId === 226) {
          if (nameLower.includes('с пола') || nameLower.includes('напольн')) return 'floor'
          if (nameLower.includes('со стен') || nameLower.includes('со стены') || nameLower.includes('настенн')) return 'walls'
          // По умолчанию для демонтажа плитки — стены (большинство позиций)
          return 'walls'
        }
        return demoSection
      }
      // Фоллбэк: ищем по ключевым словам в itemName
      return resolveByKeywords(nameLower)
    }

    // --- Смешанные категории (44, 45, 47): определяем по subCategoryId ---
    if (categorySection === 'mixed') {
      if (subCategoryId && SUBCATEGORY_ID_TO_SECTION[subCategoryId]) {
        const baseSection = SUBCATEGORY_ID_TO_SECTION[subCategoryId]

        // Специальный случай: категория 45 (шпаклёвка), sub 252 (Финишная)
        // Содержит и стеновые, и потолочные работы
        if (subCategoryId === 252) {
          if (nameLower.includes('потол') || nameLower.includes('подсветк')) return 'ceiling'
          return 'walls'
        }

        // Специальный случай: категория 47 (плитка), sub 260 (крупноформатная)
        // Может быть и на полу, и на стенах
        if (subCategoryId === 260) {
          if (nameLower.includes('напольн') || nameLower.includes('пол ')) return 'floor'
          return 'walls'
        }

        // Специальный случай: категория 47, sub 263 (резка) и 264 (затирка)
        // Универсальные — уточняем по itemName
        if (subCategoryId === 263 || subCategoryId === 264) {
          if (nameLower.includes('напольн') || nameLower.includes('пол ') || nameLower.includes('ступен')) return 'floor'
          if (nameLower.includes('настенн') || nameLower.includes('стен')) return 'walls'
          return baseSection
        }

        return baseSection
      }
      // Фоллбэк для смешанных категорий без subCategoryId
      return resolveByKeywords(nameLower)
    }
  }

  // =========================================================================
  // УРОВЕНЬ 2: subCategoryId (если categoryId не передан или неизвестен)
  // =========================================================================
  if (subCategoryId && SUBCATEGORY_ID_TO_SECTION[subCategoryId]) {
    return SUBCATEGORY_ID_TO_SECTION[subCategoryId]
  }

  // =========================================================================
  // УРОВЕНЬ 3: ключевые слова (фоллбэк)
  // =========================================================================
  return resolveByKeywords(`${categoryName} ${itemName}`.toLowerCase())
}

/**
 * 🔎 Поиск секции по ключевым словам
 */
function resolveByKeywords(searchText: string): CalculatorSection | null {
  for (const [keyword, section] of Object.entries(KEYWORD_TO_SECTION)) {
    if (searchText.includes(keyword)) return section
  }
  return null
}

// =============================================================================
// 🔄 Нормализация позиции из API
// =============================================================================
/**
 * Преобразует сырую позицию из БД в типизированный NormalizedWorkItem.
 * Возвращает null, если секцию определить не удалось (работа не для калькулятора).
 */
function normalizeItem(
  item: DBPriceItem,
  categoryName: string,
  categoryId?: number,
  subCategoryId?: number
): NormalizedWorkItem | null {
  const section = resolveSection(item.name, categoryName, categoryId, subCategoryId)
  if (!section) return null

  const rawUnit = item.unit.trim().toLowerCase()
  const normalizedUnit = UNIT_MAP[rawUnit as keyof typeof UNIT_MAP] || 'piece'
  const price = parseFloat(String(item.price).replace(',', '.'))

  // ✅ Демонтаж: categoryId === 41 ИЛИ категория называется "Демонтаж и подготовка"
  const isDemolition =
    categoryId === 41 ||
    categoryName.toLowerCase().includes('демонтаж и подготовка')

  return {
    id: item.id,
    name: item.name,
    normalizedUnit,
    pricePerUnit: isNaN(price) ? 0 : price,
    subCategoryId: item.sub_category_id,
    section,
    tags: [],
    isDemolition
  }
}

// =============================================================================
// 📥 Composable: загрузка прайс-листа для калькулятора
// =============================================================================
export function usePriceFetcher() {
  const { data, pending, error, refresh } = useFetch<PriceApiResponse>(
    '/api/price/calc/otdelochnye-raboty',
    {
      key: 'price-fetcher-calculator',
      immediate: true,
      server: true,
      watch: false
    }
  )

  const sections = computed(() => {
    const result: Record<
      CalculatorSection,
      { standard: NormalizedWorkItem[]; piece: NormalizedWorkItem[] }
    > = {
      floor: { standard: [], piece: [] },
      walls: { standard: [], piece: [] },
      ceiling: { standard: [], piece: [] },
      partitions: { standard: [], piece: [] }
    }

    if (!data.value?.categories) return result

    let totalProcessed = 0
    let totalSkipped = 0

    for (const category of data.value.categories) {
      for (const subcategory of category.subcategories || []) {
        for (const item of subcategory.items || []) {
          // ✅ Передаём categoryId и subCategoryId для точного определения секции
          const normalized = normalizeItem(
            item,
            category.name,
            category.id,
            subcategory.id
          )

          if (!normalized) {
            totalSkipped++
            continue
          }

          const bucket = normalized.normalizedUnit === 'piece' ? 'piece' : 'standard'
          result[normalized.section][bucket].push(normalized)
          totalProcessed++
        }
      }
    }

    // Сортировка по цене (для удобства в UI)
    for (const sec of Object.values(result)) {
      sec.standard.sort((a, b) => a.pricePerUnit - b.pricePerUnit)
      sec.piece.sort((a, b) => a.pricePerUnit - b.pricePerUnit)
    }

    // Лог статистики (только в dev-режиме, чтобы не засорять консоль на проде)
    if (import.meta.dev) {
      console.log('✅ Прайс-лист нормализован:', {
        пол: `${result.floor.standard.length} м² + ${result.floor.piece.length} шт/м.п.`,
        стены: `${result.walls.standard.length} м² + ${result.walls.piece.length} шт/м.п.`,
        потолок: `${result.ceiling.standard.length} м² + ${result.ceiling.piece.length} шт/м.п.`,
        перегородки: `${result.partitions.standard.length} м² + ${result.partitions.piece.length} шт/м.п.`,
        всего_обработано: totalProcessed,
        пропущено: totalSkipped
      })
    }

    return result
  })

  return { sections, pending, error, refresh }
}
