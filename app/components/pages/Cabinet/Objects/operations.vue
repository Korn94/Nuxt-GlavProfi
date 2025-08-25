<template>
  <div class="block">
    <h2>Операции объекта</h2>
    <!-- Баланс объекта -->
    <div class="balance-summary">
      <div class="balance-card">
        <div class="card-header">
          <span>Баланс объекта</span>
          <Icon name="fa6-solid:coins" width="24" height="24" />
        </div>
        <div class="card-body">
          <p>{{ objectBalance }} ₽</p>
          <small class="balance-description">Приходы - Вып. работы</small>
        </div>
      </div>
      <div class="balance-card">
        <div class="card-header">
          <span>Остаток от заказчика</span>
          <Icon name="fa6-solid:clock" width="24" height="24" />
        </div>
        <div class="card-body">
          <p>{{ remainingFromClient }} ₽</p>
          <small class="balance-description">Смета - Приход</small>
        </div>
      </div>
      <div class="balance-card">
        <div class="card-header">
          <span>Общая сумма по смете</span>
          <!-- <small class="balance-description">Сумма всех смет по работам</small> -->
          <Icon name="fa6-solid:list" width="24" height="24" />
        </div>
        <div class="card-body">
          <p>{{ expectedTotal }} ₽</p>
        </div>
      </div>
      <div class="balance-card">
        <div class="card-header">
          <span>Сумма работ в работе</span>
          <Icon name="fa6-solid:clock" width="24" height="24" />
        </div>
        <div class="card-body">
          <p>{{ pendingWorksTotal }} ₽</p>
          <small class="balance-description">Сумма не принятых работ</small>
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
      <h3>Приходы <Icon name="fa6-solid:arrow-down" width="24" height="24" /></h3>
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
              <td>{{ formatDate(coming.operationDate) }}</td>
              <td>{{ coming.amount }} ₽</td>
              <td>{{ coming.comment }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    <!-- Таблица работ -->
    <div class="table-section">
      <h3>Работы <Icon name="fa6-solid:toolbox" width="24" height="24" /></h3>
      <div class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Дата</th>
              <th>Смета</th>
              <th>Работы</th>
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
              <td>{{ formatDate(work.operationDate) }}</td>
              <td>{{ work.customerAmount }} ₽</td>
              <td>{{ work.workerAmount }} ₽</td>
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
      <Icon name="fa6-solid:check-circle" width="24" height="24" />
      {{ successMessage }}
    </div>
    <div v-if="errorMessage" class="notification error">
      <Icon name="fa6-solid:exclamation-circle" width="24" height="24" />
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
// ========================================
// Переменные
// ========================================
$color-primary: #007bff;
$color-success: #27ae60;
$color-warning: #f39c12;
$color-danger: #dc3545;
$color-muted: #6c757d;
$color-bg: #f8f9fa;
$color-text: #2c3e50;
$color-border: #e0e0e0;
$color-bg-card: #ffffff;

$shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.05);
$shadow-md: 0 4px 16px rgba(0, 0, 0, 0.1);
$shadow-hover: 0 4px 20px rgba(0, 0, 0, 0.15);

$border-radius: 10px;
$border-radius-sm: 6px;

$spacing-xs: 0.25rem;
$spacing-sm: 0.5rem;
$spacing-md: 1rem;
$spacing-lg: 1.5rem;
$spacing-xl: 2rem;

$font-size-sm: 0.85rem;
$font-size-base: 1rem;
$font-size-lg: 1.25rem;
$font-size-xl: 1.5rem;

// ========================================
// Миксины
// ========================================
@mixin button-reset() {
  border: none;
  background: none;
  padding: 0;
  cursor: pointer;
  outline: none;
  font: inherit;
}

@mixin transition($props...) {
  transition: $props;
}

@mixin card-shadow() {
  box-shadow: $shadow-sm;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: $shadow-md;
  }
}

