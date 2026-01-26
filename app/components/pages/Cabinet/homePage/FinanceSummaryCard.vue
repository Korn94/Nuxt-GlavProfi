<template>
  <Card :loading="isLoading" title="Финансовая сводка" elevated class="finance-summary-card">
    <template #icon>
      <Icon name="mdi:finance" size="24" />
    </template>

    <div v-if="balanceData" class="summary-content">
      <!-- Общий баланс -->
      <div class="summary-item total-balance">
        <div class="item-label">Общий баланс</div>
        <div class="item-value">{{ formatCurrency(totalBalance) }}</div>
      </div>

      <!-- Приходы и расходы -->
      <div class="summary-grid">
        <div class="summary-item incoming">
          <div class="item-label">Приходы за месяц</div>
          <div class="item-value">{{ formatCurrency(balanceData.totalComings) }}</div>
        </div>
        
        <div class="summary-item expense">
          <div class="item-label">Расходы за месяц</div>
          <div class="item-value">{{ formatCurrency(balanceData.totalExpenses) }}</div>
        </div>
        
        <div class="summary-item works">
          <div class="item-label">Незавершенные работы</div>
          <div class="item-value">{{ formatCurrency(balanceData.pendingWorks) }}</div>
        </div>
      </div>

      <!-- Материалы -->
      <div class="summary-item materials">
        <div class="item-label">Затраты на материалы</div>
        <div class="item-value">{{ formatCurrency(balanceData.materials.balance) }}</div>
      </div>
      
      <!-- Расходы по категориям -->
      <div class="category-section" v-if="expenseCategories.length > 0">
        <div class="section-header">
          <h3>Расходы по категориям</h3>
          <span class="count-badge">{{ expenseCategories.length }}</span>
        </div>
        
        <div class="category-grid">
          <div 
            v-for="(category, index) in expenseCategories" 
            :key="index" 
            class="category-item"
          >
            <div class="category-icon">
              <Icon :name="getCategoryIcon(category.type)" size="24" />
            </div>
            <div class="category-info">
              <div class="category-label">{{ getCategoryLabel(category.type) }}</div>
              <div class="category-amount">{{ formatCurrency(category.amount) }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Ошибка загрузки -->
    <div v-else-if="error" class="error-state">
      <Icon name="ic:outline-warning" size="40" class="error-icon" />
      <p>Не удалось загрузить финансовые данные</p>
      <button class="btn btn-secondary" @click="fetchData">
        <Icon name="mdi:refresh" size="18" />
        Повторить
      </button>
    </div>

    <!-- Пустое состояние -->
    <div v-else class="empty-state">
      <Icon name="mdi:finance" size="40" class="empty-icon" />
      <p>Финансовые данные пока недоступны</p>
    </div>

    <template #actions>
      <button class="btn btn-secondary" @click="navigateTo('/cabinet/operation')">
        Подробнее
        <Icon name="mdi:arrow-right" size="18" />
      </button>
    </template>

    <template #footer>
      <div class="footer-content">
        <span>Данные за <span>{{ currentMonth }}</span></span>
        <button class="btn btn-sm btn-link" @click="showDateRange = !showDateRange">
          {{ showDateRange ? 'Скрыть' : 'Изменить' }}
        </button>
      </div>
      
      <div v-if="showDateRange" class="date-range-selector">
        <label for="start-date">С:</label>
        <input
          id="start-date"
          type="date"
          v-model="localStartDate"
          class="date-input"
          :max="localEndDate"
        />
        <label for="end-date">По:</label>
        <input
          id="end-date"
          type="date"
          v-model="localEndDate"
          class="date-input"
          :min="localStartDate"
        />
        <button class="btn btn-primary" @click="applyDateRange">Применить</button>
        <button class="btn btn-outline" @click="resetDateRange">Сбросить</button>
      </div>
    </template>
  </Card>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { navigateTo } from '#app'

const Card = defineAsyncComponent(() => import('@/components/pages/cabinet/ui/cards/card.vue'))

// Состояние компонента
const balanceData = ref(null)
const expenseCategories = ref([])
const isLoading = ref(true)
const error = ref(null)
const showDateRange = ref(false)
const localStartDate = ref('')
const localEndDate = ref('')

// Названия месяцев на русском
const monthNames = [
  'Январь', 'Февраль', 'Март', 'Апрель',
  'Май', 'Июнь', 'Июль', 'Август',
  'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
]

// Категории расходов
const categoryMapping = {
  'Работа': { icon: 'mdi:hammer', label: 'Работы' },
  'Налог': { icon: 'mdi:currency-usd', label: 'Налоги' },
  'Зарплата': { icon: 'mdi:cash', label: 'Зарплаты' },
  'Реклама': { icon: 'mdi:bullhorn', label: 'Реклама' },
  'Кредит': { icon: 'mdi:bank', label: 'Кредиты' },
  'Топливо': { icon: 'mdi:gas-station', label: 'Топливо' },
  'ГлавПрофи': { icon: 'mdi:star', label: 'ГлавПрофи' }
}

// Форматирование даты
const formatDate = (date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// Получение текущего месяца
const getCurrentMonth = () => {
  const now = new Date()
  return `${monthNames[now.getMonth()]} ${now.getFullYear()}`
}

// Получение дат начала и конца текущего месяца
const getMonthRange = (offset = 0) => {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + offset

  // Вычисляем год с учётом переполнения
  const targetYear = Math.floor((year * 12 + month) / 12)
  const targetMonth = (month + 12) % 12

  const start = new Date(targetYear, targetMonth, 1)
  const end = new Date(targetYear, targetMonth + 1, 0) // последний день

  return {
    startDate: formatDate(start),
    endDate: formatDate(end)
  }
}

// Установка текущего месяца при монтировании
const { startDate, endDate } = getMonthRange(0)
localStartDate.value = startDate
localEndDate.value = endDate

// Текущий месяц для отображения
const currentMonth = computed(() => {
  if (localStartDate.value && localEndDate.value) {
    const start = new Date(localStartDate.value)
    const end = new Date(localEndDate.value)
    
    if (start.getFullYear() === end.getFullYear()) {
      return `${monthNames[start.getMonth()]} ${start.getFullYear()}`
    }
    return `${monthNames[start.getMonth()]} ${start.getFullYear()} - ${monthNames[end.getMonth()]} ${end.getFullYear()}`
  }
  return getCurrentMonth()
})

// Общий баланс
const totalBalance = computed(() => {
  return (
    (balanceData.value?.totalComings || 0) -
    (balanceData.value?.totalExpenses || 0) +
    (balanceData.value?.materials?.balance || 0)
  )
})

// Форматирование валюты
const formatCurrency = (amount) => {
  const num = parseFloat(amount) || 0
  return num.toLocaleString('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    minimumFractionDigits: 2
  })
}

// Получение иконки для категории
const getCategoryIcon = (type) => {
  return categoryMapping[type]?.icon || 'mdi:file-document-outline'
}

// Получение метки для категории
const getCategoryLabel = (type) => {
  return categoryMapping[type]?.label || type
}

// Загрузка данных
const fetchData = async () => {
  isLoading.value = true
  error.value = null
  
  try {
    const params = {}
    if (localStartDate.value && localEndDate.value) {
      params.startDate = localStartDate.value
      params.endDate = localEndDate.value
    }
    
    // Загрузка основных данных баланса
    const balancePromise = $fetch('/api/balance', { params })
    
    // Загрузка статистики по расходам
    const expenseStatsPromise = $fetch('/api/expenses/stats', { params })
    
    // Параллельная загрузка данных
    const [balanceDataResponse, expenseStatsData] = await Promise.all([
      balancePromise,
      expenseStatsPromise
    ])
    
    // Обработка данных баланса
    balanceData.value = balanceDataResponse
    
    // Обработка данных по категориям
    const categories = []
    
    // Фильтруем только нужные категории
    const targetCategories = [
      'Работа', 'Налог', 'Зарплата', 'Реклама', 
      'Кредит', 'Топливо', 'ГлавПрофи'
    ]
    
    expenseStatsData.forEach(item => {
      if (targetCategories.includes(item.expenseType)) {
        categories.push({
          type: item.expenseType,
          amount: item.total
        })
      }
    })
    
    // Сортируем по убыванию суммы
    categories.sort((a, b) => b.amount - a.amount)
    
    expenseCategories.value = categories
  } catch (err) {
    console.error('Ошибка загрузки финансовых данных:', err)
    error.value = 'Не удалось загрузить данные'
  } finally {
    isLoading.value = false
  }
}

// Обновление данных
const refreshData = () => {
  fetchData()
}

// Применение выбранного диапазона дат
const applyDateRange = () => {
  fetchData()
  showDateRange.value = false
}

// Сброс на текущий месяц
const resetDateRange = () => {
  const { startDate, endDate } = getMonthRange(0)
  localStartDate.value = startDate
  localEndDate.value = endDate
  fetchData()
  showDateRange.value = false
}

// Обновление каждые 5 минут
// let refreshInterval
onMounted(() => {
  fetchData()
  // refreshInterval = setInterval(refreshData, 5 * 60 * 1000)
})

// onBeforeUnmount(() => {
//   clearInterval(refreshInterval)
// })

// Следим за изменениями дат
watch([localStartDate, localEndDate], () => {
  if (localStartDate.value && localEndDate.value) {
    fetchData()
  }
})
</script>

<style lang="scss" scoped>
.finance-summary-card {
  :deep(.card__body) {
    padding: 1.5rem;
  }
}

.summary-content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
}

