<!-- app/pages/cabinet/materials.vue -->
<template>
  <PagesCabinetUiLayoutPageTitle title="Материалы">
    <template #actions>
      <!-- Кнопка добавления материала -->
      <button @click="openModal('incoming')" class="btn btn-sm primary">Добавить приход</button>
      <button @click="openModal('outgoing')" class="btn btn-sm primary">Добавить расход</button>
    </template>
  </PagesCabinetUiLayoutPageTitle>

  <!-- Сообщения об ошибках и успехе -->
  <div v-if="errorMessage" class="alert alert-error" style="margin: 0 2rem 1rem;">
    {{ errorMessage }}
  </div>
  <div v-else-if="successMessage" class="alert alert-success" style="margin: 0 2rem 1rem;">
    {{ successMessage }}
  </div>

  <!-- Фильтры -->
  <Card bordered elevated no-padding-body class="filters-card cabinet-page">
    <template #header>
      <h3>Фильтры</h3>
    </template>
    <div class="filter-group">
      <!-- Фильтр по объекту -->
      <div class="filter-item">
        <label>Объект</label>
        <select v-model="filterObjectId" @change="applyFilters">
          <option value="">Все объекты</option>
          <option v-for="obj in objects" :key="obj.id" :value="obj.id">
            {{ obj.name }} ({{ obj.address || 'Без адреса' }})
          </option>
        </select>
      </div>
      <!-- Фильтр по типу -->
      <div class="filter-item">
        <label>Тип</label>
        <select v-model="filterType" @change="applyFilters">
          <option value="">Все</option>
          <option value="incoming">Приход</option>
          <option value="outgoing">Расход</option>
        </select>
      </div>
      <!-- Фильтр по наличию чека -->
      <div class="filter-item">
        <label>Чек</label>
        <select v-model="filterHasReceipt" @change="applyFilters">
          <option value="">Все</option>
          <option value="true">Есть чек</option>
          <option value="false">Нет чека</option>
        </select>
      </div>
      <!-- Фильтр по дате -->
      <div class="date-filters">
        <div class="date-group">
          <label>С</label>
          <input type="date" v-model="startDate" @change="applyFilters" :max="endDate || ''" />
        </div>
        <div class="date-group">
          <label>По</label>
          <input type="date" v-model="endDate" @change="applyFilters" :min="startDate || ''" />
        </div>
        <button @click="clearDateFilter" class="btn secondary">Сбросить</button>
      </div>
      <!-- Фильтр по сумме (диапазон) -->
      <div class="amount-filters">
        <div class="amount-group">
          <label>Сумма от</label>
          <input type="number" step="100" v-model.number="minAmount" @change="applyFilters" placeholder="0" />
        </div>
        <div class="amount-group">
          <label>Сумма до</label>
          <input type="number" step="100" v-model.number="maxAmount" @change="applyFilters" placeholder="∞" />
        </div>
        <button @click="clearAmountFilter" class="btn secondary">Сбросить</button>
      </div>
      <!-- Фильтр по началу суммы -->
      <div class="amount-prefix-filter">
        <div class="amount-group">
          <label>Сумма начинается с</label>
          <input type="text" v-model="amountPrefix" @input="applyFilters" placeholder="Например: 15" />
        </div>
        <button @click="clearAmountPrefixFilter" class="btn secondary">Сбросить</button>
      </div>
    </div>
  </Card>

  <!-- Таблица материалов -->
  <Card bordered elevated no-padding-body class="cabinet-page">
    <template #header>
      <h3>
        Материалы ({{ materials.length }})
        <span v-if="materialsWithoutReceipt > 0" class="badge badge-warning">
          Без чека: {{ materialsWithoutReceipt }}
        </span>
      </h3>
    </template>
    <div class="table-section">
      <table>
        <thead>
          <tr>
            <th>Дата</th>
            <th>Объект</th>
            <th>Название</th>
            <th>Сумма</th>
            <th>Тип</th>
            <th>Чек</th>
            <th>Действия</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(material, $index) in filteredMaterials" :key="material.id" :class="{ 'odd-row': $index % 2 === 0 }">
            <td>{{ formatDate(material.operationDate) }}</td>
            <td>
              <router-link :to="`/cabinet/objects/${material.objectId}`" class="object-link">
                {{ getObjectById(material.objectId)?.name || '—' }}
              </router-link>
            </td>
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
  </Card>

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
        <label>Объект</label>
        <select v-model="currentMaterial.objectId" required :class="{ error: formErrors.objectId }">
          <option value="">Выберите объект</option>
          <option v-for="obj in objects" :key="obj.id" :value="obj.id">
            {{ obj.name }} ({{ obj.address || 'Без адреса' }})
          </option>
        </select>
        <span v-if="formErrors.objectId" class="error-message">{{ formErrors.objectId }}</span>
      </div>
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
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Card from '@/components/pages/cabinet/ui/cards/card.vue'

// Состояние
const isModalOpen = ref(false)
const modalType = ref('incoming')
const isEditing = ref(false)

