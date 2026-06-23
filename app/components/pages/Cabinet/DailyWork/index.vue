<!-- app/components/pages/cabinet/DailyWork/index.vue -->
<template>
  <div class="daily-work-page">
    
    <!-- ═══════════════ UNIFIED PAGE TITLE ═══════════════ -->
    <PagesCabinetUiLayoutPageTitle 
      :title="pageTitle"
      :icon="pageIcon"
    >
      <template #actions>
        <slot name="header-actions">
          <button class="btn-icon" @click="showHelp = !showHelp" title="Подсказка">?</button>
        </slot>
      </template>
    </PagesCabinetUiLayoutPageTitle>
    
    <!-- ❌ Нет прав на просмотр -->
    <UiAccessDeniedBlock v-if="isMounted && !canView" />

    <!-- ✅ Есть права — показываем контент -->
    <template v-else>
      <!-- Подсказка -->
      <div class="hint-wrapper">
        <BulkSelectionHint :visible="showHelp" text="Зажми ячейку и веди пальцем, чтобы отметить смену на несколько дней сразу." @close="showHelp = false" />
      </div>

      <!-- Навигация по датам -->
      <div class="date-nav-wrapper">
        <div class="date-nav">
          <button class="btn-nav" @click="shiftDates(-7)"><Icon name="mdi:chevron-double-left" size="18" /></button>
          <span class="date-nav__current">{{ weekLabel }}</span>
          <button class="btn-nav" @click="shiftDates(7)"><Icon name="mdi:chevron-double-right" size="18" /></button>
          <button class="btn-nav btn-nav--today" @click="resetDates">Сегодня</button>
        </div>
      </div>

      <!-- ═══════════════════════════ LOADING ═══════════════════════════ -->
      <div v-if="store.loading || (!store.workers.length && !store.error)" class="loading-state">
        <div class="spinner"></div>
        <span>{{ loadingText }}</span>
      </div>

      <!-- ═══════════════════════════ ERROR STATE ═══════════════════════════ -->
      <div v-else-if="store.error" class="error-state">
        <div class="error-card">
          <span class="error-icon">⚠️</span>
          <h3>Не удалось загрузить данные</h3>
          <p>{{ store.error }}</p>
          <button class="btn-retry" @click="retryLoad">Попробовать снова</button>
        </div>
      </div>

      <!-- ═══════════════════════════ MAIN GRID ═══════════════════════ -->
      <div v-else class="grid-wrapper" ref="scrollContainer">
        <div class="daily-grid">
          <div class="grid-header">
            <div class="grid-header__sticky">{{ headerLabel }}</div>
            <div v-for="date in datesRange" :key="date" class="grid-header__cell"
              :class="{ 'grid-header__cell--today': date === todayStr }">
              <span :class="['cell-day', { 'cell-day--weekend': isWeekend(date) }]">{{ getDayOfWeek(date) }}</span>
              <span :class="['cell-date', { 'cell-date--weekend': isWeekend(date) }]">{{ getDayNumber(date) }}</span>
            </div>
          </div>

          <div v-for="worker in store.workersWithDailyRate" :key="worker.id" class="grid-row">
            <div class="grid-row__info">
              <NuxtLink
                v-if="isMounted && isAdminUser"
                :to="`/cabinet/contractors/${worker.contractorType}/${worker.id}`"
                class="info-name info-name--link"
                :title="worker.name"
              >
                {{ worker.name }}
              </NuxtLink>
              <span
                v-else
                class="info-name"
                :title="worker.name"
              >
                {{ worker.name }}
              </span>
              <span class="info-balance">{{ formatCurrency(worker.balance) }}</span>
            </div>
            <CalendarCell
              v-for="date in datesRange"
              :key="date"
              :date="date"
              :worker-id="worker.id"
              :daily-rate="worker.dailyRate"
              :assignments="getAssignments(worker.id, date)"
              :is-editable="isDateEditable(date) && canModify"
              :is-selected="isDateSelected(worker.id, date)"
              :range-type="getRangeType(worker.id, date)"
              @click="handleCellClick(worker, date)"
              @mousedown="handleMouseDown(worker, date)"
              @mouseenter="handleMouseEnter(date)"
              @touchstart="(e) => handleTouchStart(worker, date, e)"
              @touchmove="(e) => handleTouchMove(date, e)"
            />
          </div>
        </div>
      </div>

      <!-- ═══════════════════════════ MODAL SHEET ═══════════════════════ -->
      <DailyAssignmentSheet 
        v-if="canModify"
        v-model="sheetOpen" 
        :dates="datesToApply" 
        :daily-rate="selectedWorker?.dailyRate ?? 0"
        :contractor-id="selectedWorker?.id"
        :assignments="currentAssignments" 
        :active-objects="store.activeObjects" 
        :is-saving="store.loading"
        :contractor-name="selectedWorker?.name"
        :contractor-type="selectedWorker?.contractorType"
        @save="handleSave" 
        @confirm-delete="handleDeleteConfirm" 
      />

      <!-- Подтверждение удаления -->
      <div v-if="showDeleteConfirm && canDelete" class="confirm-backdrop">
        <div class="confirm-dialog">
          <h3>Удалить записи за {{ selectedDate }}?</h3>
          <p>Это действие удалит все назначения подневки. Баланс будет пересчитан.</p>
          <div class="confirm-dialog__actions">
            <button class="btn-text" @click="showDeleteConfirm = false">Отмена</button>
            <button class="btn-danger" @click="executeDelete">Удалить всё</button>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, onUnmounted, nextTick } from 'vue'
