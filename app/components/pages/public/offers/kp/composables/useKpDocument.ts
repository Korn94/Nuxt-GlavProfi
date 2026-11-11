// app/components/pages/public/offers/kp/composables/useKpDocument.ts
//
// Расчётная часть конструктора КП: превращает «сырые» данные (KpData)
// в готовые к рендеру группы/разделы с суммами.
//
// Все суммы считаются так же, как в первых КП (см. offers/index.vue до рефакторинга):
// quantity может быть строкой ('40,2', '~800'), цена может отсутствовать —
// тогда используется фиксированная sum по позиции.
import { computed, reactive, toValue, type MaybeRefOrGetter } from 'vue'
import type { KpData, KpGroup, KpLineItem, KpSection, KpSummaryCard } from '../types'

export interface KpResolvedSection extends KpSection {
  total: number
  count: number
  /** Есть ли в разделе хотя бы одна позиция с материалом */
  hasMaterial: boolean
}

export interface KpResolvedGroup extends Omit<KpGroup, 'sections'> {
  sections: KpResolvedSection[]
  total: number
  count: number
}

export type KpCardTone = 'default' | 'materials' | 'total'

export interface KpResolvedCard extends KpSummaryCard {
  /** Посчитанная сумма карточки */
  value: number
  tone: KpCardTone
}

/** '40,2' | '~800' | 12 → 40.2 | 800 | 12 */
export const parseQty = (qty?: string | number | null): number => {
  if (qty == null) return 0
  if (typeof qty === 'number') return Number.isNaN(qty) ? 0 : qty
  const num = Number.parseFloat(String(qty).replace(/[~\s]/g, '').replace(',', '.'))
  return Number.isNaN(num) ? 0 : num
}

/** Сумма позиции: price × qty, иначе фиксированная sum */
export const getItemSum = (item: KpLineItem): number =>
  item.price != null ? parseQty(item.qty) * item.price : (item.sum ?? 0)

/** Опции (optional) показываются в таблице, но не входят в итог */
const isCountable = (item: KpLineItem): boolean => !item.optional

/** Итог раздела */
export const getSectionTotal = (section: KpSection): number =>
  section.items.filter(isCountable).reduce((sum, item) => sum + getItemSum(item), 0)

/** Итог документа с учётом корректировок (скидки/надбавки) */
export const getDocumentTotal = (data: KpData): number => {
  const groupsTotal = data.groups.reduce(
    (sum, group) => sum + group.sections.reduce((groupSum, section) => groupSum + getSectionTotal(section), 0),
    0,
  )
  const adjustmentsTotal = (data.adjustments ?? []).reduce((sum, item) => sum + item.amount, 0)

  return groupsTotal + adjustmentsTotal
}

const nf = new Intl.NumberFormat('ru-RU')

/** 12345.6 → '12 346'; null/undefined → '—' */
export const formatPrice = (value?: number | null): string =>
  value == null ? '—' : nf.format(Math.round(value))

const resolveSection = (section: KpSection): KpResolvedSection => ({
  ...section,
  total: getSectionTotal(section),
  count: section.items.length,
  hasMaterial: section.items.some(item => !!item.material),
})

const isMaterialsGroup = (group: KpGroup): boolean =>
  /материал|material/i.test(`${group.key} ${group.label}`)

/**
 * Основной композабл страницы КП.
 *
 * const doc = useKpDocument(offer)
 * doc.groups        — группы с итогами
 * doc.grandTotal    — итог по документу (с учётом adjustments)
 * doc.summaryCards  — готовые карточки для KpSummary
 */
export function useKpDocument(data: MaybeRefOrGetter<KpData>) {
  const groups = computed<KpResolvedGroup[]>(() =>
    toValue(data).groups.map((group) => {
      const sections = group.sections.map(resolveSection)
      return {
        ...group,
        sections,
        total: sections.reduce((sum, section) => sum + section.total, 0),
        count: sections.reduce((sum, section) => sum + section.count, 0),
      }
    }),
  )

  const sections = computed<KpResolvedSection[]>(() => groups.value.flatMap(group => group.sections))

  const hasMaterials = computed<boolean>(() => sections.value.some(section => section.hasMaterial))

  const adjustmentsTotal = computed<number>(() =>
    (toValue(data).adjustments ?? []).reduce((sum, item) => sum + item.amount, 0),
  )

  const grandTotal = computed<number>(() =>
    groups.value.reduce((sum, group) => sum + group.total, 0) + adjustmentsTotal.value,
  )

  const findTotal = (card: KpSummaryCard): number => {
    if (card.total) return grandTotal.value
    if (card.groupKey) {
      const group = groups.value.find(item => item.key === card.groupKey)
      if (group) return group.total
    }
    if (card.sectionKey) {
      const section = sections.value.find(item => item.key === card.sectionKey)
      if (section) return section.total
    }
    // Позволяем указывать ключ раздела в groupKey — удобно для КП без групп
    if (card.groupKey) {
      const section = sections.value.find(item => item.key === card.groupKey)
      if (section) return section.total
    }
    return 0
  }

  const summaryCards = computed<KpResolvedCard[]>(() => {
    const summary = toValue(data).summary
    const source: KpSummaryCard[] = summary?.length
      ? summary
      : [
          ...groups.value.map<KpSummaryCard>(group => ({
            label: group.label,
            hint: group.hint,
            icon: group.icon,
            groupKey: group.key,
          })),
          { label: 'Итого', total: true },
        ]

    return source.map((card): KpResolvedCard => {
      let tone: KpCardTone = card.tone ?? 'default'
      if (card.total) {
        tone = 'total'
      } else if (!card.tone) {
        const group = groups.value.find(item => item.key === card.groupKey)
        tone = group && isMaterialsGroup(group) ? 'materials' : 'default'
      }

      return { ...card, tone, value: findTotal(card) }
    })
  })

  return reactive({
    groups,
    sections,
    hasMaterials,
    grandTotal,
    adjustmentsTotal,
    summaryCards,
    formatPrice,
  })
}