.summary-item {
  padding: 1rem;
  border-radius: $border-radius;
  text-align: center;
  
  &.total-balance {
    background: $color-dark;
    color: white;
    border-radius: 10px;
    padding: 1.2rem;
    
    .item-label {
      color: rgba(255, 255, 255, 0.8);
      font-weight: 500;
      margin-bottom: 0.3rem;
    }
    
    .item-value {
      font-size: 1.8rem;
      font-weight: 700;
      color: white;
    }
  }
  
  &.incoming {
    background: $background-light;
    border: 1px solid $border-color;
    
    .item-value {
      color: $color-success;
      font-weight: 600;
    }
  }
  
  &.expense {
    background: $background-light;
    border: 1px solid $border-color;
    
    .item-value {
      color: $color-danger;
      font-weight: 600;
    }
  }
  
  &.works {
    background: $background-light;
    border: 1px solid $border-color;
    
    .item-value {
      color: $color-info;
      font-weight: 600;
    }
  }
  
  &.materials {
    background: $background-light;
    border: 1px solid $border-color;
    
    .item-value {
      color: $color-primary;
      font-weight: 600;
    }
  }
  
  .item-label {
    font-size: 0.9rem;
    color: $color-muted;
    margin-bottom: 0.3rem;
  }
  
  .item-value {
    font-size: 1.3rem;
    font-weight: 600;
    line-height: 1.4;
  }
}

