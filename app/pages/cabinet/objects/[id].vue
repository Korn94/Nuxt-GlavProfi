<template>
  <!-- Заголовок страницы -->
  <PagesCabinetUiLayoutPageTitle :title="object.name">
    <template #actions>
      <!-- Кнопка редактирования -->
      <button v-if="isAdmin" class="btn btn-sm primary">Редактировать</button>

      <!-- Кнопки управления объектом -->
      <button
        v-if="isAdmin"
        @click="toggleStatus"
        class="btn btn-sm"
        :class="object.status === 'active' ? 'btn-warning' : 'btn-success'"
      >
        {{ object.status === 'active' ? 'Завершить' : 'Возобновить' }}
      </button>
      <button
        v-if="isAdmin"
        @click="confirmDelete"
        class="btn btn-sm btn-danger"
      >
        Удалить
      </button>
    </template>
  </PagesCabinetUiLayoutPageTitle>

  <!-- Сообщения об ошибках и успехе -->
  <div v-if="errorMessage" class="alert alert-error" style="margin: 0 2rem 1rem;">
    {{ errorMessage }}
  </div>
  <div v-else-if="successMessage" class="alert alert-success" style="margin: 0 2rem 1rem;">
    {{ successMessage }}
  </div>

  <div class="object-detail-layout">
    <!-- Статус и информация -->
    <Card class="status-card" bordered elevated>
      <template #header>
        <div class="status-header">
          <h3>Информация об объекте</h3>
        </div>
      </template>
      <template #actions>
        <div class="status-header">
          <span class="status-badge" :class="`status-${object.status?.toLowerCase()}`">
            {{ object.status }}
          </span>
        </div>
      </template>
      <p><strong>Адрес:</strong> {{ object.address || '—' }}</p>
      <p><strong>Дата начала:</strong> {{ formatDate(object.startDate) }}</p>
      <p><strong>Плановая дата завершения:</strong> {{ formatDate(object.endDate) }}</p>
      <p><strong>Объект из:</strong> —</p>
      <p><strong>Комментарий:</strong> —</p>
    </Card>

    <!-- Прораб -->
    <Card title="Прораб" bordered elevated>
      <div v-if="object.foreman" class="foreman-info">
        🛠️ <strong>{{ object.foreman.name }}</strong>
      </div>
      <div v-else class="empty-state">Не назначен</div>

      <template v-if="isAdmin" #footer>
        <div class="assign-foreman-form">
          <select v-model="selectedForemanId" class="form-select">
            <option :value="null">— Не выбран —</option>
            <option v-for="foreman in foremans" :key="foreman.id" :value="foreman.id">
              {{ foreman.name }}
            </option>
          </select>
          <button @click="assignForeman" class="btn primary btn-sm">Сохранить</button>
        </div>
      </template>
    </Card>

    <!-- Баланс -->
    <Card title="Баланс объекта" bordered elevated>
      <div class="balance-grid">
        <div class="balance-item">
          <div class="label">Общий баланс</div>
          <div class="value">{{ formatCurrency(object.totalBalance) }}</div>
        </div>
        <div class="balance-item">
          <div class="label muted">Приходы</div>
          <div class="value muted">{{ formatCurrency(object.totalIncome) }}</div>
        </div>
        <div class="balance-item">
          <div class="label muted">Расходы (работы)</div>
          <div class="value muted">{{ formatCurrency(object.totalWorks) }}</div>
        </div>
      </div>

      <!-- Материалы -->
      <div class="materials-balance">
        <div class="divider"></div>
        <div class="material-row">
          <span>Материалы:</span>
          <strong :class="{ 'text-danger': materialsTotal < 0 }">
            {{ formatCurrency(materialsTotal) }}
          </strong>
        </div>
      </div>
    </Card>

    <!-- Вкладки -->
    <Card class="tabs-card" bordered elevated>
      <template #header>
        <div class="tab-nav">
          <button
            v-for="tab in tabs"
            :key="tab"
            :class="['tab-button', { active: currentTab === tab }]"
            @click="currentTab = tab"
          >
            {{ tab }}
          </button>
        </div>
      </template>

      <div class="tab-content">
        <PagesCabinetObjectsOperations
          v-if="currentTab === 'Операции'"
          :object-id="objectId"
          :operations="operations"
          @add-coming="handleComingAdded"
          @add-expense="handleExpenseAdded"
          @add-work="handleWorkAdded"
        />

        <PagesCabinetObjectsMaterials
          v-else-if="currentTab === 'Материалы'"
          :materials="materials"
          :object-id="objectId"
          @add="handleMaterialAdded"
          @update="handleMaterialUpdated"
          @delete="handleMaterialDeleted"
        />
      </div>
    </Card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Card from '@/components/pages/cabinet/ui/cards/card.vue'

