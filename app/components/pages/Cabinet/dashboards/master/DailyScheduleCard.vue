// app/components/pages/cabinet/MasterDashboard/DailyScheduleCard.vue
<template>
  <div class="daily-schedule-card">
    <!-- Заголовок -->
    <div class="daily-schedule-card__header">
      <div class="daily-schedule-card__title">
        <Icon name="mdi:calendar-clock" size="20" />
        <span>График подневки</span>
      </div>
      <div class="daily-schedule-card__subtitle">Последние 14 дней</div>
    </div>

    <!-- Загрузка -->
    <div v-if="loading" class="daily-schedule-card__loading">
      <div class="spinner"></div>
      <span>Загрузка...</span>
    </div>

    <!-- Ошибка -->
    <div v-else-if="error" class="daily-schedule-card__error">
      <Icon name="mdi:alert-circle-outline" size="24" />
      <span>{{ error }}</span>
    </div>

    <!-- Нет данных -->
    <div v-else-if="!hasData" class="daily-schedule-card__empty">
      <Icon name="mdi:calendar-blank" size="32" />
      <span>Нет данных за последние 14 дней</span>
    </div>

    <!-- Таблица -->
    <div v-else class="daily-schedule-card__table-wrapper" ref="tableWrapper">
      <div class="daily-schedule-table">
        <!-- Заголовок таблицы -->
        <div class="daily-schedule-table__header">
          <div class="daily-schedule-table__cell daily-schedule-table__cell--name">
            Сотрудник
          </div>
          <div 
            v-for="date in datesRange" 
            :key="date"
            class="daily-schedule-table__cell daily-schedule-table__cell--date"
            :class="{ 
              'daily-schedule-table__cell--today': date === todayStr,
              'daily-schedule-table__cell--weekend': isWeekend(date)
            }"
          >
            <span 
              class="cell-day"
              :class="{ 'cell-day--weekend': isWeekend(date) }"
            >
              {{ getDayOfWeek(date) }}
            </span>
            <span 
              class="cell-date"
              :class="{ 'cell-date--weekend': isWeekend(date) }"
            >
              {{ getDayNumber(date) }}
            </span>
          </div>
        </div>

        <!-- Строка с данными мастера -->
        <div class="daily-schedule-table__row">
          <div class="daily-schedule-table__cell daily-schedule-table__cell--name">
            <div class="worker-info">
              <div class="worker-info__name">{{ contractor?.name }}</div>
              <div class="worker-info__rate">{{ formatCurrency(contractor?.dailyRate || 0) }}/день</div>
            </div>
          </div>
          
          <div 
            v-for="date in datesRange" 
            :key="date"
            class="daily-schedule-table__cell daily-schedule-table__cell--date"
            :class="{ 
              'daily-schedule-table__cell--today': date === todayStr,
              'daily-schedule-table__cell--weekend': isWeekend(date)
            }"
          >
            <div class="cell-indicator-wrapper">
              <div 
                v-if="getAssignmentsForDate(date).length > 0"
                class="cell-indicator"
                :style="getCellStyle(date)"
                :title="getCellTitle(date)"
              />
              <!-- ✅ Бейдж количества людей -->
              <span 
                v-if="getDisplayMultiplier(date)"
                class="cell-indicator__multiplier"
              >
                ×{{ getDisplayMultiplier(date) }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import { useApi } from '~/composables/useApi'

interface Assignment {
  id: number
  date: string
  objectId: number
  objectName: string
  amount: number
  percentage: number
}

interface Contractor {
  id: number
  name: string
  contractorType: string
  dailyRate: number
  balance: number
}

interface Response {
  hasData: boolean
  contractor: Contractor | null
  assignments: Assignment[]
}

const api = useApi()

const tableWrapper = ref<HTMLElement | null>(null)

const loading = ref(true)
const error = ref<string | null>(null)
const hasData = ref(false)
const contractor = ref<Contractor | null>(null)
const assignments = ref<Assignment[]>([])

const todayStr = computed(() => {
  const today = new Date()
  return today.toISOString().split('T')[0] ?? ''
})

const datesRange = computed(() => {
  const dates: string[] = []
  const today = new Date()
  
  for (let i = 13; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(today.getDate() - i)
    const dateStr = date.toISOString().split('T')[0]
    if (dateStr) {
      dates.push(dateStr)
    }
  }
  
  return dates
})

// 🆕 Функция прокрутки к концу (справа)
function scrollToRight() {
  // Двойной nextTick или setTimeout гарантирует, что браузер 
  // завершил layout и правильно посчитал scrollWidth
  nextTick(() => {
    setTimeout(() => {
      if (tableWrapper.value) {
        tableWrapper.value.scrollLeft = tableWrapper.value.scrollWidth
      }
    }, 50)
  })
}

function getDayOfWeek(date: string): string {
  const d = new Date(date)
  const days = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб']
  return days[d.getDay()] ?? '—'
}

function getDayNumber(date: string): string {
  return new Date(date).getDate().toString()
}

// ✅ Проверка выходного дня (Сб = 6, Вс = 0)
function isWeekend(date: string): boolean {
  const d = new Date(date)
  const day = d.getDay()
  return day === 0 || day === 6
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    minimumFractionDigits: 0
  }).format(amount)
}

