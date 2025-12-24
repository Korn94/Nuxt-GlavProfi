<template>
  <Card :loading="isLoading" title="Статусы объектов" elevated class="object-status-card">
    <template #icon>
      <Icon name="mdi:home-city" size="24" />
    </template>

    <div v-if="objectStats" class="stats-content">
      <!-- Основные статусы -->
      <div class="stats-grid">
        <div class="status-item active">
          <div class="status-icon">
            <Icon name="mdi:work-outline" size="24" />
          </div>
          <div class="status-info">
            <div class="status-label">Активные</div>
            <div class="status-value">{{ objectStats.active }}</div>
          </div>
        </div>
        
        <div class="status-item waiting">
          <div class="status-icon">
            <Icon name="mdi:clock-outline" size="24" />
          </div>
          <div class="status-info">
            <div class="status-label">В ожидании</div>
            <div class="status-value">{{ objectStats.waiting }}</div>
          </div>
        </div>
        
        <div class="status-item completed">
          <div class="status-icon">
            <Icon name="mdi:check-circle-outline" size="24" />
          </div>
          <div class="status-info">
            <div class="status-label">Завершенные</div>
            <div class="status-value">{{ objectStats.completed }}</div>
          </div>
        </div>
      </div>

      <!-- Критические объекты -->
      <div class="critical-section" v-if="criticalObjects.length > 0">
        <div class="section-header">
          <h3>Критические объекты</h3>
          <span class="count-badge">{{ criticalObjects.length }}</span>
        </div>
        
        <div class="critical-list">
          <div v-for="(obj, index) in criticalObjects" :key="index" class="critical-item">
            <div class="critical-item-header">
              <div class="critical-item-title">
                <Icon name="mdi:alert" size="18" class="critical-icon" />
                <span>{{ obj.name }}</span>
              </div>
              <span class="days-overdue">{{ getDaysOverdue(obj.plannedEndDate) }} дн.</span>
            </div>
            
            <div class="critical-item-details">
              <div class="detail-row">
                <span class="detail-label">Адрес:</span>
                <span class="detail-value">{{ obj.address || 'Не указан' }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Прораб:</span>
                <span class="detail-value">{{ obj.foreman?.name || 'Не назначен' }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Плановая дата:</span>
                <span class="detail-value">{{ formatDate(obj.plannedEndDate) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Документооборот -->
      <div class="document-section">
        <div class="section-header">
          <h3>Документооборот</h3>
        </div>
        
        <!-- Документы по объектам в работе -->
        <div class="document-subsection">
          <div class="subsection-header">
            <h4>В работе (активные + ожидание)</h4>
            <span class="count-badge">{{ objectStats.inProgress }}</span>
          </div>
          
          <div class="document-grid">
            <div class="document-item">
              <div class="document-icon">
                <Icon name="mdi:document-sign" size="24" />
              </div>
              <div class="document-info">
                <div class="document-label">Неподписанные договоры</div>
                <div class="document-value">{{ documentStats.inProgress.unsignedContracts }}</div>
              </div>
            </div>
            
            <div class="document-item">
              <div class="document-icon">
                <Icon name="mdi:invoice-schedule-outline" size="24" />
              </div>
              <div class="document-info">
                <div class="document-label">Неоплаченные счета</div>
                <div class="document-value">{{ documentStats.inProgress.unpaidInvoices }}</div>
              </div>
            </div>
            
            <div class="document-item">
              <div class="document-icon">
                <Icon name="mdi:file-clock-outline" size="24" />
              </div>
              <div class="document-info">
                <div class="document-label">Акты на подписание</div>
                <div class="document-value">{{ documentStats.inProgress.actsToSign }}</div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Документы по завершенным объектам -->
        <div class="document-subsection">
          <div class="subsection-header">
            <h4>Завершенные</h4>
            <span class="count-badge">{{ objectStats.completed }}</span>
          </div>
          
          <div class="document-grid">
            <div class="document-item">
              <div class="document-icon">
                <Icon name="mdi:document-sign" size="24" />
              </div>
              <div class="document-info">
                <div class="document-label">Неподписанные договоры</div>
                <div class="document-value">{{ documentStats.completed.unsignedContracts }}</div>
              </div>
            </div>
            
            <div class="document-item">
              <div class="document-icon">
                <Icon name="mdi:invoice-schedule-outline" size="24" />
              </div>
              <div class="document-info">
                <div class="document-label">Неоплаченные счета</div>
                <div class="document-value">{{ documentStats.completed.unpaidInvoices }}</div>
              </div>
            </div>
            
            <div class="document-item">
              <div class="document-icon">
                <Icon name="mdi:file-clock-outline" size="24" />
              </div>
              <div class="document-info">
                <div class="document-label">Акты на подписание</div>
                <div class="document-value">{{ documentStats.completed.actsToSign }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Ошибка загрузки -->
    <div v-else-if="error" class="error-state">
      <Icon name="ic:outline-warning" size="40" class="error-icon" />
      <p>Не удалось загрузить данные по объектам</p>
      <button class="btn btn-secondary" @click="fetchData">
        <Icon name="mdi:refresh" size="18" />
        Повторить
      </button>
    </div>

    <!-- Пустое состояние -->
    <div v-else class="empty-state">
      <Icon name="mdi:home-city" size="40" class="empty-icon" />
      <p>Нет данных по объектам</p>
    </div>

    <template #actions>
      <button class="btn btn-secondary" @click="navigateTo('/cabinet/objects')">
        Подробнее
        <Icon name="mdi:arrow-right" size="18" />
      </button>
    </template>

    <template #footer>
      Данные актуальны на {{ currentDate }}
    </template>
  </Card>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { navigateTo } from '#app'

const Card = defineAsyncComponent(() => import('@/components/pages/cabinet/ui/cards/card.vue'))

// Состояние компонента
const objectStats = ref({
  active: 0,
  waiting: 0,
  completed: 0,
  inProgress: 0,
  total: 0
})
const criticalObjects = ref([])
const documentStats = ref({
  inProgress: {
    unsignedContracts: 0,
    unpaidInvoices: 0,
    actsToSign: 0
  },
  completed: {
    unsignedContracts: 0,
    unpaidInvoices: 0,
    actsToSign: 0
  }
})
const isLoading = ref(true)
const error = ref(null)

// Форматирование даты
const currentDate = computed(() => {
  return new Date().toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  })
})

// Форматирование даты
const formatDate = (dateString) => {
  if (!dateString) return '—'
  const date = new Date(dateString)
  return isNaN(date.getTime()) ? '—' : date.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit'
  })
}

// Вычисление просрочки
const getDaysOverdue = (dateString) => {
  if (!dateString) return 0
  const plannedDate = new Date(dateString)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  plannedDate.setHours(0, 0, 0, 0)
  
  const diffTime = today - plannedDate
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays > 0 ? diffDays : 0
}

// Загрузка данных
const fetchData = async () => {
  isLoading.value = true
  error.value = null
  
  try {
    const data = await $fetch('/api/objects')
    
    // Статистика по статусам
    const stats = {
      active: 0,
      waiting: 0,
      completed: 0,
      inProgress: 0,
      total: data.length
    }
    
    // Сбор критических объектов
    const critical = []
    
    // Статистика по документам
    const docs = {
      inProgress: {
        unsignedContracts: 0,
        unpaidInvoices: 0,
        actsToSign: 0
      },
      completed: {
        unsignedContracts: 0,
        unpaidInvoices: 0,
        actsToSign: 0
      }
    }
    
    data.forEach(obj => {
      // Статистика по статусам
      if (obj.status === 'active') stats.active++
      if (obj.status === 'waiting') stats.waiting++
      if (obj.status === 'completed') stats.completed++
      
      // Объекты в работе (активные + ожидание)
      if (obj.status === 'active' || obj.status === 'waiting') {
        stats.inProgress++
        
        // Критические объекты (активные с просроченной датой)
        if (obj.status === 'active' && obj.plannedEndDate) {
          const plannedDate = new Date(obj.plannedEndDate)
          const today = new Date()
          
          if (plannedDate < today) {
            critical.push(obj)
          }
        }
      }
      
      // Статистика по документам для объектов в работе
      if (obj.status === 'active' || obj.status === 'waiting') {
        if (obj.contract && obj.contract.status !== 'signed') {
          docs.inProgress.unsignedContracts++
        }
        
        if (obj.invoiceStats) {
          docs.inProgress.unpaidInvoices += (obj.invoiceStats.total - obj.invoiceStats.signed)
        }
        
        if (obj.actStats) {
          docs.inProgress.actsToSign += (obj.actStats.total - obj.actStats.signed)
        }
      }
      
      // Статистика по документам для завершенных объектов
      if (obj.status === 'completed') {
        if (obj.contract && obj.contract.status !== 'signed') {
          docs.completed.unsignedContracts++
        }
        
        if (obj.invoiceStats) {
          docs.completed.unpaidInvoices += (obj.invoiceStats.total - obj.invoiceStats.signed)
        }
        
        if (obj.actStats) {
          docs.completed.actsToSign += (obj.actStats.total - obj.actStats.signed)
        }
      }
    })
    
    // Сортируем критические объекты по дате (сначала самые просроченные)
    critical.sort((a, b) => {
      const dateA = new Date(a.plannedEndDate)
      const dateB = new Date(b.plannedEndDate)
      return dateB - dateA
    })
    
    objectStats.value = stats
    criticalObjects.value = critical.slice(0, 3) // Топ-3 самых просроченных
    documentStats.value = docs
  } catch (err) {
    console.error('Ошибка загрузки данных по объектам:', err)
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
.object-status-card {
  :deep(.card__body) {
    padding: 1.5rem;
  }
}

.stats-content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
}

.status-item {
  display: flex;
  align-items: center;
  padding: 1rem;
  border-radius: $border-radius;
  gap: 1rem;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.12);
  }
  
  &.active {
    background: rgba($blue, 0.1);
    border: 1px solid rgba($blue, 0.3);
    
    .status-icon {
      color: $color-primary;
    }
    
    .status-value {
      // color: $color-primary;
      font-weight: 600;
    }
  }
  
  &.waiting {
    background: rgba($color-warning, 0.1);
    border: 1px solid rgba($color-warning, 0.3);
    
    .status-icon {
      color: $color-warning;
    }
    
    .status-value {
      // color: $color-warning;
      font-weight: 600;
    }
  }
  
  &.completed {
    background: rgba($color-success, 0.1);
    border: 1px solid rgba($color-success, 0.3);
    
    .status-icon {
      color: $color-success;
    }
    
    .status-value {
      // color: $color-success;
      font-weight: 600;
    }
  }
  
  .status-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border-radius: 50%;
  }
  
  .status-info {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    
    .status-label {
      font-size: 0.9rem;
      color: $color-muted;
      font-weight: 500;
    }
    
    .status-value {
      font-size: 1.5rem;
      font-weight: 700;
    }
  }
}

