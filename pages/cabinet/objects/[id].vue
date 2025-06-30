<template>
  <div class="object-detail">

    <header class="object-header card">
      <div class="header-content">
        <h1 class="object-name">{{ object.name }}</h1>
        <div class="status-tag">
          <span>Статус:</span>
          <span class="status-text">{{ object.status }}</span>
        </div>
      </div>
    </header>

    <!-- Блок с прорабом -->
    <div class="card foreman-section">
      <h2 class="section-title">Прораб</h2>
      <div class="content-wrapper">
        <div v-if="object.foreman">
          {{ object.foreman.name }}
        </div>
        <div v-else class="empty-state">Не назначен</div>
        
        <div v-if="isAdmin !== null" class="assign-form" v-show="isAdmin">
          <select v-model="selectedForemanId" class="form-control">
            <option :value="null">Не выбран</option>
            <option v-for="foreman in foremans" :key="foreman.id" :value="foreman.id">
              {{ foreman.name }}
            </option>
          </select>
          <button @click="assignForeman" class="btn primary">Сохранить</button>
        </div>
      </div>
    </div>

    <div class="balance-section card">
      <h2 class="section-title">Балансы</h2>
      <div class="balance-grid">
        <div class="balance-card">
          <div class="card-header">Объект</div>
          <div class="card-body">
            <p>{{ object.totalBalance }} ₽</p>
            <div class="sub-balance">
              <span>Приходы: {{ object.totalIncome }} ₽</span>
              <span>Работы: {{ object.totalWorks }} ₽</span>
            </div>
          </div>
        </div>
        <div class="balance-card">
          <div class="card-header">Материалы</div>
          <div class="card-body">
            <p>{{ materialsTotal }} ₽</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Вкладки -->
    <div class="tabs-container card">
      <div class="tabs">
        <button
          v-for="tab in tabs"
          :key="tab"
          :class="{ active: currentTab === tab }"
          @click="currentTab = tab"
          class="tab-button"
        >
          {{ tab }}
        </button>
      </div>
    </div>

    <!-- Содержимое вкладок -->
    <div class="content-container card">
      <div v-if="currentTab === 'Операции'" class="tab-content">
        <PagesCabinetObjectsOperations
          :object-id="objectId"
          :operations="operations"
          @add-coming="handleComingAdded"
          @add-expense="handleExpenseAdded"
          @add-work="handleWorkAdded"
        />
      </div>

      <div v-if="currentTab === 'Материалы'" class="tab-content">
        <PagesCabinetObjectsMaterials
          :materials="materials"
          :object-id="objectId"
          @add="handleMaterialAdded"
          @update="handleMaterialUpdated"
          @delete="handleMaterialDeleted"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useNuxtApp } from '#app'

const route = useRoute()
const router = useRouter()
const objectId = route.params.id

const isAdmin = ref(false)

// Данные объекта
const object = ref({})
const foremans = ref([])
const selectedForemanId = ref(null)
const materials = ref([])
const operations = ref([])
const currentTab = ref('Операции')
const tabs = ['Операции', 'Материалы']

// Вычисляемые свойства балансов (для отображения)
const materialsTotal = computed(() => {
  const incoming = materials.value
    .filter(m => m.type === 'incoming')
    .reduce((sum, m) => sum + Number(m.amount), 0)

  const outgoing = materials.value
    .filter(m => m.type === 'outgoing')
    .reduce((sum, m) => sum + Number(m.amount), 0)

  return (incoming - outgoing).toFixed(2)
})

definePageMeta({
  layout: 'cabinet',
})

onMounted(async () => {
  try {
    const me = await $fetch('/api/me')
    isAdmin.value = me?.user?.role === 'admin' || false
  } catch (error) {
    isAdmin.value = false
  }

  await fetchObject()
  await fetchForemans()
  selectedForemanId.value = object.value.foremanId || null
  await fetchMaterials()
  await fetchOperations()
})

// Загрузка объекта
async function fetchObject() {
  try {
    const data = await $fetch(`/api/objects/${objectId}`, {
      method: 'GET',
      credentials: 'include'
    })
    object.value = data
    selectedForemanId.value = data.foremanId || null
  } catch (error) {
    console.error('Ошибка при получении объекта:', error)
    router.push('/cabinet/objects')
  }
}

// Загрузка прорабов
async function fetchForemans() {
  try {
    foremans.value = await $fetch('/api/contractors/foremans')
  } catch (error) {
    console.error('Ошибка при загрузке прорабов:', error)
  }
}

