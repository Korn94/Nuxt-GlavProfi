<!-- app\pages\cabinet\daily-work\index.vue -->
 <template>
  <div class="daily-work-page">
    <!-- ═══════════════════════════ HEADER ═══════════════════════════ -->
    <header class="page-header">
      <div class="header__top">
        <h1 class="page-header__title">Учет подневки</h1>
        <div class="header__actions">
          <button class="btn-icon" @click="showHelp = !showHelp">?</button>
        </div>
      </div>

      <!-- Подсказка для массового выделения -->
      <BulkSelectionHint 
        :visible="showHelp" 
        text="Зажми ячейку и веди пальцем, чтобы отметить смену на несколько дней сразу."
        @close="showHelp = false" 
      />

      <!-- Навигация по датам -->
      <div class="date-nav">
        <button class="btn-nav" @click="shiftDates(-7)">← Неделя</button>
        <span class="date-nav__current">{{ weekLabel }}</span>
        <button class="btn-nav" @click="shiftDates(7)">Неделя →</button>
        <button class="btn-nav btn-nav--today" @click="resetDates">Сегодня</button>
      </div>
    </header>

    <!-- ═══════════════════════════ LOADING ═══════════════════════════ -->
    <div v-if="store.loading || !store.workers.length" class="loading-state">
      Загрузка данных...
    </div>

    <!-- ═══════════════════════════ MAIN GRID ═══════════════════════ -->
    <div v-else class="grid-wrapper" ref="scrollContainer">
      <div class="daily-grid">
        
        <!-- Заголовки (Даты) -->
        <div class="grid-header">
          <div class="grid-header__sticky">Сотрудник</div>
          <div
            v-for="date in datesRange"
            :key="date"
            class="grid-header__cell"
            :class="{ 'grid-header__cell--today': date === todayStr }"
          >
            <span :class="['cell-day', { 'cell-day--weekend': isWeekend(date) }]">
              {{ getDayOfWeek(date) }}
            </span>
            <span :class="['cell-date', { 'cell-date--weekend': isWeekend(date) }]">
              {{ getDayNumber(date) }}
            </span>
          </div>
        </div>

        <!-- Строки рабочих -->
        <div 
          v-for="worker in store.workersWithDailyRate" 
          :key="worker.id" 
          class="grid-row"
        >
          <div class="grid-row__info">
            <span class="info-name" :title="worker.name">{{ worker.name }}</span>
            <span class="info-balance">{{ formatCurrency(worker.balance) }}</span>
          </div>

          <!-- Ячейки календаря -->
          <CalendarCell
            v-for="date in datesRange"
            :key="date"
            :date="date"
            :worker-id="worker.id"
            :assignments="getAssignments(worker.id, date)"
            :is-editable="isDateEditable(date)"
            :is-selected="isDateSelected(worker.id, date)"
            v-on="bulkBind(date)"
            @click="openSheet(worker, date)"
          />
        </div>

      </div>
    </div>

    <!-- ═══════════════════════════ MODAL SHEET ═══════════════════════ -->
    <DailyAssignmentSheet
      v-model="sheetOpen"
      :dates="datesToApply"
      :daily-rate="selectedWorker?.dailyRate ?? 0"
      :assignments="currentAssignments"
      :active-objects="store.activeObjects"
      :is-saving="store.loading"
      @save="handleSave"
      @confirm-delete="handleDeleteConfirm"
    />

    <!-- Подтверждение удаления -->
    <div v-if="showDeleteConfirm" class="confirm-backdrop">
      <div class="confirm-dialog">
        <h3>Удалить записи за {{ selectedDate }}?</h3>
        <p>Это действие удалит все назначения подневки для данного рабочего. Баланс будет пересчитан.</p>
        <div class="confirm-dialog__actions">
          <button class="btn-text" @click="showDeleteConfirm = false">Отмена</button>
          <button class="btn-danger" @click="executeDelete">Удалить всё</button>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import { useForemanDailyStore } from 'stores/foremanDaily'
import { useBulkSelection, generateDateRange, isDateInRange } from '~/composables/daily-work/useBulkSelection'
import { useDailyAssignment } from '~/composables/daily-work/useDailyAssignment'
import type { DailyWorker, DailyAssignment } from '~/types/daily-assignments'

import CalendarCell from '~/components/pages/cabinet/DailyWork/ui/CalendarCell.vue'
import DailyAssignmentSheet from '~/components/pages/cabinet/DailyWork/DailyAssignmentSheet.vue'
import BulkSelectionHint from '~/components/pages/cabinet/DailyWork/BulkSelectionHint.vue'
import { definePageMeta } from 'node_modules/nuxt/dist/pages/runtime'

const store = useForemanDailyStore()
const { formatCurrency } = useDailyAssignment()