import { useForemanDailyStore } from 'stores/foremanDaily'
import { useBulkSelection } from '~/composables/daily-work/useBulkSelection'
import { useDailyAssignment } from '~/composables/daily-work/useDailyAssignment'
import { usePermissions } from '~/composables/usePermissions'
import { useNotifications } from '~/composables/useNotifications'
import type { DailyWorker, DailyAssignment } from '~/types/daily-assignments'
import CalendarCell from './ui/CalendarCell.vue'
import DailyAssignmentSheet from './DailyAssignmentSheet.vue'
import BulkSelectionHint from './BulkSelectionHint.vue'

// ── Пропсы для гибкости компонента ─────────────────────────────
const props = defineProps<{
  pageTitle?: string
  pageIcon?: string
  headerLabel?: string
  loadingText?: string
  autoLoad?: boolean
  initialOffset?: number
}>()

// ── Эмиты для связи с родителем ────────────────────────────────
const emit = defineEmits<{
  (e: 'loaded'): void
  (e: 'error', error: string): void
  (e: 'save', payload: { 
    worker: DailyWorker
    assignments: DailyAssignment[]
    dates: string[]
  }): void
  (e: 'delete', payload: { 
    worker: DailyWorker
    dates: string[]
  }): void
}>()

// ── Значения по умолчанию ─────────────────────────────────────
const {
  pageTitle = 'Учет подневки',
  pageIcon = 'mdi:calendar-month-outline',
  headerLabel = 'Сотрудник',
  loadingText = 'Загрузка данных...',
  autoLoad = true,
  initialOffset = 0
} = props

// ── Стор и утилиты ────────────────────────────────────────────
const store = useForemanDailyStore()
const { formatCurrency } = useDailyAssignment()
const { can, hasRole } = usePermissions()
const notifications = useNotifications()

// ── 🛡️ ЗАЩИТА ОТ HYDRATION MISMATCH ────────────────────────────
const isMounted = ref(false)

// ── ПРАВА ДОСТУПА ──────────────────────────────────────────────
const canView = computed(() => can('daily-work', 'view'))
const canCreate = computed(() => can('daily-work', 'create'))
const canEdit = computed(() => can('daily-work', 'edit'))
const canDelete = computed(() => can('daily-work', 'delete'))
const canSpecial = computed(() => can('daily-work', 'special'))

// Может создавать или редактировать (для модификации ячеек)
const canModify = computed(() => canCreate.value || canEdit.value)

// Администратор (для ссылки на карточку сотрудника)
const isAdminUser = computed(() => hasRole('admin'))

