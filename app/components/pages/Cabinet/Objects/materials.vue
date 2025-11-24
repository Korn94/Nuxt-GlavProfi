<template>
  <div class="block">
    
    <!-- Балансы по типам -->
    <div class="balance-summary">
      <div class="balance-card">
        <div class="card-header">
          <span>Приходы</span>
          <Icon name="fa6-solid:arrow-up" width="20" height="20" />
        </div>
        <div class="card-body">
          <p>{{ incomingTotal }} ₽</p>
        </div>
      </div>
      <div class="balance-card">
        <div class="card-header">
          <span>Расходы</span>
          <Icon name="fa6-solid:arrow-down" width="20" height="20" />
        </div>
        <div class="card-body">
          <p>{{ outgoingTotal }} ₽</p>
        </div>
      </div>
      <div class="balance-card total">
        <div class="card-header">
          <span>Итого</span>
          <Icon name="fa6-solid:balance-scale" width="20" height="20" />
        </div>
        <div class="card-body">
          <p :class="{ 'positive': Number(totalBalance) >= 0, 'negative': Number(totalBalance) < 0 }">
            {{ totalBalance }} ₽
          </p>
        </div>
      </div>
    </div>

    <!-- Фильтрация по типу -->
    <div class="filter">
      <select v-model="filterType">
        <option value="">Все</option>
        <option value="incoming">Приход</option>
        <option value="outgoing">Расход</option>
      </select>
    </div>

    <!-- Фильтр по дате -->
    <div class="date-filters">
      <div class="date-group">
        <label>С</label>
        <input
          type="date"
          v-model="startDate"
          @change="applyFilters"
          :max="endDate || ''"
        />
      </div>
      <div class="date-group">
        <label>По</label>
        <input
          type="date"
          v-model="endDate"
          @change="applyFilters"
          :min="startDate || ''"
        />
      </div>
      <button @click="clearDateFilter" class="btn secondary">Сбросить</button>
    </div>

    <!-- Кнопки добавления -->
    <div class="add-buttons">
      <button @click="openModal('incoming')" class="btn primary">Добавить приход</button>
      <button @click="openModal('outgoing')" class="btn primary">Добавить расход</button>
    </div>

    <h3>Материалы ({{ materials.length }})</h3>

    <!-- Таблица материалов -->
    <div class="table-section">
      <table>
        <thead>
          <tr>
            <th>Дата</th>
            <th>Название</th>
            <th>Сумма</th>
            <th>Тип</th>
            <th>Наличие чека</th>
            <th>Действия</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(material, $index) in filteredMaterials" :key="material.id" :class="{ 'odd-row': $index % 2 === 0 }">
            <td>{{ formatDate(material.operationDate) }}</td>
            <td>{{ material.name }}</td>
            <td>{{ formatAmount(material.amount) }} ₽</td>
            <td>{{ material.type === 'incoming' ? 'Приход' : 'Расход' }}</td>
            <td>
              <input
                type="checkbox"
                :checked="material.hasReceipt"
                @click="toggleCheck(material)"
                class="status-checkbox"
                :disabled="!canToggleReceipt(material)"
              />
            </td>
            <td class="action-cell">
              <button @click="editMaterial(material)" class="btn small">Ред</button>
              <button @click="deleteMaterial(material.id)" class="btn small danger">×</button>
            </td>
          </tr>
        </tbody>
      </table>
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

    <!-- Модальное окно -->
    <PagesCabinetUiModal
      :visible="isModalOpen"
      @update:visible="closeModal"
      :title="isEditing ? 'Редактировать материал' : 'Добавить материал'"
      size="md"
      closable
    >
      <!-- Тело модалки -->
      <div class="modal-body">
        <div class="form-group">
          <input
            type="text"
            v-model="currentMaterial.name"
            placeholder="Название"
            required
            :class="{ error: formErrors.name }"
          />
          <span v-if="formErrors.name" class="error-message">{{ formErrors.name }}</span>
        </div>

        <div class="form-group">
          <input
            type="number"
            step="100"
            v-model.number="currentMaterial.amount"
            placeholder="Сумма"
            required
            :class="{ error: formErrors.amount }"
          />
          <span v-if="formErrors.amount" class="error-message">{{ formErrors.amount }}</span>
        </div>

        <div class="form-group">
          <label>Дата операции</label>
          <input
            type="date"
            v-model="currentMaterial.operationDate"
            required
            :class="{ error: formErrors.operationDate }"
          />
          <span v-if="formErrors.operationDate" class="error-message">{{ formErrors.operationDate }}</span>
        </div>

        <div class="form-group">
          <textarea v-model="currentMaterial.comment" placeholder="Комментарий"></textarea>
        </div>

        <div v-if="currentMaterial.type === 'outgoing'" class="form-group">
          <label>
            <input type="checkbox" v-model="currentMaterial.hasReceipt" />
            Наличие чека
          </label>
        </div>
      </div>

      <!-- Футер -->
      <template #footer>
        <div class="modal-footer-controls">
          <button @click="closeModal" class="btn secondary">Отмена</button>
          <button @click="saveMaterial" :disabled="!isFormValid" class="btn primary">
            {{ isEditing ? 'Сохранить' : 'Добавить' }}
          </button>
        </div>
      </template>
    </PagesCabinetUiModal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

