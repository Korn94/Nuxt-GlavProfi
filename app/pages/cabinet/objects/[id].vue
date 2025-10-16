<!-- app/pages/cabinet/objects/[id].vue -->
<template>
  <!-- Заголовок страницы -->
  <PagesCabinetUiLayoutPageTitle :title="object.name">
    <template #actions>
      <!-- Кнопка редактирования -->
      <button v-if="isAdmin" @click="isEditModalOpen = true" class="btn btn-sm primary">
        Редактировать
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
            {{ objectStatusText }}
          </span>
        </div>
      </template>

      <div class="info-grid">
        <!-- Адрес -->
        <div class="info-item">
          <Icon name="material-symbols:location-on" class="info-icon" />
          <div class="info-content">
            <label>Адрес</label>
            <b>{{ object.address || '—' }}</b>
          </div>
        </div>

        <!-- Источник -->
        <div class="info-item">
          <Icon name="fluent:database-48-regular" class="info-icon" />
          <div class="info-content">
            <label>Объект из</label>
            <b>{{ object.source || '—' }}</b>
          </div>
        </div>

        <!-- Прораб -->
        <div class="info-item">
          <Icon name="solar:user-rounded-outline" class="info-icon" />
          <div class="info-content">
            <label>Прораб</label>
            <template v-if="object.foreman">
              <b class="foreman-name">{{ object.foreman.name }}</b>
            </template>
            <span v-else class="empty-state">Не назначен</span>
          </div>
        </div>

        <!-- Даты -->
        <div class="info-item">
          <Icon name="solar:calendar-add-outline" class="info-icon" />
          <div class="info-content">
            <label>Дата начала</label>
            <b>{{ formatDate(object.startDate) }}</b>
          </div>
        </div>

        <div class="info-item">
          <Icon name="solar:calendar-mark-bold" class="info-icon" />
          <div class="info-content">
            <label>План завершения</label>
            <b>{{ formatDate(object.plannedEndDate) }}</b>
          </div>
        </div>

        <div class="info-item">
          <Icon name="solar:check-read-outline" class="info-icon" />
          <div class="info-content">
            <label>Фактическая дата</label>
            <b>{{ formatDate(object.completedDate) }}</b>
          </div>
        </div>

        <!-- Комментарий -->
        <div class="info-item comment-item">
          <Icon name="solar:chat-line-outline" class="info-icon" />
          <div class="info-content">
            <label>Комментарий</label>
            <b>{{ object.comment || '—' }}</b>
          </div>
        </div>
      </div>
    </Card>

    <!-- Баланс -->
    <Card title="Баланс объекта" bordered elevated>
      <!-- 1. Общий баланс (приходы - работы - баланс материалов) -->
      <div class="main-balance">
        <div class="balance-value" :class="{ 'positive': object.finances?.totalBalance >= 0, 'negative': object.finances?.totalBalance < 0 }">
          {{ formatCurrency(object.finances?.totalBalance) }}
        </div>
        <div class="balance-description">
          Приходы ({{ formatCurrency(object.finances?.totalIncome) }}) − 
          Работы ({{ formatCurrency(object.finances?.totalWorks) }}) − 
          Материалы ({{ formatCurrency(object.materialBalance) }})
        </div>
      </div>

      <!-- 2. Детализация по категориям -->
      <div class="balance-categories">
        <div class="category-item">
          <div class="category-label">Приходы</div>
          <div class="category-value">{{ formatCurrency(object.finances?.totalIncome) }}</div>
        </div>
        <div class="category-item">
          <div class="category-label">Работы</div>
          <div class="category-value">{{ formatCurrency(object.finances?.totalWorks) }}</div>
        </div>
        <div class="category-item">
          <div class="category-label">Материалы</div>
          <div 
            class="category-value" 
            :class="{ 'text-success': object.materialBalance >= 0, 'text-danger': object.materialBalance < 0 }"
          >
            {{ formatCurrency(object.materialBalance) }}
          </div>
        </div>
      </div>

      <!-- 3. Смета и выполнение -->
      <div class="budget-summary">
        <div class="divider"></div>
        
        <div class="budget-row">
          <span>Смета (общая):</span>
          <strong>{{ formatCurrency(totalBudget) }}</strong>
        </div>
        
        <div class="budget-row">
          <span>Выполнено по смете:</span>
          <strong>{{ formatCurrency(completedBudget) }}</strong>
        </div>
        
        <div class="budget-row">
          <span>Смета − баланс объекта:</span>
          <strong :class="{ 'text-success': budgetVsBalance >= 0, 'text-danger': budgetVsBalance < 0 }">
            {{ formatCurrency(budgetVsBalance) }}
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

        <PagesCabinetObjectsDocuments
          v-else-if="currentTab === 'Документы'"
          :object="object"
          :object-id="objectId"
          :is-admin="isAdmin"
          @refresh="refreshObjectData"
        />
      </div>
    </Card>
  </div>

  <!-- Модальное окно редактирования -->
  <PagesCabinetObjectsEditModal
    v-if="isAdmin"
    v-model="isEditModalOpen"
    :object="object"
    @updated="handleUpdated"
    @completed="handleCompleted"
    @deleted="handleDeleted"
  />
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Card from '@/components/pages/cabinet/ui/cards/card.vue'