// ── Локальное состояние ───────────────────────────────────────
const sheetOpen = ref(false)
const selectedWorker = ref<DailyWorker | null>(null)
const selectedDate = ref('')
const selectedDatesForModal = ref<string[]>([])
const showDeleteConfirm = ref(false)
const showHelp = ref(false)
const startOffset = ref(initialOffset)
const selectedWorkerIdForBulk = ref<number | null>(null)
const modalDates = ref<string[]>([])

// ── Вычисляемые свойства (прокси к стору) ─────────────────────
const todayStr = computed(() => store.todayStr)
const minEditableDate = computed(() => store.minEditableDate)

const datesRange = computed(() => {
  const today = new Date()
  const start = new Date(today)
  start.setDate(today.getDate() - 12 + startOffset.value * 7)
  const end = new Date(start)
  end.setDate(start.getDate() + 13)
  const dates: string[] = []
  const current = new Date(start)
  while (current <= end) {
    dates.push(current.toISOString().slice(0, 10))
    current.setDate(current.getDate() + 1)
  }
  return dates
})

const weekLabel = computed(() => {
  if (datesRange.value.length < 2) return ''
  const s = new Date(datesRange.value[0]!)
  const e = new Date(datesRange.value[datesRange.value.length - 1]!)
  return `${s.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })} — ${e.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}`
})

const currentAssignments = computed(() => {
  if (!selectedWorker.value || !selectedDate.value) return []
  return store.getGroupByDate(selectedWorker.value.id, selectedDate.value)
})

const datesToApply = computed(() => {
  return modalDates.value.length > 0 
    ? modalDates.value 
    : (selectedDatesForModal.value.length > 0 
        ? selectedDatesForModal.value 
        : (selectedDate.value ? [selectedDate.value] : [])
      )
})

// ── Логика выделения ──────────────────────────────────────────
let currentWorkerForBulk: DailyWorker | null = null

const { bindCell, state: bulkState, isDragging } = useBulkSelection({
  minDate: minEditableDate.value,
  
  onChange: (dates) => {
    if (selectedWorkerIdForBulk.value === selectedWorker.value?.id) {
      selectedDatesForModal.value = [...dates]
    }
  },
  
  onEnd: (dates) => {
    if (dates.length > 0 && selectedWorker.value && canModify.value) {
      console.log('[DailyWork] Выделение завершено, дней:', dates.length)
      
      selectedDate.value = dates[0]!
      modalDates.value = [...dates]
      
      sheetOpen.value = true
    }
    
    selectedDatesForModal.value = []
    selectedWorkerIdForBulk.value = null
    currentWorkerForBulk = null
  }
})

// ── Логика скролла ────────────────────────────────────────────
const scrollContainer = ref<HTMLElement | null>(null)

function onScroll() {
  if (!scrollContainer.value) return
  const scrollX = scrollContainer.value.scrollLeft
  if (scrollX > 10) {
    scrollContainer.value.classList.add('scrolled')
  } else {
    scrollContainer.value.classList.remove('scrolled')
  }
}

// ── Обработчики событий ───────────────────────────────────────
function handleMouseDown(worker: DailyWorker, date: string) {
  if (!canModify.value) return
  
  selectedWorker.value = worker
  selectedWorkerIdForBulk.value = worker.id
  currentWorkerForBulk = worker
  bindCell(date).mousedown({ button: 0 } as MouseEvent)
}

function handleMouseEnter(date: string) {
  if (!bulkState.isActive || !currentWorkerForBulk || selectedWorker.value?.id !== currentWorkerForBulk.id) return
  bindCell(date).mouseenter()
}

function handleTouchStart(worker: DailyWorker, date: string, event: TouchEvent) {
  if (!canModify.value) return
  
  event.preventDefault()
  
  selectedWorker.value = worker
  selectedWorkerIdForBulk.value = worker.id
  currentWorkerForBulk = worker
  
  bindCell(date).touchstart(event)
}

function handleTouchMove(date: string, event: TouchEvent) {
  if (!bulkState.isActive || !currentWorkerForBulk || selectedWorker.value?.id !== currentWorkerForBulk.id) return
  
  if (bulkState.isActive) {
    event.preventDefault()
  }
  
  bindCell(date).touchmove(event)
}

function handleCellClick(worker: DailyWorker, date: string) {
  if (isDragging.value) return
  if (!canModify.value) return
  
  selectedWorker.value = worker
  selectedDate.value = date
  selectedDatesForModal.value = [date]
  sheetOpen.value = true
}

