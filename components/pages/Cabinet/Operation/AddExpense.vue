<template>
  <div v-if="isOpen" class="modal-overlay">
    <div class="modal">
      <div class="modal-header">
        <h3>Добавить расход</h3>
        <button @click="close" class="close-btn">×</button>
      </div>
      
      <div class="modal-body">
        <!-- Тип расхода -->
        <div class="form-group expense-types">
          <label>Тип расхода:</label>
          <div class="type-buttons">
            <button 
              v-for="type in expenseTypes" 
              :key="type" 
              :class="['type-btn', { active: selectedType === type }]"
              @click="selectType(type)"
            >
              {{ type }}
            </button>
          </div>
        </div>

        <!-- Форма в зависимости от типа -->
        <form @submit.prevent="submitExpense">
          <!-- Общее поле: сумма -->
          <div class="form-group">
            <label>Сумма <span class="required">*</span></label>
            <input 
              type="number" 
              v-model.number="form.amount"
              required
              placeholder="Введите сумму"
            />
            <span v-if="errors.amount" class="error-message">{{ errors.amount }}</span>
          </div>

          <!-- Дата операции -->
          <div class="form-group">
            <label>Дата операции <span class="required">*</span></label>
            <input 
              type="date" 
              v-model="form.operationDate"
            />
            <span v-if="errors.operationDate" class="error-message">{{ errors.operationDate }}</span>
          </div>

          <!-- Поля для типа "Работа" -->
          <div v-if="selectedType === 'Работа'" class="nested-form">
            <div class="form-group">
              <label>Категория контрагента <span class="required">*</span></label>
              <select v-model="form.contractorType" required>
                <option value="">Выберите категорию</option>
                <option value="worker">Разнорабочий</option>
                <option value="master">Мастер</option>
                <option value="foreman">Прораб</option>
                <option value="office">Офис</option>
              </select>
              <span v-if="errors.contractorType" class="error-message">{{ errors.contractorType }}</span>
            </div>

            <div class="form-group">
              <label>Контрагент <span class="required">*</span></label>
              <select v-model="form.contractorId" required>
                <option value="">Выберите контрагента</option>
                <option 
                  v-for="contractor in contractorsByType" 
                  :key="contractor.id" 
                  :value="contractor.id"
                >
                  {{ contractor.name }}
                </option>
              </select>
              <span v-if="errors.contractorId" class="error-message">{{ errors.contractorId }}</span>
            </div>

            <div class="form-group">
              <label>Объект</label>
              <select v-model="form.objectId">
                <option value="">Без объекта</option>
                <option v-for="object in objects" :key="object.id" :value="object.id">
                  {{ object.name }}
                </option>
              </select>
            </div>
          </div>

          <!-- Поля для типа "Налог" -->
          <div v-if="selectedType === 'Налог'" class="nested-form">
            <div class="form-group">
              <label>Объект</label>
              <select v-model="form.objectId">
                <option value="">Без объекта</option>
                <option v-for="object in objects" :key="object.id" :value="object.id">
                  {{ object.name }}
                </option>
              </select>
            </div>
          </div>

          <!-- Поля для типов "Зарплата", "Топливо" -->
          <div v-if="['Зарплата', 'Топливо'].includes(selectedType)" class="nested-form">
            <div class="form-group">
              <label>Категория контрагента <span class="required">*</span></label>
              <select v-model="form.contractorType" required>
                <option value="">Выберите категорию</option>
                <option value="worker">Разнорабочий</option>
                <option value="master">Мастер</option>
                <option value="foreman">Прораб</option>
                <option value="office">Офис</option>
              </select>
              <span v-if="errors.contractorType" class="error-message">{{ errors.contractorType }}</span>
            </div>

            <div class="form-group">
              <label>Контрагент <span class="required">*</span></label>
              <select v-model="form.contractorId" required>
                <option value="">Выберите контрагента</option>
                <option 
                  v-for="contractor in contractorsByType" 
                  :key="contractor.id" 
                  :value="contractor.id"
                >
                  {{ contractor.name }}
                </option>
              </select>
              <span v-if="errors.contractorId" class="error-message">{{ errors.contractorId }}</span>
            </div>
          </div>

          <!-- Комментарий (для всех типов) -->
          <div class="form-group">
            <label>Комментарий</label>
            <textarea v-model="form.comment" placeholder="Дополнительная информация"></textarea>
          </div>

          <!-- Кнопки управления -->
          <div class="modal-footer">
            <button type="button" @click="close" class="btn secondary">Отмена</button>
            <button type="submit" class="btn primary" :disabled="loading">
              {{ loading ? 'Сохранение...' : 'Добавить расход' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useNuxtApp } from '#app'

const props = defineProps({
  isOpen: {
    type: Boolean,
    required: true
  }
})

const emit = defineEmits(['close', 'expense-added'])

// Состояние формы
const form = ref({
  amount: null,
  contractorType: '',
  contractorId: '',
  objectId: '',
  comment: '',
  expenseType: '',
  operationDate: new Date().toISOString().split('T')[0]
})

const selectedType = ref('')
const loading = ref(false)
const errors = ref({})
const errorMessage = ref('')
const successMessage = ref('')
const contractors = ref([])
const objects = ref([])
const contractorsByType = computed(() => {
  return contractors.value.filter(c => c.type === form.value.contractorType)
})

// Все типы расходов
const expenseTypes = [
  'Работа', 'Налог', 'Зарплата', 'Реклама', 
  'Кредит', 'Топливо', 'ГлавПрофи'
]

// Загрузка данных
async function loadData() {
  try {
    // Загрузка контрагентов всех типов
    const [workers, masters, foremans, offices] = await Promise.all([
      $fetch('/api/contractors/workers'),
      $fetch('/api/contractors/masters'),
      $fetch('/api/contractors/foremans'),
      $fetch('/api/contractors/offices')
    ])
    
    // Добавляем тип контрагента для фильтрации
    contractors.value = [
      ...workers.map(w => ({ ...w, type: 'worker' })),
      ...masters.map(m => ({ ...m, type: 'master' })),
      ...foremans.map(f => ({ ...f, type: 'foreman' })),
      ...offices.map(o => ({ ...o, type: 'office' }))
    ]
    
    // Загрузка объектов
    objects.value = await $fetch('/api/objects')
  } catch (error) {
    console.error('Ошибка загрузки данных:', error)
    console.error('Critical error loading data:', error);
    errorMessage.value = 'Не удалось загрузить данные для формы. Попробуйте позже.';
  }
}

// Выбор типа расхода
function selectType(type) {
  selectedType.value = type
  form.value.expenseType = type
  
  // Сброс полей при смене типа
  form.value.contractorType = ''
  form.value.contractorId = ''
  form.value.objectId = ''
  form.value.comment = ''
}

// Валидация формы
function validateForm() {
  errors.value = {}
  let isValid = true

  if (!form.value.amount || form.value.amount <= 0) {
    errors.value.amount = 'Сумма обязательна и должна быть больше нуля'
    isValid = false
  }

  // Проверка контрагентов для определенных типов
  const contractorRequiredTypes = ['Работа', 'Зарплата', 'Топливо']
  if (contractorRequiredTypes.includes(selectedType.value)) {
    if (!form.value.contractorType) {
      errors.value.contractorType = 'Категория контрагента обязательна'
      isValid = false
    }
    if (!form.value.contractorId) {
      errors.value.contractorId = 'Контрагент обязателен'
      isValid = false
    }
  }

  // Проверка даты операции
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
async function submitExpense() {
  if (!validateForm()) return

  loading.value = true
  try {
    const payload = {
      ...form.value,
      operationDate: form.value.operationDate || new Date().toISOString()
    }

    // Для типов "Топливо" и "ГлавПрофи" не обновляем баланс контрагента
    if (['Топливо', 'ГлавПрофи'].includes(selectedType.value)) {
      payload.contractorType = null
      payload.contractorId = null
    }

    const result = await $fetch('/api/expenses', {
      method: 'POST',
      body: payload,
      credentials: 'include'
    })

    emit('expense-added', result) // Эмит события в родителя
    emit('close') // Закрываем модальное окно
    
    // Установка сообщения в родителе
    successMessage.value = 'Расход успешно добавлен'
    setTimeout(() => successMessage.value = '', 3000)

  } catch (error) {
    errorMessage.value = 'Ошибка при добавлении расхода'
    setTimeout(() => errorMessage.value = '', 5000)
  } finally {
    loading.value = false
  }
}

// Сброс формы
function resetForm() {
  form.value = {
    amount: null,
    contractorType: '',
    contractorId: '',
    objectId: '',
    comment: '',
    expenseType: '',
    operationDate: ''
  }
  selectedType.value = ''
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
    await loadData();
    if (!props.isOpen) return; // Прервать, если окно закрыто
  }
});
</script>

<style scoped>
/* Добавьте стили по вашему дизайну */
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

.type-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 10px;
}

.type-btn {
  padding: 8px 16px;
  border: 1px solid #ccc;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.type-btn.active {
  background-color: #007bff;
  color: white;
  border-color: #007bff;
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
  background-color: #007bff;
  color: white;
}

.btn.secondary {
  background-color: #6c757d;
  color: white;
}
</style>