// --- Состояние ---
const route = useRoute()
const router = useRouter()
const objectId = Number(route.params.id)

if (isNaN(objectId)) {
  router.push('/cabinet/objects')
  throw new Error('Неверный ID объекта')
}

// Данные
const object = ref({
  id: null,
  name: 'Загрузка...',
  status: 'active',
  finances: { totalIncome: 0, totalWorks: 0, totalBalance: 0 },
  foreman: null,
  address: null,
  startDate: null,
  plannedEndDate: null,
  completedDate: null,
  source: null,
  documentType: null,
  contractType: null,
  comment: null,
  budget: [],
  invoices: []
})

const materials = ref([])
const operations = ref([])

const currentTab = ref('Операции')
const tabs = ['Операции', 'Материалы', 'Документы']

const isAdmin = ref(false)

// Модальное окно редактирования объекта
const isEditModalOpen = ref(false)

// Сообщения
const errorMessage = ref('')
const successMessage = ref('')

// Мета-информация
definePageMeta({
  layout: 'cabinet',
  middleware: 'role',
  allowedRoles: ['admin']
})

// --- Жизненный цикл ---
onMounted(async () => {
  try {
    const me = await $fetch('/api/me')
    isAdmin.value = me?.user?.role === 'admin'
  } catch (error) {
    console.error('Ошибка при получении пользователя:', error)
    isAdmin.value = false
  }

  await refreshObjectData()
})

// --- API методы ---