function getRangeType(workerId: number, date: string): 'start' | 'middle' | 'end' | undefined {
  if (selectedWorkerIdForBulk.value !== workerId) return undefined
  
  const dates = selectedDatesForModal.value
  if (dates.length < 2) return undefined
  if (dates[0] === date) return 'start'
  if (dates[dates.length - 1] === date) return 'end'
  if (dates.includes(date)) return 'middle'
  return undefined
}

function isDateSelected(workerId: number, date: string) {
  return selectedWorkerIdForBulk.value === workerId && selectedDatesForModal.value.includes(date)
}

function isDateEditable(date: string) { return store.isDateEditable(date) }
function getAssignments(workerId: number, date: string) { return store.getGroupByDate(workerId, date) }

function shiftDates(days: number) { startOffset.value += days / 7 }
function resetDates() { startOffset.value = 0 }
function getDayOfWeek(date: string) { return new Date(date).toLocaleDateString('ru-RU', { weekday: 'short' }) }
function getDayNumber(date: string) { return new Date(date).getDate().toString() }
function isWeekend(date: string) { const d = new Date(date).getDay(); return d === 0 || d === 6 }

// ── Сохранение и удаление ─────────────────────────────────────
async function handleSave(data: { assignments: DailyAssignment[], dates: string[] }) {
  if (!selectedWorker.value) return
  if (!canModify.value) {
    notifications.error('У вас нет прав для изменения подневки', 'Доступ запрещён')
    return
  }
  
  console.log('[DailyWork] Начало сохранения назначений...')
  
  try {
    for (const date of data.dates) {
      const existing = store.getGroupByDate(selectedWorker.value.id, date)
      // Удаляем существующие (требует canDelete или canEdit)
      if (canDelete.value || canEdit.value) {
        for (const item of existing) { 
          if (item.id) await store.deleteAssignment(item.id) 
        }
      }
      // Создаём новые (требует canCreate)
      if (canCreate.value) {
        for (const item of data.assignments) {
          await store.saveAssignment({ 
            ...item, 
            workerId: selectedWorker.value.id, 
            contractorType: selectedWorker.value.contractorType, 
            date 
          })
        }
      }
    }
    
    emit('save', {
      worker: selectedWorker.value,
      assignments: data.assignments,
      dates: data.dates
    })
    
    sheetOpen.value = false
    selectedDatesForModal.value = []
    selectedWorkerIdForBulk.value = null
    currentWorkerForBulk = null
  } catch (e: any) {
    console.error('[DailyWork] Ошибка сохранения:', e)
    
    // Обработка 403
    if (e.statusCode === 403) {
      notifications.error('У вас нет прав для изменения подневки', 'Доступ запрещён')
    }
    
    emit('error', 'Не удалось сохранить данные')
  }
}

async function handleDeleteConfirm() {
  if (!canDelete.value) {
    notifications.error('У вас нет прав для удаления подневки', 'Доступ запрещён')
    return
  }
  showDeleteConfirm.value = true
}

async function executeDelete() {
  showDeleteConfirm.value = false
  if (!selectedWorker.value) return
  if (!canDelete.value) {
    notifications.error('У вас нет прав для удаления подневки', 'Доступ запрещён')
    return
  }
  
  console.log('[DailyWork] Удаление назначений...')
  
  try {
    const datesToDelete = selectedDatesForModal.value.length > 0 
      ? selectedDatesForModal.value 
      : [selectedDate.value]
    
    for (const date of datesToDelete) {
      const existing = store.getGroupByDate(selectedWorker.value.id, date)
      for (const item of existing) { if (item.id) await store.deleteAssignment(item.id) }
    }
    
    emit('delete', {
      worker: selectedWorker.value,
      dates: datesToDelete.filter(Boolean) as string[]
    })
    
    sheetOpen.value = false
    selectedDatesForModal.value = []
    selectedWorkerIdForBulk.value = null
    currentWorkerForBulk = null
  } catch (e: any) {
    console.error('[DailyWork] Ошибка удаления:', e)
    
    // Обработка 403
    if (e.statusCode === 403) {
      notifications.error('У вас нет прав для удаления подневки', 'Доступ запрещён')
    }
    
    emit('error', 'Не удалось удалить данные')
  }
}

