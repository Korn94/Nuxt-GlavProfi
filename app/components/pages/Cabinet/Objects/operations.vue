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
          <p>{{ formatAmount(objectBalance) }} ₽</p>
          <small class="balance-description">Приходы - Вып. работы</small>
        </div>
      </div>

      <div class="balance-card">
        <div class="card-header">
          <span>Сумма работ в работе</span>
          <Icon name="fa6-solid:clock" width="24" height="24" />
        </div>
        <div class="card-body">
          <p>{{ formatAmount(pendingWorksTotal) }} ₽</p>
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
      <h3><Icon name="fa6-solid:arrow-down" width="24" height="24" /> Приходы</h3>
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
            <tr v-for="(coming, $index) in sortByDateDesc(comings)" :key="coming.id" :class="{ 'odd-row': $index % 2 === 0 }">
              <td>{{ formatDate(coming.operationDate) }}</td>
              <td>{{ formatAmount(coming.amount) }} ₽</td>
              <td>{{ coming.comment || '-' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Таблица работ -->
    <div class="table-section">
      <h3><Icon name="fa6-solid:toolbox" width="24" height="24" /> Работы</h3>
      <button class="btn btn-secondary" @click="refreshData">
        <Icon name="mdi:refresh" size="18" />
        Обновить
      </button>
      <div class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Дата</th>
              <th>Сумма</th>
              <th>Статус</th>
              <th>Комментарий</th>
              <th>Контрагент</th>
              <th>Вид работы</th>
              <th>Прораб</th>
              <th>Принято заказчиком</th>
              <th>Комментарий</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(work, $index) in sortByDateDesc(works)" :key="work.id" :class="{ 'odd-row': $index % 2 === 0 }">
              <td>{{ formatDate(work.operationDate) }}</td>
              <td>{{ formatAmount(work.workerAmount || work.amount) }} ₽</td>
              <td :class="{'status-paid': work.paid, 'status-pending': !work.paid}">
                {{ work.paid ? 'Принято' : 'В работе' }}
              </td>
              <td>{{ work.comment || '-' }}</td>
              <td>
                {{ contractors.find(c => c.id === work.contractorId && c.type === work.contractorType)?.name || '-' }}
              </td>
              <td>{{ work.workType || '-' }}</td>
              <td>
                {{ foremans.find(s => s.id === work.supervisorId)?.name || '-' }}
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
                  <button @click="deleteWork(work.id, work.paid)" class="delete-button" title="Удалить работу">×</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Уведомления -->
    <div v-if="successMessage" class="notification success">
      <Icon name="fa6-solid:check-circle" width="24" height="24" />
      {{ successMessage }}
    </div>
    <div v-if="errorMessage" class="notification error">
      <Icon name="fa6-solid:exclamation-circle" width="24" height="24" />
      {{ errorMessage }}
    </div>

    <!-- Модальное окно: Добавить приход -->
    <PagesCabinetUiModal
      :visible="isComingModalOpen"
      @update:visible="closeModals"
      @close="closeModals"
      title="Добавить приход"
      size="md"
      closable
    >
      <!-- Контент -->
      <div class="modal-content">
        <form @submit.prevent="addComing">
          <div class="form-group">
            <label>Сумма <span class="required">*</span></label>
            <input
              type="text"
              v-model="comingDisplayAmount"
              placeholder="Введите сумму"
              @blur="formatComingOnBlur"
              @focus="unformatComingOnFocus"
              @input="syncComingAmount"
              required
              :class="{ error: formErrors.coming }"
            />
            <span v-if="formErrors.coming" class="error-message">{{ formErrors.coming }}</span>
          </div>

          <div class="form-group">
            <label>Комментарий</label>
            <textarea v-model="newComing.comment" placeholder="Дополнительная информация"></textarea>
          </div>
        </form>
      </div>

      <!-- Футер -->
      <template #footer>
        <button type="button" @click="closeModals" class="btn secondary">Отмена</button>
        <button type="submit" @click="addComing" :disabled="!isComingValid" class="btn primary">
          {{ loadingComing ? 'Сохранение...' : 'Добавить' }}
        </button>
      </template>
    </PagesCabinetUiModal>

    <!-- Модальное окно: Добавить работу -->
    <PagesCabinetUiModal
      :visible="isWorkModalOpen"
      @update:visible="closeModals"
      @close="closeModals"
      title="Добавить работу"
      size="lg"
      closable
    >
      <!-- Контент -->
      <div class="modal-content">
        <form @submit.prevent="addWork">
          <div class="form-grid">
            <div class="form-group">
              <label>Сумма работ (мастеру) <span class="required">*</span></label>
              <input
                type="text"
                v-model="workDisplayAmount"
                placeholder="Сумма работ"
                @blur="formatWorkOnBlur"
                @focus="unformatWorkOnFocus"
                @input="syncWorkAmount"
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
              <select v-model="newWork.contractorId" :disabled="!selectedCategory">
                <option value="">Выберите контрагента</option>
                <option
                  v-for="contractor in filteredContractors"
                  :key="contractor.id"
                  :value="contractor.id"
                >
                  {{ contractor.name }} (Баланс: {{ formatAmount(contractor.balance) }} ₽)
                </option>
              </select>
            </div>

            <div class="form-group">
              <label>Выберите прораба</label>
              <select v-model="newWork.supervisorId">
                <option value="">Без прораба</option>
                <option v-for="foreman in foremans" :key="foreman.id" :value="foreman.id">
                  {{ foreman.name }}
                </option>
              </select>
            </div>

            <div class="form-group">
              <label>Выберите вид работы</label>
              <select v-model="newWork.workType">
                <option value="">Выберите вид работы</option>
                <option v-for="type in workTypes" :key="type" :value="type">
                  {{ type }}
                </option>
              </select>
            </div>

            <div class="form-group">
              <label>
                <input type="checkbox" v-model="newWork.immediatePayment" />
                <span>Сразу оплатить с баланса компании</span>
              </label>
            </div>
          </div>

          <div class="form-group">
            <label>Комментарий</label>
            <textarea v-model="newWork.comment" placeholder="Комментарий к работе"></textarea>
          </div>
        </form>
      </div>

      <!-- Футер -->
      <template #footer>
        <button type="button" @click="closeModals" class="btn secondary">Отмена</button>
        <button type="submit" @click="addWork" :disabled="!isWorkValid" class="btn primary">
          {{ loadingWork ? 'Сохранение...' : 'Добавить работу' }}
        </button>
      </template>
    </PagesCabinetUiModal>
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
const loadingComing = ref(false)
const loadingWork = ref(false)

// Операции и справочники
const operations = ref([])
const contractors = ref([])
const foremans = ref([])

// Приходы и работы
const comings = ref([])
const works = ref([])

// Справочник видов работ
const workTypes = [
  'Отделка', 'Электрика', 'Плитка', 'Сантехника', 'Перегородки ГКЛ',
  'Сварка', 'Бетонные работы', 'Кровля', 'Фасад', 'Перегородки Камень',
  'Демонтаж', 'Мусор', 'Прочее'
]

// Формы
const newComing = ref({ amount: null, comment: '', objectId })
const newWork = ref({
  amount: null, // Сумма работ (мастеру)
  contractorId: null,
  comment: '',
  paid: false,
  objectId,
  acceptedByClient: false, // Принято заказчиком
  rejectionComment: null, // Комментарий при отклонении
  workType: '', // Вид работы
  supervisorId: null, // ID прораба
  immediatePayment: false // Немедленная оплата
})

const emit = defineEmits(['add-coming', 'add-work'])

const selectedCategory = ref('')
const formErrors = ref({})
const successMessage = ref('')
const errorMessage = ref('')

// --- Локальные значения для отображения ---
const localComingValue = ref('')
const localWorkValue = ref('')

// --- Функции форматирования ---
function formatAmount(value) {
  if (value == null || isNaN(value)) return '0'
  return new Intl.NumberFormat('ru-RU').format(Number(value))
}

// --- Вычисляемые значения ---

// Общая сумма приходов
const totalComings = computed(() => {
  return comings.value.reduce((sum, op) => sum + Number(op.amount), 0)
})

// Баланс объекта: приходы - выплаченные работы (принятые заказчиком)
const objectBalance = computed(() => {
  const totalWorksPaid = works.value
    .filter(w => w.paid && w.acceptedByClient)
    .reduce((sum, w) => sum + Number(w.workerAmount || w.amount || 0), 0)
  return totalComings.value - totalWorksPaid
})

// Сумма непринятых работ (в работе)
const pendingWorksTotal = computed(() => {
  return works.value
    .filter(w => !w.paid && !w.acceptedByClient)
    .reduce((sum, w) => sum + Number(w.workerAmount || w.amount || 0), 0)
})

// --- Фильтрация контрагентов ---
const filteredContractors = computed(() => {
  if (!selectedCategory.value) return []
  return contractors.value.filter(c => c.type === selectedCategory.value)
})

// --- Валидация форм ---
const isComingValid = computed(() => Number(newComing.value.amount) > 0)

const isWorkValid = computed(() => {
  return (
    Number(newWork.value.amount) > 0 &&
    newWork.value.contractorId !== null &&
    newWork.value.workType !== ''
  )
})

// --- Форматирование даты ---
function formatDate(dateString) {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
  })
}

