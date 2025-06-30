<template>
  <div class="operations-history">
    <!-- Форма фильтрации по периоду -->
    <div class="filter-period">
      <label>Период:</label>
      <input 
        type="date" 
        v-model="startDate" 
        class="date-input"
      />
      <input 
        type="date" 
        v-model="endDate" 
        class="date-input"
      />
      <button @click="applyFilter" class="btn-filter">Применить фильтр</button>
      <button @click="resetFilter" class="btn-reset">Сбросить</button>
    </div>

    <!-- Блок общего баланса -->
    <div class="balance-summary">
      <h2>Общий баланс</h2>
      <div v-if="loadingBalance" class="loading">Загрузка баланса...</div>
      <div v-else-if="errorBalance" class="error">{{ errorBalance }}</div>
      <div v-else class="balance-details">
        <div class="balance-item">
          <span class="label">Общие приходы:</span>
          <span class="value incoming">+ {{ formatCurrency(balance.totalComings) }}</span>
        </div>
        <div class="balance-item">
          <span class="label">Общие расходы:</span>
          <span class="value expense">- {{ formatCurrency(balance.totalExpenses) }}</span>
        </div>
        <div class="balance-item">
          <span class="label">Материалы:</span>
          <span class="value material">
            {{ formatCurrency(balance.materials.balance) }}
            <small>(+{{ formatCurrency(balance.materials.incoming) }} / -{{ formatCurrency(balance.materials.outgoing) }})</small>
          </span>
        </div>
        <div class="balance-item">
          <span class="label">Ожидают оплаты:</span>
          <span class="value pending">- {{ formatCurrency(balance.pendingWorks) }}</span>
        </div>
        <div class="balance-total">
          <span class="label">Итого:</span>
          <span class="value total">
            {{ formatCurrency(
              balance.totalComings 
              - balance.totalExpenses 
              - balance.pendingWorks 
              + balance.materials.balance
            ) }}
          </span>
        </div>
      </div>
    </div>

    <!-- Две колонки: расходы и приходы -->
    <div class="operations-container">
      <!-- Левая колонка - расходы -->
      <div class="expenses-column column">
        <h3>Расходы</h3>
        <div v-if="loadingExpenses" class="loading">Загрузка расходов...</div>
        <div v-else-if="errorExpenses" class="error">{{ errorExpenses }}</div>
        <div v-else-if="filteredExpenses.length === 0" class="no-data">Нет расходов за выбранный период</div>
        <ul v-else class="operations-list">
          <li 
            v-for="expense in filteredExpenses" 
            :key="expense.id" 
            class="operation-item expense-item"
          >
            <div v-if="expense" class="operation-content">
              <div class="operation-date">{{ formatDate(expense.operationDate) }}</div>
              <div class="operation-amount">- {{ formatCurrency(expense.amount) }}</div>
              <div class="operation-details">
                <!-- Ссылка на мастера или рабочего -->
                <div class="contractor-type">
                  <NuxtLink 
                    :to="`/cabinet/admin/contractors/${expense.contractorType}/${expense.contractorId}`"
                  >
                    {{ expense.contractorType === 'master' ? 'Мастер ' : 'Рабочий ' }} - {{ expense.contractorName }}
                  </NuxtLink>
                </div>

                <!-- Ссылка на объект -->
                <div class="object-id">
                  <template v-if="expense.objectId">
                    <NuxtLink :to="`/cabinet/objects/${expense.objectId}`">
                      {{ expense.objectName }}
                    </NuxtLink>
                  </template>
                  <template v-else>
                    {{ expense.objectName }}
                  </template>
                </div>

                <div class="comment">{{ expense.comment || 'Без комментария' }}</div>
              </div>
            </div>
          </li>
        </ul>
      </div>

      <!-- Правая колонка - приходы -->
      <div class="comings-column column">
        <h3>Приходы</h3>
        <div v-if="loadingComings" class="loading">Загрузка приходов...</div>
        <div v-else-if="errorComings" class="error">{{ errorComings }}</div>
        <div v-else-if="filteredComings.length === 0" class="no-data">Нет приходов за выбранный период</div>
        <ul v-else class="operations-list">
          <li 
            v-for="coming in filteredComings" 
            :key="coming.id" 
            class="operation-item coming-item"
          >
            <div v-if="coming" class="operation-content">
              <div class="operation-date">{{ formatDate(coming.operationDate) }}</div>
              <div class="operation-amount">+ {{ formatCurrency(coming.amount) }}</div>
              <div class="operation-details">
                <!-- Объект как ссылка -->
                <div class="object-id">
                  <NuxtLink :to="`/cabinet/objects/${coming.objectId}`">
                    {{ getObjectLabel(coming.objectId) }}
                  </NuxtLink>
                </div>
                <div class="comment">{{ coming.comment || 'Без комментария' }}</div>
              </div>
            </div>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