// ── Загрузка данных ───────────────────────────────────────────
async function loadAssignmentsForRange() {
  if (store.workers.length === 0 || datesRange.value.length < 2) return
  
  const from = datesRange.value[0]!
  const to = datesRange.value[datesRange.value.length - 1]!
  
  await Promise.allSettled(
    store.workers.map(w => 
      store.fetchAssignments(w.id, w.contractorType, from, to)
    )
  )
}

// 🔹 Автозагрузка при смене недели
watch(datesRange, () => {
  if (store.workers.length > 0) {
    loadAssignmentsForRange()
  }
})

/** Повторная загрузка данных при ошибке */
async function retryLoad() {
  store.error = null
  console.log('[DailyWork] Повторная загрузка данных...')
  
  try {
    await Promise.allSettled([
      store.fetchWorkers(),
      store.fetchActiveObjects()
    ])
    
    if (!store.workers.length && !store.error) {
      store.error = 'Сервер ответил успешно, но список рабочих пуст.'
    }
  } catch (e: any) {
    console.error('[DailyWork] Ошибка загрузки:', e)
    
    // Обработка 403
    if (e.statusCode === 403) {
      notifications.error('У вас больше нет прав для просмотра подневки', 'Доступ запрещён')
    }
  }
}

// ── Хуки жизненного цикла ─────────────────────────────────────
onMounted(async () => {
  // ✅ Устанавливаем флаг ПОСЛЕ монтирования
  isMounted.value = true
  
  if (autoLoad && canView.value) {
    // 1. Инициализация данных
    store.error = null
    try {
      await Promise.all([store.fetchWorkers(), store.fetchActiveObjects()])
      
      // 2. Сразу грузим назначения, если рабочие есть
      if (store.workers.length > 0) {
        await loadAssignmentsForRange()
      }
      
      emit('loaded')
    } catch (e: any) {
      console.error('[DailyWork] Ошибка загрузки:', e)
      
      // Обработка 403
      if (e.statusCode === 403) {
        notifications.error('У вас нет прав для просмотра подневки', 'Доступ запрещён')
      }
    }
  }
  
  // 3. Инициализация скролл-листенера
  nextTick(() => {
    if (scrollContainer.value) {
      scrollContainer.value.addEventListener('scroll', onScroll, { passive: true })
      onScroll()
    }
  })
})

onUnmounted(() => {
  if (scrollContainer.value) {
    scrollContainer.value.removeEventListener('scroll', onScroll)
  }
})

// ── Публичные методы (через defineExpose) ─────────────────────
defineExpose({
  reload: async () => {
    store.error = null
    await Promise.all([store.fetchWorkers(), store.fetchActiveObjects()])
    if (store.workers.length > 0) {
      await loadAssignmentsForRange()
    }
    emit('loaded')
  },
  shiftDates,
  resetDates
})
</script>

<style lang="scss" scoped>
/* ═══════════════════════════════════════════════════════════════
   КОМПОНЕНТ: DailyWork
   Файл: app/components/pages/cabinet/DailyWork/index.vue
   ═══════════════════════════════════════════════════════════════ */

.daily-work-page {
  min-height: 100vh;
  background: var(--crm-bg-base);
  padding-bottom: 20px;
  display: flex;
  flex-direction: column;
}

.hint-wrapper {
  padding: 0 24px;
  
  @media (max-width: 767.98px) {
    padding: 0 16px;
  }
}

.date-nav-wrapper {
  padding: 8px 24px;
  background: var(--crm-bg-base);
  border-bottom: 1px solid var(--crm-border);
  margin-bottom: .5em;
  
  @media (max-width: 767.98px) {
    padding: 8px 16px;
    margin-top: 10px;
  }
}

.date-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  background: var(--crm-bg-surface);
  padding: 6px 12px;
  border-radius: var(--crm-radius-md);
  border: 1px solid var(--crm-border);
  max-width: 600px;
  margin: 0 auto;
  
  &__current {
    font-size: var(--crm-text-sm);
    font-weight: 600;
    color: var(--crm-text-primary);
    white-space: nowrap;
  }
}

