// stores/foremanDaily.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type {
  DailyAssignment,
  DailyWorker,
  ActiveObject,
  BulkAssignmentPayload,
  SplitMode
} from '~/types/daily-assignments'

export const useForemanDailyStore = defineStore('foremanDaily', () => {
  // ── Состояние ──────────────────────────────────────────────────────────
  const assignments = ref<Map<string, DailyAssignment[]>>(new Map())
  const dailyRates = ref<Map<number, number>>(new Map())
  const activeObjects = ref<ActiveObject[]>([])
  const workers = ref<DailyWorker[]>([])
  const bulkSelection = ref<{ workerId: number; dates: string[] } | null>(null)
  const editMode = ref<SplitMode>('percent')
  const loading = ref(false)
  const error = ref<string | null>(null)

  // ── Даты ───────────────────────────────────────────────────────────────
  const editableDaysLimit = 30

  const now = new Date()
  const todayStr = ref<string>(now.toISOString().slice(0, 10))
  
  const minDate = new Date()
  minDate.setDate(minDate.getDate() - editableDaysLimit)
  const minEditableDate = ref<string>(minDate.toISOString().slice(0, 10))

  const workersWithDailyRate = computed(() =>
    workers.value.filter(w => w.dailyRate > 0)
  )

  function isDateEditable(date: string): boolean {
    return date >= minEditableDate.value && date <= todayStr.value
  }

  function getGroupByDate(workerId: number, date: string): DailyAssignment[] {
    const key = `${workerId}_${date}`
    return assignments.value.get(key) ?? []
  }

  function getWorkerRate(workerId: number): number {
    return dailyRates.value.get(workerId) ?? 0
  }

  // ── Действия ───────────────────────────────────────────────────────────
  async function fetchWorkers() {
    error.value = null // 🔹 Сбрасываем ошибку перед новой попыткой
    console.log('[Store:foremanDaily] Загрузка списка рабочих/мастеров с подневкой...')
    try {
      const data = await $fetch<DailyWorker[]>('/api/works/daily-work/workers-with-daily-rate')
      workers.value = data || []
      data.forEach(w => {
        if (w.dailyRate > 0) dailyRates.value.set(w.id, w.dailyRate)
      })
      console.log(`[Store:foremanDaily] Загружено рабочих: ${workers.value.length}`)
    } catch (e: any) {
      console.error('[Store:foremanDaily] Ошибка загрузки рабочих:', e)
      error.value = e.message || 'Не удалось загрузить список'
    }
  }

  async function fetchActiveObjects() {
    error.value = null // 🔹 Сбрасываем ошибку перед новой попыткой
    console.log('[Store:foremanDaily] Загрузка активных объектов...')
    try {
      const data = await $fetch<ActiveObject[]>('/api/works/daily-work/active-objects')
      activeObjects.value = data || []
      console.log(`[Store:foremanDaily] Загружено объектов: ${activeObjects.value.length}`)
    } catch (e: any) {
      console.error('[Store:foremanDaily] Ошибка загрузки объектов:', e)
      error.value = e.message || 'Не удалось загрузить объекты'
    }
  }

  async function fetchAssignments(workerId: number, contractorType: 'worker' | 'master', from: string, to: string) {
    console.log(`[Store:foremanDaily] Загрузка назначений для ${contractorType} #${workerId} с ${from} по ${to}`)
    
    // ❗ Убрали loading.value = true, чтобы не перекрывать UI спиннером при параллельных запросах
    try {
      const data = await $fetch<DailyAssignment[]>(
        `/api/works/daily-work/daily-assignments?workerId=${workerId}&contractorType=${contractorType}&from=${from}&to=${to}`
      )
      
      const grouped = new Map<string, DailyAssignment[]>()
      data.forEach(assignment => {
        const key = `${assignment.workerId}_${assignment.date}`
        if (!grouped.has(key)) grouped.set(key, [])
        grouped.get(key)!.push(assignment)
      })
      
      // Мерджим новые данные в общий кэш
      grouped.forEach((vals, key) => assignments.value.set(key, vals))
      console.log(`[Store:foremanDaily] Кэшировано ${grouped.size} дней назначений`)
    } catch (e: any) {
      console.error('[Store:foremanDaily] Ошибка загрузки назначений:', e)
      error.value = e.message || 'Не удалось загрузить историю'
    }
  }

  async function saveAssignment(payload: DailyAssignment) {
    console.log(`[Store:foremanDaily] Сохранение назначения на ${payload.date}`)
    try {
      const res = await $fetch<{ id: number } & Omit<DailyAssignment, 'id'>>('/api/works', {
        method: 'POST',
        body: {
          contractorId: payload.workerId,
          contractorType: payload.contractorType,
          objectId: payload.objectId,
          workerAmount: payload.amount.toString(),
          operationDate: payload.date,
          workSource: 'daily'
        }
      })

      const key = `${payload.workerId}_${payload.date}`
      const current: DailyAssignment[] = assignments.value.get(key) ?? []
      const idx = current.findIndex(a => a.id !== undefined && a.id === payload.id)
      
      const newEntry: DailyAssignment = { 
        ...payload, 
        id: res.id 
      }
      
      if (idx !== -1) {
        current[idx] = newEntry
      } else {
        current.push(newEntry)
      }

      assignments.value.set(key, current)
      console.log('[Store:foremanDaily] Назначение успешно сохранено')
      return res
    } catch (e: any) {
      console.error('[Store:foremanDaily] Ошибка сохранения:', e)
      throw e
    }
  }

  async function deleteAssignment(id: number) {
    console.log(`[Store:foremanDaily] Удаление записи #${id}`)
    try {
      await $fetch(`/api/works/${id}`, { method: 'DELETE' })
      
      const updatedMap = new Map<string, DailyAssignment[]>()
      assignments.value.forEach((arr, key) => {
        const filtered = arr.filter(a => {
          if (a.id === undefined) return true
          return a.id !== id
        })
        if (filtered.length > 0) {
          updatedMap.set(key, filtered)
        }
      })
      assignments.value = updatedMap
      
      console.log('[Store:foremanDaily] Запись удалена и кэш обновлен')
    } catch (e: any) {
      console.error('[Store:foremanDaily] Ошибка удаления:', e)
      throw e
    }
  }

  async function applyBulk(payload: BulkAssignmentPayload) {
    console.log(`[Store:foremanDaily] Массовое применение на ${payload.dates.length} дней`)
    loading.value = true
    
    try {
      // 🚀 Один запрос на весь пакет
      const response = await $fetch<{ success: boolean; count: number; ids: number[] }>(
        '/api/works/daily-work/bulk',
        {
          method: 'POST',
          body: {
            workerId: payload.workerId,
            contractorType: payload.contractorType,
            assignments: payload.assignments.map(a => ({
              objectId: a.objectId,
              amount: a.amount.toString()
            })),
            dates: payload.dates
          }
        }
      )

      // 🔄 Обновляем кеш стора с новыми записями
      payload.dates.forEach((date, dateIdx) => {
        const key = `${payload.workerId}_${date}`
        
        const newAssignments = payload.assignments.map((obj, objIdx) => {
          // Вычисляем индекс ID в плоском массиве: даты × объекты
          const flatIndex = dateIdx * payload.assignments.length + objIdx
          const newId = response.ids[flatIndex]
          
          return {
            ...obj,
            workerId: payload.workerId,
            contractorType: payload.contractorType,
            date,
            id: newId,
            workSource: 'daily' as const
          }
        })
        
        assignments.value.set(key, newAssignments)
      })

      console.log(`[Store:foremanDaily] Массовое применение завершено: ${response.count} записей`)
      
    } catch (e: any) {
      console.error('[Store:foremanDaily] Ошибка массового применения:', e)
      throw e
    } finally {
      loading.value = false
    }
  }

  // ── Утилиты расчета ────────────────────────────────────────────────────
  function roundTo50(value: number): number {
    return Math.round(value / 50) * 50
  }

  // 🔧 FIX: Полностью переписано для обхода noUncheckedIndexedAccess
  function calculateSplit(dailyRate: number, splits: { percentage: number }[]): number[] {
    if (splits.length === 0) return []
    
    const raw = splits.map(s => (dailyRate * s.percentage) / 100)
    const rounded = raw.map(r => roundTo50(r))
    const diff = dailyRate - rounded.reduce((sum, val) => sum + val, 0)
    
    if (diff !== 0) {
      // Используем entries() чтобы TS не ругался на arr[i]
      let maxIdx = 0
      let maxPerc = -Infinity
      for (const [i, s] of splits.entries()) {
        if (s.percentage > maxPerc) {
          maxPerc = s.percentage
          maxIdx = i
        }
      }
      rounded[maxIdx]! += diff
    }
    
    return rounded
  }

  function validateTotal(amounts: number[], dailyRate: number): boolean {
    const sum = amounts.reduce((acc, val) => acc + val, 0)
    return Math.abs(sum - dailyRate) < 0.01
  }

  // ── Возврат интерфейса стора ───────────────────────────────────────────
  return {
    assignments,
    dailyRates,
    activeObjects,
    workers,
    bulkSelection,
    editMode,
    loading,
    error,
    todayStr,
    minEditableDate,
    workersWithDailyRate,
    isDateEditable,
    getGroupByDate,
    getWorkerRate,
    fetchWorkers,
    fetchActiveObjects,
    fetchAssignments,
    saveAssignment,
    deleteAssignment,
    applyBulk,
    calculateSplit,
    validateTotal
  }
})