// Сортирует массив объектов по дате operationDate в порядке убывания (новые сверху)
function sortByDateDesc(array) {
  return [...array].sort((a, b) => new Date(b.operationDate) - new Date(a.operationDate))
}

// --- ВЫЧИСЛЯЕМЫЕ ПОЛЯ ДЛЯ ОТОБРАЖЕНИЯ СУММ ---

// Приход: displayAmount
const comingDisplayAmount = computed({
  get() {
    if (newComing.value.amount === null || newComing.value.amount === '') return ''
    return new Intl.NumberFormat('ru-RU').format(newComing.value.amount)
  },
  set(value) {
    localComingValue.value = value
  }
})

// Работа: displayAmount
const workDisplayAmount = computed({
  get() {
    if (newWork.value.amount === null || newWork.value.amount === '') return ''
    return new Intl.NumberFormat('ru-RU').format(newWork.value.amount)
  },
  set(value) {
    localWorkValue.value = value
  }
})

// --- Парсер строки в число ---
function parseNumber(str) {
  if (!str) return NaN
  const cleaned = str.replace(/[^\d,.-]/g, '').replace(',', '.')
  return parseFloat(cleaned)
}

// --- Приход: события ввода ---
function unformatComingOnFocus() {
  if (newComing.value.amount !== null) {
    localComingValue.value = String(newComing.value.amount)
  } else {
    localComingValue.value = ''
  }
}