// Данные
const materials = ref([])
const objects = ref([]) // Для фильтрации по объектам
const currentMaterial = ref({
  id: null,
  name: '',
  amount: 0,
  comment: '',
  hasReceipt: false,
  objectId: null, // Будет заполняться из select
  type: 'incoming',
  operationDate: new Date().toISOString().split('T')[0]
})

// Фильтры
const filterObjectId = ref('')
const filterType = ref('')
const filterHasReceipt = ref('')
const startDate = ref('')
const endDate = ref('')
// Фильтры по сумме (диапазон)
const minAmount = ref(null)
const maxAmount = ref(null)
// Фильтр по началу суммы
const amountPrefix = ref('')

// Валидация формы
const formErrors = ref({})
const successMessage = ref('')
const errorMessage = ref('')

// Вычисляемое свойство для валидации формы
const isFormValid = computed(() => {
  return (
    currentMaterial.value.name?.trim() !== '' &&
    Number(currentMaterial.value.amount) > 0 &&
    ['incoming', 'outgoing'].includes(currentMaterial.value.type) &&
    currentMaterial.value.objectId
  )
})

// Сортирует массив по operationDate в порядке убывания
function sortByDateDesc(array) {
  return [...array].sort((a, b) => new Date(b.operationDate) - new Date(a.operationDate))
}

// Фильтрация и сортировка материалов
const filteredMaterials = computed(() => {
  let filtered = [...materials.value]

  if (filterObjectId.value) {
    filtered = filtered.filter(m => m.objectId == filterObjectId.value)
  }
  if (filterType.value) {
    filtered = filtered.filter(m => m.type === filterType.value)
  }
  if (filterHasReceipt.value !== '') {
    filtered = filtered.filter(m => m.hasReceipt === (filterHasReceipt.value === 'true'))
  }
  if (startDate.value) {
    const start = new Date(startDate.value)
    filtered = filtered.filter(m => new Date(m.operationDate) >= start)
  }
  if (endDate.value) {
    const end = new Date(endDate.value)
    filtered = filtered.filter(m => new Date(m.operationDate) <= end)
  }

  // Фильтр по диапазону суммы
  if (minAmount.value !== null && minAmount.value !== '') {
    filtered = filtered.filter(m => m.amount >= minAmount.value)
  }
  if (maxAmount.value !== null && maxAmount.value !== '') {
    filtered = filtered.filter(m => m.amount <= maxAmount.value)
  }

  // Фильтр по началу суммы (если поле не пустое)
  if (amountPrefix.value.trim() !== '') {
    const prefix = amountPrefix.value.trim()
    filtered = filtered.filter(m => {
      // Преобразуем сумму в строку и проверяем, начинается ли она с указанного префикса
      const amountStr = String(m.amount).replace('.', '').replace(',', '')
      return amountStr.startsWith(prefix)
    })
  }

  return sortByDateDesc(filtered)
})

// Получение объекта по ID для отображения в таблице
const getObjectById = (id) => {
  return objects.value.find(obj => obj.id == id)
}

// Форматирование числа
const formatAmount = (amount) => {
  return Number(amount).toLocaleString('ru-RU')
}

