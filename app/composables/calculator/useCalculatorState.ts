// app/composables/calculator/useCalculatorState.ts
import { reactive } from 'vue'
import type { CalculatorState, CalculatorSection } from '~/types/calculator'
import { generateId } from '~/utils/id'
import { FINISH_GROUPS } from '~/utils/finish-groups' // ✅ Импорт для определения секции покрытия

/**
 * 🧠 Реактивное состояние калькулятора
 * ✅ Обновлено: при добавлении покрытия автоматически выбирается площадь пола или стен.
 */
export function useCalculatorState() {
  // =========================================================================
  // 📐 Вспомогательные функции
  // =========================================================================
  function calculateAutoWallArea(floorArea: number, height: number, perimeter: number | null): number {
    if (floorArea <= 0 || height <= 0) return 0
    const p = perimeter ?? 4 * Math.sqrt(floorArea)
    return Math.round(p * height * 10) / 10
  }

  /**
   * 🔍 Находит значение опции по умолчанию.
   * Приоритет: вариант, содержащий "(стандарт)" в названии.
   * Фоллбэк: первый элемент массива, если стандарт не найден.
   */
  function findDefaultValue(values: Array<{ label: string; value: string }>): string {
    // ✅ Защита от пустого массива
    if (!values?.length) return ''
    
    const standard = values.find(v => v.label?.toLowerCase().includes('(стандарт)'))
    
    // ✅ Гарантированный возврат строки (даже если первый элемент не имеет value)
    return standard?.value ?? values[0]?.value ?? ''
  }

  // =========================================================================
  // 🗃️ Инициализация состояния
  // =========================================================================
  const state = reactive<CalculatorState>({
    section: 'walls',
    dimensions: {
      floorArea: 50,
      height: 2.7,
      perimeter: null,
      wallArea: null,
      isWallAreaManual: false
    },
    demolitionWorks: [],
    surfaceInstances: [],
    pieceWorks: []
  })

  // Первичный авто-расчёт площади стен
  state.dimensions.wallArea = calculateAutoWallArea(
    state.dimensions.floorArea,
    state.dimensions.height,
    state.dimensions.perimeter
  )

  // =========================================================================
  // 📏 Управление параметрами помещения
  // =========================================================================
  function updateFloorArea(area: number) {
    state.dimensions.floorArea = Math.max(0, area)
    if (!state.dimensions.isWallAreaManual) {
      state.dimensions.wallArea = calculateAutoWallArea(
        state.dimensions.floorArea,
        state.dimensions.height,
        state.dimensions.perimeter
      )
    }
  }

  function updateHeight(height: number) {
    state.dimensions.height = Math.max(2.0, height)
    if (!state.dimensions.isWallAreaManual) {
      state.dimensions.wallArea = calculateAutoWallArea(
        state.dimensions.floorArea,
        state.dimensions.height,
        state.dimensions.perimeter
      )
    }
  }

  function updatePerimeter(perimeter: number | null) {
    state.dimensions.perimeter = perimeter
    if (!state.dimensions.isWallAreaManual) {
      state.dimensions.wallArea = calculateAutoWallArea(
        state.dimensions.floorArea,
        state.dimensions.height,
        state.dimensions.perimeter
      )
    }
  }

  function toggleWallAreaManual() {
    state.dimensions.isWallAreaManual = !state.dimensions.isWallAreaManual
    if (!state.dimensions.isWallAreaManual) {
      state.dimensions.wallArea = calculateAutoWallArea(
        state.dimensions.floorArea,
        state.dimensions.height,
        state.dimensions.perimeter
      )
    }
  }

  function updateWallArea(area: number | null) {
    const val = area === null ? null : Math.max(0, area)
    state.dimensions.wallArea = val
    if (val !== null && !state.dimensions.isWallAreaManual) {
      state.dimensions.isWallAreaManual = true
    }
  }

  // =========================================================================
  // 🔄 Переключение секций
  // =========================================================================
  function setSection(section: CalculatorSection) {
    state.section = section
    console.log(`🔄 Секция изменена на: ${section}`)
  }

  // =========================================================================
  // 🔨 Демонтаж и подготовка
  // =========================================================================
  function addDemolitionWork(itemId: number) {
    if (!state.demolitionWorks.some(w => w.itemId === itemId)) {
      state.demolitionWorks.push({ itemId, quantity: 1 })
      console.log('✅ Добавлена работа демонтажа:', itemId)
    }
  }

  function removeDemolitionWork(itemId: number) {
    state.demolitionWorks = state.demolitionWorks.filter(w => w.itemId !== itemId)
    console.log('🗑️ Удалена работа демонтажа:', itemId)
  }

  function updateDemolitionQty(itemId: number, qty: number) {
    const work = state.demolitionWorks.find(w => w.itemId === itemId)
    if (work) work.quantity = Math.max(0, qty)
  }

  // =========================================================================
  // 🎨 Чистовые покрытия (Инстансы)
  // =========================================================================
  /**
   * ✅ Умное добавление покрытия: 
   * - Автоматическая площадь (пол или стены).
   * - Предвыбор первой опции из конфига (чтобы кнопки сразу горели).
   */
  function addSurfaceInstance(finishGroupId: string) {
    const config = FINISH_GROUPS[finishGroupId]
    const section = config?.section ?? 'floor'

    let defaultArea = state.dimensions.floorArea || 50
    if (section === 'walls') {
      defaultArea = state.dimensions.wallArea ?? state.dimensions.floorArea ?? 50
    }

    // ✅ 1. Инициализируем опции дефолтными значениями (ищем пометку "стандарт")
    const defaultOptions: Record<string, string> = {}
    if (config?.options) {
      for (const optKey in config.options) {
        const optGroup = config.options[optKey]
        if (optGroup?.values?.length) {
          defaultOptions[optKey] = findDefaultValue(optGroup.values)
        }
      }
    }

    const newInstance = {
      instanceId: generateId('surface'),
      finishGroupId,
      options: defaultOptions, // ✅ Передаем предзаполненные опции
      area: Math.round(defaultArea * 10) / 10,
      excludedItemIds: [],
      extras: []
    }
    
    state.surfaceInstances.push(newInstance)
    console.log(`✅ Добавлено покрытие: ${config?.name || finishGroupId} | Секция: ${section} | Площадь: ${newInstance.area} м²`)
  }

  function removeSurfaceInstance(instanceId: string) {
    state.surfaceInstances = state.surfaceInstances.filter(i => i.instanceId !== instanceId)
    console.log('🗑️ Удалено покрытие ID:', instanceId)
  }

  function updateInstanceArea(instanceId: string, area: number) {
    const inst = state.surfaceInstances.find(i => i.instanceId === instanceId)
    if (inst) inst.area = Math.max(0, area)
  }

  function updateInstanceOption(instanceId: string, optionKey: string, value: string) {
    const inst = state.surfaceInstances.find(i => i.instanceId === instanceId)
    if (inst) inst.options[optionKey] = value
  }

  function toggleInstanceItemExclusion(instanceId: string, itemId: number) {
    const inst = state.surfaceInstances.find(i => i.instanceId === instanceId)
    if (inst) {
      const idx = inst.excludedItemIds.indexOf(itemId)
      if (idx === -1) inst.excludedItemIds.push(itemId)
      else inst.excludedItemIds.splice(idx, 1)
    }
  }

  // =========================================================================
  // 🧩 Штучные дополнительные работы
  // =========================================================================
  function addPieceWork(itemId: number) {
    if (!state.pieceWorks.some(w => w.itemId === itemId)) {
      state.pieceWorks.push({ itemId, quantity: 1 })
      console.log('✅ Добавлена штучная работа:', itemId)
    }
  }

  function removePieceWork(itemId: number) {
    state.pieceWorks = state.pieceWorks.filter(w => w.itemId !== itemId)
    console.log('🗑️ Удалена штучная работа:', itemId)
  }

  function updatePieceQty(itemId: number, qty: number) {
    const work = state.pieceWorks.find(w => w.itemId === itemId)
    if (work) work.quantity = Math.max(1, qty)
  }

  // =========================================================================
  // 🔄 Полный сброс
  // =========================================================================
  function resetState() {
    state.section = 'walls'
    state.dimensions.floorArea = 50
    state.dimensions.height = 2.7
    state.dimensions.perimeter = null
    state.dimensions.isWallAreaManual = false
    state.dimensions.wallArea = calculateAutoWallArea(50, 2.7, null)
    state.demolitionWorks = []
    state.surfaceInstances = []
    state.pieceWorks = []
    console.log('🔄 Калькулятор сброшен')
  }

  return {
    state,
    // Параметры помещения
    updateFloorArea,
    updateHeight,
    updatePerimeter,
    toggleWallAreaManual,
    updateWallArea,
    // Навигация
    setSection,
    // Демонтаж
    addDemolitionWork,
    removeDemolitionWork,
    updateDemolitionQty,
    // Покрытия
    addSurfaceInstance,
    removeSurfaceInstance,
    updateInstanceArea,
    updateInstanceOption,
    toggleInstanceItemExclusion,
    // Штучные работы
    addPieceWork,
    removePieceWork,
    updatePieceQty,
    // Сброс
    resetState
  }
}
