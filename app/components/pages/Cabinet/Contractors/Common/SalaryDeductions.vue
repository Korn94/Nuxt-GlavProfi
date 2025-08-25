<template>
  <div class="block">
    <h3>Оплаты</h3>

    <h3>Оплаты (ожидает: {{ pendingTotal }} ₽)</h3>
    
    <div v-if="deductions.length === 0" class="no-data">
      Нет записей об оплатах
    </div>
    
    <table v-else class="work-table">
      <thead>
        <tr>
          <th>Дата</th>
          <th>Сумма</th>
          <th>Объект</th>
          <th>Комментарий</th>
          <th>Действия</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="deduction in deductions" :key="deduction.id">
          <td>{{ formatDate(deduction.paymentDate || deduction.createdAt) }}</td>
          <td :class="{ 'text-danger': deduction.amount < 0 }">
            {{ formatAmount(deduction.amount) }} ₽
          </td>
          <td>{{ getObjectName(deduction.objectId) }}</td>
          <td>{{ deduction.comment }}</td>
          <td>
            <button 
              @click="openEditModal(deduction)" 
              class="btn-icon"
              title="Редактировать"
            >
              <Icon name="mdi:pencil" size="16px" />
            </button>
            <button 
              @click="deleteDeduction(deduction)" 
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
    <div v-if="editingDeduction" class="modal-overlay">
      <div class="modal">
        <h4>Редактировать оплату</h4>
        
        <div class="form-group">
          <label>Сумма</label>
          <input 
            v-model.number="editingDeduction.amount" 
            type="number" 
            step="0.01"
            :class="{ error: formErrors.amount }"
          />
          <div v-if="formErrors.amount" class="error-message">{{ formErrors.amount }}</div>
        </div>

        <div class="form-group">
          <label>Объект</label>
          <select 
            v-model="editingDeduction.objectId"
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
          <textarea v-model="editingDeduction.comment"></textarea>
        </div>

        <div class="form-group">
          <label>Дата оплаты</label>
          <input 
            v-model="editingDeduction.paymentDate" 
            type="date"
          />
        </div>

        <div class="modal-actions">
          <button @click="saveDeduction" class="btn primary">Сохранить</button>
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
  deductions: {
    type: Array,
    required: true,
    default: () => []
  },
  objects: {
    type: Array,
    required: true,
    default: () => []
  },
  contractorType: {
    type: String,
    required: true,
    validator: value => ['master', 'worker', 'foreman', 'office'].includes(value)
  },
  pendingTotal: {
    type: Number,
    default: 0
  }
})

const emit = defineEmits(['update:deduction', 'delete:deduction', 'error'])

const { $fetch } = useNuxtApp()

const editingDeduction = ref(null)
const formErrors = ref({})
const errorMessage = ref(null)

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
  
  if (editingDeduction.value.amount === null || isNaN(editingDeduction.value.amount)) {
    formErrors.value.amount = 'Сумма обязательна'
  }
  
  if (!editingDeduction.value.objectId) {
    formErrors.value.object = 'Объект обязателен'
  }
  
  return Object.keys(formErrors.value).length === 0
}

function openEditModal(deduction) {
  editingDeduction.value = { 
    ...deduction,
    paymentDate: deduction.paymentDate 
      ? new Date(deduction.paymentDate).toISOString().split('T')[0] 
      : new Date().toISOString().split('T')[0]
  }
}

function closeModal() {
  editingDeduction.value = null
  formErrors.value = {}
}

async function saveDeduction() {
  if (!validateForm()) return

  try {
    const response = await $fetch(`/api/expenses/${editingDeduction.value.id}`, {
      method: 'PUT',
      body: {
        amount: editingDeduction.value.amount,
        objectId: editingDeduction.value.objectId,
        comment: editingDeduction.value.comment,
        paymentDate: editingDeduction.value.paymentDate
      },
      credentials: 'include'
    })

    // Форматируем ответ под ожидаемый формат
    const formattedDeduction = {
      ...response,
      amount: parseFloat(response.amount),
      paymentDate: response.paymentDate
    }

    emit('update:deduction', formattedDeduction)
    closeModal()
  } catch (error) {
    console.error('Ошибка сохранения оплаты:', error)
    errorMessage.value = 'Не удалось сохранить изменения'
    setTimeout(() => errorMessage.value = null, 5000)
    emit('error', 'Не удалось сохранить оплату')
  }
}

async function deleteDeduction(deduction) {
  if (!confirm('Вы уверены, что хотите удалить эту оплату?')) return

  try {
    await $fetch(`/api/expenses/${deduction.id}`, {
      method: 'DELETE',
      credentials: 'include'
    })

    emit('delete:deduction', deduction.id)
  } catch (error) {
    console.error('Ошибка удаления оплаты:', error)
    alert('Не удалось удалить оплату')
  }
}
</script>

<style scoped>
.work-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 1rem;
}

.work-table thead {
  background: #f8f9fa;
  text-align: left;
}

.work-table th,
.work-table td {
  padding: 0.8rem 1rem;
  border-bottom: 1px solid #eee;
}

.text-danger {
  color: #dc3545;
  font-weight: 500;
}

.btn-icon {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.4rem;
  margin-right: 0.4rem;
}

.btn-delete {
  color: #dc3545;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  max-width: 500px;
  width: 100%;
  position: relative;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 0.6rem 0.8rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.95rem;
}

.form-group input.error,
.form-group select.error {
  border-color: #dc3545;
}

.error-message {
  color: #dc3545;
  font-size: 0.85rem;
  margin-top: 0.25rem;
  display: block;
}

.modal-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 1.5rem;
}

.btn {
  padding: 0.6rem 1.2rem;
  border-radius: 4px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn.primary {
  background: #007bff;
  color: white;
  border: none;
}

.btn.secondary {
  background: #6c757d;
  color: white;
  border: none;
}

.no-data {
  padding: 1.5rem;
  text-align: center;
  color: #6c757d;
  font-style: italic;
}
</style>