function getAssignmentsForDate(date: string): Assignment[] {
  return assignments.value.filter(a => a.date === date)
}

// ✅ Расчёт количества людей (как в оригинальном CalendarCell)
function getDisplayMultiplier(date: string): string | null {
  const dayAssignments = getAssignmentsForDate(date)
  if (dayAssignments.length === 0) return null
  
  if (!contractor.value || contractor.value.dailyRate <= 0) return null
  
  const totalAmount = dayAssignments.reduce((sum, a) => sum + a.amount, 0)
  const ratio = totalAmount / contractor.value.dailyRate
  
  // Показываем только если ratio > 1.1 (больше одной ставки за день)
  if (ratio <= 1.1) return null
  
  // Округляем до 0.5: "1.5", "2", "2.5", "3" и т.д.
  const rounded = Math.round(ratio * 2) / 2
  
  // Если дробная часть нулевая — показываем целое
  if (rounded === Math.floor(rounded)) {
    return String(Math.floor(rounded))
  }
  
  return String(rounded)
}

function getCellStyle(date: string): Record<string, string> {
  const dayAssignments = getAssignmentsForDate(date)
  if (dayAssignments.length === 0) return {}

  const sorted = [...dayAssignments].sort((a, b) => a.objectId - b.objectId)
  const segments: string[] = []
  let cumulative = 0

  const colors = [
    'hsl(340, 92%, 58%)',
    'hsl(25, 92%, 58%)',
    'hsl(55, 92%, 58%)',
    'hsl(140, 92%, 58%)'
  ]

  sorted.forEach((assignment, idx) => {
    const color = colors[idx % colors.length]
    const from = cumulative
    cumulative += assignment.percentage
    segments.push(`${color} ${from}% ${cumulative}%`)
  })

  // Проверяем "пол дня"
  const totalPercentage = dayAssignments.reduce((sum, a) => sum + a.percentage, 0)
  const isHalfDay = totalPercentage > 40 && totalPercentage < 60

  if (isHalfDay) {
    return {
      background: `conic-gradient(${segments.join(', ')}, transparent 50% 100%)`
    }
  }

  return { background: `conic-gradient(${segments.join(', ')})` }
}

function getCellTitle(date: string): string {
  const dayAssignments = getAssignmentsForDate(date)
  if (dayAssignments.length === 0) return ''

  const total = dayAssignments.reduce((sum, a) => sum + a.amount, 0)
  const objects = dayAssignments.map(a => a.objectName).join(', ')
  
  return `${objects}\nСумма: ${formatCurrency(total)}`
}

async function loadData() {
  loading.value = true
  error.value = null

  try {
    const response = await api.get<Response>('/api/contractors/me/daily-recent')
    
    hasData.value = response.hasData
    contractor.value = response.contractor
    assignments.value = response.assignments
    
    console.log('[DailyScheduleCard] ✅ Данные загружены:', {
      hasData: response.hasData,
      assignments: response.assignments.length
    })
    
    // 🆕 Прокручиваем к последним датам после загрузки
    if (response.hasData) {
      scrollToRight()
    }
  } catch (err: any) {
    console.error('[DailyScheduleCard] Ошибка загрузки:', err)
    error.value = err?.message || 'Ошибка загрузки данных'
  } finally {
    loading.value = false
  }
}