// Назначение прораба
async function assignForeman() {
  try {
    await $fetch(`/api/objects/${route.params.id}`, {
      method: 'PUT',
      body: { foremanId: selectedForemanId.value }
    })
    await fetchObject()
    // showNotification('Прораб успешно назначен')
  } catch (error) {
    console.error('Ошибка назначения прораба:', error)
    // showNotification('Ошибка назначения прораба')
  }
}

async function fetchMaterials() {
  try {
    const data = await $fetch(`/api/materials`, {
      method: 'GET',
      params: { objectId },
      credentials: 'include'
    })

    // Преобразуем amount в число
    materials.value = data.map(m => ({
      ...m,
      amount: Number(m.amount || 0)
    }))
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

    // Объединяем приходы и расходы в одну структуру с типом
    operations.value = [
      ...data.comings.map(op => ({ ...op, type: 'coming', amount: Number(op.amount) })),
      ...data.works.map(op => ({ ...op, type: 'work', amount: Number(op.amount) }))
    ]
  } catch (error) {
    console.error('Ошибка при загрузке операций:', error)
  }
}

// Обработчики событий из дочерних компонентов
function handleMaterialAdded(material) {
  materials.value.push(material)
}

function handleMaterialUpdated(updatedMaterial) {
  const index = materials.value.findIndex(m => m.id === updatedMaterial.id)
  if (index !== -1) {
    materials.value.splice(index, 1, updatedMaterial)
  }
}

function handleMaterialDeleted(id) {
  materials.value = materials.value.filter(m => m.id !== id)
}

async function handleComingAdded(coming) {
  operations.value.push({ ...coming, type: 'coming' })
  await updateObjectBalance()
}

async function handleExpenseAdded(expense) {
  operations.value.push({ ...expense, type: 'expense' })
  await updateObjectBalance()
}

// function handleWorkAdded(work) {
//   operations.value = [
//     ...operations.value,
//     { ...work, type: 'work' }
//   ]
//   updateObjectBalance()
// }

function handleWorkAdded(work) {
  operations.value.push({ ...work, type: 'work' })
  object.value.totalBalance -= work.amount // Пример локального обновления
}

// Обновление данных объекта после изменений
async function updateObjectBalance() {
  try {
    const updatedObject = await $fetch(`/api/objects/${objectId}`, {
      method: 'GET',
      credentials: 'include'
    })
    object.value = updatedObject
  } catch (error) {
    console.error('Ошибка обновления данных объекта:', error)
  }
}
</script>

<style lang="scss" scoped>
.object-detail {
  padding: 2rem;
  background-color: #f9f9f9;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.card {
  background-color: #ffffff;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.05);
  padding: 1.5rem;
  transition: all 0.3s ease;
}

.card:hover {
  box-shadow: 0 6px 12px rgba(0,0,0,0.1);
}

.section-title {
  margin-bottom: 1.5rem;
  color: #2c3e50;
  font-size: 1.25rem;
  border-bottom: 2px solid #ecf0f1;
  padding-bottom: 0.5rem;
}

.content-wrapper {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.empty-state {
  color: #999;
  font-style: italic;
}

.assign-form {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.form-control {
  flex: 1 1 200px;
  padding: 0.5rem 0.75rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 1rem;
}

.btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s ease;
}

.primary {
  background-color: #007bff;
  color: white;
}

.primary:hover {
  background-color: #0069d9;
}

.object-header {
  .header-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .object-name {
    font-size: 1.5rem;
    color: #2c3e50;
  }
  
  .status-tag {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    background-color: #e8f5e9;
    padding: 0.5rem 1rem;
    border-radius: 6px;
  }
  
  .status-text {
    color: #2e7d32;
    font-weight: 500;
  }
}

.balance-section {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.balance-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
}

.balance-card {
  background-color: #f8f9fa;
  border-radius: 8px;
  padding: 1rem;
  transition: all 0.3s ease;
}

.balance-card:hover {
  background-color: #f1f3f4;
}

.card-header {
  font-size: 1.1rem;
  color: #34495e;
  margin-bottom: 0.5rem;
}

.card-body p {
  font-size: 1.25rem;
  color: #2c3e50;
  margin: 0.5rem 0;
}

.sub-balance {
  display: flex;
  justify-content: space-between;
  font-size: 0.95rem;
  color: #7f8c8d;
}

.tabs-container {
  .tabs {
    display: flex;
    gap: 1rem;
    overflow-x: auto;
  }
  
  .tab-button {
    padding: 0.75rem 1.5rem;
    background-color: #f1f1f1;
    border: none;
    border-radius: 6px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s ease;
  }
  
  .tab-button.active {
    background-color: #007bff;
    color: white;
  }
}

.content-container {
  flex: 1;
  min-height: 400px;
}

@media (max-width: 768px) {
  .balance-grid {
    grid-template-columns: 1fr;
  }
}
</style>