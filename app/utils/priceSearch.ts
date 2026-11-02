// app/utils/priceSearch.ts
/**
 * Нечёткий поиск по прайс-листу на базе MiniSearch + русского стеммера Snowball.
 *
 * Решает типовые причины «не находит»:
 *   1. Ищет по ВСЕМ полям (категория, подкатегория, работа, детали, доп. работы).
 *   2. Опечатки — через fuzzy-поиск (edit distance).
 *   3. Русская морфология — через стеммер («штукатуркой» найдёт «штукатурка»).
 *   4. «ё/е» — через нормализацию перед индексацией и поиском.
 *   5. Синонимы («шпаклёвка» ↔ «шпатлёвка») — через расширение терминов.
 *
 * Работает и на сервере (SSR), и в браузере — без обращений к window/document.
 */
import MiniSearch from 'minisearch'
import type { PriceCategory } from 'stores/price/types'
import { normalizeRussian, stemRussian } from './russianStemmer'

// ============================================================
// 📄 Документ индекса (одна работа = один документ)
// ============================================================
export interface PriceSearchDoc {
  id: number // itemId
  categoryId: number
  subcategoryId: number
  category: string
  subcategory: string
  name: string
  details: string
  dopworks: string
}

// ============================================================
// 🔗 СИНОНИМЫ (в нормализованной форме: строчные, «ё» → «е»)
// ============================================================
const SYNONYM_GROUPS: string[][] = [
  ['шпаклевка', 'шпатлевка'],
]

function buildSynonymStemMap(): Map<string, string[]> {
  const map = new Map<string, string[]>()
  for (const group of SYNONYM_GROUPS) {
    const stems = [...new Set(group.map(normalizeRussian).map(stemRussian).filter(Boolean))]
    for (const stem of stems) {
      map.set(stem, stems)
    }
  }
  return map
}

const STEM_SYNONYMS = buildSynonymStemMap()

/**
 * processTerm для MiniSearch: нормализует + стеммит + раскрывает синонимы.
 * Возвращает массив стемм (строку или falsy — по контракту MiniSearch).
 */
export function processPriceTerm(term: string): string[] | null {
  const norm = normalizeRussian(term)
  if (!norm) return null
  const stem = stemRussian(norm)
  if (!stem) return null
  const group = STEM_SYNONYMS.get(stem)
  return group && group.length > 1 ? group : [stem]
}

// ============================================================
// 🏗️ ПОСТРОЕНИЕ ИНДЕКСА
// ============================================================
export function buildPriceIndex(categories: PriceCategory[]): MiniSearch<PriceSearchDoc> {
  const index = new MiniSearch<PriceSearchDoc>({
    idField: 'id',
    fields: ['category', 'subcategory', 'name', 'details', 'dopworks'],
    storeFields: ['categoryId', 'subcategoryId'],
    processTerm: processPriceTerm,
  })

  const docs: PriceSearchDoc[] = []
  for (const category of categories) {
    for (const subcategory of category.subcategories ?? []) {
      for (const item of subcategory.items ?? []) {
        docs.push({
          id: item.id,
          categoryId: category.id,
          subcategoryId: subcategory.id,
          category: category.name,
          subcategory: subcategory.name,
          name: item.name,
          details: (item.details ?? []).map(d => d.name).join(' '),
          dopworks: (item.dopworks ?? [])
            .map(d => [d.label, d.dopwork].filter(Boolean).join(' '))
            .join(' '),
        })
      }
    }
  }

  index.addAll(docs)
  return index
}

// ============================================================
// 🔍 ПОИСК
// ============================================================
export function searchPriceIndex(index: MiniSearch<PriceSearchDoc>, query: string): number[] {
  if (!query.trim()) return []
  const results = index.search(query, {
    prefix: true,
    fuzzy: 0.2,
    maxFuzzy: 3,
    combineWith: 'OR',
    boost: { name: 3, subcategory: 2, category: 1.5, details: 1, dopworks: 1 },
  })
  return results.map(r => r.id as number)
}

// ============================================================
// 🖍️ ПОДСВЕТКА СОВПАДЕНИЙ
// ============================================================
const WORD_RE = /[\p{L}\p{N}]+/gu

export interface HighlightPart {
  text: string
  isMatch: boolean
}

/**
 * Разбивает текст на сегменты, подсвечивая слова, совпадающие с запросом
 * (учитывает нормализацию «ё/е», стемминг и префиксы). Корректно работает
 * при нечётком совпадении, когда точная подстрока в тексте отсутствует.
 */
export function highlightText(text: string, query: string): HighlightPart[] {
  if (!text || !query.trim()) return [{ text, isMatch: false }]

  const queryWords = normalizeRussian(query).split(/\s+/).filter(Boolean)
  const queryStems = queryWords.map(stemRussian).filter(Boolean)

  const parts: HighlightPart[] = []
  let last = 0
  for (const match of text.matchAll(WORD_RE)) {
    const index = match.index!
    const token = match[0]
    if (index > last) parts.push({ text: text.slice(last, index), isMatch: false })

    const normToken = normalizeRussian(token)
    const stemToken = stemRussian(normToken)
    const isMatch =
      queryWords.some(q => q.length > 0 && normToken.includes(q)) ||
      queryStems.some(
        s => s && (stemToken === s || stemToken.startsWith(s) || s.startsWith(stemToken)),
      )

    parts.push({ text: token, isMatch })
    last = index + token.length
  }
  if (last < text.length) parts.push({ text: text.slice(last), isMatch: false })
  if (parts.length === 0) parts.push({ text, isMatch: false })
  return parts
}
