// app/composables/daily-work/useBulkSelection.ts

import { computed } from "vue"

export interface BulkSelectionState {
  isActive: boolean
  isDragging: boolean
  startDate: string | null
  endDate: string | null
  selectedDates: string[]
}

export interface UseBulkSelectionOptions {
  onStart?: (date: string) => void
  onChange?: (dates: string[]) => void
  onEnd?: (dates: string[]) => void
  minDate?: string
  maxDate?: string
}

/** Генерация массива дат между start и end (включительно) */
export function generateDateRange(start: string, end: string): string[] {
  const dates: string[] = []
  const currentDate = new Date(start)
  const endDate = new Date(end)

  while (currentDate <= endDate) {
    // toISOString всегда содержит 'T', поэтому [0]! безопасен
    const dateStr = currentDate.toISOString().split('T')[0]!
    dates.push(dateStr)
    currentDate.setDate(currentDate.getDate() + 1)
  }

  return dates
}

/** Проверка, попадает ли дата в разрешённый диапазон */
export function isDateInRange(date: string, min?: string, max?: string): boolean {
  if (min && date < min) return false
  if (max && date > max) return false
  return true
}

/** Composable для управления массовым выделением дат */
export function useBulkSelection(options: UseBulkSelectionOptions = {}) {
  const state: BulkSelectionState = {
    isActive: false,
    isDragging: false,
    startDate: null,
    endDate: null,
    selectedDates: []
  }

  function startSelection(date: string): void {
    if (!isDateInRange(date, options.minDate, options.maxDate)) return

    state.isActive = true
    state.startDate = date
    state.endDate = date
    state.selectedDates = [date]

    options.onStart?.(date)
    options.onChange?.([date])
  }

  function extendSelection(date: string): void {
    if (!state.isActive || !state.startDate) return
    if (!isDateInRange(date, options.minDate, options.maxDate)) return

    state.endDate = date

    const sorted = [state.startDate, date].sort()
    // sort() гарантирует 2 элемента, поэтому [0]! и [1]! безопасны
    const start = sorted[0]!
    const end = sorted[1]!

    const range = generateDateRange(start, end)
    state.selectedDates = range.filter(d => isDateInRange(d, options.minDate, options.maxDate))

    options.onChange?.(state.selectedDates)
  }

  function endSelection(): string[] {
    if (!state.isActive) return []

    state.isActive = false
    state.isDragging = false
    const result = [...state.selectedDates]

    options.onEnd?.(result)

    state.startDate = null
    state.endDate = null
    state.selectedDates = []

    return result
  }

  function cancelSelection(): void {
    state.isActive = false
    state.startDate = null
    state.endDate = null
    state.selectedDates = []
  }

  function bindCell(date: string) {
    return {
      touchstart: (e: TouchEvent) => {
        e.preventDefault() // ✅ Блокируем скролл при касании
        state.isDragging = false
        startSelection(date)
      },
      touchmove: (e: TouchEvent) => {
        if (!state.isActive) return
        e.preventDefault()
        state.isDragging = true // ✅ Помечаем как перетаскивание
        const touch = e.touches[0]
        if (!touch) return
        const target = document.elementFromPoint(touch.clientX, touch.clientY)
        const cellDate = target?.getAttribute('data-date')
        if (cellDate) extendSelection(cellDate)
      },
      mousedown: (e: MouseEvent) => {
        if (e.button !== 0) return
        startSelection(date)
      },
      mouseenter: () => {
        if (state.isActive) {
          state.isDragging = true // ✅ Для ПК тоже помечаем
          extendSelection(date)
        }
      }
    }
  }

  if (typeof window !== 'undefined') {
    window.addEventListener('touchend', () => {
      if (state.isActive) endSelection()
    }, { passive: true })

    window.addEventListener('mouseup', () => {
      if (state.isActive) endSelection()
    })
  }

  return {
    state,
    isDragging: computed(() => state.isDragging),
    startSelection,
    extendSelection,
    endSelection,
    cancelSelection,
    bindCell,
    generateDateRange,
    isDateInRange
  }
}