definePageMeta({
  layout: 'cabinet',
  middleware: 'role',
  allowedRoles: ['admin', 'foreman']
})

// ── Состояние ─────────────────────────────────────────────────────
const sheetOpen = ref(false)
const selectedWorker = ref<DailyWorker | null>(null)
const selectedDate = ref('')
const showDeleteConfirm = ref(false)
const showHelp = ref(false)

const startOffset = ref(0) // Смещение окна дат относительно сегодня (0 = текущие 14 дней)

// ── Вычисляемые свойства ──────────────────────────────────────────
const todayStr = computed(() => store.todayStr)

const minDate = computed(() => store.minEditableDate)

// Генерируем массив из 14 дат для отображения
const datesRange = computed(() => {
  const today = new Date()
  const start = new Date(today)
  // Базовое начало: 12 дней назад. Смещаем на startOffset * 7 дней
  start.setDate(today.getDate() - 12 + startOffset.value * 7)

  const end = new Date(start)
  end.setDate(start.getDate() + 13) // +13 дней = ровно 14 дней в массиве

  return generateDateRange(
    start.toISOString().slice(0, 10),
    end.toISOString().slice(0, 10)
  )
})

const weekLabel = computed(() => {
  if (datesRange.value.length < 2) return ''
  const start = new Date(datesRange.value[0]!)
  const end = new Date(datesRange.value[13]!)
  return `${start.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })} — ${end.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}`
})

const currentAssignments = computed(() => {
  if (!selectedWorker.value || !selectedDate.value) return []
  return store.getGroupByDate(selectedWorker.value.id, selectedDate.value)
})

// ── Логика ────────────────────────────────────────────────────────

// Массовое выделение
const { bindCell, state: bulkState, isDragging } = useBulkSelection({
  minDate: minDate.value,
  onEnd: (dates) => {
    if (dates.length > 1 && selectedWorker.value) {
      selectedDate.value = dates[0]!
      // Логика массового применения (пока открываем модалку для первой даты)
      sheetOpen.value = true
    }
  }
})

const datesToApply = computed(() => {
  if (bulkState.selectedDates.length > 0) return bulkState.selectedDates
  if (selectedDate.value) return [selectedDate.value]
  return []
})

// Привязка событий к ячейке (обновляем minDate при смене дат)
function bulkBind(date: string) {
  return bindCell(date)
}

function isDateSelected(workerId: number, date: string) {
  return bulkState.selectedDates.includes(date) && 
         bulkState.selectedDates.some(d => getAssignments(workerId, d).length > 0)
}

function isDateEditable(date: string): boolean {
  return store.isDateEditable(date)
}

function getAssignments(workerId: number, date: string): DailyAssignment[] {
  return store.getGroupByDate(workerId, date)
}

// Навигация по датам
function shiftDates(days: number) {
  startOffset.value += days / 7
}

function resetDates() {
  startOffset.value = 0
}

// Утилиты для шапки
function getDayOfWeek(date: string) {
  const d = new Date(date)
  return d.toLocaleDateString('ru-RU', { weekday: 'short' })
}

function getDayNumber(date: string) {
  return new Date(date).getDate().toString()
}

function isWeekend(date: string): boolean {
  const day = new Date(date).getDay()
  return day === 0 || day === 6 // 0 = воскресенье, 6 = суббота
}

// Открытие модалки
function openSheet(worker: DailyWorker, date: string) {
  // Проверка на массовое выделение
  if (isDragging.value || bulkState.isActive) return

  selectedWorker.value = worker
  selectedDate.value = date
  sheetOpen.value = true
}

// Сохранение (одиночное или множественное)
async function handleSave(data: { assignments: DailyAssignment[], dates: string[] }) {
  if (!selectedWorker.value) return

  try {
    for (const date of data.dates) {
      // 1. Удаляем старые записи этого рабочего за этот день
      const existing = store.getGroupByDate(selectedWorker.value.id, date)
      for (const item of existing) {
        if (item.id) await store.deleteAssignment(item.id)
      }

      // 2. Создаем новые записи
      for (const item of data.assignments) {
        await store.saveAssignment({
          ...item,
          workerId: selectedWorker.value.id,
          contractorType: selectedWorker.value.contractorType,
          date: date
        })
      }
    }
    
    sheetOpen.value = false
    bulkState.selectedDates = [] // Сброс выделения
  } catch (e) {
    console.error('Ошибка сохранения:', e)
  }
}

// Удаление
async function handleDeleteConfirm() {
  showDeleteConfirm.value = true
}