onMounted(loadData)
</script>

<style lang="scss" scoped>
.daily-schedule-card {
  background: var(--crm-bg-surface);
  border: 1px solid var(--crm-border);
  border-radius: var(--crm-radius-lg);
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  overflow: hidden;
  min-width: 0;

  &__header {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  &__title {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: var(--crm-text-lg);
    font-weight: 600;
    color: var(--crm-text-primary);
  }

  &__subtitle {
    font-size: var(--crm-text-xs);
    color: var(--crm-text-muted);
    margin-left: 30px;
  }

  &__loading,
  &__error,
  &__empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
    padding: 40px 20px;
    color: var(--crm-text-muted);
    text-align: center;
  }

  &__error {
    color: var(--crm-danger);
  }

  &__table-wrapper {
    overflow-x: auto;
    margin: 0 -20px;
    padding: 0 20px;
  }
}

.daily-schedule-table {
  display: flex;
  flex-direction: column;
  min-width: max-content;

  &__header {
    display: flex;
    border-bottom: 2px solid var(--crm-border);
  }

  &__row {
    display: flex;
    border-bottom: 1px solid var(--crm-border);
  }

  &__cell {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 8px;
    border-right: 1px solid var(--crm-border);

    &--name {
      width: 140px;
      justify-content: flex-start;
      padding-left: 12px;
      background: var(--crm-bg-surface);
      
      // Удалено:
      // position: sticky;
      // left: 0;
      // z-index: 10;
    }

    &--date {
      width: 48px;
      flex-direction: column;
      gap: 4px;
      background: var(--crm-bg-elevated);

      &.daily-schedule-table__cell--today {
        background: var(--crm-accent-dim);
        
        .cell-day:not(.cell-day--weekend),
        .cell-date:not(.cell-date--weekend) {
          color: var(--crm-accent);
          font-weight: 700;
        }
      }
    }
  }
}

.cell-day {
  font-size: 9px;
  text-transform: uppercase;
  color: var(--crm-text-muted);
  opacity: 0.7;

  // ✅ Красный цвет для выходных
  &--weekend {
    color: var(--crm-danger);
    opacity: 1;
    font-weight: 600;
  }
}

.cell-date {
  font-size: 14px;
  font-weight: 700;
  color: var(--crm-text-primary);

  // ✅ Красный цвет для выходных
  &--weekend {
    color: var(--crm-danger);
  }
}

.worker-info {
  display: flex;
  flex-direction: column;
  gap: 2px;

  &__name {
    font-size: var(--crm-text-sm);
    font-weight: 600;
    color: var(--crm-text-primary);
  }

  &__rate {
    font-size: var(--crm-text-xs);
    color: var(--crm-text-muted);
    font-family: var(--crm-font-mono);
  }
}

.cell-indicator-wrapper {
  position: relative;
  z-index: 2;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.cell-indicator {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  box-shadow: 0 0 6px rgba(0, 0, 0, 0.3);

  &:hover {
    box-shadow: 0 0 8px currentColor;
    filter: saturate(1.2);
  }

  // ✅ Бейдж количества людей
  &__multiplier {
    position: absolute;
    top: -4px;
    right: -4px;
    min-width: 16px;
    height: 16px;
    padding: 0 4px;
    background: var(--crm-bg-surface);
    color: var(--crm-text-primary);
    font-size: 10px;
    font-weight: 700;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    line-height: 1;
    border: 1.5px solid var(--crm-border);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.25);
    pointer-events: none;
    z-index: 3;
    font-family: var(--crm-font-mono);
  }
}

.spinner {
  width: 24px;
  height: 24px;
  border: 3px solid var(--crm-border);
  border-top-color: var(--crm-accent);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@media (max-width: 768px) {
  .daily-schedule-table__cell--name {
    width: 120px;
  }

  .worker-info__name {
    font-size: var(--crm-text-xs);
  }
}
</style>