// Состояние модального окна
const isModalOpen = ref(false)
const modalType = ref('incoming')

// Данные
const materials = ref([])
const currentMaterial = ref({
  name: '',
  amount: 0,
  comment: '',
  hasReceipt: false,
  objectId: route.params.id,
  type: 'incoming',
  operationDate: new Date().toISOString().split('T')[0]
})
const isEditing = ref(false)
const filterType = ref('')
const startDate = ref('')
const endDate = ref('')
const formErrors = ref({})
const successMessage = ref('')
const errorMessage = ref('')

// Валидация формы
const isFormValid = computed(() => {
  return (
    currentMaterial.value.name?.trim() !== '' &&
    Number(currentMaterial.value.amount) > 0 &&
    ['incoming', 'outgoing'].includes(currentMaterial.value.type)
  )
})

// Сортирует массив по operationDate в порядке убывания
function sortByDateDesc(array) {
  return [...array].sort((a, b) => new Date(b.operationDate) - new Date(a.operationDate))
}

// Фильтрация и сортировка материалов
const filteredMaterials = computed(() => {
  return sortByDateDesc(materials.value)
})

// Вычисляемые балансы
const incomingTotal = computed(() => {
  return filteredMaterials.value
    .filter(m => m.type === 'incoming')
    .reduce((sum, m) => sum + Number(m.amount), 0)
    .toFixed(2)
})

const outgoingTotal = computed(() => {
  return filteredMaterials.value
    .filter(m => m.type === 'outgoing')
    .reduce((sum, m) => sum + Number(m.amount), 0)
    .toFixed(2)
})

const totalBalance = computed(() => {
  const total = Number(incomingTotal.value) - Number(outgoingTotal.value)
  return total.toFixed(2)
})

// Форматирование числа
const formatAmount = (amount) => {
  return Number(amount).toLocaleString('ru-RU')
}

// Форматирование даты
function formatDate(dateString) {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit'
  })
}

// Загрузка данных
async function fetchMaterials() {
  try {
    const params = {
      objectId: route.params.id,
      type: filterType.value
    }

    if (startDate.value) params.startDate = startDate.value
    if (endDate.value) params.endDate = endDate.value

    const data = await $fetch(`/api/materials`, {
      method: 'GET',
      params,
      credentials: 'include'
    })

    materials.value = data.map(m => ({
      ...m,
      amount: Number(m.amount)
    }))
    clearMessages()
  } catch (error) {
    console.error('Ошибка загрузки материалов:', error)
    errorMessage.value = 'Не удалось загрузить материалы'
    setTimeout(() => errorMessage.value = '', 5000)
  }
}