.btn-nav {
  background: transparent;
  border: none;
  color: var(--crm-accent);
  font-size: var(--crm-text-sm);
  cursor: pointer;
  padding: 0;
  border-radius: var(--crm-radius-sm);
  transition: var(--crm-transition);
  
  &:hover {
    background: var(--crm-bg-elevated);
  }
  
  &--today {
    padding: 4px 8px;
    color: var(--crm-text-primary);
    border: 1px solid var(--crm-border);
    background: var(--crm-bg-elevated);
  }
}

.btn-icon {
  background: var(--crm-bg-elevated);
  border: 1px solid var(--crm-border);
  color: var(--crm-text-secondary);
  border-radius: var(--crm-radius-sm);
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-weight: 700;
  font-size: var(--crm-text-sm);
  
  &:hover {
    background: var(--crm-bg-overlay);
    color: var(--crm-text-primary);
  }
}

.loading-state {
  padding: 40px;
  text-align: center;
  color: var(--crm-text-muted);
}

.error-state {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  padding: 20px;
}

.error-card {
  background: var(--crm-bg-surface);
  border: 1px solid var(--crm-border);
  border-radius: var(--crm-radius-lg);
  padding: 32px 24px;
  text-align: center;
  max-width: 420px;
  width: 100%;
  box-shadow: var(--crm-shadow-md);
}

.error-icon {
  font-size: 48px;
  display: block;
  margin-bottom: 16px;
}

.error-card h3 {
  margin: 0 0 8px;
  font-size: var(--crm-text-lg);
  color: var(--crm-text-primary);
}

.error-card p {
  margin: 0 0 24px;
  font-size: var(--crm-text-sm);
  color: var(--crm-text-secondary);
  line-height: 1.5;
  white-space: pre-line;
}