function formatComingOnBlur() {
  const num = parseNumber(localComingValue.value)
  if (!isNaN(num) && num >= 0) {
    newComing.value.amount = num
    localComingValue.value = new Intl.NumberFormat('ru-RU').format(num)
  } else {
    localComingValue.value = newComing.value.amount
      ? new Intl.NumberFormat('ru-RU').format(newComing.value.amount)
      : ''
  }
}

function syncComingAmount() {
  const raw = localComingValue.value
  const num = parseNumber(raw)
  if (!isNaN(num)) {
    newComing.value.amount = num
  } else if (raw === '' || raw === null) {
    newComing.value.amount = null
  }
}

// --- Работа: события ввода ---
function unformatWorkOnFocus() {
  if (newWork.value.amount !== null) {
    localWorkValue.value = String(newWork.value.amount)
  } else {
    localWorkValue.value = ''
  }
}

function formatWorkOnBlur() {
  const num = parseNumber(localWorkValue.value)
  if (!isNaN(num) && num >= 0) {
    newWork.value.amount = num
    localWorkValue.value = new Intl.NumberFormat('ru-RU').format(num)
  } else {
    localWorkValue.value = newWork.value.amount
      ? new Intl.NumberFormat('ru-RU').format(newWork.value.amount)
      : ''
  }
}

function syncWorkAmount() {
  const raw = localWorkValue.value
  const num = parseNumber(raw)
  if (!isNaN(num)) {
    newWork.value.amount = num
  } else if (raw === '' || raw === null) {
    newWork.value.amount = null
  }
}

// --- Загрузка данных ---
onMounted(async () => {
  await fetchOperations()
  await fetchContractors()
  await fetchForemans()
})

