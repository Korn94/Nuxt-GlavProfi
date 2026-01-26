<template>
  <Card :loading="isLoading" title="Финансы контрагентов" elevated class="contractor-finance-card">
    <template #icon>
      <Icon name="mdi:account-group" size="24" />
    </template>

    <div v-if="contractorData" class="finance-content">
      <!-- Общий баланс -->
      <div class="summary-item total-balance">
        <div class="item-label">Общий баланс по контрагентам</div>
        <div class="item-value">
          {{ formatCurrency(totalBalance) }}
        </div>
      </div>

      <!-- Балансы по типам -->
      <div class="types-grid">
        <div class="type-item master" @click="navigateTo('/cabinet/admin/contractors/master')">
          <div class="type-icon">
            <Icon name="mdi:hammer" size="24" />
          </div>
          <div class="type-info">
            <div class="type-label">Мастера</div>
            <div class="type-value" :class="{
              'positive-balance': contractorData.masters.totalBalance > 0,
              'negative-balance': contractorData.masters.totalBalance < 0
            }">
              {{ formatCurrency(contractorData.masters.totalBalance) }}
            </div>
            <div class="type-count">{{ contractorData.masters.count }} контрагентов</div>
          </div>
        </div>
        
        <div class="type-item worker" @click="navigateTo('/cabinet/admin/contractors/worker')">
          <div class="type-icon">
            <Icon name="mdi:account-hard-hat" size="24" />
          </div>
          <div class="type-info">
            <div class="type-label">Рабочие</div>
            <div class="type-value" :class="{
              'positive-balance': contractorData.workers.totalBalance > 0,
              'negative-balance': contractorData.workers.totalBalance < 0
            }">
              {{ formatCurrency(contractorData.workers.totalBalance) }}
            </div>
            <div class="type-count">{{ contractorData.workers.count }} контрагентов</div>
          </div>
        </div>
        
        <div class="type-item foreman" @click="navigateTo('/cabinet/admin/contractors/foreman')">
          <div class="type-icon">
            <Icon name="mdi:briefcase" size="24" />
          </div>
          <div class="type-info">
            <div class="type-label">Прорабы</div>
            <div class="type-value" :class="{
              'positive-balance': contractorData.foremans.totalBalance > 0,
              'negative-balance': contractorData.foremans.totalBalance < 0
            }">
              {{ formatCurrency(contractorData.foremans.totalBalance) }}
            </div>
            <div class="type-count">{{ contractorData.foremans.count }} контрагентов</div>
          </div>
        </div>
        
        <div class="type-item office" @click="navigateTo('/cabinet/admin/contractors/office')">
          <div class="type-icon">
            <Icon name="mdi:office-building" size="24" />
          </div>
          <div class="type-info">
            <div class="type-label">Офис</div>
            <div class="type-value" :class="{
              'positive-balance': contractorData.offices.totalBalance > 0,
              'negative-balance': contractorData.offices.totalBalance < 0
            }">
              {{ formatCurrency(contractorData.offices.totalBalance) }}
            </div>
            <div class="type-count">{{ contractorData.offices.count }} контрагентов</div>
          </div>
        </div>
      </div>

      <!-- Контрагенты, которые должны нам -->
      <div class="debtors-section" v-if="debtors.length > 0">
        <div class="section-header">
          <h3>Контрагенты, которые должны нам</h3>
          <span class="count-badge">{{ debtors.length }}</span>
        </div>
        
        <div class="debtors-list">
          <div v-for="(debtor, index) in debtors" :key="index" class="debtor-item">
            <div class="debtor-header" @click.stop="toggleContractorDetails(debtor)">
              <div class="debtor-name">
                <Icon :name="getContractorIcon(debtor.type)" size="18" />
                {{ debtor.name }}
              </div>
              <Icon 
              name="mdi:chevron-down" 
              size="20" 
              class="expand-icon" 
              :class="{ 'rotated': expandedContractorId === debtor.id }" 
              />
              <div class="debtor-balance">{{ formatCurrency(debtor.balance) }}</div>
            </div>
            
            <div class="debtor-details">
              <div class="detail-row">
                <span class="detail-label">Тип:</span>
                <span class="detail-value">{{ getTypeLabel(debtor.type) }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Баланс:</span>
                <span class="detail-value">{{ formatCurrency(debtor.balance) }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Статус:</span>
                <span class="detail-value">{{ debtor.isOnSalary ? 'На зарплате' : 'Сдельная' }}</span>
              </div>
            </div>
            
            <!-- Транзакции контрагента -->
            <div v-if="expandedContractorId === debtor.id" class="transactions-section">
              <div class="transactions-columns">
                <!-- Расходы (слева) -->
                <div class="column expenses-column">
                  <div class="column-header">
                    <h4>Расходы</h4>
                    <span class="count-badge">{{ contractorTransactions[debtor.id]?.expenses?.length || 0 }}</span>
                  </div>
                  
                  <div v-if="contractorTransactions[debtor.id]?.expenses?.length > 0" class="transactions-list">
                    <div v-for="(tx, txIndex) in contractorTransactions[debtor.id].expenses" :key="txIndex" class="transaction-item">
                      <div class="transaction-header">
                        <div class="transaction-date">{{ formatDate(tx.operationDate) }}</div>
                      </div>
                      
                      <div class="transaction-details">
                        <div class="transaction-amount" :class="{
                          'positive-balance': tx.amount > 0,
                          'negative-balance': tx.amount < 0
                        }">
                          {{ formatCurrency(tx.amount) }}
                        </div>
                        <div class="transaction-object" v-if="tx.objectName">
                          <Icon name="mdi:map-marker" size="16" class="object-icon" />
                          {{ tx.objectName }}
                        </div>
                        <div class="transaction-comment" v-if="tx.comment">
                          <Icon name="mdi:comment-text-outline" size="16" class="comment-icon" />
                          {{ tx.comment }}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div v-else class="no-transactions">
                    <Icon name="mdi:history" size="24" class="no-transactions-icon" />
                    <span>Нет расходов за последнее время</span>
                  </div>
                </div>
                
                <!-- Работы (справа) -->
                <div class="column works-column">
                  <div class="column-header">
                    <h4>Работы</h4>
                    <span class="count-badge">{{ contractorTransactions[debtor.id]?.comings?.length || 0 }}</span>
                  </div>
                  
                  <div v-if="contractorTransactions[debtor.id]?.comings?.length > 0" class="transactions-list">
                    <div v-for="(tx, txIndex) in contractorTransactions[debtor.id].comings" :key="txIndex" class="transaction-item">
                      <div class="transaction-header">
                        <div class="transaction-date">{{ formatDate(tx.operationDate) }}</div>
                      </div>
                      
                      <div class="transaction-details">
                        <div class="transaction-amount" :class="{
                          'positive-balance': tx.amount > 0,
                          'negative-balance': tx.amount < 0
                        }">
                          {{ formatCurrency(tx.amount) }}
                        </div>
                        <div class="transaction-object" v-if="tx.objectName">
                          <Icon name="mdi:map-marker" size="16" class="object-icon" />
                          {{ tx.objectName }}
                        </div>
                        <div class="transaction-comment" v-if="tx.comment">
                          <Icon name="mdi:comment-text-outline" size="16" class="comment-icon" />
                          {{ tx.comment }}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div v-else class="no-transactions">
                    <Icon name="mdi:history" size="24" class="no-transactions-icon" />
                    <span>Нет работ за последнее время</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Контрагенты, кому мы должны -->
      <div class="creditors-section" v-if="creditors.length > 0">
        <div class="section-header">
          <h3>Контрагенты, кому мы должны</h3>
          <span class="count-badge">{{ creditors.length }}</span>
        </div>
        
        <div class="creditors-list">
          <div v-for="(creditor, index) in creditors" :key="index" class="creditor-item">
            <div class="creditor-header" @click.stop="toggleContractorDetails(creditor)">
              <div class="creditor-name">
                <Icon :name="getContractorIcon(creditor.type)" size="18" />
                {{ creditor.name }}
              </div>
              <Icon 
              name="mdi:chevron-down" 
              size="20" 
              class="expand-icon" 
              :class="{ 'rotated': expandedContractorId === creditor.id }" 
              />
              <div class="creditor-balance">{{ formatCurrency(creditor.balance) }}</div>
            </div>
            
            <div class="creditor-details">
              <div class="detail-row">
                <span class="detail-label">Тип:</span>
                <span class="detail-value">{{ getTypeLabel(creditor.type) }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Баланс:</span>
                <span class="detail-value">{{ formatCurrency(creditor.balance) }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Следующая выплата:</span>
                <span class="detail-value">{{ getNextPaymentDate(creditor) }}</span>
              </div>
            </div>
            
            <!-- Транзакции контрагента -->
            <div v-if="expandedContractorId === creditor.id" class="transactions-section">
              <div class="transactions-columns">
                <!-- Расходы (слева) -->
                <div class="column expenses-column">
                  <div class="column-header">
                    <h4>Расходы</h4>
                    <span class="count-badge">{{ contractorTransactions[creditor.id]?.expenses?.length || 0 }}</span>
                  </div>
                  
                  <div v-if="contractorTransactions[creditor.id]?.expenses?.length > 0" class="transactions-list">
                    <div v-for="(tx, txIndex) in contractorTransactions[creditor.id].expenses" :key="txIndex" class="transaction-item">
                      <div class="transaction-header">
                        <div class="transaction-date">{{ formatDate(tx.operationDate) }}</div>
                      </div>
                      
                      <div class="transaction-details">
                        <div class="transaction-amount" :class="{
                          'positive-balance': tx.amount > 0,
                          'negative-balance': tx.amount < 0
                        }">
                          {{ formatCurrency(tx.amount) }}
                        </div>
                        <div class="transaction-object" v-if="tx.objectName">
                          <Icon name="mdi:map-marker" size="16" class="object-icon" />
                          {{ tx.objectName }}
                        </div>
                        <div class="transaction-comment" v-if="tx.comment">
                          <Icon name="mdi:comment-text-outline" size="16" class="comment-icon" />
                          {{ tx.comment }}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div v-else class="no-transactions">
                    <Icon name="mdi:history" size="24" class="no-transactions-icon" />
                    <span>Нет расходов за последнее время</span>
                  </div>
                </div>
                
                <!-- Работы (справа) -->
                <div class="column works-column">
                  <div class="column-header">
                    <h4>Работы</h4>
                    <span class="count-badge">{{ contractorTransactions[creditor.id]?.comings?.length || 0 }}</span>
                  </div>
                  
                  <div v-if="contractorTransactions[creditor.id]?.comings?.length > 0" class="transactions-list">
                    <div v-for="(tx, txIndex) in contractorTransactions[creditor.id].comings" :key="txIndex" class="transaction-item">
                      <div class="transaction-header">
                        <div class="transaction-date">{{ formatDate(tx.operationDate) }}</div>
                      </div>
                      
                      <div class="transaction-details">
                        <div class="transaction-amount" :class="{
                          'positive-balance': tx.amount > 0,
                          'negative-balance': tx.amount < 0
                        }">
                          {{ formatCurrency(tx.amount) }}
                        </div>
                        <div class="transaction-object" v-if="tx.objectName">
                          <Icon name="mdi:map-marker" size="16" class="object-icon" />
                          {{ tx.objectName }}
                        </div>
                        <div class="transaction-comment" v-if="tx.comment">
                          <Icon name="mdi:comment-text-outline" size="16" class="comment-icon" />
                          {{ tx.comment }}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div v-else class="no-transactions">
                    <Icon name="mdi:history" size="24" class="no-transactions-icon" />
                    <span>Нет работ за последнее время</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Ошибка загрузки -->
    <div v-else-if="error" class="error-state">
      <Icon name="ic:outline-warning" size="40" class="error-icon" />
      <p>Не удалось загрузить финансовую информацию по контрагентам</p>
      <button class="btn btn-secondary" @click="fetchData">
        <Icon name="mdi:refresh" size="18" />
        Повторить
      </button>
    </div>

    <!-- Пустое состояние -->
    <div v-else class="empty-state">
      <Icon name="mdi:account-group" size="40" class="empty-icon" />
      <p>Нет данных по контрагентам</p>
    </div>

    <template #actions>
      <button class="btn btn-primary" @click="navigateTo('/cabinet/contractors')">
        Все контрагенты
        <Icon name="mdi:arrow-right" size="18" />
      </button>
    </template>

    <template #footer>
      Данные актуальны на {{ currentDate }}
    </template>
  </Card>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { navigateTo } from '#app'