async function executeDelete() {
  showDeleteConfirm.value = false
  if (!selectedWorker.value) return

  try {
    const existing = store.getGroupByDate(selectedWorker.value.id, selectedDate.value)
    for (const item of existing) {
      if (item.id) await store.deleteAssignment(item.id)
    }
    sheetOpen.value = false
  } catch (e) {
    console.error('Ошибка удаления:', e)
  }
}

// ── Lifecycle ─────────────────────────────────────────────────────
onMounted(async () => {
  await store.fetchWorkers()
  await store.fetchActiveObjects()
  
  // Загружаем назначения для отображаемых дат
  if (store.workersWithDailyRate.length > 0) {
    // Загружаем данные для всех рабочих в текущем окне
    // В реальном приложении лучше грузить лениво по видимости
  }
})
</script>

<style lang="scss" scoped>
.daily-work-page {
  min-height: 100vh;
  background: var(--crm-bg-base);
  padding-bottom: 20px;
  display: flex;
  flex-direction: column;
}

.page-header {
  background: var(--crm-bg-surface);
  padding: 16px 20px;
  border-bottom: 1px solid var(--crm-border);
  position: sticky;
  top: 0;
  z-index: 40;
}

.header__top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.page-header__title {
  font-size: var(--crm-text-xl);
  font-weight: 700;
  margin: 0;
}

.btn-icon {
  background: var(--crm-bg-elevated);
  border: 1px solid var(--crm-border);
  color: var(--crm-text-secondary);
  border-radius: 50%;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-weight: 700;
}

.date-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  background: var(--crm-bg-base);
  padding: 6px 8px;
  border-radius: var(--crm-radius-md);
  border: 1px solid var(--crm-border);
}

.date-nav__current {
  font-size: var(--crm-text-sm);
  font-weight: 600;
  color: var(--crm-text-primary);
  white-space: nowrap;
}

.btn-nav {
  background: transparent;
  border: none;
  color: var(--crm-accent);
  font-size: var(--crm-text-sm);
  cursor: pointer;
  padding: 4px 8px;
  
  &--today {
    color: var(--crm-text-primary);
    border: 1px solid var(--crm-border);
    border-radius: var(--crm-radius-sm);
    background: var(--crm-bg-elevated);
  }
}

.loading-state {
  padding: 40px;
  text-align: center;
  color: var(--crm-text-muted);
}

/* ═══════════════════════════ GRID LAYOUT ═══════════════════════════ */
.grid-wrapper {
  flex: 1;
  overflow-x: auto;
  overflow-y: hidden;
  -webkit-overflow-scrolling: touch;
  padding: 0 20px;
  margin-top: 16px;
}

.daily-grid {
  display: grid;
  /* Левая колонка 140px + 14 дней по 48px = ~812px общей ширины */
  grid-template-columns: 140px repeat(14, 48px);
  gap: 1px;
  background: var(--crm-border); /* Цвет линий сетки */
  border: 1px solid var(--crm-border);
  border-radius: var(--crm-radius-md);
  min-width: max-content; /* Не сжимать сетку, разрешить скролл */
}

/* Заголовки дат */
.grid-header {
  display: contents; /* Элемент не создаёт блок, дети участвуют в сетке напрямую */
}

.grid-header__sticky {
  position: sticky;
  left: 0;
  z-index: 10;
  background: var(--crm-bg-surface);
  padding: 12px;
  font-size: var(--crm-text-xs);
  color: var(--crm-text-muted);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-bottom: 2px solid var(--crm-border);
  border-right: 2px solid var(--crm-border);
  display: flex;
  align-items: center;
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
    
    .cell-day { color: var(--crm-accent); }
    .cell-date { color: var(--crm-accent); font-weight: 700; }
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

/* Строки рабочих */
.grid-row {
  display: contents;
}

/* Левая ячейка с инфо о рабочем (СТАТИЧНАЯ) */
.grid-row__info {
  position: sticky;
  left: 0;
  z-index: 5; /* Ниже хедера дат, но выше ячеек */
  background: var(--crm-bg-surface);
  display: flex;
  align-items: center;
  gap: 5px;
  justify-content: center;
  padding: 8px 12px;
  // min-height: 56px;
  border-right: 2px solid var(--crm-border);
  border-bottom: 1px solid var(--crm-border);
  cursor: default;

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
}

.info-balance {
  font-size: var(--crm-text-xs);
  color: var(--crm-text-muted);
  font-family: var(--crm-font-mono);
}

/* Ячейки календаря */
.grid-row :deep(.daily-cell) {
  border-bottom: 1px solid var(--crm-border);
  border-right: 1px solid var(--crm-border);
}

/* ═══════════════════════════ MODAL & CONFIRM ═══════════════════════════ */
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
  
  &:hover { color: var(--crm-text-primary); }
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
  
  &:hover { background: color-mix(in srgb, var(--crm-danger), black 10%); }
}
</style>