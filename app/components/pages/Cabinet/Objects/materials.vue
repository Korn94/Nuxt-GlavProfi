<template>
  <div class="block">
    
    <!-- Балансы по типам -->
    <div class="balance-summary">
      <div class="balance-card">
        <div class="card-header">
          <span>Приходы</span>
          <i class="fas fa-arrow-up"></i>
        </div>
        <div class="card-body">
          <p>{{ incomingTotal }} ₽</p>
        </div>
      </div>
      <div class="balance-card">
        <div class="card-header">
          <span>Расходы</span>
          <i class="fas fa-arrow-down"></i>
        </div>
        <div class="card-body">
          <p>{{ outgoingTotal }} ₽</p>
        </div>
      </div>
      <div class="balance-card total">
        <div class="card-header">
          <span>Итого</span>
          <i class="fas fa-balance-scale"></i>
        </div>
        <div class="card-body">
          <p>{{ totalBalance }} ₽</p>
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
            <td class="flex">
              <button @click="editMaterial(material)" class="btn small">Ред</button>
              <button @click="deleteMaterial(material.id)" class="btn small danger">✕</button>
            </td>
          </tr>
        </tbody>
      </table>
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
            step="100.00"
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
import { useNuxtApp } from '#app'

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
const formErrors = ref({})
const successMessage = ref('')
const errorMessage = ref('')

// Валидация формы
const isFormValid = computed(() => {
  return (
    currentMaterial.value.name.trim() !== '' &&
    Number(currentMaterial.value.amount) > 0 &&
    ['incoming', 'outgoing'].includes(currentMaterial.value.type)
  )
})

// Сортирует массив по operationDate в порядке убывания (новые — сверху)
function sortByDateDesc(array) {
  return [...array].sort((a, b) => new Date(b.operationDate) - new Date(a.operationDate))
}

// Фильтрация и сортировка материалов
const filteredMaterials = computed(() => {
  const filtered = materials.value.filter(material => {
    const matchesType = !filterType.value || material.type === filterType.value
    const matchesObject = parseInt(material.objectId) === parseInt(route.params.id)
    return matchesType && matchesObject
  })

  // Сортируем отфильтрованные материалы: новые — сверху
  return sortByDateDesc(filtered)
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
  return (Number(incomingTotal.value) - Number(outgoingTotal.value)).toFixed(2)
})

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

// Методы для работы с материалами
async function fetchMaterials() {
  try {
    const data = await $fetch(`/api/materials`, {
      method: 'GET',
      params: { objectId: route.params.id, type: filterType.value },
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
  }
}

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

async function toggleCheck(material) {
  if (material.hasReceipt) {
    alert('Снятие чека разрешено только через редактирование')
    return
  }

  const checked = true
  try {
    await $fetch(`/api/materials/${material.id}/toggle-check`, {
      method: 'PATCH',
      body: { hasReceipt: checked },
      credentials: 'include'
    })

    // Локальное обновление
    const index = materials.value.findIndex(m => m.id === material.id)
    if (index !== -1) {
      materials.value[index].hasReceipt = checked
    }
  } catch (error) {
    console.error('Ошибка изменения статуса чека:', error)
    errorMessage.value = 'Не удалось изменить статус чека'
    setTimeout(() => (errorMessage.value = ''), 5000)
  }
}

// Определяет, можно ли менять флаг hasReceipt
const canToggleReceipt = (material) => {
  return material.type === 'outgoing' && !material.hasReceipt
}

function resetForm() {
  currentMaterial.value = {
    name: '',
    amount: 0,
    comment: '',
    hasReceipt: false,
    objectId: route.params.id,
    type: modalType.value,
    operationDate: new Date().toISOString().split('T')[0] // <-- Сегодняшняя дата
  }
  isEditing.value = false
  formErrors.value = {}
}

function clearMessages() {
  successMessage.value = ''
  errorMessage.value = ''
}

// Открытие модального окна
function openModal(type) {
  modalType.value = type
  if (!isEditing.value) {
    resetForm()
  }
  isModalOpen.value = true
}

// Закрытие модального окна
function closeModal() {
  isModalOpen.value = false
  // Сброс формы при закрытии
  nextTick(() => {
    resetForm()
  })
}

// Следим за изменением объекта
watch(
  () => route.params.id,
  async (newId) => {
    currentMaterial.value.objectId = newId
    await fetchMaterials()
  }
)

onMounted(async () => {
  await fetchMaterials()
})
</script>

<style lang="scss" scoped>
.block {
  margin-bottom: 2rem;
  position: relative;
}

.filter {
  margin-bottom: 1.5rem;
  select {
    width: 100%;
    padding: 0.5rem;
    border: 1px solid #ccc;
    border-radius: 6px;
    font-size: 1rem;
  }
}

.add-buttons {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.table-section {
  background: #ffffff;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
  padding: 1rem;
  transition: all 0.3s ease;
  overflow: hidden;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th,
td {
  padding: 0.75rem 1rem;
  text-align: left;
  border-bottom: 1px solid #f0f0f0;
}

tr:hover {
  background-color: #f9f9f9;
  transition: background-color 0.3s ease;
}

.odd-row {
  background-color: #fafafa;
}

.status-checkbox {
  transform: scale(1.2);
}

.balance-summary {
  display: flex;
  gap: 1.5rem;
  flex-wrap: wrap;
  margin-top: 2rem;
}

.balance-card {
  flex: 1 1 calc(33% - 1.5rem);
  min-width: 200px;
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
  background: #f0f8ff;
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

.total {
  .card-header {
    background: #e6e6e6;
  }
  .card-body {
    color: #34495e;
  }
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

.danger {
  background-color: #dc3545;
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
  .balance-card {
    flex: 1 1 100%;
  }
}
</style>