<template>
  <div class="block">
    <h3>Финансовые выплаты</h3>
    <table class="work-table">
      <thead>
        <tr>
          <th>Дата</th>
          <th>Сумма</th>
          <th>Тип</th>
          <th>Объект</th>
          <th>Комментарий</th>
          <th>Действия</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="payment in payments" :key="payment.id">
          <td>{{ formatDate(payment.date || payment.createdAt) }}</td>
          <td :class="{
            'text-green': payment.type === 'salary',
            'text-red': payment.type === 'expense',
            'text-expense': payment.expenseType && payment.type === 'expense'
          }">
            {{ formatAmount(payment.amount) }} ₽
          </td>
          <td>
            <span :class="`tag tag-${payment.type === 'salary' ? 'salary' : (payment.expenseType || 'expense')}`">
              {{ paymentTypeLabels[payment.type === 'salary' ? 'salary' : (payment.expenseType || 'expense')] }}
            </span>
          </td>
          <td>{{ getObjectName(payment.objectId) }}</td>
          <td>{{ payment.description || payment.comment }}</td>
          <td>
            <button 
              @click="openEditModal(payment)" 
              class="btn-icon"
              title="Редактировать"
            >
              <Icon name="mdi:pencil" size="16px" />
            </button>
            <button 
              @click="deletePayment(payment)" 
              class="btn-icon btn-delete"
              title="Удалить"
            >
              <Icon name="mdi:delete" size="16px" />
            </button>
          </td>
        </tr>
      </tbody>
    </table>
    <!-- Модальное окно редактирования -->
    <div v-if="editingPayment" class="modal-overlay">
      <div class="modal">
        <h4>Редактировать выплату</h4>
        <div class="form-group">
          <label>Сумма</label>
          <input 
            v-model.number="editingPayment.amount" 
            type="number" 
            step="0.01"
            :class="{ error: formErrors.amount }"
          />
          <div v-if="formErrors.amount" class="error-message">{{ formErrors.amount }}</div>
        </div>
        <div class="form-group">
          <label>Объект</label>
          <select 
            v-model="editingPayment.objectId"
            :class="{ error: formErrors.object }"
          >
            <option value="">Выберите объект</option>
            <option v-for="obj in objects" :key="obj.id" :value="obj.id">
              {{ obj.name }}
            </option>
          </select>
          <div v-if="formErrors.object" class="error-message">{{ formErrors.object }}</div>
        </div>
        <div class="form-group">
          <label>Комментарий</label>
          <textarea v-model="editingPayment.description"></textarea>
        </div>
        <div class="form-group">
          <label>Дата</label>
          <input 
            v-model="editingPayment.date" 
            type="date"
          />
        </div>
        <div class="form-group" v-if="editingPayment.type === 'expense'">
          <label>Тип расхода</label>
          <select v-model="editingPayment.expenseType">
            <option v-for="type in expenseTypes" :key="type" :value="type">
              {{ type }}
            </option>
          </select>
        </div>
        <div class="modal-actions">
          <button @click="savePayment" class="btn primary">Сохранить</button>
          <button @click="closeModal" class="btn secondary">Отмена</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useNuxtApp } from '#app'

const props = defineProps({
  payments: {
    type: Array,
    required: true
  },
  objects: {
    type: Array,
    required: true
  }
})

const emit = defineEmits(['update:payment', 'delete:payment'])

const { $fetch } = useNuxtApp()

const editingPayment = ref(null)
const formErrors = ref({})

const paymentTypeLabels = {
  salary: 'Зарплата',
  'Работа': 'Работа',
  'Налог': 'Налог',
  'Зарплата': 'Зарплата',
  'Реклама': 'Реклама',
  'Кредит': 'Кредит',
  'Топливо': 'Топливо',
  'ГлавПрофи': 'ГлавПрофи',
  expense: 'Прочее'
}

const expenseTypes = ['Работа', 'Налог', 'Зарплата', 'Реклама', 'Кредит', 'Топливо', 'ГлавПрофи']

function formatDate(dateString) {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

function formatAmount(amount) {
  return parseFloat(amount).toFixed(2)
}

function getObjectName(objectId) {
  const obj = props.objects.find(o => o.id === objectId)
  return obj ? obj.name : 'Объект не найден'
}

function validateForm() {
  formErrors.value = {}
  if (editingPayment.value.amount === null || isNaN(editingPayment.value.amount)) {
    formErrors.value.amount = 'Сумма обязательна'
  }
  if (!editingPayment.value.objectId) {
    formErrors.value.object = 'Объект обязателен'
  }
  return Object.keys(formErrors.value).length === 0
}

function openEditModal(payment) {
  editingPayment.value = { ...payment }
}

function closeModal() {
  editingPayment.value = null
  formErrors.value = {}
}

async function savePayment() {
  if (!validateForm()) return
  try {
    const endpoint = editingPayment.value.type === 'salary' 
      ? `/api/salary-deductions/${editingPayment.value.id}` 
      : `/api/expenses/${editingPayment.value.id}`
    const response = await $fetch(endpoint, {
      method: 'PUT',
      body: {
        amount: editingPayment.value.amount,
        objectId: editingPayment.value.objectId,
        description: editingPayment.value.description || editingPayment.value.comment,
        paymentDate: editingPayment.value.date,
        ...(editingPayment.value.type === 'salary' && { contractorType: props.contractorType }),
        ...(editingPayment.value.type === 'expense' && { expenseType: editingPayment.value.expenseType })
      },
      credentials: 'include'
    })
    const formattedPayment = {
      ...response,
      amount: parseFloat(response.amount),
      date: response.paymentDate || response.createdAt
    }
    emit('update:payment', formattedPayment)
    closeModal()
  } catch (error) {
    console.error('Ошибка сохранения выплаты:', error)
    alert('Не удалось сохранить изменения')
  }
}

async function deletePayment(payment) {
  if (!confirm('Вы уверены, что хотите удалить эту выплату?')) return
  try {
    const endpoint = payment.type === 'salary' 
      ? `/api/salary-deductions/${payment.id}` 
      : `/api/expenses/${payment.id}`
    await $fetch(endpoint, {
      method: 'DELETE',
      credentials: 'include'
    })
    emit('delete:payment', payment.id)
  } catch (error) {
    console.error('Ошибка удаления выплаты:', error)
    alert('Не удалось удалить выплату')
  }
}
</script>

<style scoped>
.text-green {
  color: #28a745;
  font-weight: 500;
}
.text-red {
  color: #dc3545;
  font-weight: 500;
}
.text-expense {
  color: #6c757d;
  font-weight: 500;
}

.tag {
  padding: 0.2rem 0.6rem;
  border-radius: 4px;
  font-size: 0.8rem;
  color: white;
}

.tag-salary {
  background: #28a745;
}
.tag-Работа {
  background: #6c757d;
}
.tag-Налог {
  background: #dc3545;
}
.tag-Зарплата {
  background: #28a745;
}
.tag-Реклама {
  background: #ffc107;
  color: #212529;
}
.tag-Кредит {
  background: #17a2b8;
}
.tag-Топливо {
  background: #6610f2;
}
.tag-ГлавПрофи {
  background: #e83e8c;
}
.tag-expense {
  background: #6c757d;
}
</style>