async function fetchOperations() {
  try {
    const data = await $fetch(`/api/objects/${objectId}/operations`, {
      method: 'GET',
      credentials: 'include'
    })

    // Разделяем на приходы и работы
    comings.value = data.comings?.map(op => ({
      ...op,
      amount: Number(op.amount)
    })) || []

    works.value = (data.works || []).map(op => ({
      ...op,
      workerAmount: Number(op.workerAmount || 0),
      amount: Number(op.workerAmount || 0), // дубль для удобства
      paid: Boolean(op.paid),
      acceptedByClient: Boolean(op.accepted),
      rejectionComment: op.rejectedReason || null,
      workType: op.workTypes || '',
      supervisorId: op.foremanId || null,
      contractorType: op.contractorType
    }))

    clearMessages()
  } catch (error) {
    console.error('Ошибка получения операций:', error)
    errorMessage.value = 'Не удалось загрузить список операций'
    setTimeout(() => errorMessage.value = '', 5000)
  }
}

// Обновление данных
const refreshData = () => {
  fetchOperations()
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
    foremans.value = data || []
  } catch (error) {
    console.error('Ошибка получения прорабов:', error)
    errorMessage.value = 'Не удалось загрузить список прорабов'
    setTimeout(() => errorMessage.value = '', 5000)
  }
}

// --- Управление модальными окнами ---
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

function resetForm() {
  newComing.value = { amount: null, comment: '', objectId }
  newWork.value = {
    amount: null,
    contractorId: null,
    comment: '',
    paid: false,
    objectId,
    acceptedByClient: false,
    rejectionComment: null,
    workType: '',
    supervisorId: null,
    immediatePayment: false
  }
  selectedCategory.value = ''
  localComingValue.value = ''
  localWorkValue.value = ''
}

// --- Добавление операций ---
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

async function addWork() {
  formErrors.value = {}
  if (!isWorkValid.value) {
    formErrors.value = {
      workAmount: 'Сумма работ обязательна',
      contractor: 'Контрагент обязателен',
      workType: 'Выберите вид работы'
    }
    return
  }

  loadingWork.value = true

  try {
    let result;
    
    if (newWork.value.immediatePayment) {
      // Используем новое API для создания и немедленной оплаты
      result = await $fetch('/api/works/create-and-pay', {
        method: 'POST',
        body: {
          workerAmount: Number(newWork.value.amount),
          contractorId: newWork.value.contractorId,
          contractorType: selectedCategory.value,
          workTypes: newWork.value.workType,
          foremanId: newWork.value.supervisorId || null,
          comment: newWork.value.comment || '',
          objectId
        },
        credentials: 'include'
      });
    } else {
      // Используем существующее API
      const payload = {
        workerAmount: Number(newWork.value.amount),
        contractorId: newWork.value.contractorId,
        workTypes: newWork.value.workType,
        foremanId: newWork.value.supervisorId || null,
        comment: newWork.value.comment || '',
        paid: false,
        paymentDate: null,
        operationDate: new Date().toISOString(),
        objectId,
        contractorType: selectedCategory.value
      }

      result = await $fetch('/api/works', {
        method: 'POST',
        body: payload,
        credentials: 'include'
      })
    }

    // Убедимся, что у нас есть все необходимые поля
    const workItem = {
      ...result,
      paid: result.paid,
      acceptedByClient: result.accepted,
      workerAmount: Number(result.workerAmount || 0),
      amount: Number(result.workerAmount || 0),
      workType: result.workTypes || '',
      supervisorId: result.foremanId || null,
      operationDate: result.operationDate || new Date().toISOString()
    }

    emit('add-work', workItem)
    works.value.push(workItem)

    closeModals()

    successMessage.value = newWork.value.immediatePayment ? 
      'Работа создана и оплачена' : 'Работа успешно добавлена'
    setTimeout(() => successMessage.value = '', 3000)
  } catch (error) {
    console.error('Ошибка при добавлении работы:', error)
    errorMessage.value = 'Не удалось добавить работу'
    setTimeout(() => errorMessage.value = '', 5000)
  }
}

// --- Работа с существующими работами ---
async function payWork(workId) {
  try {
    const result = await $fetch(`/api/works/pay-work/${workId}`, {
      method: 'POST',
      credentials: 'include'
    })

    const work = works.value.find(w => w.id === workId)
    if (work) {
      work.paid = true
      work.paymentDate = result.paymentDate
    }

    successMessage.value = 'Работа оплачена'
    setTimeout(() => successMessage.value = '', 3000)
  } catch (error) {
    console.error('Ошибка оплаты работы:', error)
    errorMessage.value = 'Не удалось оплатить работу'
    setTimeout(() => errorMessage.value = '', 5000)
  }
}