const route = useRoute()
const router = useRouter()
const objectId = route.params.id

// Данные
const object = ref({})
const foremans = ref([])
const materials = ref([])
const operations = ref([])
const selectedForemanId = ref(null)
const currentTab = ref('Операции')
const tabs = ['Операции', 'Материалы']
const isAdmin = ref(false)

// Сообщения
const errorMessage = ref('')
const successMessage = ref('')

definePageMeta({
  layout: 'cabinet',
  middleware: 'role',
  allowedRoles: ['admin']
})

onMounted(async () => {
  try {
    const me = await $fetch('/api/me')
    isAdmin.value = me?.user?.role === 'admin'
  } catch (error) {
    console.error('Ошибка при получении пользователя:', error)
    isAdmin.value = false
  }

  await fetchObject()
  await fetchForemans()
  await fetchMaterials()
  await fetchOperations()

  if (object.value.foremanId) {
    selectedForemanId.value = object.value.foremanId
  }
})

// --- API методы ---

async function fetchObject() {
  try {
    object.value = await $fetch(`/api/objects/${objectId}`, {
      method: 'GET',
      credentials: 'include'
    })
  } catch (error) {
    console.error('Ошибка при получении объекта:', error)
    router.push('/cabinet/objects')
  }
}

async function fetchForemans() {
  try {
    foremans.value = await $fetch('/api/contractors/foremans')
  } catch (error) {
    console.error('Ошибка при загрузке прорабов:', error)
  }
}

async function assignForeman() {
  try {
    await $fetch(`/api/objects/${objectId}`, {
      method: 'PUT',
      body: { foremanId: selectedForemanId.value },
      credentials: 'include'
    })
    await fetchObject()
  } catch (error) {
    console.error('Ошибка назначения прораба:', error)
  }
}

async function fetchMaterials() {
  try {
    const data = await $fetch('/api/materials', {
      method: 'GET',
      params: { objectId },
      credentials: 'include'
    })
    materials.value = data.map(m => ({ ...m, amount: Number(m.amount || 0) }))
  } catch (error) {
    console.error('Ошибка при загрузке материалов:', error)
  }
}

async function fetchOperations() {
  try {
    const data = await $fetch(`/api/objects/${objectId}/operations`, {
      method: 'GET',
      credentials: 'include'
    })

    operations.value = [
      ...data.comings.map(op => ({ ...op, type: 'coming', amount: Number(op.amount) })),
      ...data.works.map(op => ({ ...op, type: 'work', amount: Number(op.amount) }))
    ]
  } catch (error) {
    console.error('Ошибка при загрузке операций:', error)
  }
}

// --- Управление объектом ---

// Переключение статуса: активный ↔ завершённый
async function toggleStatus() {
  const newStatus = object.value.status === 'active' ? 'completed' : 'active'
  try {
    await $fetch(`/api/objects/${objectId}`, {
      method: 'PUT',
      body: { status: newStatus },
      credentials: 'include'
    })

    object.value.status = newStatus
    successMessage.value = `Объект успешно ${newStatus === 'active' ? 'возобновлён' : 'завершён'}`
    setTimeout(() => (successMessage.value = ''), 3000)
  } catch (error) {
    console.error('Ошибка изменения статуса:', error)
    errorMessage.value = 'Не удалось изменить статус объекта'
    setTimeout(() => (errorMessage.value = ''), 5000)
  }
}

// Подтверждение и удаление объекта
function confirmDelete() {
  const confirmed = window.confirm(
    'Вы уверены, что хотите удалить этот объект?\n\n' +
    'Это действие нельзя отменить. Все данные по объекту будут потеряны.'
  )
  if (confirmed) {
    deleteObject()
  }
}

async function deleteObject() {
  try {
    await $fetch(`/api/objects/${objectId}`, {
      method: 'DELETE',
      credentials: 'include'
    })

    // Очистка и редирект
    successMessage.value = 'Объект успешно удалён'
    setTimeout(() => {
      router.push('/cabinet/objects')
    }, 800)
  } catch (error) {
    console.error('Ошибка удаления объекта:', error)
    errorMessage.value = 'Не удалось удалить объект'
    setTimeout(() => (errorMessage.value = ''), 5000)
  }
}

// --- Обработчики событий из дочерних компонентов ---

function handleMaterialAdded(material) {
  materials.value.push({ ...material, amount: Number(material.amount) })
}

function handleMaterialUpdated(updatedMaterial) {
  const index = materials.value.findIndex(m => m.id === updatedMaterial.id)
  if (index !== -1) {
    materials.value.splice(index, 1, { ...updatedMaterial, amount: Number(updatedMaterial.amount) })
  }
}

