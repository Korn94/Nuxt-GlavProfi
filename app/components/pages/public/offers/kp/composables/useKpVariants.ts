// app/components/pages/public/offers/kp/composables/useKpVariants.ts
//
// Варианты КП: база (KpData) + список взаимоисключающих вариантов.
// Каждый вариант — либо патч поверх базы (`patch`), либо самостоятельный
// документ (`data`). Резолвер возвращает готовый KpData для выбранного варианта.
//
// Патч устроен предсказуемо:
//  • meta         — поверхностный merge;
//  • sections     — правки по ключу раздела (null удаляет раздел);
//  • items        — заменяют позиции раздела целиком;
//  • addSections  — добавляют разделы в группу (before задаёт позицию);
//  • summary,
//    notes,
//    callouts,
//    adjustments  — заменяются целиком, если заданы;
//  • notesPatch   — точечные правки примечаний по заголовку;
//  • estimate,
//    charts,
//    footer       — поверхностный merge.
import type {
  KpData,
  KpGroup,
  KpNote,
  KpSection,
  KpSectionPatch,
  KpVariant,
  KpVariantPatch,
} from '../types'
import { getDocumentTotal } from './useKpDocument'

export { getDocumentTotal }

/** Данные для переключателя вариантов */
export interface KpVariantSummary {
  key: string
  label: string
  shortLabel?: string
  hint?: string
  icon?: string
  badge?: string
  /** Итог варианта с учётом корректировок */
  total: number
  isDefault: boolean
  /** Отклонение от варианта по умолчанию, % (например -18) */
  deltaPercent: number | null
}

/** Ключ варианта по умолчанию: флаг default → первый в списке */
export function getDefaultVariantKey(data: KpData): string | null {
  const variants = data.variants ?? []
  if (!variants.length) return null

  return variants.find(variant => variant.default)?.key ?? variants[0]!.key
}

const cloneSection = (section: KpSection): KpSection => ({
  ...section,
  items: section.items.map(item => ({ ...item })),
})

const cloneGroup = (group: KpGroup): KpGroup => ({
  ...group,
  sections: group.sections.map(cloneSection),
})

const applySectionPatch = (section: KpSection, patch: KpSectionPatch): KpSection => ({
  ...section,
  ...patch,
  items: (patch.items ?? section.items).map(item => ({ ...item })),
})

/** Правки существующих разделов + вставка новых внутри одной группы */
const patchGroupSections = (group: KpGroup, patch: KpVariantPatch): KpSection[] => {
  const sectionPatches = patch.sections ?? {}

  let sections = group.sections.reduce<KpSection[]>((acc, section) => {
    const sectionPatch = sectionPatches[section.key]

    if (sectionPatch === null) return acc

    acc.push(sectionPatch ? applySectionPatch(section, sectionPatch) : cloneSection(section))
    return acc
  }, [])

  for (const addition of patch.addSections ?? []) {
    if (addition.groupKey !== group.key) continue

    const index = addition.before
      ? sections.findIndex(section => section.key === addition.before)
      : -1
    const insertAt = index >= 0 ? index : sections.length

    sections = [
      ...sections.slice(0, insertAt),
      ...addition.sections.map(cloneSection),
      ...sections.slice(insertAt),
    ]
  }

  return sections
}

/** Правки примечаний по заголовку; null — удалить примечание */
const applyNotesPatch = (
  notes: KpNote[],
  patch?: Record<string, Partial<KpNote> | null>,
): KpNote[] => {
  return notes.reduce<KpNote[]>((acc, note) => {
    const change = note.title ? patch?.[note.title] : undefined

    if (change === null) return acc

    acc.push(change ? { ...note, ...change } : { ...note })
    return acc
  }, [])
}

const applyVariantPatch = (base: KpData, patch: KpVariantPatch): KpData => ({
  ...base,
  meta: { ...base.meta, ...patch.meta },
  groups: patch.groups
    ? patch.groups.map(cloneGroup)
    : base.groups.map(group => ({
        ...group,
        sections: patchGroupSections(group, patch),
      })),
  summary: patch.summary ?? base.summary,
  estimate: patch.estimate ? { ...base.estimate, ...patch.estimate } : base.estimate,
  charts: patch.charts ? { ...base.charts, ...patch.charts } : base.charts,
  callouts: patch.callouts ?? base.callouts,
  notesTitle: patch.notesTitle ?? base.notesTitle,
  notes: applyNotesPatch(patch.notes ?? base.notes ?? [], patch.notesPatch),
  footer: patch.footer ? { ...base.footer, ...patch.footer } : base.footer,
  adjustments: patch.adjustments ?? base.adjustments,
  // Варианты не должны «просачиваться» в разрешённый документ.
  variants: undefined,
})

/**
 * Разворачивает базовый документ в выбранный вариант.
 * Если вариантов нет — возвращает базу как есть.
 * Неизвестный ключ → вариант по умолчанию.
 */
export function resolveKpData(base: KpData, variantKey?: string | null): KpData {
  const variants = base.variants ?? []
  if (!variants.length) return base

  const variant: KpVariant =
    (variantKey ? variants.find(item => item.key === variantKey) : undefined)
    ?? variants.find(item => item.default)
    ?? variants[0]!

  if (variant.data) return variant.data
  if (!variant.patch) return base

  return applyVariantPatch(base, variant.patch)
}

/**
 * Данные для переключателя: подпись, итог и отклонение от варианта по умолчанию.
 * Меньше двух вариантов — переключатель не нужен, возвращается пустой список.
 */
export function getVariantSummary(data: KpData): KpVariantSummary[] {
  const variants = data.variants ?? []
  if (variants.length < 2) return []

  const defaultKey = getDefaultVariantKey(data)
  const defaultTotal = defaultKey ? getDocumentTotal(resolveKpData(data, defaultKey)) : 0

  return variants.map((variant) => {
    const total = getDocumentTotal(resolveKpData(data, variant.key))
    const deltaPercent = defaultKey && variant.key !== defaultKey && defaultTotal > 0
      ? Math.round(((total - defaultTotal) / defaultTotal) * 100)
      : null

    return {
      key: variant.key,
      label: variant.label,
      shortLabel: variant.shortLabel,
      hint: variant.hint,
      icon: variant.icon,
      badge: variant.badge,
      total,
      isDefault: variant.key === defaultKey,
      deltaPercent,
    }
  })
}