const Card = defineAsyncComponent(() => import('@/components/pages/cabinet/ui/cards/card.vue'))

// Состояние компонента
const contractorData = ref(null)
const expandedContractorId = ref(null)
const contractorTransactions = ref({})
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

// Форматирование валюты
const formatCurrency = (amount) => {
  const num = parseFloat(amount) || 0
  const absAmount = Math.abs(num)
  const formatted = absAmount.toLocaleString('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    minimumFractionDigits: 2
  })
  
  // Если баланс положительный, это долг контрагента нам (он должен нам)
  // Если отрицательный, это наш долг контрагенту (мы должны ему)
  if (num > 0) {
    return `+${formatted}`
  } else if (num < 0) {
    return `-${formatted}`
  }
  return formatted
}

// Получение иконки для типа контрагента
const getContractorIcon = (type) => {
  switch (type) {
    case 'master': return 'mdi:hammer'
    case 'worker': return 'mdi:account-hard-hat'
    case 'foreman': return 'mdi:briefcase'
    case 'office': return 'mdi:office-building'
    default: return 'mdi:account'
  }
}

// Получение метки для типа контрагента
const getTypeLabel = (type) => {
  switch (type) {
    case 'master': return 'Мастер'
    case 'worker': return 'Рабочий'
    case 'foreman': return 'Прораб'
    case 'office': return 'Офисный сотрудник'
    default: return type
  }
}