const startDate = ref('')
const endDate = ref('')
const balance = ref(null)
const loadingBalance = ref(true)
const errorBalance = ref(null)
const expenses = ref([])
const comings = ref([])
const loadingExpenses = ref(false)
const loadingComings = ref(false)
const errorExpenses = ref(null)
const errorComings = ref(null)
const objectLabels = ref({})
const contractorLabels = ref({
  master: {},
  worker: {}
})

definePageMeta({
  layout: 'cabinet'
})

// Загрузка общего баланса
const loadBalance = async () => {
  loadingBalance.value = true
  errorBalance.value = null
  
  try {
    const data = await $fetch('/api/balance')
    balance.value = data
  } catch (error) {
    errorBalance.value = 'Ошибка загрузки баланса'
    console.error('Ошибка загрузки баланса:', error)
  } finally {
    loadingBalance.value = false
  }
}

// Фильтрация расходов по периоду
const filteredExpenses = computed(() => {
  if (!startDate.value || !endDate.value) return expenses.value
  return expenses.value.filter(expense => {
    if (!expense?.operationDate) return false
    const date = new Date(expense.operationDate)
    return date >= new Date(startDate.value) && date <= new Date(endDate.value)
  })
})

// Фильтрация приходов по периоду
const filteredComings = computed(() => {
  if (!startDate.value || !endDate.value) return comings.value
  return comings.value.filter(coming => {
    if (!coming?.operationDate) return false
    const date = new Date(coming.operationDate)
    return date >= new Date(startDate.value) && date <= new Date(endDate.value)
  })
})

// Загрузка расходов
const loadExpenses = async () => {
  loadingExpenses.value = true
  errorExpenses.value = null
  
  try {
    const params = {}
    if (startDate.value && endDate.value) {
      params.startDate = startDate.value
      params.endDate = endDate.value
    }
    
    const data = await $fetch('/api/expenses', { params })
    expenses.value = Array.isArray(data) ? data : []
  } catch (error) {
    errorExpenses.value = 'Ошибка загрузки расходов'
    console.error('Ошибка загрузки расходов:', error)
  } finally {
    loadingExpenses.value = false
  }
}

// Загрузка приходов
const loadComings = async () => {
  loadingComings.value = true
  errorComings.value = null
  
  try {
    const params = {}
    if (startDate.value && endDate.value) {
      params.startDate = startDate.value
      params.endDate = endDate.value
    }
    
    const data = await $fetch('/api/comings', { params })
    comings.value = Array.isArray(data) ? data : []
  } catch (error) {
    errorComings.value = 'Ошибка загрузки приходов'
    console.error('Ошибка загрузки приходов:', error)
  } finally {
    loadingComings.value = false
  }
}

// Загружаем названия объектов
const loadObjectLabels = async () => {
  try {
    const data = await $fetch('/api/objects')
    data.forEach(obj => {
      objectLabels.value[obj.id] = obj.name
    })
  } catch (e) {
    console.error('Ошибка загрузки названий объектов:', e)
  }
}

// Получаем название объекта или "Неизвестный объект"
const getObjectLabel = (objectId) => {
  return objectLabels.value[objectId] || `Без объекта`
}

// Загружаем имена мастеров и рабочих
const loadContractorLabels = async () => {
  try {
    const [mastersData, workersData] = await Promise.all([
      $fetch('/api/contractors/masters'),
      $fetch('/api/contractors/workers')
    ])

    mastersData.forEach(master => {
      contractorLabels.value.master[master.id] = master.name
    })

    workersData.forEach(worker => {
      contractorLabels.value.worker[worker.id] = worker.name
    })
  } catch (e) {
    console.error('Ошибка загрузки данных о контрагентах:', e)
  }
}

// Применение фильтра
const applyFilter = () => {
  if (startDate.value && endDate.value) {
    loadExpenses()
    loadComings()
  }
}

// Сброс фильтра
const resetFilter = () => {
  startDate.value = ''
  endDate.value = ''
  loadExpenses()
  loadComings()
}

// Форматирование даты
const formatDate = (dateString) => {
  if (!dateString) return 'Не указана'
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return 'Некорректная дата'
    return date.toLocaleDateString('ru-RU')
  } catch (e) {
    return 'Ошибка даты'
  }
}

// Форматирование валюты
const formatCurrency = (amount) => {
  if (typeof amount === 'undefined') return '0 ₽'
  try {
    const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount
    if (isNaN(numericAmount)) return '0 ₽'
    
    return numericAmount.toLocaleString('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 2
    })
  } catch (e) {
    return '0 ₽'
  }
}

