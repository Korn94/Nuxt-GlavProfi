<template>
  <div class="block">
    <h2>Операции объекта</h2>
    <!-- Баланс объекта -->
    <div class="balance-summary">
      <div class="balance-card">
        <div class="card-header">
          <span>Баланс объекта</span>
          <i class="fas fa-coins"></i>
        </div>
        <div class="card-body">
          <p>{{ objectBalance }} ₽</p>
        </div>
      </div>
      <div class="balance-card">
        <div class="card-header">
          <span>Остаток от заказчика</span>
          <i class="fas fa-clock"></i>
        </div>
        <div class="card-body">
          <p>{{ remainingFromClient }} ₽</p>
        </div>
      </div>
      <div class="balance-card">
        <div class="card-header">
          <span>Общая сумма по смете</span>
          <i class="fas fa-list-alt"></i>
        </div>
        <div class="card-body">
          <p>{{ expectedTotal }} ₽</p>
        </div>
      </div>
      <div class="balance-card">
        <div class="card-header">
          <span>Сумма работ в работе</span>
          <i class="fas fa-clock"></i>
        </div>
        <div class="card-body">
          <p>{{ pendingWorksTotal }} ₽</p>
        </div>
      </div>
    </div>
    <!-- Кнопки добавления -->
    <div class="add-buttons">
      <button @click="openComingModal" class="btn primary">Добавить приход</button>
      <button @click="openWorkModal" class="btn primary">Добавить работу</button>
    </div>
    <!-- Таблица приходов -->
    <div class="table-section">
      <h3>Приходы <i class="fas fa-arrow-down"></i></h3>
      <div class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Дата</th>
              <th>Сумма</th>
              <th>Комментарий</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="coming in comings" :key="coming.id" :class="{ 'odd-row': comings.indexOf(coming) % 2 === 0 }">
              <td>{{ formatDate(coming.createdAt) }}</td>
              <td>{{ coming.amount }} ₽</td>
              <td>{{ coming.comment }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    <!-- Таблица работ -->
    <div class="table-section">
      <h3>Работы <i class="fas fa-tools"></i></h3>
      <div class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Дата</th>
              <th>Сумма</th>
              <th>Контрагент</th>
              <th>Прораб</th>
              <th>Вид работы</th>
              <th>Комментарий</th>
              <th>Статус</th>
              <th>Принято заказчиком</th>
              <th>Комментарий</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="work in works" :key="work.id" :class="{ 'odd-row': works.indexOf(work) % 2 === 0 }">
              <td>{{ formatDate(work.createdAt) }}</td>
              <td>{{ work.amount }} ₽</td>
              <td>
                {{ contractors.find(c => c.id === work.contractorId && c.type === work.contractorType)?.name || '-' }}
              </td>
              <td>
                {{ foremans.find(s => s.id === work.supervisorId)?.name || '-' }}
              </td>
              <td>{{ work.workType || '-' }}</td>
              <td>{{ work.comment }}</td>
              <td :class="{'status-paid': work.paid, 'status-pending': !work.paid}">
                {{ work.paid ? 'Принято' : 'В работе' }}
              </td>
              <td>
                <span v-if="work.acceptedByClient">✅</span>
                <span v-else>❌</span>
              </td>
              <td>
                <span v-if="work.rejectionComment">{{ work.rejectionComment }}</span>
                <span v-else>-</span>
              </td>
              <td>
                <div class="action-buttons">
                  <button v-if="!work.paid && !work.acceptedByClient" @click="acceptWork(work.id)">Принять</button>
                  <button v-if="!work.paid && !work.acceptedByClient" @click="rejectWork(work.id)">Отклонить</button>
                  <button v-if="!work.paid && work.acceptedByClient" @click="payWork(work.id)">Закрыть</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    <!-- Сообщения -->
    <div v-if="successMessage" class="notification success">
      <i class="fas fa-check-circle"></i>
      {{ successMessage }}
    </div>
    <div v-if="errorMessage" class="notification error">
      <i class="fas fa-exclamation-circle"></i>
      {{ errorMessage }}
    </div>
    <!-- Модальное окно для прихода -->
    <div v-if="isComingModalOpen" class="modal-overlay">
      <div class="modal">
        <div class="modal-header">
          <h3>Добавить приход</h3>
          <button @click="closeModals" class="close-btn">×</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <input
              type="number"
              step="100.00"
              v-model.number="newComing.amount"
              placeholder="Сумма"
              required
              :class="{ error: formErrors.coming }"
            />
            <span v-if="formErrors.coming" class="error-message">{{ formErrors.coming }}</span>
          </div>
          <div class="form-group">
            <textarea v-model="newComing.comment" placeholder="Комментарий"></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="closeModals" class="btn secondary">Отмена</button>
          <button @click="addComing" :disabled="!isComingValid" class="btn primary">Добавить</button>
        </div>
      </div>
    </div>
    <!-- Модальное окно для работы -->
    <div v-if="isWorkModalOpen" class="modal-overlay">
      <div class="modal">
        <div class="modal-header">
          <h3>Добавить работу</h3>
          <button @click="closeModals" class="close-btn">×</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>Сумма сметы (заказчик)</label>
            <input
              type="number"
              step="100.00"
              v-model.number="newWork.clientAmount"
              placeholder="Сумма сметы"
              required
              :class="{ error: formErrors.clientAmount }"
            />
            <span v-if="formErrors.clientAmount" class="error-message">{{ formErrors.clientAmount }}</span>
          </div>
          <div class="form-group">
            <label>Сумма работ (мастеру)</label>
            <input
              type="number"
              step="100.00"
              v-model.number="newWork.amount"
              placeholder="Сумма работ"
              required
              :class="{ error: formErrors.contractorAmount }"
            />
            <span v-if="formErrors.contractorAmount" class="error-message">{{ formErrors.contractorAmount }}</span>
          </div>
          <div class="form-group">
            <label>Выберите категорию</label>
            <select v-model="selectedCategory">
              <option value="">Выберите категорию</option>
              <option value="master">Мастера</option>
              <option value="worker">Рабочие</option>
            </select>
          </div>
          <div class="form-group">
            <label>Выберите контрагента</label>
            <select v-model="newWork.contractorId">
              <option value="">Выберите контрагента</option>
              <option v-for="contractor in filteredContractors" :key="contractor.id" :value="contractor.id">
                {{ contractor.name }} (Баланс: {{ contractor.balance }} ₽)
              </option>
            </select>
          </div>
          <div class="form-group">
            <label>Выберите прораба</label>
            <select v-model="newWork.supervisorId">
              <option v-for="foreman in foremans" :key="foreman.id" :value="foreman.id">
                {{ foreman.name }}
              </option>
            </select>
          </div>
          <div class="form-group">
            <label>Выберите вид работы</label>
            <select v-model="newWork.workType">
              <option v-for="type in workTypes" :key="type" :value="type">
                {{ type }}
              </option>
            </select>
          </div>
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
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const objectId = route.params.id

// Состояние модалей
const isComingModalOpen = ref(false)
const isWorkModalOpen = ref(false)

// Операции и справочники
const operations = ref([])
const contractors = ref([])
const foremans = ref([]) // Прорабы

// Приходы и работы
const comings = ref([])
const works = ref([])

// Справочник видов работ
const workTypes = [
  'Отделка', 'Электрика', 'Плитка', 'Сантехника', 'Перегородки ГКЛ',
  'Сварка', 'Бетонные работы', 'Кровля', 'Перегородки Камень',
  'Демонтаж', 'Мусор', 'Прочее'
]

// Формы
const newComing = ref({ amount: 0, comment: '', objectId })
const newWork = ref({
  amount: 0, // Сумма работ (мастеру)
  clientAmount: 0, // Сумма сметы (заказчик)
  contractorId: null,
  comment: '',
  paid: false,
  objectId,
  acceptedByClient: false, // Принято заказчиком
  rejectionComment: null, // Комментарий при отклонении
  workType: '', // Вид работы
  supervisorId: null // ID прораба
})

const emit = defineEmits(['add-coming', 'add-work'])

const selectedCategory = ref('')
const formErrors = ref({})
const successMessage = ref('')
const errorMessage = ref('')

// Функции открытия/закрытия модалей
function openComingModal() {
  resetFormErrors()
  isComingModalOpen.value = true
}

function openWorkModal() {
  resetFormErrors()
  isWorkModalOpen.value = true
}

function closeModals() {
  isComingModalOpen.value = false
  isWorkModalOpen.value = false
  resetForm()
}

// Сброс форм
function resetForm() {
  newComing.value = { amount: 0, comment: '', objectId }
  newWork.value = {
    amount: 0,
    clientAmount: 0,
    contractorId: null,
    comment: '',
    paid: false,
    objectId,
    acceptedByClient: false,
    rejectionComment: null,
    workType: '',
    supervisorId: null
  }
  selectedCategory.value = ''
}

// Валидация форм
const isComingValid = computed(() => Number(newComing.value.amount) > 0)

const isWorkValid = computed(() => {
  const valid = (
    Number(newWork.value.amount) > 0 &&
    Number(newWork.value.clientAmount) > 0 &&
    newWork.value.contractorId !== null &&
    newWork.value.workType !== '' &&
    newWork.value.supervisorId !== null
  )
  return valid
})

// Фильтрация контрагентов по категории
const filteredContractors = computed(() => {
  if (!selectedCategory.value) return []
  return contractors.value.filter(c => c.type === selectedCategory.value)
})

// Пробел на тысячах
function formatCurrency(value) {
  const formatter = new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
  return formatter.format(Number(value))
}

// Расчёт баланса объекта (только по принятым работам)
const objectBalance = computed(() => {
  const totalComings = comings.value.reduce((sum, op) => sum + Number(op.amount), 0)
  const totalWorksPaid = works.value
    .filter(w => w.paid && w.acceptedByClient)
    .reduce((sum, w) => sum + Number(w.amount), 0)
  return formatCurrency(totalComings - totalWorksPaid)
})

// Сумма ожидаемых работ (только непринятые)
const pendingWorksTotal = computed(() => {
  const total = works.value
    .filter(w => !w.paid && !w.acceptedByClient)
    .reduce((sum, w) => sum + Number(w.amount), 0)
  return formatCurrency(total)
})

// Cколько ещё осталось получить от заказчика
const remainingFromClient = computed(() => {
  const totalExpected = works.value
    .reduce((sum, work) => sum + Number(work.clientAmount), 0)
  const totalReceived = comings.value
    .reduce((sum, op) => sum + Number(op.amount), 0)
  return formatCurrency(totalExpected - totalReceived)
})

// Общая сумма по смете
const expectedTotal = computed(() => {
  const total = works.value
    .reduce((sum, work) => sum + Number(work.clientAmount), 0)
  return formatCurrency(total)
})

// Форматирование даты
function formatDate(dateString) {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Загрузка данных
onMounted(async () => {
  await fetchOperations()
  await fetchContractors()
  await fetchForemans() // Загрузка прорабов
})

async function fetchOperations() {
  try {
    const data = await $fetch(`/api/objects/${objectId}/operations`, {
      method: 'GET',
      credentials: 'include'
    })
    
    // Разделяем на приходы и работы
    comings.value = data.comings.map(op => ({
      ...op,
      amount: Number(op.amount)
    }))
    
    works.value = data.works.map(op => ({
      ...op,
      // workerAmount → amount
      amount: Number(op.workerAmount || 0),
      // customerAmount → clientAmount
      clientAmount: Number(op.customerAmount || 0),
      paid: Boolean(op.paid),
      // accepted → acceptedByClient
      acceptedByClient: Boolean(op.accepted),
      rejectionComment: op.rejectedReason || null,
      // workTypes → workType
      workType: op.workTypes || '',
      // foremanId → supervisorId
      supervisorId: op.foremanId || null,
      // contractorType (берётся из contractorType в API)
      contractorType: op.contractorType
    }))
    
    clearMessages()
  } catch (error) {
    console.error('Ошибка получения операций:', error)
    errorMessage.value = 'Не удалось загрузить список операций'
    setTimeout(() => errorMessage.value = '', 5000)
  }
}

async function fetchContractors() {
  try {
    const [mastersData, workersData] = await Promise.all([
      $fetch('/api/contractors/masters', { method: 'GET', credentials: 'include' }),
      $fetch('/api/contractors/workers', { method: 'GET', credentials: 'include' })
    ])
    
    contractors.value = [
      ...mastersData.map(m => ({ ...m, type: 'master' })),
      ...workersData.map(w => ({ ...w, type: 'worker' }))
    ]
    
    clearMessages()
  } catch (error) {
    console.error('Ошибка получения контрагентов:', error)
    errorMessage.value = 'Не удалось загрузить список контрагентов'
    setTimeout(() => errorMessage.value = '', 5000)
  }
}

async function fetchForemans() {
  try {
    const data = await $fetch('/api/contractors/foremans', { 
      method: 'GET', 
      credentials: 'include' 
    })
    foremans.value = data
  } catch (error) {
    console.error('Ошибка получения прорабов:', error)
    errorMessage.value = 'Не удалось загрузить список прорабов'
    setTimeout(() => errorMessage.value = '', 5000)
  }
}

// Добавление прихода
async function addComing() {
  formErrors.value = {}
  
  if (!isComingValid.value) {
    formErrors.value.coming = 'Сумма должна быть больше нуля'
    return
  }
  
  try {
    const created = await $fetch('/api/comings', {
      method: 'POST',
      body: {
        ...newComing.value,
        objectId
      },
      credentials: 'include'
    })
    
    emit('add-coming', created)
    comings.value.push(created)
    closeModals()
    
    successMessage.value = 'Приход успешно добавлен'
    setTimeout(() => successMessage.value = '', 3000)
  } catch (error) {
    console.error('Ошибка при добавлении прихода:', error)
    errorMessage.value = 'Не удалось добавить приход'
    setTimeout(() => errorMessage.value = '', 5000)
  }
}

// Добавление работы
async function addWork() {
  formErrors.value = {}
  
  if (!isWorkValid.value) {
    formErrors.value = {
      workAmount: 'Сумма работ обязательна',
      clientAmount: 'Сумма сметы обязательна',
      contractor: 'Контрагент обязателен',
      workType: 'Выберите вид работы',
      supervisor: 'Выберите прораба'
    }
    return
  }
  
  try {
    const payload = {
      // workerAmount → amount
      workerAmount: Number(newWork.value.amount),
      // customerAmount → clientAmount
      customerAmount: Number(newWork.value.clientAmount),
      contractorId: newWork.value.contractorId,
      // workTypes → workType
      workTypes: newWork.value.workType,
      // foremanId → supervisorId
      foremanId: newWork.value.supervisorId,
      comment: newWork.value.comment || '',
      paid: false,
      paymentDate: null,
      operationDate: new Date().toISOString(),
      objectId,
      contractorType: selectedCategory.value
    }
    
    const result = await $fetch('/api/works', {
      method: 'POST',
      body: payload,
      credentials: 'include'
    })

    // Эмитим событие для родителя
    emit('add-work', {
      ...result,
      paid: false,
      acceptedByClient: false,
      amount: Number(result.workerAmount || 0),
      clientAmount: Number(result.customerAmount || 0)
    })
    
    works.value.push({
      ...result,
      paid: false,
      acceptedByClient: false
    })
    
    closeModals()
    
    successMessage.value = 'Работа успешно добавлена'
    setTimeout(() => successMessage.value = '', 3000)
  } catch (error) {
    console.error('Ошибка при добавлении работы:', error)
    errorMessage.value = 'Не удалось добавить работу'
    setTimeout(() => errorMessage.value = '', 5000)
  }
}

// Оплата работы
async function payWork(workId) {
  try {
    const result = await $fetch(`/api/works/pay-work/${workId}`, {
      method: 'POST',
      credentials: 'include'
    })
    
    const index = works.value.findIndex(w => w.id === workId)
    if (index !== -1) {
      works.value[index].paid = true
      works.value[index].paymentDate = result.paymentDate
    }
    
    successMessage.value = 'Работа оплачена'
    setTimeout(() => successMessage.value = '', 3000)
  } catch (error) {
    console.error('Ошибка оплаты работы:', error)
    errorMessage.value = 'Не удалось оплатить работу'
    setTimeout(() => errorMessage.value = '', 5000)
  }
}

// Принятие работы заказчиком
async function acceptWork(workId) {
  try {
    await $fetch(`/api/works/accept/${workId}`, {
      method: 'POST',
      credentials: 'include'
    })
    
    const index = works.value.findIndex(w => w.id === workId)
    if (index !== -1) {
      works.value[index].acceptedByClient = true
      
      // Добавление процента от сметы в приходы
      const percentAmount = calculatePercent(works.value[index].clientAmount)
      comings.value.push({
        amount: percentAmount,
        comment: `Процент от работы "${works.value[index].workType}"`,
        createdAt: new Date().toISOString()
      })
    }
    
    successMessage.value = 'Работа принята заказчиком'
    setTimeout(() => successMessage.value = '', 3000)
  } catch (error) {
    console.error('Ошибка принятия работы:', error)
    errorMessage.value = 'Не удалось принять работу'
    setTimeout(() => errorMessage.value = '', 5000)
  }
}

// Отклонение работы заказчиком
async function rejectWork(workId) {
  const comment = prompt('Введите причину отклонения:')
  
  if (!comment) return
  
  try {
    await $fetch(`/api/works/reject/${workId}`, {
      method: 'POST',
      body: { comment },
      credentials: 'include'
    })
    
    const index = works.value.findIndex(w => w.id === workId)
    if (index !== -1) {
      works.value[index].rejectionComment = comment
      works.value[index].acceptedByClient = false
    }
    
    successMessage.value = 'Работа отклонена'
    setTimeout(() => successMessage.value = '', 3000)
  } catch (error) {
    console.error('Ошибка отклонения работы:', error)
    errorMessage.value = 'Не удалось отклонить работу'
    setTimeout(() => errorMessage.value = '', 5000)
  }
}

// Расчет процента от сметы (пример: 10%)
function calculatePercent(amount) {
  const percent = 10 // 10%
  return Number(amount) * (percent / 100)
}

// Вспомогательные функции
function clearMessages() {
  successMessage.value = ''
  errorMessage.value = ''
}

function resetFormErrors() {
  formErrors.value = {}
}
</script>

<style lang="scss" scoped>
.block {
  margin-bottom: 2rem;
  position: relative;
}

.balance-summary {
  display: flex;
  gap: 1.5rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
}

.balance-card {
  flex: 1 1 calc(50% - 1rem);
  min-width: 250px;
  background: #ffffff;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
  transition: all 0.3s ease;
  overflow: hidden;
  cursor: default;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 16px rgba(0,0,0,0.1);
  }
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  // background: #f0f8ff;
  background: linear-gradient(to right, #f0f8ff, #fff);
  font-weight: 600;
  color: #2c3e50;
  font-size: 0.95rem;
}

.card-body {
  padding: 0 1rem 1rem;
  text-align: right;
  font-size: 1.5rem;
  font-weight: bold;
  color: #27ae60;
}

.add-buttons {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  justify-content: center;
}

.table-section {
  // margin-bottom: 2rem;
  // background: #ffffff;
  // border-radius: 10px;
  // box-shadow: 0 2px 8px rgba(0,0,0,0.05);
  // padding: 1rem;
  // transition: all 0.3s ease;
}

.table-wrapper {
  max-height: 600px;
  overflow-y: auto;
  margin-top: 1rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

.table-section h3 {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
  font-size: 1.25rem;
  color: #2c3e50;
}

table {
  width: 100%;
  border-collapse: collapse;
  min-width: 100%;
}

th {
  background-color: #f8f9fa;
  padding: 10px 1em;
  text-align: left;
  font-weight: 600;
  color: #34495e;
  border-bottom: 2px solid #e0e0e0;
}

td {
  // padding: 1em;
  // margin: 0 10px;
  text-align: center;
  border-bottom: 1px solid #f0f0f0;
  vertical-align: middle;
}

tr:hover {
  background-color: #f9f9f9;
  transition: background-color 0.3s ease;
}

.odd-row {
  background-color: #fafafa;
}

.status-paid {
  color: #27ae60;
  font-weight: bold;
}

.status-pending {
  color: #f39c12;
  font-weight: bold;
}

.notification {
  padding: 1rem 1.5rem;
  border-radius: 6px;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 500;
}

.success {
  background: #d4edda;
  color: #155724;
}

.error {
  background: #f8d7da;
  color: #721c24;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
  backdrop-filter: blur(2px);
}

.modal {
  background: white;
  border-radius: 10px;
  width: 90%;
  max-width: 600px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.2);
  overflow: hidden;
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-20px); }
  to { opacity: 1; transform: translateY(0); }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  background: #f8f9fa;
  border-bottom: 1px solid #ddd;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.25rem;
  color: #2c3e50;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #666;
  transition: color 0.3s ease;
}

.close-btn:hover {
  color: #34495e;
}

.modal-body {
  padding: 1.5rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

input, select, textarea {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 6px;
  font-size: 1rem;
  transition: border-color 0.3s ease;
  margin-top: 0.5rem;
}

input:focus, select:focus, textarea:focus {
  border-color: #007bff;
  outline: none;
}

textarea {
  resize: vertical;
  min-height: 80px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  padding: 1rem 1.5rem;
  border-top: 1px solid #ddd;
  gap: 1rem;
}

.btn {
  padding: 0.5rem 1.2rem;
  border: none;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 1rem;
}

.primary {
  background-color: #007bff;
  color: white;
}

.secondary {
  background-color: #6c757d;
  color: white;
}

.btn:hover {
  transform: translateY(-1px);
}

.btn:active {
  transform: translateY(0);
}

.small {
  padding: 0.3rem 0.7rem;
  font-size: 0.9rem;
}

.error {
  border-color: #dc3545 !important;
}

.error-message {
  color: #dc3545;
  font-size: 0.85em;
  margin-top: 0.25rem;
  display: block;
}

@media (max-width: 768px) {
  .table-wrapper {
    max-height: 400px;
  }
  
  .balance-card {
    flex: 1 1 100%;
  }
}
</style>