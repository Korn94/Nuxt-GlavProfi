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
   * ✅ Логика: для стен берётся wallArea, для пола/потолка — floorArea.
   */
  function calculateInstanceLines(instance: CalculatorState['surfaceInstances'][number]): CalculationLine[] {
    const config = FINISH_GROUPS[instance.finishGroupId]
    if (!config) return []

    const lines: CalculationLine[] = []
    
    // 1. Определяем ID основной работы с учётом опций
    const getEffectiveItemId = (baseId: number): number => {
      if (!config.options) return baseId
      
      for (const [optKey, optVal] of Object.entries(instance.options)) {
        const optConfig = config.options?.[optKey]
        if (optConfig) {
          const match = optConfig.values.find(v => v.value === optVal)
          if (match?.itemId) return match.itemId
        }
      }
      return baseId
    }

    // 2. Формируем список работ из конфига
    const workIds = [...config.baseItemIds]
    
    for (const workId of workIds) {
      if (instance.excludedItemIds.includes(workId)) continue

      const finalWorkId = getEffectiveItemId(workId)
      const work = getWorkById(finalWorkId)
      if (!work) continue

      // ✅ Динамический выбор площади в зависимости от секции работы
      let quantity = 0
      if (work.section === 'walls') {
        // Для стен используем площадь стен (с фоллбэком на площадь пола)
        quantity = state.dimensions.wallArea ?? state.dimensions.floorArea
      } else if (work.section === 'floor' || work.section === 'ceiling') {
        // Для пола и потолка всегда площадь пола
        quantity = state.dimensions.floorArea
      } else {
        // Фоллбэк для нестандартных случаев
        quantity = instance.area || state.dimensions.floorArea
      }

      // Защита от отрицательных или нулевых значений
      quantity = Math.max(0, quantity)

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