// Вычисляемое свойство: количество материалов без чека (hasReceipt === false)
const materialsWithoutReceipt = computed(() => {
  return filteredMaterials.value.filter(m => m.type === 'outgoing' && !m.hasReceipt).length
})

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
    const params = {}
    if (filterObjectId.value) params.objectId = filterObjectId.value
    if (filterType.value) params.type = filterType.value
    if (startDate.value) params.startDate = startDate.value
    if (endDate.value) params.endDate = endDate.value
    // Добавляем параметры для фильтра по сумме
    if (minAmount.value !== null && minAmount.value !== '') params.minAmount = minAmount.value
    if (maxAmount.value !== null && maxAmount.value !== '') params.maxAmount = maxAmount.value
    // Добавляем параметр для фильтра по началу суммы
    if (amountPrefix.value.trim() !== '') params.amountPrefix = amountPrefix.value.trim()

    const data = await $fetch('/api/materials', {
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

// Загрузка списка объектов для фильтра
async function fetchObjects() {
  try {
    const data = await $fetch('/api/objects', {
      method: 'GET',
      credentials: 'include'
    })
    objects.value = data
  } catch (error) {
    console.error('Ошибка загрузки объектов:', error)
    errorMessage.value = 'Не удалось загрузить список объектов'
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
  if (!currentMaterial.value.objectId) {
    formErrors.value.objectId = 'Объект обязателен'
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

// Очистка фильтра по сумме (диапазон)
function clearAmountFilter() {
  minAmount.value = null
  maxAmount.value = null
  fetchMaterials()
}

// Очистка фильтра по началу суммы
function clearAmountPrefixFilter() {
  amountPrefix.value = ''
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
    id: null,
    name: '',
    amount: 0,
    comment: '',
    hasReceipt: false,
    objectId: null,
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
  () => [filterObjectId.value, filterType.value, filterHasReceipt.value, startDate.value, endDate.value, minAmount.value, maxAmount.value, amountPrefix.value],
  async () => {
    await fetchMaterials()
  },
  { immediate: true }
)

onMounted(async () => {
  await Promise.all([
    fetchMaterials(),
    fetchObjects()
  ])
})

// Мета-информация
definePageMeta({
  layout: 'cabinet',
  middleware: 'role',
  allowedRoles: ['admin']
})

useHead(() => ({
  meta: [
    { name: 'robots', content: 'noindex, nofollow' },
  ],
  title: 'CRM — Материалы'
}))
</script>

<style lang="scss" scoped>
.cabinet-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: unset;
}

.filters-card {
  margin-bottom: 1.5rem;
  .filter-group {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
    align-items: end;
    padding: 1rem;
  }
  .filter-item {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    label {
      font-size: 0.9em;
      color: $color-muted;
    }
    select,
    input[type="date"] {
      padding: 0.6em;
      border: 1px solid $border-color;
      border-radius: $border-radius;
      background: $background-light;
      color: $text-dark;
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
    align-items: end;
    .date-group {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      label {
        font-size: 0.9em;
        color: $color-muted;
      }
      input[type="date"] {
        padding: 0.6em;
        border: 1px solid $border-color;
        border-radius: $border-radius;
        background: $background-light;
        color: $text-dark;
        &:focus {
          outline: none;
          border-color: $blue;
          box-shadow: 0 0 0 3px rgba($blue, 0.1);
        }
      }
    }
    button {
      padding: 0.6em 1em;
      border: none;
      border-radius: $border-radius;
      cursor: pointer;
      font-weight: 500;
      transition: all 0.2s ease;
      &.secondary {
        background: $color-muted;
        color: white;
        &:hover {
          background: rgba($color-muted, 0.9);
        }
      }
    }
  }
  // Стили для фильтра по сумме (диапазон)
  .amount-filters {
    display: flex;
    gap: 1rem;
    align-items: end;
    .amount-group {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      label {
        font-size: 0.9em;
        color: $color-muted;
      }
      input[type="number"] {
        padding: 0.6em;
        border: 1px solid $border-color;
        border-radius: $border-radius;
        background: $background-light;
        color: $text-dark;
        &:focus {
          outline: none;
          border-color: $blue;
          box-shadow: 0 0 0 3px rgba($blue, 0.1);
        }
      }
    }
    button {
      padding: 0.6em 1em;
      border: none;
      border-radius: $border-radius;
      cursor: pointer;
      font-weight: 500;
      transition: all 0.2s ease;
      &.secondary {
        background: $color-muted;
        color: white;
        &:hover {
          background: rgba($color-muted, 0.9);
        }
      }
    }
  }
  // Стили для фильтра по началу суммы
  .amount-prefix-filter {
    display: flex;
    gap: 1rem;
    align-items: end;
    .amount-group {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      label {
        font-size: 0.9em;
        color: $color-muted;
      }
      input[type="text"] {
        padding: 0.6em;
        border: 1px solid $border-color;
        border-radius: $border-radius;
        background: $background-light;
        color: $text-dark;
        &:focus {
          outline: none;
          border-color: $blue;
          box-shadow: 0 0 0 3px rgba($blue, 0.1);
        }
      }
    }
    button {
      padding: 0.6em 1em;
      border: none;
      border-radius: $border-radius;
      cursor: pointer;
      font-weight: 500;
      transition: all 0.2s ease;
      &.secondary {
        background: $color-muted;
        color: white;
        &:hover {
          background: rgba($color-muted, 0.9);
        }
      }
    }
  }
}

.badge {
  padding: 0.3em 0.6em;
  border-radius: $border-radius;
  font-size: 0.85em;
  font-weight: 500;
  margin-left: 1em;
  &.badge-warning {
    background-color: $background-light;
    color: $text-dark;
  }
}

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
  // @include transition(background-color 0.2s ease);
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

.object-link {
  color: $blue;
  text-decoration: none;
  &:hover {
    text-decoration: underline;
  }
}

// --- Общие стили кнопок и форм ---
.btn {
  padding: 0.4em 0.8em;
  border: none;
  border-radius: $border-radius;
  font-weight: 500;
  cursor: pointer;
  // @include transition(all 0.2s ease);
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
    // @include transition(border-color, box-shadow);
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

.modal-body {
  padding: 1em 0;
}

.modal-footer-controls {
  display: flex;
  justify-content: flex-end;
  gap: 1em;
}

// Адаптивность
@media (max-width: 768px) {
  .filters-card .filter-group {
    flex-direction: column;
    gap: 0.8em;
  }
  .filter-item,
  .date-filters,
  .amount-filters,
  .amount-prefix-filter {
    width: 100%;
  }
  .date-filters,
  .amount-filters,
  .amount-prefix-filter {
    flex-direction: column;
    align-items: stretch;
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
</style>