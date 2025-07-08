<template>
  <div class="contractor-header block">
    <h3>Данные контрагента</h3>
    
    <div v-if="editing" class="edit-mode">
      <div class="form-group">
        <label>Имя <span class="required">*</span></label>
        <input 
          v-model="editedContractor.name"
          :class="{ error: formErrors.name }"
        />
        <div v-if="formErrors.name" class="error-message">{{ formErrors.name }}</div>
      </div>

      <div class="form-group">
        <label>Телефон <span class="required">*</span></label>
        <input 
          v-model="editedContractor.phone"
          :class="{ error: formErrors.phone }"
        />
        <div v-if="formErrors.phone" class="error-message">{{ formErrors.phone }}</div>
      </div>

      <div class="form-group">
        <label>Зарплата</label>
        <input 
          v-model.number="editedContractor.salaryAmount"
          type="number"
          step="0.01"
        />
      </div>

      <div class="form-group">
        <label>На зарплате</label>
        <select v-model="editedContractor.isOnSalary">
          <option :value="true">Да</option>
          <option :value="false">Нет</option>
        </select>
      </div>

      <div class="form-group">
        <label>День выплаты</label>
        <select v-model.number="editedContractor.salaryDay">
          <option v-for="day in 31" :key="day" :value="day">{{ day }}</option>
        </select>
      </div>

      <div class="form-group">
        <label>Комментарий</label>
        <textarea v-model="editedContractor.comment"></textarea>
      </div>

      <div class="actions">
        <button @click="saveChanges" class="btn primary">Сохранить</button>
        <button @click="toggleEdit" class="btn secondary">Отмена</button>
      </div>
    </div>
    
    <div v-else class="view-mode">
      <p><strong>Имя:</strong> {{ contractor.name }}</p>
      <p><strong>Телефон:</strong> {{ contractor.phone }}</p>
      <p><strong>Баланс:</strong> {{ contractor.balance }} ₽</p>
      <p><strong>Ожидает оплаты:</strong> {{ pendingTotal }} ₽</p>
      <p><strong>На зарплате:</strong> {{ contractor.isOnSalary ? 'Да' : 'Нет' }}</p>
      <p><strong>Зарплата:</strong> {{ contractor.salaryAmount }} ₽</p>
      <p><strong>День выплаты:</strong> {{ contractor.salaryDay }}</p>
      <p><strong>Комментарий:</strong> {{ contractor.comment }}</p>
      
      <button @click="toggleEdit" class="btn secondary">Редактировать</button>
    </div>

    <!-- Уведомления -->
    <div v-if="successMessage" class="notification success">{{ successMessage }}</div>
    <div v-if="errorMessage" class="notification error">{{ errorMessage }}</div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useNuxtApp } from '#app'
import { useRoute } from 'vue-router'

const props = defineProps({
  contractor: {
    type: Object,
    required: true
  },
  contractorType: {
    type: String,
    required: true,
    validator: value => ['master', 'worker', 'foreman', 'office'].includes(value)
  },
    pendingTotal: {
    type: Number,
    required: true
  }
})

const emit = defineEmits(['update:contractor', 'error', 'success'])

const { $fetch } = useNuxtApp()
const route = useRoute()

// Локальное состояние
const editing = ref(false)
const editedContractor = ref({})
const formErrors = ref({})
const errorMessage = ref(null)
const successMessage = ref(null)

// При изменении контрагента обновляем локальные данные
watch(() => props.contractor, () => {
  resetForm()
}, { deep: true })

function resetForm() {
  // Глубокое копирование объекта
  editedContractor.value = JSON.parse(JSON.stringify(props.contractor))
  formErrors.value = {}
  errorMessage.value = null
  successMessage.value = null
}

function validateForm() {
  formErrors.value = {}
  
  if (!editedContractor.value.name?.trim()) {
    formErrors.value.name = 'Имя обязательно'
  }
  
  if (!editedContractor.value.phone?.trim()) {
    formErrors.value.phone = 'Телефон обязателен'
  }
  
  return Object.keys(formErrors.value).length === 0
}

async function saveChanges() {
  if (!validateForm()) return

  try {
    const endpoint = `/api/contractors/${props.contractorType}s/${props.contractor.id}`
    
    const response = await $fetch(endpoint, {
      method: 'PUT',
      body: editedContractor.value,
      credentials: 'include'
    })

    // Форматируем ответ под ожидаемый формат
    const formattedContractor = {
      ...response,
      balance: parseFloat(response.balance),
      salaryAmount: parseFloat(response.salaryAmount)
    }

    emit('update:contractor', formattedContractor)
    editing.value = false
    successMessage.value = 'Данные успешно обновлены'
    setTimeout(() => successMessage.value = null, 3000)
  } catch (error) {
    console.error('Ошибка сохранения данных:', error)
    errorMessage.value = 'Не удалось сохранить изменения'
    setTimeout(() => errorMessage.value = null, 5000)
    emit('error', 'Не удалось сохранить данные')
  }
}

// Инициализация формы при монтировании
resetForm()
</script>

<style scoped>
.contractor-header {
  margin-bottom: 2rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
}

input, select, textarea {
  width: 100%;
  padding: 0.6rem 0.8rem;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 0.95rem;
  transition: border-color 0.2s ease;
}

input.error, select.error {
  border-color: #dc3545;
}

textarea {
  resize: vertical;
  min-height: 80px;
}

.error-message {
  color: #dc3545;
  font-size: 0.85rem;
  margin-top: 0.25rem;
  display: block;
}

.actions {
  display: flex;
  gap: 1rem;
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

.notification {
  margin-top: 1rem;
  padding: 0.8rem 1rem;
  border-radius: 4px;
  font-size: 0.95rem;
}

.notification.success {
  background: #d4edda;
  color: #155724;
  border-left: 4px solid #c3e6cb;
}

.notification.error {
  background: #f8d7da;
  color: #721c24;
  border-left: 4px solid #f5c6cb;
}
</style>