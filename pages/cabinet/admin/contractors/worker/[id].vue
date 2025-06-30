<template>
  <div class="container">
    <h1>{{ worker.name }}</h1>

    <div v-if="loading" class="loading">
      <Icon name="eos-icons:bubble-loading" size="34px" />
    </div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <div v-else>
      <!-- Информация о Рабочийе -->
      <div class="block">
        <h3>Данные Рабочийа:</h3>
        <!-- <p><strong>Имя:</strong> {{ worker.name }}</p> -->
        <p><strong>Телефон:</strong> {{ worker.phone }}</p>
        <p><strong>Баланс:</strong> {{ worker.balance }} ₽</p>
        <p><strong>В работе:</strong> {{ pendingTotal }} ₽</p>
        <p><strong>Комментарий:</strong> {{ worker.comment }}</p>
      </div>

      <!-- Кнопки для открытия модальных окон -->
      <div class="add-buttons">
        <button @click="openWorkModal" class="btn primary">Добавить работу</button>
        <button @click="openExpenseModal" class="btn secondary">Добавить оплату</button>
      </div>

      <!-- Модальное окно для добавления работы -->
      <div v-if="isWorkModalOpen" class="modal-overlay">
        <div class="modal">
          <div class="modal-header">
            <h3>Добавить работу</h3>
            <button @click="closeModals" class="close-btn">×</button>
          </div>
          <div class="modal-body">
            <!-- Сумма работы Рабочийу -->
            <div class="form-group">
              <label>Сумма Рабочийу</label>
              <input
                type="number"
                step="100.00"
                v-model.number="newWork.amount"
                placeholder="4500"
                required
                :class="{ error: formErrors.amount }"
              />
              <span v-if="formErrors.amount" class="error-message">{{ formErrors.amount }}</span>
            </div>

            <!-- Сумма сметы (заказчик) -->
            <div class="form-group">
              <label>Сумма сметы (заказчик)</label>
              <input
                type="number"
                step="100.00"
                v-model.number="newWork.clientAmount"
                placeholder="5000"
                required
                :class="{ error: formErrors.clientAmount }"
              />
              <span v-if="formErrors.clientAmount" class="error-message">{{ formErrors.clientAmount }}</span>
            </div>

            <!-- Объект -->
            <div class="form-group">
              <label>Объект</label>
              <select v-model="newWork.objectId" :class="{ error: formErrors.object }">
                <option value="">Выберите объект</option>
                <option v-for="obj in objects" :key="obj.id" :value="obj.id">{{ obj.name }}</option>
              </select>
              <span v-if="formErrors.object" class="error-message">{{ formErrors.object }}</span>
            </div>

            <!-- Вид работы -->
            <div class="form-group">
              <label>Вид работы</label>
              <select v-model="newWork.workType" :class="{ error: formErrors.workType }">
                <option value="">Выберите вид работы</option>
                <option v-for="type in workTypes" :key="type" :value="type">{{ type }}</option>
              </select>
              <span v-if="formErrors.workType" class="error-message">{{ formErrors.workType }}</span>
            </div>

            <!-- Прораб -->
            <div class="form-group">
              <label>Прораб</label>
              <select v-model="newWork.supervisorId">
                <option value="">Без привязки</option>
                <option v-for="foreman in foremans" :key="foreman.id" :value="foreman.id">{{ foreman.name }}</option>
              </select>
            </div>

            <!-- Комментарий -->
            <div class="form-group">
              <label>Комментарий</label>
              <textarea v-model="newWork.comment" placeholder="Комментарий"></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button @click="closeModals" class="btn secondary">Отмена</button>
            <button @click="addWork" :disabled="!isWorkValid" class="btn primary">Добавить работу</button>
          </div>
        </div>
      </div>

      <!-- Модальное окно для добавления оплаты -->
      <div v-if="isExpenseModalOpen" class="modal-overlay">
        <div class="modal">
          <div class="modal-header">
            <h3>Добавить оплату</h3>
            <button @click="closeModals" class="close-btn">×</button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label>Сумма</label>
              <input
                type="number"
                step="100.00"
                v-model.number="newExpense.amount"
                placeholder="Сумма"
                required
                :class="{ error: formErrors.expenseAmount }"
              />
              <span v-if="formErrors.expenseAmount" class="error-message">{{ formErrors.expenseAmount }}</span>
            </div>
            <div class="form-group">
              <label>Объект (необязательно)</label>
              <select v-model="newExpense.objectId">
                <option value="">Без привязки</option>
                <option v-for="obj in objects" :key="obj.id" :value="obj.id">
                  {{ obj.name }}
                </option>
              </select>
            </div>
            <div class="form-group">
              <label>Комментарий</label>
              <textarea v-model="newExpense.comment" placeholder="Комментарий"></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button @click="closeModals" class="btn secondary">Отмена</button>
            <button @click="addExpense" :disabled="!isExpenseValid" class="btn primary">Добавить оплату</button>
          </div>
        </div>
      </div>

      <!-- Таблица работ -->
      <div class="block">
        <h3>Работы</h3>
        <div class="table-wrapper">
          <table class="work-table">
            <thead>
              <tr>
                <th>Дата</th>
                <th>Смета</th>
                <th>Оплата работы</th>
                <th>Вид работ</th>
                <th>Комментарий</th>
                <th>Статус</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="work in works" :key="work.id">
                <td>{{ formatDate(work.createdAt) }}</td>
                <td>{{ work.clientAmount }} ₽</td>
                <td>{{ work.amount }} ₽</td>
                <td>{{ work.workType }}</td>
                <td>{{ work.comment }}</td>
                <td :class="{ 'status-paid': work.paid }">{{ work.paid ? 'Готово' : 'В работе' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Расходы -->
      <div class="block">
        <h3>Расходы</h3>
        <ul v-if="expenses.length > 0">
          <li v-for="expense in expenses" :key="expense.id">
            <b>{{ formatDate(expense.paymentDate) }}</b>
            {{ expense.amount }} ₽ — {{ expense.comment }}
            <span v-if="expense.objectId">({{ getObjectName(expense.objectId) }})</span>
          </li>
        </ul>
        <p v-else>Нет расходов.</p>
      </div>

      <!-- Договоренности -->
      <div class="block">
        <h2>Договоренности</h2>
        <div class="form">
          <textarea v-model="newAgreement.text" placeholder="Текст договоренности" :class="{ error: formAgreementErrors.text }" />
          <select v-model="newAgreement.status">
            <option value="active">Активная</option>
            <option value="completed">Завершенная</option>
          </select>
          <button @click="addAgreement">Добавить договоренность</button>
        </div>
        <h4>Активные:</h4>
        <ul>
          <li v-for="a in activeAgreements" :key="a.id">
            {{ a.text }}
            <button @click="completeAgreement(a.id)">Завершить</button>
          </li>
        </ul>
        <h4>Завершённые:</h4>
        <ul>
          <li v-for="a in completedAgreements" :key="a.id">
            {{ a.text }} (Завершено)
          </li>
        </ul>
      </div>

      <!-- Редактирование Рабочийа -->
      <div class="block" v-if="editing">
        <h3>Редактировать данные</h3>
        <input v-model="worker.name" placeholder="Имя" required />
        <input v-model="worker.phone" placeholder="Телефон" />
        <textarea v-model="worker.comment" placeholder="Комментарий"></textarea>
        <button @click="saveworker">Сохранить</button>
        <button @click="cancelEdit">Отмена</button>
      </div>
      <div v-else>
        <button @click="toggleEdit">Редактировать</button>
      </div>

      <!-- Уведомления -->
      <div v-if="successMessage" class="notification success">
        {{ successMessage }}
      </div>
      <div v-if="errorMessage" class="notification error">
        {{ errorMessage }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useNuxtApp } from '#app'

definePageMeta({ layout: 'cabinet' })

const route = useRoute()
const router = useRouter()

// Состояние
const worker = ref({})
const objects = ref([])
const works = ref([])
const expenses = ref([])
const agreements = ref([])
const loading = ref(true)
const error = ref(null)
const editing = ref(false)
const foremans = ref([])
const workTypes = [
  'Отделка', 'Электрика', 'Плитка', 'Сантехника', 'Перегородки ГКЛ',
  'Сварка', 'Бетонные работы', 'Кровля', 'Перегородки Камень',
  'Демонтаж', 'Мусор', 'Прочее'
]

// Формы
const newWork = ref({
  amount: null, // workerAmount
  clientAmount: null, // customerAmount
  objectId: null,
  workType: '',
  supervisorId: null,
  comment: ''
})
const newExpense = ref({ amount: null, objectId: null, comment: '' })
const newAgreement = ref({ text: '', status: 'active' })

// Модальные окна
const isWorkModalOpen = ref(false)
const isExpenseModalOpen = ref(false)

// Уведомления
const successMessage = ref('')
const errorMessage = ref('')
const formErrors = ref({})
const formAgreementErrors = ref({})

// Вычисляемые свойства
const isWorkValid = computed(() => {
  return (
    Number(newWork.value.amount) > 0 &&
    Number(newWork.value.clientAmount) > 0 &&
    newWork.value.objectId &&
    newWork.value.workType
  )
})

const isExpenseValid = computed(() => {
  return Number(newExpense.value.amount) > 0
})

const activeAgreements = computed(() => 
  agreements.value.filter(a => a.status === 'active')
)

const completedAgreements = computed(() => 
  agreements.value.filter(a => a.status === 'completed')
)

const pendingWorks = computed(() => works.value.filter(w => !w.paid))
const paidWorks = computed(() => works.value.filter(w => w.paid))
const pendingTotal = computed(() => pendingWorks.value.reduce((sum, w) => sum + w.amount, 0))

function formatDate(dateString) {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

function getObjectName(objectId) {
  const obj = objects.value.find(o => o.id === objectId)
  return obj ? obj.name : 'Объект не найден'
}

// Загрузка данных
async function fetchworker() {
  try {
    const data = await $fetch(`/api/contractors/workers/${route.params.id}`, {
      method: 'GET',
      credentials: 'include'
    })
    worker.value = data
  } catch (err) {
    error.value = 'Не удалось загрузить данные Рабочийа'
  }
}

async function fetchObjects() {
  try {
    objects.value = await $fetch('/api/objects', { method: 'GET', credentials: 'include' })
  } catch (err) {
    console.error('Ошибка загрузки объектов:', err)
  }
}

async function fetchWorks() {
  try {
    const data = await $fetch(`/api/works`, {
      method: 'GET',
      params: { contractorType: 'worker', contractorId: route.params.id },
      credentials: 'include'
    })

    works.value = data.map(work => ({
      id: work.id,
      amount: parseFloat(work.workerAmount),
      clientAmount: parseFloat(work.customerAmount),
      comment: work.comment || '',
      contractorId: work.contractorId,
      contractorType: work.contractorType,
      workType: work.workTypes,
      objectId: work.objectId,
      paid: work.accepted,
      paymentDate: work.accepted ? work.acceptedDate : work.paymentDate,
      createdAt: work.createdAt
    }))
  } catch (err) {
    console.error('Ошибка загрузки работ:', err)
  }
}

async function fetchExpenses() {
  try {
    expenses.value = await $fetch(`/api/expenses`, {
      method: 'GET',
      params: { contractorType: 'worker', contractorId: route.params.id },
      credentials: 'include'
    })
  } catch (err) {
    console.error('Ошибка загрузки расходов:', err)
  }
}

async function fetchAgreements() {
  try {
    agreements.value = await $fetch(`/api/agreements`, {
      method: 'GET',
      params: { workerId: route.params.id },
      credentials: 'include'
    })
  } catch (err) {
    console.error('Ошибка загрузки договоренностей:', err)
  }
}

onMounted(async () => {
  try {
    await Promise.all([
      fetchworker(),
      fetchObjects(),
      fetchWorks(),
      fetchExpenses(),
      fetchAgreements(),
      fetchForemans()
    ])
    loading.value = false
  } catch (err) {
    error.value = err.message
    loading.value = false
  }
})

// Методы
function openWorkModal() {
  resetFormErrors()
  isWorkModalOpen.value = true
}

function openExpenseModal() {
  resetFormErrors()
  isExpenseModalOpen.value = true
}

function closeModals() {
  isWorkModalOpen.value = false
  isExpenseModalOpen.value = false
  resetForm()
  resetFormErrors()
}

function resetForm() {
  newWork.value = { amount: null, objectId: null, comment: '' }
  newExpense.value = { amount: null, objectId: null, comment: '' }
}

function resetFormErrors() {
  formErrors.value = {}
}

async function fetchForemans() {
  try {
    foremans.value = await $fetch('/api/contractors/foremans', {
      method: 'GET',
      credentials: 'include'
    })
  } catch (err) {
    console.error('Ошибка загрузки прорабов:', err)
  }
}

async function addWork() {
  formErrors.value = {}

  if (!isWorkValid.value) {
    if (!newWork.value.amount) formErrors.value.amount = 'Сумма Рабочийу обязательна'
    if (!newWork.value.clientAmount) formErrors.value.clientAmount = 'Сумма сметы обязательна'
    if (!newWork.value.objectId) formErrors.value.object = 'Объект обязателен'
    if (!newWork.value.workType) formErrors.value.workType = 'Вид работы обязателен'
    return
  }

  try {
    const payload = {
      workerAmount: Number(newWork.value.amount),
      customerAmount: Number(newWork.value.clientAmount),
      contractorId: parseInt(route.params.id),
      contractorType: 'worker',
      workTypes: newWork.value.workType,
      foremanId: newWork.value.supervisorId || null,
      comment: newWork.value.comment || '',
      paid: false,
      paymentDate: null,
      operationDate: new Date().toISOString(),
      objectId: newWork.value.objectId
    }

    const result = await $fetch('/api/works', {
      method: 'POST',
      body: payload,
      credentials: 'include'
    })

    works.value.unshift(result)
    closeModals()
    successMessage.value = 'Работа успешно добавлена'
    setTimeout(() => successMessage.value = '', 3000)
  } catch (err) {
    console.error('Ошибка добавления работы:', err)
    errorMessage.value = 'Не удалось добавить работу'
    setTimeout(() => errorMessage.value = '', 5000)
  }
}

async function addExpense() {
  formErrors.value = {}

  if (!isExpenseValid.value) {
    formErrors.value.expenseAmount = 'Сумма обязательна'
    return
  }

  try {
    const payload = {
      ...newExpense.value,
      contractorType: 'worker',
      contractorId: parseInt(route.params.id),
      paymentDate: new Date().toISOString(),
      operationDate: new Date().toISOString()
    }

    const result = await $fetch('/api/expenses', {
      method: 'POST',
      body: payload,
      credentials: 'include'
    })

    expenses.value.unshift(result)
    closeModals()
    successMessage.value = 'Оплата успешно добавлена'
    setTimeout(() => successMessage.value = '', 3000)
  } catch (err) {
    console.error('Ошибка добавления оплаты:', err)
    errorMessage.value = 'Не удалось добавить оплату'
    setTimeout(() => errorMessage.value = '', 5000)
  }
}

function toggleEdit() {
  editing.value = true
}

async function saveworker() {
  try {
    await $fetch(`/api/contractors/workers/${route.params.id}`, {
      method: 'PUT',
      body: worker.value,
      credentials: 'include'
    })
    editing.value = false
    successMessage.value = 'Данные Рабочийа обновлены'
    setTimeout(() => successMessage.value = '', 3000)
  } catch (err) {
    console.error('Ошибка сохранения Рабочийа:', err)
    errorMessage.value = 'Не удалось сохранить данные'
    setTimeout(() => errorMessage.value = '', 5000)
  }
}

async function addAgreement() {
  formAgreementErrors.value = {}
  
  if (!newAgreement.value.text.trim()) {
    formAgreementErrors.value.text = 'Текст договоренности обязателен'
    return
  }

  try {
    const payload = {
      text: newAgreement.value.text,
      status: newAgreement.value.status,
      workerId: parseInt(route.params.id)
    }

    const result = await $fetch('/api/agreements', {
      method: 'POST',
      body: payload,
      credentials: 'include'
    })

    agreements.value.unshift(result)
    newAgreement.value = { text: '', status: 'active' }
    successMessage.value = 'Договорённость добавлена'
    setTimeout(() => successMessage.value = '', 3000)
  } catch (error) {
    console.error('Ошибка добавления договорённости:', error)
    errorMessage.value = 'Не удалось добавить договорённость'
    setTimeout(() => errorMessage.value = '', 5000)
  }
}

async function completeAgreement(id) {
  try {
    const result = await $fetch(`/api/agreements/${id}`, {
      method: 'PATCH',
      body: { status: 'completed' },
      credentials: 'include'
    })

    const index = agreements.value.findIndex(a => a.id === id)
    if (index !== -1) {
      agreements.value[index] = result
    }
    
    successMessage.value = 'Договорённость завершена'
    setTimeout(() => successMessage.value = '', 3000)
  } catch (error) {
    console.error('Ошибка завершения договорённости:', error)
    errorMessage.value = 'Не удалось завершить договорённость'
    setTimeout(() => errorMessage.value = '', 5000)
  }
}

function cancelEdit() {
  editing.value = false
  fetchworker()
}
</script>

<style lang="scss" scoped>
$primary-color: #4a90e2;
$secondary-color: #f5f7fa;
$error-color: #ff4d4d;
$success-color: #4caf50;
$border-radius: 8px;
$spacing: 1rem;
$box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);

.container {
  max-width: 1200px;
  margin: 2rem auto;
  padding: $spacing * 1.5;
  background: #fff;
  border-radius: $border-radius;
  box-shadow: $box-shadow;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

h1 {
  text-align: center;
}

h1, h2, h3, h4 {
  color: #333;
  margin-top: $spacing * 1.5;
}

.block {
  background: $secondary-color;
  padding: $spacing;
  border-radius: $border-radius;
  margin-bottom: $spacing * 1.5;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.03);
  
  h3 {
    margin-top: 0;
    margin-bottom: $spacing;
    color: $primary-color;
  }
  
  p {
    margin: 0.4rem 0;
    color: #555;
  }
}

// Таблицы
.work-table {
  width: 100%;
  border-collapse: collapse;
  
  thead {
    background: #f8f9fa;
    text-align: left;
  }
  
  th, td {
    padding: 0.8rem 1rem;
    border-bottom: 1px solid #eee;
  }
  
  td.status-paid {
    color: $success-color;
    font-weight: 500;
  }
}

// Формы
.form {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: $spacing;
  margin-bottom: $spacing * 1.5;
}

.form-group {
  display: flex;
  flex-direction: column;
  
  label {
    margin-bottom: 0.4rem;
    font-weight: 500;
    color: #333;
  }
  
  input, select, textarea {
    padding: 0.6rem 1rem;
    border: 1px solid #ddd;
    border-radius: $border-radius;
    font-size: 1rem;
    transition: border-color 0.3s ease;
    
    &:focus {
      border-color: $primary-color;
      outline: none;
    }
    
    &.error {
      border-color: $error-color;
      background-color: #fff0f0;
    }
  }
  
  textarea {
    resize: vertical;
    min-height: 80px;
  }
}

.error-message {
  color: $error-color;
  font-size: 0.85em;
  margin-top: 0.25rem;
  display: block;
}

// Кнопки
.btn {
  background-color: $primary-color;
  color: white;
  border: none;
  padding: 0.6rem 1.2rem;
  font-size: 1rem;
  border-radius: $border-radius;
  cursor: pointer;
  transition: background 0.3s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  
  &:hover {
    background-color: $primary-color;
  }
  
  &.secondary {
    background-color: $secondary-color;
    color: #333;
    
    &:hover {
      background-color: #888;
    }
  }
  
  &[disabled] {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

// Модальные окна
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
  border-radius: $border-radius;
  max-width: 600px;
  width: 90%;
  padding: $spacing;
  position: relative;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: $spacing;
  
  h3 {
    margin: 0;
    font-size: 1.5rem;
  }
  
  .close-btn {
    font-size: 1.5rem;
    background: none;
    border: none;
    cursor: pointer;
    color: #999;
    
    &:hover {
      color: #333;
    }
  }
}

.modal-body {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: $spacing;
  margin-bottom: $spacing;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: $spacing;
}

// Уведомления
.notification {
  padding: 0.8rem 1rem;
  border-radius: $border-radius;
  margin-top: $spacing;
  font-weight: 500;
  
  &.success {
    background-color: #e8f5e9;
    color: $success-color;
  }
  
  &.error {
    background-color: #ffebee;
    color: $error-color;
  }
}

// Статус
.status-paid {
  color: $success-color;
  font-weight: 500;
}

// Объекты
.object-name {
  color: #888;
  font-size: 0.9em;
  margin-left: 0.5rem;
}

// Адаптивность
@media (max-width: 768px) {
  .form {
    grid-template-columns: 1fr;
  }
  
  .modal-body {
    grid-template-columns: 1fr;
  }
  
  .container {
    margin: 1rem;
    padding: $spacing;
  }
  
  input, select, textarea {
    font-size: 0.95rem;
  }
}
</style>