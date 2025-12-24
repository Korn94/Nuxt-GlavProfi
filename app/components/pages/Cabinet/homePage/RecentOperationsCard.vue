<template>
  <Card :loading="isLoading" title="Последние операции" elevated class="recent-operations-card">
    <template #icon>
      <Icon name="mdi:history" size="24" />
    </template>

    <div v-if="recentOperations.length > 0" class="operations-list">
      <div v-for="(operation, index) in recentOperations" :key="index" class="operation-item">
        <div class="operation-header">
          <div class="operation-type">
            <Icon :name="getIcon(operation.type)" size="18" class="type-icon" />
            <span>{{ getTypeLabel(operation.type) }}</span>
          </div>
          <div class="operation-date">{{ formatDate(operation.operationDate) }}</div>
        </div>
        
        <div class="operation-details">
          <div class="operation-amount">{{ formatCurrency(operation.amount) }}</div>
          <div class="operation-object" v-if="operation.objectName">
            <Icon name="mdi:map-marker" size="16" class="object-icon" />
            {{ operation.objectName }}
          </div>
          <div class="operation-comment" v-if="operation.comment">
            <Icon name="mdi:comment-text-outline" size="16" class="comment-icon" />
            {{ operation.comment }}
          </div>
        </div>
      </div>
    </div>

    <!-- Ошибка загрузки -->
    <div v-else-if="error" class="error-state">
      <Icon name="ic:outline-warning" size="40" class="error-icon" />
      <p>Не удалось загрузить последние операции</p>
      <button class="btn btn-secondary" @click="fetchData">
        <Icon name="mdi:refresh" size="18" />
        Повторить
      </button>
    </div>

    <!-- Пустое состояние -->
    <div v-else class="empty-state">
      <Icon name="mdi:history" size="40" class="empty-icon" />
      <p>Нет операций за последнее время</p>
    </div>

    <template #actions>
      <button class="btn btn-secondary" @click="navigateTo('/cabinet/operation')">
        Операции
        <Icon name="mdi:arrow-right" size="18" />
      </button>
    </template>

    <template #footer>
      Последние {{ recentOperations.length }} операции
    </template>
  </Card>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { navigateTo } from '#app'

const Card = defineAsyncComponent(() => import('@/components/pages/cabinet/ui/cards/card.vue'))

// Состояние компонента
const recentOperations = ref([])
const isLoading = ref(true)
const error = ref(null)

// Форматирование даты
const formatDate = (dateString) => {
  if (!dateString) return '—'
  const date = new Date(dateString)
  return isNaN(date.getTime()) ? '—' : date.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Форматирование валюты
const formatCurrency = (amount) => {
  const num = parseFloat(amount) || 0
  return num.toLocaleString('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    minimumFractionDigits: 2
  })
}

// Получение иконки для типа операции
const getIcon = (type) => {
  if (type === 'income') return 'mdi:arrow-left-bold'
  if (type === 'expense') return 'mdi:arrow-right-bold'
  return 'mdi:history'
}

// Получение метки для типа операции
const getTypeLabel = (type) => {
  if (type === 'income') return 'Приход'
  if (type === 'expense') return 'Расход'
  return 'Операция'
}

// Загрузка данных
const fetchData = async () => {
  isLoading.value = true
  error.value = null
  
  try {
    // Загрузка приходов и расходов
    const [comingsData, expensesData] = await Promise.all([
      $fetch('/api/comings'),
      $fetch('/api/expenses')
    ])
    
    // Объединение и преобразование операций
    const allOperations = [
      ...comingsData.map(op => ({
        ...op,
        type: 'income',
        amount: parseFloat(op.amount),
        objectName: op.objectName || op.object?.name
      })),
      ...expensesData.map(op => ({
        ...op,
        type: 'expense',
        amount: parseFloat(op.amount),
        objectName: op.objectName || op.object?.name
      }))
    ]
    
    // Сортировка по дате (новые первыми)
    const sortedOperations = allOperations
      .sort((a, b) => new Date(b.operationDate) - new Date(a.operationDate))
      .slice(0, 5) // Ограничение до 5 операций
    
    recentOperations.value = sortedOperations
  } catch (err) {
    console.error('Ошибка загрузки операций:', err)
    error.value = 'Не удалось загрузить данные'
  } finally {
    isLoading.value = false
  }
}

// Обновление данных
const refreshData = () => {
  fetchData()
}

// Обновление каждые 5 минут
let refreshInterval
onMounted(() => {
  fetchData()
  refreshInterval = setInterval(refreshData, 5 * 60 * 1000)
})

onBeforeUnmount(() => {
  clearInterval(refreshInterval)
})
</script>

<style lang="scss" scoped>
.recent-operations-card {
  // Убираем фиксированные высоты
  :deep(.card__body) {
    padding: 1rem;
    display: flex;
    flex-direction: column;
  }
  
  .operations-list {
    flex-grow: 1;
    overflow-y: auto;
    max-height: 100%;
    padding-right: 5px;
    
    // Стили полосы прокрутки
    &::-webkit-scrollbar {
      width: 8px;
    }
    
    &::-webkit-scrollbar-track {
      background: rgba(0,0,0,0.05);
      border-radius: 4px;
    }
    
    &::-webkit-scrollbar-thumb {
      background: rgba(0,0,0,0.2);
      border-radius: 4px;
      
      &:hover {
        background: rgba(0,0,0,0.3);
      }
    }
  }
  
  .operation-item {
    padding: 0.75rem;
    gap: 0.5rem;
  }
  
  .operation-details {
    gap: 0.2rem;
  }
}

.operations-list {
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
}

.operation-item {
  padding: 1rem;
  border-radius: $border-radius;
  border: 1px solid $border-color;
  transition: all 0.2s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  }
  
  .operation-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
  }
  
  .operation-type {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-weight: 600;
    
    &.income {
      color: $color-success;
    }
    
    &.expense {
      color: $color-danger;
    }
    
    .type-icon {
      &.income {
        color: $color-success;
      }
      
      &.expense {
        color: $color-danger;
      }
    }
  }
  
  .operation-date {
    font-size: 0.85rem;
    color: $color-muted;
  }
  
  .operation-details {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
    font-size: 0.9rem;
    
    .operation-amount {
      font-weight: 600;
      
      &.income {
        color: $color-success;
      }
      
      &.expense {
        color: $color-danger;
      }
    }
    
    .operation-object,
    .operation-comment {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: $color-muted;
      font-size: 0.85rem;
      
      .object-icon,
      .comment-icon {
        opacity: 0.7;
      }
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

.btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s ease;

  &-secondary {
    background-color: $background-light;
    color: #495057;
    border: 1px solid $border-color;

    &:hover {
      border: 1px solid $blue;
    }
  }
}
</style>