.category-section {
  // background: rgba($color-primary, 0.05);
  border: 1px solid $border-color;
  border-radius: $border-radius;
  padding: 1rem;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.75rem;
  
  h3 {
    font-size: 1.1rem;
    margin: 0;
    color: $color-dark;
  }
  
  .count-badge {
    font-size: 0.8rem;
    padding: 0.2rem 0.5rem;
    border: 1px solid $border-color;
    border-radius: $border-radius;
    font-weight: 600;
  }
}

.category-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
}

.category-item {
  display: flex;
  align-items: center;
  padding: 0.75rem;
  border-radius: $border-radius;
  background: white;
  border: 1px solid $border-color;
  transition: all 0.2s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  }
  
  .category-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border-radius: 8px;
    background: rgba($blue, 0.1);
    color: $blue;
    margin-right: 0.75rem;
  }
  
  .category-info {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    
    .category-label {
      font-size: 0.9rem;
      color: $color-dark;
      font-weight: 500;
    }
    
    .category-amount {
      font-size: 1.1rem;
      font-weight: 600;
      color: $color-danger;
    }
  }
}

.empty-state, .error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem 1rem;
  text-align: center;
  min-height: 200px;
  
  .empty-icon, .error-icon {
    margin-bottom: 1rem;
    opacity: 0.7;
  }
  
  p {
    margin: 0.5rem 0 1.5rem 0;
    color: $color-muted;
  }
  
  .btn {
    margin-top: 0.5rem;
  }
}

.footer-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  span {
    color: $color-muted;
    span {
      color: $blue;
    }
  }
}

.date-range-selector {
  display: grid;
  grid-template-columns: auto 1fr auto 1fr auto auto;
  gap: 0.5rem;
  margin-top: 1rem;
  align-items: end;
  
  @media (max-width: 768px) {
    grid-template-columns: auto 1fr;
    gap: 0.5rem 1rem;
  }
  
  .date-input {
    padding: 0.6rem;
    border: 1px solid $border-color;
    border-radius: $border-radius;
    font-size: 0.9rem;
    
    &:focus {
      outline: none;
      border-color: $blue;
      box-shadow: 0 0 0 3px rgba($blue, 0.2);
    }
  }
  
  label {
    font-weight: 500;
    color: $color-muted;
  }
  
  .btn {
    height: fit-content;
  }
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &-primary {
    background-color: $blue;
    color: white;
    border: 1px solid $blue;
    
    &:hover {
      background-color: $blue;
      opacity: 0.9;
    }
  }
  
  &-secondary {
    background-color: $background-light;
    color: #495057;
    border: 1px solid $border-color;
    
    &:hover {
      border: 1px solid $blue;
    }
  }
  
  &-link {
    background: none;
    border: none;
    color: $blue;
    padding: 0;
    text-decoration: underline;
    font-weight: 500;
    font-size: 0.85rem;
    
    &:hover {
      color: $blue;
    }
  }
  
  &-sm {
    padding: 0.3rem 0.6rem;
    font-size: 0.8rem;
  }
}
</style>