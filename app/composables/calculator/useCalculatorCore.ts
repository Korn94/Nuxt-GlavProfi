// app/composables/calculator/useCalculatorCore.ts
import { computed, type ComputedRef } from 'vue'
import type { 
  CalculatorState, 
  CalculationResult, 
  CalculationLine,
  NormalizedWorkItem,
  FinishGroupConfig
} from '~/types/calculator'
import { FINISH_GROUPS } from '~/utils/finish-groups'

/**
 * 🧮 Ядро расчёта калькулятора
 * Принимает текущий стейт и загруженные работы, возвращает итоговую смету.
 * ✅ Обновлено: учтено разделение площади пола и площади стен.
 */
export function useCalculatorCore(
  state: CalculatorState,
  allWorks: ComputedRef<NormalizedWorkItem[]>
) {
  
  // Вспомогательная функция: поиск работы по ID
  const getWorkById = (id: number) => allWorks.value.find(w => w.id === id)

/**
 * 📦 Расчёт линий для конкретного инстанса покрытия
 * ✅ ИСПРАВЛЕНО: теперь используется instance.area, а не глобальные размеры
 * ✅ ДОБАВЛЕНО: учёт дополнительных работ (extras)
 */
function calculateInstanceLines(instance: CalculatorState['surfaceInstances'][number]): CalculationLine[] {
  const config = FINISH_GROUPS[instance.finishGroupId]
  if (!config) return []

  const lines: CalculationLine[] = []

  // 1. Собираем все выбранные itemId из активных опций
  const selectedOptionIds = new Set<number>()
  if (config.options) {
    for (const [optKey, optVal] of Object.entries(instance.options)) {
      const optConfig = config.options[optKey]
      if (optConfig) {
        const match = optConfig.values.find(v => v.value === optVal)
        if (match?.itemId) selectedOptionIds.add(match.itemId)
      }
    }
  }

  // 2. Функция поиска замены: опция должна иметь тот же subCategoryId
  const getEffectiveItemId = (baseId: number): number => {
    const baseWork = getWorkById(baseId)
    if (!baseWork || selectedOptionIds.size === 0) return baseId

    const replacementId = [...selectedOptionIds].find(optId => {
      const optWork = getWorkById(optId)
      return optWork?.subCategoryId === baseWork.subCategoryId
    })

    return replacementId || baseId
  }

  // ✅ ИСПРАВЛЕНО: Используем instance.area как базовое количество
  // Раньше здесь было: state.dimensions.wallArea ?? state.dimensions.floorArea
  const baseQuantity = instance.area || state.dimensions.floorArea

  // 3. Формируем список базовых работ из конфига
  const workIds = [...config.baseItemIds]
  for (const workId of workIds) {
    if (instance.excludedItemIds.includes(workId)) continue

    const finalWorkId = getEffectiveItemId(workId)
    const work = getWorkById(finalWorkId)
    if (!work) continue

    // ✅ ВСЕГДА используем instance.area для базовых работ покрытия
    const quantity = Math.max(0, baseQuantity)
    const total = work.pricePerUnit * quantity

    lines.push({
      id: work.id,
      name: work.name,
      unit: work.normalizedUnit,
      quantity,
      pricePerUnit: work.pricePerUnit,
      total,
      finishGroupId: instance.finishGroupId
    })
  }

  // ✅ ДОБАВЛЕНО: Учитываем extras (дополнительные работы внутри карточки)
  if (instance.extras?.length) {
    for (const extra of instance.extras) {
      const work = getWorkById(extra.itemId)
      if (!work) continue
      
      const total = work.pricePerUnit * extra.qty
      lines.push({
        id: work.id,
        name: work.name,
        unit: work.normalizedUnit,
        quantity: extra.qty,
        pricePerUnit: work.pricePerUnit,
        total,
        finishGroupId: instance.finishGroupId,
        isExtra: true
      })
    }
  }

  return lines
}

  /**
   * 📊 Главный метод генерации сметы
   */
  const result = computed<CalculationResult>(() => {
    const lines: CalculationLine[] = []
    let grandTotal = 0

    // 1. Демонтаж и подготовка (количество берётся явно из стейта)
    for (const dw of state.demolitionWorks) {
      const work = getWorkById(dw.itemId)
      if (!work) continue

      const total = work.pricePerUnit * dw.quantity
      lines.push({
        id: work.id,
        name: work.name,
        unit: work.normalizedUnit,
        quantity: dw.quantity,
        pricePerUnit: work.pricePerUnit,
        total
      })
      grandTotal += total
    }

    // 2. Чистовые покрытия (инстансы)
    for (const instance of state.surfaceInstances) {
      const instanceLines = calculateInstanceLines(instance)
      lines.push(...instanceLines)
      grandTotal += instanceLines.reduce((sum, l) => sum + l.total, 0)
    }

    // 3. Штучные работы (количество берётся явно из стейта)
    for (const pw of state.pieceWorks) {
      const work = getWorkById(pw.itemId)
      if (!work) continue

      const total = work.pricePerUnit * pw.quantity
      lines.push({
        id: work.id,
        name: work.name,
        unit: work.normalizedUnit,
        quantity: pw.quantity,
        pricePerUnit: work.pricePerUnit,
        total,
        isExtra: true
      })
      grandTotal += total
    }

    // console.log('📊 Смета пересчитана. Итого:', grandTotal, '₽')

    return {
      lines,
      summary: { grandTotal }
    }
  })

  return { result }
}