// Сохранение материала
async function saveMaterial() {
  formErrors.value = {}

  if (!currentMaterial.value.name?.trim()) {
    formErrors.value.name = 'Название обязательно'
  }

  if (Number(currentMaterial.value.amount) <= 0) {
    formErrors.value.amount = 'Сумма должна быть больше нуля'
  }

  if (!currentMaterial.value.operationDate || isNaN(Date.parse(currentMaterial.value.operationDate))) {
    formErrors.value.operationDate = 'Укажите корректную дату'
  }

  if (Object.keys(formErrors.value).length > 0) return

  try {
    if (isEditing.value) {
      await $fetch(`/api/materials/${currentMaterial.value.id}`, {
        method: 'PUT',
        body: currentMaterial.value,
        credentials: 'include'
      })
    } else {
      const created = await $fetch('/api/materials', {
        method: 'POST',
        body: currentMaterial.value,
        credentials: 'include'
      })
      materials.value.push(created)
    }

    closeModal()
    successMessage.value = 'Материал успешно сохранён'
    setTimeout(() => (successMessage.value = ''), 3000)
  } catch (error) {
    console.error('Ошибка сохранения материала:', error)
    errorMessage.value = 'Не удалось сохранить материал'
    setTimeout(() => (errorMessage.value = ''), 5000)
  }
}

// Редактирование материала
async function editMaterial(material) {
  const date = new Date(material.operationDate)
  currentMaterial.value = {
    ...material,
    operationDate: isNaN(date.getTime())
      ? new Date().toISOString().split('T')[0]
      : date.toISOString().split('T')[0]
  }
  isEditing.value = true
  modalType.value = material.type
  openModal(material.type)
}

// Удаление материала
async function deleteMaterial(id) {
  if (!confirm('Вы уверены, что хотите удалить этот материал?')) return

  try {
    await $fetch(`/api/materials/${id}`, {
      method: 'DELETE',
      credentials: 'include'
    })

    materials.value = materials.value.filter(m => m.id !== id)
    successMessage.value = 'Материал удален'
    setTimeout(() => (successMessage.value = ''), 3000)
  } catch (error) {
    console.error('Ошибка удаления материала:', error)
    errorMessage.value = 'Не удалось удалить материал'
    setTimeout(() => (errorMessage.value = ''), 5000)
  }
}

// Фильтр по дате
function applyFilters() {
  fetchMaterials()
}

function clearDateFilter() {
  startDate.value = ''
  endDate.value = ''
  fetchMaterials()
}

// Переключение чека
async function toggleCheck(material) {
  if (material.hasReceipt) {
    alert('Снятие чека разрешено только через редактирование')
    return
  }

  try {
    await $fetch(`/api/materials/${material.id}/toggle-check`, {
      method: 'PATCH',
      body: { hasReceipt: true },
      credentials: 'include'
    })

    const index = materials.value.findIndex(m => m.id === material.id)
    if (index !== -1) {
      materials.value[index].hasReceipt = true
    }
  } catch (error) {
    console.error('Ошибка изменения статуса чека:', error)
    errorMessage.value = 'Не удалось изменить статус чека'
    setTimeout(() => (errorMessage.value = ''), 5000)
  }
}

// Можно ли переключить чек
const canToggleReceipt = (material) => {
  return material.type === 'outgoing' && !material.hasReceipt
}

// Сброс формы
function resetForm() {
  currentMaterial.value = {
    name: '',
    amount: 0,
    comment: '',
    hasReceipt: false,
    objectId: route.params.id,
    type: modalType.value,
    operationDate: new Date().toISOString().split('T')[0]
  }
  isEditing.value = false
  formErrors.value = {}
}

// Очистка сообщений
function clearMessages() {
  successMessage.value = ''
  errorMessage.value = ''
}

// Открытие модалки
function openModal(type) {
  modalType.value = type
  if (!isEditing.value) {
    resetForm()
  }
  isModalOpen.value = true
}

// Закрытие модалки
function closeModal() {
  isModalOpen.value = false
  nextTick(() => {
    resetForm()
  })
}

// Слежение за параметрами
watch(
  () => [route.params.id, filterType.value, startDate.value, endDate.value],
  async ([newId]) => {
    currentMaterial.value.objectId = newId
    await fetchMaterials()
  },
  { immediate: true }
)