function handleMaterialDeleted(id) {
  materials.value = materials.value.filter(m => m.id !== id)
}

function handleComingAdded(coming) {
  operations.value.push({ ...coming, type: 'coming', amount: Number(coming.amount) })
  refreshObjectData()
}

function handleExpenseAdded(expense) {
  operations.value.push({ ...expense, type: 'expense', amount: Number(expense.amount) })
  refreshObjectData()
}

function handleWorkAdded(work) {
  operations.value.push({ ...work, type: 'work', amount: Number(work.amount) })
  refreshObjectData()
}

// Локальное обновление данных объекта (баланс и т.п.)
async function refreshObjectData() {
  await fetchObject()
}

// --- Вычисляемые значения ---

const materialsTotal = computed(() => {
  const incoming = materials.value
    .filter(m => m.type === 'incoming')
    .reduce((sum, m) => sum + Number(m.amount), 0)

  const outgoing = materials.value
    .filter(m => m.type === 'outgoing')
    .reduce((sum, m) => sum + Number(m.amount), 0)

  return incoming - outgoing
})

// --- Утилиты форматирования ---

const formatDate = (dateStr) => {
  if (!dateStr) return '—'
  const date = new Date(dateStr)
  return date.toLocaleDateString('ru-RU')
}

const formatCurrency = (value) => {
  return new Intl.NumberFormat('ru-RU').format(value || 0) + ' ₽'
}
</script>

<style lang="scss" scoped>
.object-detail-layout {
  padding: 2rem;
  display: flex;
  flex-direction: column;
  gap: 2rem;
  max-width: 1200px;
  margin: 0 auto;
  background-color: #fcfcfc;
}

// Статус
.status-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;

  h3 {
    margin: unset;
  }
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 999px;
  font-size: 0.875rem;
  font-weight: 600;
  &.status-active {
    background-color: #e8f5e9;
    color: #2e7d32;
  }
  &.status-completed {
    background-color: #e3f2fd;
    color: #1565c0;
  }
  &.status-paused {
    background-color: #fff8e1;
    color: #f57f17;
  }
  &.status-canceled {
    background-color: #ffebee;
    color: #c62828;
  }
}

// Прораб
.foreman-info {
  font-size: 1.1rem;
  color: $text-dark;
}

.empty-state {
  color: $color-muted;
  font-style: italic;
  padding: 0.5rem 0;
}

// Форма назначения
.assign-foreman-form {
  display: flex;
  gap: 0.75rem;
  align-items: center;
  flex-wrap: wrap;

  .form-select {
    flex: 1 1 200px;
    padding: 0.5rem;
    border: 1px solid $border-color;
    border-radius: $border-radius;
    background: white;
  }

  .btn {
    white-space: nowrap;
  }
}

// Баланс
.balance-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 1rem;
}

.balance-item {
  padding: 1rem;
  background: rgba($blue, 0.05);
  border-radius: $border-radius;
  text-align: center;
}

.label {
  font-size: 0.9rem;
  color: $text-dark;
  &.muted {
    color: $color-muted;
  }
}

.value {
  font-size: 1.4rem;
  font-weight: 600;
  color: $text-dark;
  &.muted {
    color: $color-muted;
  }
}

.materials-balance {
  text-align: right;
  font-size: 1rem;
}

.divider {
  height: 1px;
  background-color: $border-color;
  margin: 1rem 0;
}

.text-danger {
  color: #c62828;
}

// Вкладки
.tab-nav {
  display: flex;
  gap: 0.5rem;
  overflow-x: auto;
  padding-bottom: 0.25rem;
}

.tab-button {
  padding: 0.6rem 1rem;
  border: none;
  background: $background-light;
  border-radius: $border-radius;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s ease;
  white-space: nowrap;

  &.active {
    background: $blue;
    color: white;
  }

  &:hover:not(.active) {
    background: rgba($background-light, 5%);
  }
}

.tab-content {
  padding-top: 1.5rem;
}

// Кнопки
.btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: $border-radius;
  cursor: pointer;
  font-size: 0.95rem;
  font-weight: 500;
  transition: all 0.2s ease;

  &.primary {
    background: $blue;
    color: white;

    &:hover {
      background: rgba($blue, 10%);
    }
  }

  &.btn-sm {
    padding: 0.4rem 0.8rem;
    font-size: 0.875rem;
  }
}

@media (max-width: 768px) {
  .object-detail-layout {
    padding: 1rem;
  }

  .balance-grid {
    grid-template-columns: 1fr;
  }

  .assign-foreman-form,
  .tab-nav {
    flex-wrap: wrap;
  }
}
</style>