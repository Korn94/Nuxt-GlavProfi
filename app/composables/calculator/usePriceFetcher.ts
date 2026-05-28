// app/composables/calculator/usePriceFetcher.ts
import { computed } from 'vue'
import { useFetch } from 'nuxt/app'
import type { 
  CalculatorSection, 
  NormalizedWorkItem, 
  WorkUnit, 
  DBPriceItem, 
  PriceApiResponse 
} from '~/types/calculator'
import { UNIT_MAP } from '~/types/calculator'

/**
 * 🗺 Маппинг ключевых слов для определения секции.
 * Используем корни слов, чтобы охватить разные окончания (потолок/потолки/потолочный).
 */
const KEYWORD_TO_SECTION: Record<string, CalculatorSection> = {
  // =========================================================================
  // 🟫 ПОЛ
  // =========================================================================
  'пол': 'floor', 'стяжк': 'floor', 'наливн': 'floor', 'армир': 'floor',
  'гидроизол': 'floor', 'ламинат': 'floor', 'линолеум': 'floor',
  'spc': 'floor', 'винил': 'floor', 'коврол': 'floor', 'плинтус': 'floor', 
  'паркет': 'floor', 'лаг': 'floor', 'осб': 'floor', 'доск': 'floor',
  'пробк': 'floor', 'резин': 'floor', 'спорт': 'floor', 'покрыт': 'floor',

  // =========================================================================
  // 🟦 СТЕНЫ
  // =========================================================================
  'стен': 'walls', 'штукатур': 'walls', 'шпаклёв': 'walls', 'шпаклев': 'walls',
  'грунтов': 'walls', 'шлифов': 'walls', 'покраск': 'walls', 'обо': 'walls',
  'декоратив': 'walls', 'гкл': 'walls', 'панел': 'walls', 'зеркал': 'walls',
  'плитк': 'walls', 'керамо': 'walls', 'сапожк': 'walls', 'микродекор': 'walls',
  'перегородк': 'walls', 'короб': 'walls', 'проем': 'walls', 'проём': 'walls',
  'кирпич': 'walls', 'блок': 'walls', 'газоблок': 'walls', 'пеноблок': 'walls', 'пгп': 'walls',
  'звуко': 'walls', 'теплоизол': 'walls', 'утеплит': 'walls', 'демпфер': 'walls', 'вибро': 'walls',
  'изоляц': 'walls', 'колор': 'walls', 'колеровк': 'walls', 'график': 'walls', 
  'фактур': 'walls', 'венециан': 'walls', 'короед': 'walls', 'бархат': 'walls', 'шелк': 'walls',
  'жидк': 'walls', 'отделк': 'walls', 'финишн': 'walls',

  // =========================================================================
  // 🟨 ПОТОЛОК
  // =========================================================================
  'потолок': 'ceiling', 'потолк': 'ceiling', 'потол': 'ceiling',
  'армстронг': 'ceiling', 'реечн': 'ceiling', 'подвесн': 'ceiling',
  'светильник': 'ceiling', 'точечн': 'ceiling', 'побелк': 'ceiling', 'натяжн': 'ceiling',
  'закладн': 'ceiling', 'усилен': 'ceiling', 'каркас': 'ceiling', 'люк': 'ceiling',
  'грильят': 'ceiling'
} as const

/**
 * 🎯 Определяет секцию по названию работы или родительской категории.
 * Категория проверяется первой, чтобы избежать ложных срабатываний на общих словах.
 */
function resolveSection(itemName: string, categoryName: string): CalculatorSection | null {
  // Сначала проверяем название категории — она имеет приоритет
  // Например: "Демонтаж и подготовка" → определяем секцию по подкатегории внутри неё
  const categoryLower = categoryName.toLowerCase()

  // Для категории "Демонтаж и подготовка" определяем секцию по имени подкатегории
  if (categoryLower.includes('демонтаж') || categoryLower.includes('подготовка')) {
    // Ищем ключевые слова в itemName для определения секции
    for (const [keyword, section] of Object.entries(KEYWORD_TO_SECTION)) {
      if (itemName.toLowerCase().includes(keyword)) return section
    }
    // Если не нашли, пробуем определить по подкатегории (она передаётся в categoryName)
    return null
  }

  // Ставим категорию вперед: "9. Потолки Прокладка провода"
  const searchText = `${categoryName} ${itemName}`.toLowerCase()
  
  for (const [keyword, section] of Object.entries(KEYWORD_TO_SECTION)) {
    if (searchText.includes(keyword)) return section
  }
  return null
}

/**
 * 🔄 Нормализует сырую позицию из API в типизированный объект
 */
function normalizeItem(item: DBPriceItem, categoryName: string, categoryId?: number): NormalizedWorkItem | null {
  const section = resolveSection(item.name, categoryName)
  if (!section) return null

  const rawUnit = item.unit.trim().toLowerCase()
  const normalizedUnit = UNIT_MAP[rawUnit as keyof typeof UNIT_MAP] || 'piece'
  const price = parseFloat(String(item.price).replace(',', '.'))

  // ✅ Помечаем работы из категории "Демонтаж и подготовка"
  // ID 41 в БД, плюс проверка по имени на всякий случай
  const isDemolition = categoryId === 41 || categoryName.includes('Демонтаж и подготовка')

  return {
    id: item.id,
    name: item.name,
    normalizedUnit,
    pricePerUnit: isNaN(price) ? 0 : price,
    subCategoryId: item.sub_category_id,
    section,
    tags: [],
    isDemolition // ✅
  }
}

/**
 * 📥 Комьютабл загрузки прайс-листа для калькулятора
 */
export function usePriceFetcher() {
  const { data, pending, error, refresh } = useFetch<PriceApiResponse>('/api/price/calc/otdelochnye-raboty', {
    key: 'price-fetcher-calculator',
    immediate: true,
    server: true,
    watch: false
  })

  const sections = computed(() => {
    const result: Record<CalculatorSection, { 
      standard: NormalizedWorkItem[]
      piece: NormalizedWorkItem[] 
    }> = {
      floor: { standard: [], piece: [] },
      walls: { standard: [], piece: [] },
      ceiling: { standard: [], piece: [] }
    }

    if (!data.value?.categories) return result

    for (const category of data.value.categories) {
      for (const subcategory of category.subcategories || []) {
        for (const item of subcategory.items || []) {
          // ✅ Передаем categoryId третьим аргументом
          const normalized = normalizeItem(item, category.name, category.id)
          if (!normalized) continue

          const bucket = normalized.normalizedUnit === 'piece' ? 'piece' : 'standard'
          result[normalized.section][bucket].push(normalized)
        }
      }
    }

    // Сортировка по цене
    for (const sec of Object.values(result)) {
      sec.standard.sort((a, b) => a.pricePerUnit - b.pricePerUnit)
      sec.piece.sort((a, b) => a.pricePerUnit - b.pricePerUnit)
    }

    // console.log('✅ Прайс-лист нормализован. Доступно позиций:', {
    //   floor: result.floor.standard.length + result.floor.piece.length,
    //   walls: result.walls.standard.length + result.walls.piece.length,
    //   ceiling: result.ceiling.standard.length + result.ceiling.piece.length
    // })

    return result
  })

  return { sections, pending, error, refresh }
}