// Получение даты следующей выплаты
const getNextPaymentDate = (contractor) => {
  if (!contractor.isOnSalary) return 'Не на зарплате'
  
  const today = new Date()
  let nextPayment = new Date(today.getFullYear(), today.getMonth(), contractor.salaryDay)
  
  if (nextPayment < today) {
    nextPayment = new Date(today.getFullYear(), today.getMonth() + 1, contractor.salaryDay)
  }
  
  return nextPayment.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: 'short'
  })
}

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

// Общий баланс
const totalBalance = computed(() => {
  if (!contractorData.value) return 0
  
  return (
    contractorData.value.masters.totalBalance +
    contractorData.value.workers.totalBalance +
    contractorData.value.foremans.totalBalance +
    contractorData.value.offices.totalBalance
  )
})

// Должники (контрагенты, которые должны нам - положительный баланс)
const debtors = computed(() => {
  if (!contractorData.value) return []
  
  const allContractors = [
    ...contractorData.value.masters.list,
    ...contractorData.value.workers.list,
    ...contractorData.value.foremans.list,
    ...contractorData.value.offices.list
  ]
  
  // Фильтруем контрагентов с положительным балансом (они должны нам)
  return allContractors
    .filter(c => c.balance > 0)
    .sort((a, b) => b.balance - a.balance)
    .slice(0, 5)
})