async function fetchFullObject() {
  try {
    const data = await $fetch(`/api/objects/${objectId}/full`, {
      method: 'GET',
      credentials: 'include'
    })

    object.value = {
      ...data,
      finances: {
        totalIncome: Number(data.finances?.totalIncome) || 0,
        totalWorks: Number(data.finances?.totalWorks) || 0,
        totalBalance: Number(data.finances?.totalBalance) || 0
      }
    }
  } catch (error) {
    console.error('Ошибка при получении объекта:', error)
    errorMessage.value = 'Не удалось загрузить данные объекта'
    setTimeout(() => (errorMessage.value = ''), 5000)

    // Перенаправление при ошибке
    router.push('/cabinet/objects')
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

// --- Единая функция обновления данных ---
async function refreshObjectData() {
  await Promise.all([
    fetchFullObject(),
    fetchMaterials(),
    fetchOperations()
  ])
}

// --- Обработчики ---
function handleUpdated(updatedObject) {
  object.value = updatedObject
  successMessage.value = 'Объект успешно обновлён'
  setTimeout(() => (successMessage.value = ''), 3000)
}

function handleCompleted(updatedObject) {
  object.value = updatedObject
  successMessage.value = `Объект ${updatedObject.status === 'completed' ? 'завершён' : 'возобновлён'}`
  setTimeout(() => (successMessage.value = ''), 3000)
}

// --- Обновление типа договора ---
async function updateContractType(type) {
  try {
    const updated = await $fetch(`/api/objects/${objectId}`, {
      method: 'PUT',
      body: { contractType: type },
      credentials: 'include'
    })

    object.value = updated
    successMessage.value = 'Тип договора обновлён'
    setTimeout(() => (successMessage.value = ''), 3000)
  } catch (error) {
    console.error('Ошибка обновления типа договора:', error)
    errorMessage.value = 'Не удалось изменить тип договора'
    setTimeout(() => (errorMessage.value = ''), 5000)
  }
}

function handleDeleted() {
  // Уже перенаправлено внутри модалки
}

// --- Работа с материалами ---
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

// --- Работа с операциями ---
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

// --- Текстовые отображения ---

const objectStatusText = computed(() => {
  if (!object.value?.status) return '—'
  const map = { active: 'Активный', completed: 'Завершён', waiting: 'Ожидание' }
  return map[object.value.status] || object.value.status
})

// --- Добавляем вычисляемые свойства для сметы ---
const totalBudget = computed(() => {
  return object.value.budget?.reduce((sum, item) => {
    const amount = typeof item.amount === 'string' ? parseFloat(item.amount) : item.amount
    return sum + (amount || 0)
  }, 0) || 0
})

const completedBudget = computed(() => {
  return object.value.budget
    ?.filter(item => item.workProgress === 'completed')
    .reduce((sum, item) => {
      const amount = typeof item.amount === 'string' ? parseFloat(item.amount) : item.amount
      return sum + (amount || 0)
    }, 0) || 0
})

const budgetVsBalance = computed(() => {
  return totalBudget.value - (object.value.finances?.totalBalance || 0)
})
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

  // --- ОСНОВНОЙ БАЛАНС ---
  .main-balance {
    padding: 1.5rem 1rem;
    text-align: center;
    background: rgba($blue, 0.03);
    border-radius: $border-radius;
    margin-bottom: 1.5rem;
    
    .balance-value {
      font-size: 2.2rem;
      font-weight: 700;
      margin-bottom: 0.5rem;
      
      &.positive {
        color: #2e7d32;
      }
      
      &.negative {
        color: #c62828;
      }
    }
    
    .balance-description {
      font-size: 0.95rem;
      color: $color-muted;
      line-height: 1.4;
    }
  }

  // --- КАТЕГОРИИ БАЛАНСА ---
  .balance-categories {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1rem;
    margin-bottom: 1.5rem;
    
    @media (max-width: 768px) {
      grid-template-columns: 1fr;
    }
  }

  .category-item {
    padding: 1rem;
    background: $sub-item-bg;
    border-radius: $border-radius;
    text-align: center;
    
    .category-label {
      font-size: 0.9rem;
      color: $color-muted;
      margin-bottom: 0.5rem;
    }
    
    .category-value {
      font-size: 1.25rem;
      font-weight: 600;
      
      &.text-success {
        color: #2e7d32;
      }
      
      &.text-danger {
        color: #c62828;
      }
    }
  }

  // --- СМЕТА И ВЫПОЛНЕНИЕ ---
  .budget-summary {
    .divider {
      height: 1px;
      background-color: $border-color;
      margin: 1rem 0;
    }
    
    .budget-row {
      display: flex;
      justify-content: space-between;
      padding: 0.75rem 0;
      
      span {
        color: $color-muted;
      }
      
      strong {
        font-weight: 600;
        
        &.text-success {
          color: #2e7d32;
        }
        
        &.text-danger {
          color: #c62828;
        }
      }
    }
  }
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
  &.status-waiting {
    background-color: #fff8e1;
    color: #f57f17;
  }
}

// Инлайн-стиль для прораба внутри карточки
.foreman-inline {
  color: $text-dark;
}

.empty-state {
  color: $color-muted;
  font-style: italic;
  padding: 0.5rem 0;
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

.alert {
  padding: 0.75rem 1rem;
  border-radius: $border-radius;
  margin: 0 2rem;
  font-size: 0.95rem;

  &.alert-success {
    background: #e8f5e9;
    color: #2e7d32;
    border: 1px solid #c8e6c9;
  }

  &.alert-error {
    background: #ffebee;
    color: #c62828;
    border: 1px solid #ef9a9a;
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

// --- Сетка информации ---
.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1rem;
  row-gap: 1.5rem;
}

.info-item {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
}

.info-icon {
  color: $blue;
  font-size: 1.25rem;
  min-width: 24px;
  margin-top: 0.25rem;
}

.info-content {
  flex: 1;
  line-height: 1.5;
}

.info-content label {
  display: block;
  font-size: 0.85rem;
  color: $color-muted;
  margin-bottom: 0.25rem;
}

.info-content b {
  font-weight: 600;
  color: $text-dark;
}

.empty-state {
  color: $color-muted;
  font-style: italic;
  font-weight: normal;
}

.comment-item {
  grid-column: 1 / -1; // Занимает всю ширину на всех экранах
}
</style>