onMounted(async () => {
  await fetchMaterials()
})
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
  flex: 1 1 calc(33% - 1rem);
  min-width: 250px;
  background: $background-light;
  border-radius: $border-radius;
  overflow: hidden;
  @include card-shadow();

  &.total {
    background: $blue20;
    color: $text-dark;

    .card-header {
      background: rgba($blue, 0.1);
    }

    p {
      color: $blue;
      font-weight: bold;
    }
  }
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1em;
  background: $sub-item-bg;
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

  &.positive {
    color: $color-success;
  }

  &.negative {
    color: $red;
  }
}

// ========================================
// Фильтры
// ========================================
.filter {
  margin-bottom: 1em;

  select {
    padding: 0.7em 1em;
    border: 1px solid $border-color;
    border-radius: $border-radius;
    background: $background-light;
    color: $text-dark;
    font-size: 0.95em;

    &:focus {
      outline: none;
      border-color: $blue;
      box-shadow: 0 0 0 3px rgba($blue, 0.1);
    }
  }
}

.date-filters {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
  align-items: end;

  .date-group {
    label {
      display: block;
      margin-bottom: 0.5em;
      font-size: 0.9em;
      color: $text-dark;
    }

    input[type="date"] {
      padding: 0.6em;
      border: 1px solid $border-color;
      border-radius: $border-radius;
      background: $background-light;
      font-size: 0.95em;

      &:focus {
        outline: none;
        border-color: $blue;
        box-shadow: 0 0 0 3px rgba($blue, 0.1);
      }
    }
  }
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
}

// ========================================
// Таблица материалов
// ========================================
.table-section {
  margin-bottom: 1.5em;
  background: $background-light;
  border-radius: $border-radius;
  box-shadow: $box-shadow;
  overflow: hidden;
}

.table-section h3 {
  margin: 0 0 1em 0;
  color: $text-dark;
  font-size: 1.2em;
}

table {
  width: 100%;
  border-collapse: collapse;
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

.action-cell {
  display: flex;
  gap: 0.8em;
  justify-content: center;
}

.status-checkbox {
  accent-color: $blue;
  transform: scale(1.2);
  cursor: pointer;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

// ========================================
// Кнопки в таблице
// ========================================
.btn {
  padding: 0.4em 0.8em;
  border: none;
  border-radius: $border-radius;
  font-weight: 500;
  cursor: pointer;
  @include transition(all 0.2s ease);
  font-size: 0.9em;

  &.primary {
    background: $blue;
    color: #fff;

    &:hover:not(:disabled) {
      background: rgba($blue, 0.9);
    }

    &:disabled {
      background: $color-muted;
      opacity: 0.7;
      cursor: not-allowed;
    }
  }

  &.secondary {
    background: $color-muted;
    color: #fff;

    &:hover {
      background: rgba($color-muted, 0.9);
    }
  }

  &.small {
    padding: 0.2em 0.5em;
    font-size: 0.85em;

    &.danger {
      background: $red;
      color: #fff;

      &:hover {
        background: rgba($red, 0.9);
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

// ========================================
// Модальное окно
// ========================================
.modal-body {
  padding: 1em 0;
}

.modal-footer-controls {
  display: flex;
  justify-content: flex-end;
  gap: 1em;
}

// ========================================
// Адаптивность
// ========================================
@media (max-width: 768px) {
  .balance-summary {
    flex-direction: column;
    gap: 0.8em;
  }

  .balance-card {
    flex: 1 1 100%;
  }

  .date-filters {
    flex-direction: column;
    align-items: stretch;

    .date-group {
      max-width: 100%;
    }
  }

  .add-buttons {
    flex-direction: column;
    align-items: stretch;
    max-width: 300px;
    margin: 0 auto 1.5em;
  }

  th, td {
    padding: 0.6em 0.8em;
    font-size: 0.8em;
  }

  .btn.small {
    font-size: 0.8em;
    padding: 0.3em 0.5em;
  }
}

@media (max-width: 480px) {
  .block {
    padding: 0 0.5em;
  }

  .notification {
    font-size: 0.95em;
  }
}
</style>