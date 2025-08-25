<template>
  <div v-if="isOpen" class="modal-overlay">
    <div class="modal">
      <div class="modal-header">
        <h3>Добавить приход</h3>
        <button @click="close" class="close-btn">×</button>
      </div>
      
      <div class="modal-body">
        <form @submit.prevent="submitIncome">
          <!-- Сумма -->
          <div class="form-group">
            <label>Сумма <span class="required">*</span></label>
            <input 
              type="number" 
              v-model.number="form.amount"
              placeholder="Введите сумму"
              required
            />
            <span v-if="errors.amount" class="error-message">{{ errors.amount }}</span>
          </div>

          <div class="form-group">
            <label>Дата операции <span class="required">*</span></label>
            <input 
              type="date" 
              v-model="form.operationDate"
            />
            <span v-if="errors.operationDate" class="error-message">{{ errors.operationDate }}</span>
          </div>

          <!-- Объект -->
          <div class="form-group">
            <label>Объект <span class="required">*</span></label>
            <select v-model="form.objectId" required>
              <option value="">Выберите объект</option>
              <option v-for="object in objects" :key="object.id" :value="object.id">
                {{ object.name }}
              </option>
            </select>
            <span v-if="errors.objectId" class="error-message">{{ errors.objectId }}</span>
          </div>

          <!-- Комментарий -->
          <div class="form-group">
            <label>Комментарий</label>
            <textarea v-model="form.comment" placeholder="Дополнительная информация"></textarea>
          </div>

          <!-- Ошибки формы -->
          <div v-if="errors.form" class="error-message form-error">
            {{ errors.form }}
          </div>

          <!-- Кнопки управления -->
          <div class="modal-footer">
            <button type="button" @click="close" class="btn secondary">Отмена</button>
            <button type="submit" class="btn primary" :disabled="loading">
              {{ loading ? 'Сохранение...' : 'Добавить приход' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useNuxtApp } from '#app'

const props = defineProps({
  isOpen: {
    type: Boolean,
    required: true
  }
})

const emit = defineEmits(['close', 'income-added'])

// Состояние формы
const form = ref({
  amount: null,
  objectId: '',
  comment: '',
  operationDate: new Date().toISOString().split('T')[0]
})

const loading = ref(false)
const errors = ref({})
const objects = ref([])
const errorMessage = ref('')
const successMessage = ref('')

// Загрузка данных
async function loadData() {
  try {
    // Загрузка объектов
    objects.value = await $fetch('/api/objects')
  } catch (error) {
    console.error('Ошибка загрузки данных:', error)
  }
}

// Валидация формы
function validateForm() {
  errors.value = {}
  let isValid = true

  if (!form.value.amount || form.value.amount <= 0) {
    errors.value.amount = 'Сумма обязательна и должна быть больше нуля'
    isValid = false
  }

  if (!form.value.objectId) {
    errors.value.objectId = 'Объект обязателен'
    isValid = false
  }

  if (!form.value.operationDate) {
    errors.value.operationDate = 'Дата операции обязательна'
    isValid = false
  } else {
    const date = new Date(form.value.operationDate)
    if (isNaN(date.getTime())) {
      errors.value.operationDate = 'Некорректный формат даты'
      isValid = false
    }
  }

  return isValid
}

// Отправка формы
async function submitIncome() {
  if (!validateForm()) return

  loading.value = true
  try {
    const payload = {
      ...form.value,
      operationDate: form.value.operationDate || new Date().toISOString()
    }

    const result = await $fetch('/api/comings', {
      method: 'POST',
      body: payload,
      credentials: 'include'
    })

    emit('income-added', result)
    emit('close') // Закрываем модальное окно
    
    // Установка сообщения в родителе
    successMessage.value = 'Приход успешно добавлен'
    setTimeout(() => successMessage.value = '', 3000)

  } catch (error) {
    errorMessage.value = 'Ошибка при добавлении прихода'
    setTimeout(() => errorMessage.value = '', 5000)
  } finally {
    loading.value = false
  }
}

// Сброс формы
function resetForm() {
  form.value = {
    amount: null,
    objectId: '',
    comment: ''
  }
  errors.value = {}
}

// Закрытие модального окна
function close() {
  resetForm()
  emit('close')
}

// Автоматическая загрузка данных при открытии
watch(() => props.isOpen, async (newVal) => {
  if (newVal) {
    await loadData()
  }
})
</script>

<style scoped>
/* Стили аналогичны компоненту AddExpenseModal.vue */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal {
  background: white;
  padding: 20px;
  border-radius: 8px;
  width: 600px;
  max-width: 90%;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.close-btn {
  font-size: 24px;
  background: none;
  border: none;
  cursor: pointer;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.required {
  color: red;
}

.error-message {
  color: red;
  font-size: 14px;
  margin-top: 4px;
  display: block;
}

.form-error {
  margin-bottom: 15px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.btn.primary {
  background-color: #28a745;
  color: white;
}

.btn.secondary {
  background-color: #6c757d;
  color: white;
}
</style>