.btn-retry {
  background: var(--crm-accent);
  color: #fff;
  border: none;
  border-radius: var(--crm-radius-md);
  padding: 10px 20px;
  font-size: var(--crm-text-sm);
  font-weight: 600;
  cursor: pointer;
  transition: var(--crm-transition);
  
  &:hover {
    background: var(--crm-accent-hover);
  }
  &:active {
    transform: scale(0.98);
  }
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.spinner {
  width: 24px;
  height: 24px;
  border: 3px solid var(--crm-border);
  border-top-color: var(--crm-accent);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin: 0 auto 8px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.grid-wrapper {
  flex: 1;
  overflow-x: auto;
  overflow-y: hidden;
  -webkit-overflow-scrolling: touch;
  
  padding-left: 20px;
  padding-right: 20px;
  
  &.scrolled {
    padding-left: 0;
  }
  
  @media (max-width: 767.98px) {
    padding-left: 16px;
    padding-right: 16px;
    
    &.scrolled {
      padding-left: 0;
    }
  }
}

.daily-grid {
  display: grid;
  grid-template-columns: 140px repeat(14, 48px);
  background: var(--crm-border);
  border: 1px solid var(--crm-border);
  border-radius: var(--crm-radius-md);
  min-width: max-content;
  max-width: max-content;
}

.grid-header {
  display: contents;
}

.grid-header__sticky {
  position: sticky;
  width: 140px;
  padding: 12px;
  transition: left 0.15s ease, width 0.15s ease, padding 0.15s ease;
  
  .grid-wrapper.scrolled & {
    left: 0;
    width: 100px;
    padding: 12px 8px;
  }
  
  z-index: 20;
  background: var(--crm-bg-surface);
  font-size: var(--crm-text-xs);
  color: var(--crm-text-muted);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-bottom: 2px solid var(--crm-border);
  border-right: 2px solid var(--crm-border);
  display: flex;
  align-items: center;
  isolation: isolate;
  
  &::after {
    content: '';
    position: absolute;
    top: 0; right: -1px; bottom: 0;
    width: 1px;
    background: var(--crm-border);
    pointer-events: none;
  }
}

.grid-header__cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: var(--crm-bg-surface);
  padding: 8px 2px;
  border-bottom: 2px solid var(--crm-border);
  border-right: 1px solid var(--crm-border);
  color: var(--crm-text-primary);

  &--today {
    background: var(--crm-accent-dim);

    .cell-day {
      color: var(--crm-accent);
    }

    .cell-date {
      color: var(--crm-accent);
      font-weight: 700;
    }
  }
}

.cell-day {
  font-size: 9px;
  text-transform: uppercase;
  opacity: 0.7;
  line-height: 1;

  &--weekend {
    color: var(--crm-danger);
    opacity: 1;
  }
}

.cell-date {
  font-size: 14px;
  font-weight: 700;
  line-height: 1;
  margin-top: 4px;

  &--weekend {
    color: var(--crm-danger);
  }
}

.grid-row {
  display: contents;
}

.grid-row__info {
  position: sticky;
  width: 140px;
  padding: 8px 12px;
  transition: left 0.15s ease, width 0.15s ease, padding 0.15s ease;
  
  .grid-wrapper.scrolled & {
    left: 0;
    width: 100px;
    padding: 8px 8px;
  }
  
  z-index: 15;
  background: var(--crm-bg-surface);
  display: flex;
  align-items: center;
  gap: 5px;
  justify-content: flex-start;
  border-right: 2px solid var(--crm-border);
  border-bottom: 1px solid var(--crm-border);
  cursor: default;
  isolation: isolate;
  
  box-shadow: 4px 0 8px -4px rgba(0, 0, 0, 0.15);
  
  &:hover {
    background: var(--crm-bg-elevated);
  }
}

.info-name {
  font-size: var(--crm-text-sm);
  font-weight: 600;
  color: var(--crm-text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 2px;
  transition: font-size 0.15s ease, color 0.15s ease;
  
  
  .grid-wrapper.scrolled & {
    font-size: var(--crm-text-xs);
  }
}

.info-name--link {
  color: var(--crm-accent);
  text-decoration: none;

  &:hover {
    color: var(--crm-accent-hover, #4a7be8);
    text-decoration: underline;
  }
}

.info-balance {
  font-size: var(--crm-text-xs);
  color: var(--crm-text-muted);
  font-family: var(--crm-font-mono);
  transition: opacity 0.15s ease, width 0.15s ease;
  
  .grid-wrapper.scrolled & {
    opacity: 0;
    width: 0;
    overflow: hidden;
  }
}

.grid-row :deep(.daily-cell) {
  border-bottom: 1px solid var(--crm-border);
  border-right: 1px solid var(--crm-border);
}

.confirm-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  z-index: 60;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.confirm-dialog {
  background: var(--crm-bg-surface);
  padding: 20px;
  border-radius: var(--crm-radius-lg);
  width: 100%;
  max-width: 350px;
  border: 1px solid var(--crm-border);

  h3 {
    margin: 0 0 8px;
    font-size: var(--crm-text-lg);
    color: var(--crm-text-primary);
  }

  p {
    margin: 0 0 20px;
    font-size: var(--crm-text-sm);
    color: var(--crm-text-secondary);
    line-height: 1.4;
  }

  &__actions {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
  }
}

.btn-text {
  background: transparent;
  color: var(--crm-text-muted);
  border: none;
  cursor: pointer;
  padding: 8px 12px;
  font-size: var(--crm-text-sm);

  &:hover {
    color: var(--crm-text-primary);
  }
}

.btn-danger {
  background: var(--crm-danger);
  color: #fff;
  border: none;
  border-radius: var(--crm-radius-md);
  cursor: pointer;
  padding: 8px 16px;
  font-weight: 600;
  font-size: var(--crm-text-sm);

  &:hover {
    background: color-mix(in srgb, var(--crm-danger), black 10%);
  }
}

@media (max-width: 767.98px) {
  .grid-header__sticky,
  .grid-row__info {
    .grid-wrapper.scrolled & {
      left: 0;
      width: 90px;
      padding: 8px 6px;
    }
  }
  
  .info-name {
    font-size: var(--crm-text-xs);
    
    .grid-wrapper.scrolled & {
      font-size: 11px;
    }
  }
  
  .info-balance {
    .grid-wrapper.scrolled & {
      opacity: 0;
      width: 0;
      overflow: hidden;
    }
  }
}
</style>