// Кредиторы (контрагенты, кому мы должны - отрицательный баланс)
const creditors = computed(() => {
  if (!contractorData.value) return []
  
  const allContractors = [
    ...contractorData.value.masters.list,
    ...contractorData.value.workers.list,
    ...contractorData.value.foremans.list,
    ...contractorData.value.offices.list
  ]
  
  // Фильтруем контрагентов с отрицательным балансом (мы должны им)
  return allContractors
    .filter(c => c.balance < 0)
    .sort((a, b) => a.balance - b.balance)
    .slice(0, 3)
})

// Загрузка данных
const fetchData = async () => {
  isLoading.value = true
  error.value = null
  
  try {
    // Загрузка всех типов контрагентов
    const [mastersData, workersData, foremansData, officesData] = await Promise.all([
      $fetch('/api/contractors/masters'),
      $fetch('/api/contractors/workers'),
      $fetch('/api/contractors/foremans'),
      $fetch('/api/contractors/offices')
    ])
    
    // Обработка данных
    const processContractors = (data, type) => {
      return data.map(c => ({
        ...c,
        type,
        balance: parseFloat(c.balance) || 0
      }))
    }
    
    const masters = processContractors(mastersData, 'master')
    const workers = processContractors(workersData, 'worker')
    const foremans = processContractors(foremansData, 'foreman')
    const offices = processContractors(officesData, 'office')
    
    // Вычисляем общие балансы по типам
    const calculateTotalBalance = (contractors) => {
      return contractors.reduce((sum, c) => sum + c.balance, 0)
    }
    
    contractorData.value = {
      masters: {
        totalBalance: calculateTotalBalance(masters),
        count: masters.length,
        list: masters
      },
      workers: {
        totalBalance: calculateTotalBalance(workers),
        count: workers.length,
        list: workers
      },
      foremans: {
        totalBalance: calculateTotalBalance(foremans),
        count: foremans.length,
        list: foremans
      },
      offices: {
        totalBalance: calculateTotalBalance(offices),
        count: offices.length,
        list: offices
      }
    }
  } catch (err) {
    console.error('Ошибка загрузки финансовых данных по контрагентам:', err)
    error.value = 'Не удалось загрузить данные'
  } finally {
    isLoading.value = false
  }
}

