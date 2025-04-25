<template>
  <div class="block">
    <h3>Платежи ({{ payments.length }})</h3>

    <!-- Форма добавления/редактирования -->
    <div class="payment-form">
      <select 
        v-model="currentPayment.category" 
        class="form-control"
        required
      >
        <option value="materials">Материалы</option>
        <option value="workers">Рабочие</option>
        <option value="enterprise">Предприятие</option>
      </select>
      <input 
        v-model.number="currentPayment.amount" 
        type="number" 
        step="0.01"
        placeholder="Сумма" 
        class="form-control" 
        :class="{ error: !currentPayment.amount }"
        required
      />
      <input 
        v-model="currentPayment.date" 
        type="date" 
        class="form-control"
        required
      />
      <button 
        @click="savePayment" 
        :disabled="!isFormValid"
        class="btn btn-primary"
      >
        {{ isEditing ? 'Сохранить' : 'Добавить' }}
      </button>
      <button 
        v-if="isEditing" 
        @click="cancelEdit" 
        class="btn btn-secondary"
      >
        Отмена
      </button>
    </div>

    <!-- Таблица платежей -->
    <table>
      <thead>
        <tr>
          <th>Категория</th>
          <th>Сумма</th>
          <th>Дата</th>
          <th>Действия</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="payment in payments" :key="payment.id">
          <td>{{ payment.category }}</td>
          <td>{{ payment.amount }} ₽</td>
          <td>{{ payment.date }}</td>
          <td>
            <button @click="editPayment(payment)">Редактировать</button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useNuxtApp } from '#app'

const route = useRoute()
const payments = ref([])
const currentPayment = ref({
  category: 'enterprise',
  amount: 0,
  date: new Date().toISOString().split('T')[0],
  objectId: route.params.id
})
const isEditing = ref(false)

// Валидация формы
const isFormValid = computed(() => {
  return currentPayment.value.amount > 0 && currentPayment.value.date
})

// Обновление objectId при изменении route
watch(
  () => route.params.id,
  (newId) => {
    currentPayment.value.objectId = newId
    fetchPayments()
  }
)

// Загрузка платежей
async function fetchPayments() {
  try {
    const response = await useNuxtApp().$axios.get(
      `/payments?objectId=${route.params.id}`
    )
    payments.value = response.data.map(payment => ({
      ...payment,
      amount: Number(payment.amount)
    }))
  } catch (error) {
    console.error('Ошибка загрузки платежей:', error)
  }
}

// Методы для платежей
async function savePayment() {
  if (isEditing.value) {
    await updatePayment()
  } else {
    await addPayment()
  }
  resetForm()
}

async function addPayment() {
  try {
    const response = await useNuxtApp().$axios.post('/payments', {
      ...currentPayment.value,
      userId: user.value.id // Убедитесь, что user доступен
    })
    payments.value.push(response.data)
  } catch (error) {
    console.error('Ошибка добавления платежа:', error)
  }
}

async function updatePayment() {
  try {
    const response = await useNuxtApp().$axios.put(
      `/payments/${currentPayment.value.id}`,
      currentPayment.value
    )
    const index = payments.value.findIndex(
      (p) => p.id === currentPayment.value.id
    )
    if (index !== -1) {
      payments.value.splice(index, 1, response.data)
    }
  } catch (error) {
    console.error('Ошибка обновления платежа:', error)
  }
}

function editPayment(payment) {
  currentPayment.value = { ...payment }
  isEditing.value = true
}

function cancelEdit() {
  resetForm()
  isEditing.value = false
}

function resetForm() {
  currentPayment.value = {
    category: 'enterprise',
    amount: 0,
    date: new Date().toISOString().split('T')[0],
    objectId: route.params.id
  }
}

// Загрузка данных при монтировании
onMounted(fetchPayments)
</script>

<style scoped>
.payment-form {
  margin-bottom: 20px;
}

.form-control {
  width: 100%;
  padding: 8px;
  margin: 5px 0;
  border: 1px solid #ccc;
  border-radius: 4px;
}

.form-control.error {
  border-color: red;
}

.buttons {
  display: flex;
  gap: 10px;
  margin-top: 15px;
}

.btn {
  padding: 8px 16px;
  border: none;
  cursor: pointer;
  border-radius: 4px;
}

.btn-primary {
  background-color: #007bff;
  color: white;
}

.btn-secondary {
  background-color: #6c757d;
  color: white;
}

table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 20px;
}

th,
td {
  border: 1px solid #ddd;
  padding: 8px;
  text-align: left;
}

th {
  background-color: #f8f9fa;
}

.status-checkbox {
  transform: scale(1.2);
  cursor: pointer;
}

.status-checkbox:disabled {
  opacity: 0.5;
}

.block {
  margin-bottom: 40px;
}
</style>