// ========================================
// Основной блок
// ========================================
.block {
  margin-bottom: $spacing-xl;
  position: relative;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

// ========================================
// Баланс — карточки
// ========================================
.balance-summary {
  display: flex;
  gap: $spacing-lg;
  margin-bottom: $spacing-xl;
  flex-wrap: wrap;
}

.balance-card {
  flex: 1 1 calc(50% - 1rem);
  min-width: 250px;
  background: $color-bg-card;
  border-radius: $border-radius;
  overflow: hidden;
  @include card-shadow();

  &:hover {
    transform: translateY(-2px);
  }
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: $spacing-md;
  background: linear-gradient(to right, #f0f8ff, #fff);
  font-weight: 600;
  color: $color-text;
  font-size: $font-size-sm;
  letter-spacing: 0.3px;
}

.card-body {
  padding: 0 $spacing-md $spacing-md;
  text-align: right;

  p {
    margin: 0;
    font-size: $font-size-xl;
    font-weight: bold;
    color: $color-text;
  }
}

.balance-description {
  display: block;
  font-size: $font-size-sm;
  color: #666;
  margin-top: $spacing-xs;
}

// ========================================
// Кнопки добавления
// ========================================
.add-buttons {
  display: flex;
  gap: $spacing-lg;
  margin-bottom: $spacing-xl;
  justify-content: center;
  flex-wrap: wrap;

  .btn {
    @include transition(transform 0.2s ease, box-shadow 0.2s ease);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

    &:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
    }

    &:active {
      transform: translateY(0);
    }
  }
}

// ========================================
// Таблицы
// ========================================
.table-section {
  margin-bottom: $spacing-xl;
  background: $color-bg-card;
  border-radius: $border-radius;
  box-shadow: $shadow-sm;
  overflow: hidden;
}

.table-section h3 {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
  margin: 0;
  padding: $spacing-md;
  font-size: $font-size-lg;
  color: $color-text;
  border-bottom: 1px solid $color-border;
  background: $color-bg;
}

.table-wrapper {
  max-height: 600px;
  overflow-y: auto;
  margin-top: $spacing-md;
  border-top: 1px solid $color-border;
}

table {
  width: 100%;
  border-collapse: collapse;
  min-width: 100%;
}

th {
  padding: $spacing-sm $spacing-md;
  background-color: #f8f9fa;
  font-weight: 600;
  color: #34495e;
  text-transform: uppercase;
  font-size: $font-size-sm;
  letter-spacing: 0.5px;
  border-bottom: 2px solid $color-border;
}

td {
  padding: $spacing-sm $spacing-md;
  text-align: center;
  vertical-align: middle;
  border-bottom: 1px solid #f0f0f0;
  font-size: $font-size-base;
  white-space: nowrap;
}

tr {
  @include transition(background-color 0.2s ease);

  &:hover {
    background-color: #f9f9f9;
  }

  &.odd-row {
    background-color: #fafafa;
  }
}

// Статусы работ
.status-paid {
  color: $color-success;
  font-weight: 600;
}

.status-pending {
  color: $color-warning;
  font-weight: 600;
}

// Действия в таблице
.action-buttons {
  display: flex;
  gap: $spacing-sm;
  justify-content: center;
  flex-wrap: wrap;

  button {
    padding: $spacing-xs $spacing-sm;
    font-size: $font-size-sm;
    border-radius: $border-radius-sm;
    border: 1px solid $color-muted;
    background: #fff;
    color: $color-muted;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
      background: $color-muted;
      color: #fff;
    }

    &:first-child {
      background: $color-success;
      color: #fff;
      border: none;

      &:hover {
        background: #333;
      }
    }

    &:nth-child(2) {
      background: $color-warning;
      color: #fff;
      border: none;

      &:hover {
        background: #333
      }
    }

    &:last-child {
      background: $color-primary;
      color: #fff;
      border: none;

      &:hover {
        background: #333;
      }
    }
  }
}

