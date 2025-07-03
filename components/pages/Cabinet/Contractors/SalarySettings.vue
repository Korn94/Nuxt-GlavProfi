<template>
  <div class="salary-settings">
    <!-- Статус "На зарплате" -->
    <div class="salary-status">
      <label>
        <input 
          type="checkbox" 
          v-model="isOnSalary" 
          @change="handleToggleSalary"
        />
        На зарплате
      </label>
    </div>

    <!-- Блок настроек зарплаты (отображается только если isOnSalary = true) -->
    <div v-if="isOnSalary" class="salary-details">
      <div class="form-group">
        <label>Сумма зарплаты:</label>
        <input 
          type="number" 
          v-model.number="salaryAmount"
          min="0"
          step="0.01"
          @blur="saveSettings"
        />
      </div>

      <div class="form-group">
        <label>День выплаты:</label>
        <input 
          type="number" 
          v-model.number="salaryDay"
          min="1"
          max="31"
          @blur="saveSettings"
        />
      </div>

      <!-- История списаний -->
      <div class="deductions-history">
        <h4>История списаний</h4>
        <table v-if="deductionsHistory.length > 0">
          <thead>
            <tr>
              <th>Дата</th>
              <th>Сумма</th>
              <th>Статус</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="deduction in deductionsHistory" :key="deduction.id">
              <td>{{ formatDate(deduction.deductionDate) }}</td>
              <td>{{ deduction.amount }} ₽</td>
              <td :class="statusClass(deduction.status)">{{ deduction.status }}</td>
            </tr>
          </tbody>
        </table>
        <p v-else>Нет данных о списаниях.</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useNuxtApp } from '#app'

// Props
const props = defineProps({
  contractorType: {
    type: String,
    required: true,
    validator: value => ['master', 'worker'].includes(value)
  },
  contractorId: {
    type: Number,
    required: true
  },
  initialIsOnSalary: {
    type: Boolean,
    default: false
  },
  initialSalaryAmount: {
    type: [Number, String],
    default: 0
  },
  initialSalaryDay: {
    type: Number,
    default: 10
  }
})

// Локальное состояние
const isOnSalary = ref(props.initialIsOnSalary)
const salaryAmount = ref(Number(props.initialSalaryAmount))
const salaryDay = ref(props.initialSalaryDay)
const deductionsHistory = ref([])

// Форматирование даты
function formatDate(date) {
  return new Date(date).toLocaleDateString('ru-RU')
}

// Цвет статуса
function statusClass(status) {
  return {
    'status-completed': status === 'completed',
    'status-failed': status === 'failed',
    'status-skipped': status === 'skipped'
  }
}

// Обновление статуса "На зарплате"
async function handleToggleSalary() {
  try {
    await $fetch(`/api/contractors/${props.contractorType}s/${props.contractorId}`, {
      method: 'PUT',
      body: { isOnSalary: isOnSalary.value }
    })
  } catch (error) {
    console.error('Ошибка обновления статуса:', error)
    isOnSalary.value = !isOnSalary.value // Откат изменения
  }
}

// Сохранение настроек зарплаты
async function saveSettings() {
  // Проверка валидности данных
  if (salaryAmount.value <= 0 || salaryDay.value < 1 || salaryDay.value > 31) {
    alert('Сумма и день должны быть корректными!')
    return
  }

  try {
    await $fetch(`/api/contractors/${props.contractorType}s/${props.contractorId}`, {
      method: 'PUT',
      body: {
        salaryAmount: salaryAmount.value.toFixed(2),
        salaryDay: salaryDay.value
      }
    })
  } catch (error) {
    console.error('Ошибка сохранения настроек:', error)
  }
}

// Загрузка истории списаний
async function fetchDeductionsHistory() {
  try {
    const data = await $fetch('/api/salary-deductions', {
      method: 'GET',
      params: {
        contractorType: props.contractorType,
        contractorId: props.contractorId
      }
    })
    deductionsHistory.value = data
  } catch (error) {
    console.error('Ошибка загрузки истории:', error)
  }
}

// Загрузка данных при монтировании
onMounted(async () => {
  if (isOnSalary.value) {
    await fetchDeductionsHistory()
  }
})
</script>

<style scoped>
.salary-settings {
  margin-bottom: 20px;
  padding: 15px;
  border: 1px solid #ddd;
  border-radius: 8px;
}

.salary-status {
  font-weight: bold;
  margin-bottom: 10px;
}

.salary-details .form-group {
  margin-bottom: 15px;
}

.salary-details label {
  display: block;
  margin-bottom: 5px;
}

.salary-details input {
  width: 100%;
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
}

.deductions-history table {
  width: 100%;
  border-collapse: collapse;
}

.deductions-history th, .deductions-history td {
  border: 1px solid #ddd;
  padding: 8px;
  text-align: left;
}

.status-completed { color: green; }
.status-failed { color: red; }
.status-skipped { color: gray; }
</style>