// Загрузка данных при монтировании
onMounted(() => {
  loadBalance()
  loadContractorLabels()
  loadObjectLabels()
  loadExpenses()
  loadComings()
})
</script>

<style lang="scss" scoped>
.operations-history {
  padding: 1rem;
  max-width: 1200px;
  margin: 0 auto;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;

  .balance-summary {
    background-color: #f8f9fa;
    border-radius: 8px;
    padding: 1.5rem;
    margin-bottom: 2rem;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);

    h2 {
      margin-top: 0;
      font-size: 1.5rem;
      color: #343a40;
      margin-bottom: 1rem;
    }

    .balance-details {
      display: grid;
      gap: 0.75rem;
    }

    .balance-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 1rem;
      padding: 0.5rem 0;

      .label {
        font-weight: 500;
        color: #495057;
        min-width: 180px;
      }

      .value {
        font-weight: bold;
        &.incoming { color: #00A12A; }
        &.expense { color: #A61300; }
        &.material { color: #00c3f5; }
        &.pending { color: #FAB702; }
      }

      small {
        color: #868e96;
        font-size: 0.85rem;
        margin-left: 0.5rem;
      }
    }

    .balance-total {
      padding-top: 0.75rem;
      border-top: 1px solid #e9ecef;
      font-size: 1.1rem;
      font-weight: bold;
      text-align: end;

      .label {
        font-size: 1.1rem;
      }

      .value.total {
        font-size: 1.25rem;
        color: #343a40;
        margin: 0 1em;
      }
    }

    .loading,
    .error {
      text-align: center;
      padding: 1rem;
      font-style: italic;
    }

    .error {
      color: #dc3545;
    }
  }
  

  .filter-period {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 1.5rem;
    padding: 1rem;
    background-color: #f8f9fa;
    border-radius: 8px;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);

    label {
      font-weight: 600;
      min-width: 60px;
    }

    .date-input {
      padding: 0.5rem;
      border: 1px solid #ced4da;
      border-radius: 4px;
      font-size: 0.95rem;
      transition: border-color 0.3s ease;

      &:focus {
        border-color: #0d6efd;
        outline: none;
        box-shadow: 0 0 0 2px rgba(13, 110, 253, 0.25);
      }
    }

    .btn-filter,
    .btn-reset {
      padding: 0.5rem 1rem;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-weight: 500;
      transition: all 0.2s ease;
    }

    .btn-filter {
      background-color: #0d6efd;
      color: white;

      &:hover {
        background-color: #0b5ed7;
      }
    }

    .btn-reset {
      background-color: #6c757d;
      color: white;

      &:hover {
        background-color: #5a6268;
      }
    }
  }

  .operations-container {
    display: flex;
    gap: 2rem;
    flex-wrap: wrap;

    @media (max-width: 768px) {
      flex-direction: column;
    }

    .column {
      flex: 1;
      min-width: 300px;
      background: white;
      border-radius: 8px;
      padding: 1.5rem;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
      transition: box-shadow 0.3s ease;

      h3 {
        margin-top: 0;
        margin-bottom: 1rem;
        font-size: 1.25rem;
        color: #343a40;
        font-weight: 600;
      }

      .loading,
      .error,
      .no-data {
        text-align: center;
        padding: 2rem;
        color: #6c757d;
        font-style: italic;
        font-size: 0.95rem;
      }

      .error {
        color: #dc3545;
      }

      .operations-list {
        list-style: none;
        padding: 0;
        margin: 0;

        .operation-item {
          padding: 1rem;
          border-bottom: 1px solid #e9ecef;
          transition: background-color 0.3s ease;

          &:last-child {
            border-bottom: none;
          }

          &:hover {
            background-color: #f1f3f5;
          }

          .operation-content {
            width: 100%;
          }

          .operation-date {
            font-weight: 500;
            color: #495057;
            font-size: 0.9rem;
          }

          .operation-amount {
            font-weight: bold;
            text-align: right;
            font-size: 1rem;
            color: #212529;
          }

          .operation-details {
            font-size: 0.9rem;
            color: #6c757d;

            .contractor-type {
              font-weight: 500;
              color: #212529;
            }

            .object-id {
              margin-top: 0.25rem;
              color: #555;
            }

            .comment {
              margin-top: 0.5rem;
              color: #212529;
            }
          }
        }

        .expense-item {
          border-left: 4px solid #dc3545;
          margin: 5px auto;
        }
        
        .coming-item {
          border-left: 4px solid #198754;
          margin: 5px auto;
        }
      }
    }
  }
}
</style>