// ========================================
// Уведомления
// ========================================
.notification {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
  padding: $spacing-md;
  margin-bottom: $spacing-md;
  border-radius: $border-radius-sm;
  font-weight: 500;
  font-size: $font-size-base;

  svg {
    flex-shrink: 0;
  }
}

.success {
  background: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.error {
  background: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

// ========================================
// Модальные окна
// ========================================
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-20px); }
  to { opacity: 1; transform: translateY(0); }
}

.modal {
  background: #fff;
  border-radius: $border-radius;
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow: hidden;
  box-shadow: $shadow-hover;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: $spacing-lg;
  background: $color-bg;
  border-bottom: 1px solid $color-border;
}

.modal-header h3 {
  margin: 0;
  font-size: $font-size-lg;
  color: $color-text;
}

.close-btn {
  @include button-reset();
  font-size: 1.8rem;
  color: #666;
  line-height: 1;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background 0.2s ease, color 0.2s ease;

  &:hover {
    background: #e9ecef;
    color: #333;
  }
}

.modal-body {
  padding: $spacing-lg;
  flex-grow: 1;
  overflow-y: auto;
}

.form-group {
  margin-bottom: $spacing-lg;

  label {
    display: block;
    margin-bottom: $spacing-xs;
    font-weight: 500;
    color: #495057;
    font-size: $font-size-base;
  }

  input,
  select,
  textarea {
    width: 100%;
    padding: $spacing-sm;
    border: 1px solid #ccc;
    border-radius: $border-radius-sm;
    font-size: $font-size-base;
    @include transition(border-color);

    &:focus {
      outline: none;
      border-color: $color-primary;
      box-shadow: 0 0 0 3px rgba($color-primary, 0.1);
    }

    &.error {
      border-color: $color-danger;
      box-shadow: 0 0 0 3px rgba($color-danger, 0.1);
    }
  }

  textarea {
    resize: vertical;
    min-height: 80px;
  }
}

.error-message {
  display: block;
  margin-top: $spacing-xs;
  color: $color-danger;
  font-size: $font-size-sm;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  padding: $spacing-md $spacing-lg;
  gap: $spacing-md;
  border-top: 1px solid $color-border;
  background: $color-bg;
}

.btn {
  padding: $spacing-sm $spacing-md;
  border: none;
  border-radius: $border-radius-sm;
  font-weight: 500;
  cursor: pointer;
  @include transition(all 0.2s ease);
  font-size: $font-size-base;

  &.primary {
    background: $color-primary;
    color: #fff;

    &:hover:not(:disabled) {
      background: #333;
    }

    &:disabled {
      background: #aaa;
      cursor: not-allowed;
      opacity: 0.7;
    }
  }

  &.secondary {
    background: $color-muted;
    color: #fff;

    &:hover {
      background: #333;
    }
  }
}

// ========================================
// Адаптивность
// ========================================
@media (max-width: 768px) {
  .balance-summary {
    gap: $spacing-md;
  }

  .balance-card {
    flex: 1 1 100%;
    min-width: auto;
  }

  .add-buttons {
    flex-direction: column;
    align-items: center;
  }

  .table-wrapper {
    max-height: 400px;
  }

  .modal {
    width: 95%;
    max-width: 100%;
    padding: 0 $spacing-sm;
  }

  .modal-body,
  .modal-footer {
    padding: $spacing-md;
  }

  th, td {
    padding: $spacing-xs;
    font-size: $font-size-sm;
  }

  .action-buttons button {
    font-size: $font-size-sm;
    padding: $spacing-xs $spacing-sm;
  }
}

@media (max-width: 480px) {
  .table-section h3 {
    font-size: 1.1rem;
    padding: $spacing-md;
  }

  .btn {
    font-size: $font-size-sm;
    padding: $spacing-xs $spacing-sm;
  }
}
</style>