// Загрузка транзакций контрагента
const loadContractorTransactions = async (contractor) => {
  // Если транзакции уже загружены, не загружаем повторно
  if (contractorTransactions.value[contractor.id]) {
    return
  }

  try {
    // Загрузка расходов и приходов по контрагенту
    const [expenses, comings] = await Promise.all([
      $fetch('/api/expenses', {
        params: {
          contractorType: contractor.type,
          contractorId: contractor.id
        }
      }),
      $fetch('/api/comings', {
        params: {
          contractorType: contractor.type,
          contractorId: contractor.id
        }
      })
    ])
    
    // Форматирование данных
    const formattedExpenses = expenses.map(expense => ({
      type: 'expense',
      amount: parseFloat(expense.amount) || 0,
      operationDate: expense.operationDate,
      comment: expense.comment,
      objectName: expense.objectName
    }))
    
    const formattedComings = comings.map(coming => ({
      type: 'income',
      amount: parseFloat(coming.amount) || 0,
      operationDate: coming.operationDate,
      comment: coming.comment,
      objectName: coming.objectName
    }))
    
    // Обновляем состояние
    contractorTransactions.value = {
      ...contractorTransactions.value,
      [contractor.id]: {
        expenses: formattedExpenses,
        comings: formattedComings
      }
    }
  } catch (err) {
    console.error(`Ошибка загрузки транзакций для контрагента ${contractor.id}:`, err)
  }
}