.critical-section {
  background: rgba($color-warning, 0.05);
  border: 1px solid rgba($color-warning, 0.2);
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
    background: $color-warning;
    color: white;
    font-size: 0.8rem;
    padding: 0.2rem 0.5rem;
    border-radius: $border-radius;
    font-weight: 600;
  }
}

.subsection-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.75rem;
  
  h4 {
    font-size: 1rem;
    margin: 0;
    color: $color-dark;
  }
  
  .count-badge {
    background: $color-muted;
    color: white;
    font-size: 0.8rem;
    padding: 0.2rem 0.5rem;
    border-radius: $border-radius;
    font-weight: 600;
  }
}

.critical-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.critical-item {
  background: white;
  border: 1px solid $border-color;
  border-radius: $border-radius;
  padding: 0.75rem;
  
  &:last-child {
    margin-bottom: 0;
  }
}

.critical-item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.critical-item-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  color: $color-dark;
}

.critical-icon {
  color: $color-warning;
}

.days-overdue {
  font-weight: 600;
  color: $color-danger;
}

.critical-item-details {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  font-size: 0.85rem;
  color: $color-muted;
}

.detail-row {
  display: flex;
  justify-content: space-between;
}

.detail-label {
  font-weight: 500;
  color: $color-dark;
}

.document-section {
  margin-top: 1.5rem;
}

.document-subsection {
  margin-bottom: 1.5rem;
  
  &:last-child {
    margin-bottom: 0;
  }
}

.document-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
}

.document-item {
  display: flex;
  align-items: center;
  padding: 1rem;
  border-radius: $border-radius;
  background: $background-light;
  border: 1px solid $border-color;
  transition: all 0.3s ease;
  
  &:hover {
    background: white;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  }
  
  .document-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border-radius: 8px;
    background: rgba($blue, 0.1);
    color: $blue;
    margin-right: 0.75rem;
  }
  
  .document-info {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    
    .document-label {
      font-size: 0.9rem;
      color: $color-muted;
      font-weight: 500;
    }
    
    .document-value {
      font-size: 1.3rem;
      font-weight: 700;
      color: $color-dark;
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
}
</style>