async function acceptWork(workId) {
  try {
    await $fetch(`/api/works/accept/${workId}`, {
      method: 'POST',
      credentials: 'include'
    })

    const work = works.value.find(w => w.id === workId)
    if (work) {
      work.acceptedByClient = true
      work.rejectionComment = null
    }

    successMessage.value = 'Работа принята заказчиком'
    setTimeout(() => successMessage.value = '', 3000)
  } catch (error) {
    console.error('Ошибка принятия работы:', error)
    errorMessage.value = 'Не удалось принять работу'
    setTimeout(() => errorMessage.value = '', 5000)
  }
}

async function rejectWork(workId) {
  const comment = prompt('Введите причину отклонения:')
  if (!comment) return

  try {
    await $fetch(`/api/works/reject/${workId}`, {
      method: 'POST',
      body: { comment },
      credentials: 'include'
    })

    const work = works.value.find(w => w.id === workId)
    if (work) {
      work.rejectionComment = comment
      work.acceptedByClient = false
    }

    successMessage.value = 'Работа отклонена'
    setTimeout(() => successMessage.value = '', 3000)
  } catch (error) {
    console.error('Ошибка отклонения работы:', error)
    errorMessage.value = 'Не удалось отклонить работу'
    setTimeout(() => errorMessage.value = '', 5000)
  }
}

// Обработчик удаления в компонент операций
async function deleteWork(workId, isPaid) {
  const message = isPaid 
    ? 'Вы уверены, что хотите удалить эту оплаченную работу? Это действие вернёт средства контрагенту и обновит баланс объекта.' 
    : 'Вы уверены, что хотите удалить эту работу? Это действие нельзя отменить.';
    
  if (!confirm(message)) {
    return;
  }
  try {
    await $fetch(`/api/works/${workId}`, {
      method: 'DELETE',
      credentials: 'include'
    });
    // Удаляем работу из локального списка
    works.value = works.value.filter(work => work.id !== workId);
    // Эмитим событие об удалении работы
    emit('delete-work', workId);
    successMessage.value = 'Работа успешно удалена';
    setTimeout(() => successMessage.value = '', 3000);
  } catch (error) {
    console.error('Ошибка удаления работы:', error);
    errorMessage.value = 'Не удалось удалить работу';
    setTimeout(() => errorMessage.value = '', 5000);
  }
}

// --- Вспомогательные функции ---
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
  box-shadow: $box-shadow;
  @include transition(all 0.3s ease);

  &:hover {
    transform: translateY(-2px);
    box-shadow: $box-shadow;
  }
}