// Переключение раскрытия деталей контрагента
const toggleContractorDetails = async (contractor) => {
  if (expandedContractorId.value === contractor.id) {
    expandedContractorId.value = null
    return
  }
  
  expandedContractorId.value = contractor.id
  await loadContractorTransactions(contractor)
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
.contractor-finance-card {
  :deep(.card__body) {
    padding: 1.5rem;
  }
}

.finance-content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
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

.types-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1rem;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    opacity: 0.95;
  }
  
  .type-item {
    padding: 1rem;
    border-radius: $border-radius;
    transition: all 0.2s ease;
    
    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    }
    
    &.master {
      background: rgba($color-primary, 0.1);
      border: 1px solid rgba($color-primary, 0.3);
      
      .type-icon {
        color: $color-primary;
        background: rgba($color-primary, 0.15);
      }
      
      .type-value {
        color: $color-primary;
      }
    }
    
    &.worker {
      background: rgba($color-warning, 0.1);
      border: 1px solid rgba($color-warning, 0.3);
      
      .type-icon {
        color: $color-warning;
        background: rgba($color-warning, 0.15);
      }
      
      .type-value {
        color: $color-warning;
      }
    }
    
    &.foreman {
      background: rgba($color-info, 0.1);
      border: 1px solid rgba($color-info, 0.3);
      
      .type-icon {
        color: $color-info;
        background: rgba($color-info, 0.15);
      }
      
      .type-value {
        color: $color-info;
      }
    }
    
    &.office {
      background: rgba($color-muted, 0.1);
      border: 1px solid rgba($color-muted, 0.3);
      
      .type-icon {
        color: $color-muted;
        background: rgba($color-muted, 0.15);
      }
      
      .type-value {
        color: $color-muted;
      }
    }
    
    .type-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      border-radius: 8px;
      margin-bottom: 0.5rem;
    }
    
    .type-info {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      
      .type-label {
        font-size: 0.9rem;
        color: $color-dark;
        font-weight: 500;
      }
      
      .type-value {
        font-size: 1.3rem;
        font-weight: 700;
      }
      
      .type-count {
        font-size: 0.85rem;
        color: $color-muted;
      }
    }
  }
}

.debtors-section, .creditors-section {
  background: $background-light;
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
    color: $color-dark;
    font-weight: 600;
  }
}

.debtors-list, .creditors-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.debtor-item, .creditor-item {
  background: white;
  border: 1px solid $border-color;
  border-radius: $border-radius;
  padding: 0.75rem;
  transition: all 0.2s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  }
}

.debtor-header, .creditor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: $border-radius;
  transition: all 0.2s ease;
  
  &:hover {
    background: rgba(0, 0, 0, 0.02);
  }
}

.debtor-name, .creditor-name {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  color: $color-dark;
}

.debtor-balance, .creditor-balance {
  font-weight: 600;
  flex: 2;
  text-align: right;
  color: $color-danger;
}

.creditor-balance {
  color: $color-success;
}

.expand-icon {
  transition: transform 0.3s ease;
  
  &.rotated {
    transform: rotate(180deg);
  }
}

.debtor-details, .creditor-details {
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

.transactions-section {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid $border-color;
}

.transactions-columns {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.column {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  
  &.expenses-column {
    border-right: 1px solid $border-color;
    padding-right: 1rem;
  }
  
  &.works-column {
    padding-left: 1rem;
  }
}

.column-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.75rem;
  
  h4 {
    font-size: 1rem;
    margin: 0;
    color: $color-dark;
  }
}

.transactions-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.transaction-item {
  background: $background-light;
  border: 1px solid $border-color;
  border-radius: $border-radius;
  padding: 0.75rem;
}

.transaction-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.transaction-date {
  font-size: 0.85rem;
  color: $color-muted;
}

.transaction-details {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  font-size: 0.9rem;
  
  .transaction-amount {
    font-weight: 600;
    
    &.positive-balance {
      color: $color-danger;
    }
    
    &.negative-balance {
      color: $color-success;
    }
  }
  
  .transaction-object,
  .transaction-comment {
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

.no-transactions {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  text-align: center;
  color: $color-muted;
  font-size: 0.9rem;
  
  .no-transactions-icon {
    margin-bottom: 0.5rem;
    opacity: 0.7;
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