// ========================================
// Основной блок
// ========================================
.block {
  margin-bottom: 1em;
  position: relative;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

// ========================================
// Баланс — карточки
// ========================================
.balance-summary {
  display: flex;
  gap: 1em;
  margin-bottom: 1em;
  flex-wrap: wrap;
}

.balance-card {
  flex: 1 1 calc(50% - 1rem);
  min-width: 250px;
  background: $background-light;
  border-radius: $border-radius;
  overflow: hidden;
  @include card-shadow();
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1em;
  background: $blue20;
  color: $text-dark;
  font-weight: 600;
  font-size: 1em;
  letter-spacing: 0.3px;
}

.card-body {
  padding: 0 1em 1em;

  p {
    margin: 0;
    font-size: 1.4em;
    font-weight: bold;
    color: $text-dark;
  }
}

.balance-description {
  display: block;
  font-size: 0.9em;
  color: $text-gray;
  margin-top: 0.5em;
}

// ========================================
// Кнопки добавления
// ========================================
.add-buttons {
  display: flex;
  gap: 1em;
  margin-bottom: 1.5em;
  justify-content: center;
  flex-wrap: wrap;

  .btn {
    @include transition(transform 0.2s ease, box-shadow 0.2s ease);
    box-shadow: 0 2px 4px $shadow-color;

    &:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 8px $shadow-color;
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
  margin-bottom: 1.5em;
  background: $background-light;
  border-radius: $border-radius;
  box-shadow: $box-shadow;
  overflow: hidden;
}

.table-section h3 {
  display: flex;
  align-items: center;
  gap: 0.8em;
  margin: 0;
  padding: 1em;
  font-size: 1.1em;
  color: $text-dark;
  border-bottom: 1px solid $border-color;
  background: $sub-item-bg;
}

.table-wrapper {
  max-height: 600px;
  overflow-y: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
  min-width: 100%;
}

th {
  padding: 0.8em 1em;
  background-color: #f8f9fa;
  font-weight: 600;
  color: #34495e;
  text-transform: uppercase;
  font-size: 0.8em;
  letter-spacing: 0.5px;
  border-bottom: 1px solid $border-color;
}

td {
  padding: 0.7em 1em;
  border-bottom: 1px solid #f0f0f0;
  font-size: 0.85em;
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
  gap: 0.8em;
  justify-content: center;

  button {
    padding: 0.3em 0.6em;
    border-radius: $border-radius;
    border: 1px solid $color-muted;
    color: $color-muted;
    cursor: pointer;
    @include transition(all 0.2s ease);

    &:hover {
      background: $color-muted;
      color: #fff;
    }

    &:first-child {
      // Принять
      background: $color-success;
      color: #fff;
      border: none;

      &:hover {
        background: rgba($color-success, 0.9);
      }
    }

    &:nth-child(2) {
      // Отклонить
      background: $color-warning;
      color: #fff;
      border: none;

      &:hover {
        background: rgba($color-warning, 0.9);
      }
    }

    &:last-child {
      // Удалить
      background: $blue;
      color: #fff;
      border: none;

      &:hover {
        background: rgba($blue, 0.9);
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
  gap: 1em;
  padding: 1em;
  margin-bottom: 1em;
  border-radius: $border-radius;
  font-weight: 500;
  font-size: 1em;

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
// Формы и поля
// ========================================
.form-group {
  margin-bottom: 1em;

  label {
    display: block;
    margin-bottom: 0.5em;
    font-weight: 500;
    color: $text-dark;
    font-size: 0.95em;
  }

  input,
  select,
  textarea {
    width: 100%;
    padding: 0.8em 1em;
    border: 1px solid $border-color;
    border-radius: $border-radius;
    background: $background-light;
    color: $text-dark;
    @include transition(border-color, box-shadow);

    &:focus {
      outline: none;
      border-color: $blue;
      box-shadow: 0 0 0 3px rgba($blue, 0.1);
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
  margin-top: 0.5em;
  color: $color-danger;
  font-size: 0.9em;
  font-weight: 500;
}

.required {
  color: $red;
  font-weight: bold;
}

// ========================================
// Кнопки
// ========================================
.btn {
  padding: 0.5em 1em;
  border: none;
  border-radius: $border-radius;
  font-weight: 500;
  cursor: pointer;
  @include transition(all 0.2s ease);
  font-size: 0.95em;

  &.primary {
    background: $blue;
    color: #fff;

    &:hover:not(:disabled) {
      background: rgba($blue, 0.9);
    }

    &:disabled {
      background: $color-muted;
      color: #fff;
      cursor: not-allowed;
      opacity: 0.7;
    }
  }

  &.secondary {
    background: $color-muted;
    color: #fff;

    &:hover {
      background: rgba($color-muted, 0.9);
    }
  }
}

// ========================================
// Адаптивность
// ========================================
@media (max-width: 768px) {
  .balance-summary {
    gap: 1em;
  }

  .balance-card {
    flex: 1 1 100%;
    min-width: auto;
  }

  .add-buttons {
    flex-direction: column;
    align-items: stretch;
    max-width: 300px;
    margin: 0 auto 1.5em;
  }

  .table-wrapper {
    max-height: 400px;
  }

  th, td {
    padding: 0.7em 0.8em;
    font-size: 0.85em;
  }

  .action-buttons {
    gap: 0.5em;
  }

  .action-buttons button {
    font-size: 0.85em;
    padding: 0.4em 0.5em;
  }
}

@media (max-width: 480px) {
  .block {
    padding: 0 0.5em;
  }

  .table-section h3 {
    font-size: 1.1em;
    padding: 1em;
  }

  .btn {
    font-size: 1em;
    padding: 0.8em 1em;
  }

  .notification {
    font-size: 0.95em;
  }
}
</style>