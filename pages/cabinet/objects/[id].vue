<template>
  <div class="object-detail">
    <header class="object-header">
      <h1>{{ object.name }}</h1>
      <div class="object-status">
        <span>Статус: {{ object.status }}</span>
      </div>
    </header>

    <!-- Баланс объекта -->
    <div class="balance-section">
      <h2>Баланс</h2>
      <div class="balance-item">
        <strong>Общий баланс:</strong> {{ object.profit }} ₽
      </div>
      <div class="balance-item">
        <strong>Баланс материалов:</strong> {{ materialsTotal }} ₽
      </div>
    </div>

    <!-- Навигация -->
    <div class="tabs">
      <button 
        v-for="tab in tabs" 
        :key="tab" 
        :class="{ active: currentTab === tab }" 
        @click="currentTab = tab"
      >
        {{ tab }}
      </button>
    </div>

    <!-- Вкладки -->
    <div class="content">
      <PagesCabinetObjectsMaterials 
        v-if="currentTab === 'Материалы'" 
        :materials="materials" 
        @add="handleAddMaterial" 
        @update="handleUpdateMaterial" 
        @toggle-check="handleToggleCheck"
      />

      <PagesCabinetObjectsPayments 
        v-if="currentTab === 'Платежи'" 
        :payments="payments" 
        @add="handleAddPayment" 
        @update="handleUpdatePayment"
      />

      <PagesCabinetObjectsTasks 
        v-if="currentTab === 'Задачи'" 
        :tasks="tasks" 
        @add="handleAddTask" 
        @update-status="handleUpdateTaskStatus"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useNuxtApp } from '#app'

const route = useRoute()
const object = ref({})
const materials = ref([])
const payments = ref([])
const tasks = ref([])
const currentTab = ref('Материалы')
const tabs = ['Материалы', 'Платежи', 'Задачи']

// Вычисляемые свойства
const materialsTotal = computed(() => {
  return materials.value.reduce((sum, m) => sum + m.amount, 0)
})

definePageMeta({
  middleware: 'auth',
  allowedRoles: ['admin'],
  layout: 'cabinet',
});

// Загрузка данных
onMounted(async () => {
  await Promise.all([
    fetchObject(),
    fetchMaterials(),
    fetchPayments(),
    fetchTasks()
  ])
})

// Загрузка объекта
async function fetchObject() {
  try {
    const response = await useNuxtApp().$axios.get(`/objects/${route.params.id}`)
    object.value = response.data
  } catch (error) {
    console.error('Ошибка загрузки объекта:', error)
  }
}

// Загрузка материалов
async function fetchMaterials() {
  try {
    const response = await useNuxtApp().$axios.get(
      `/materials/${route.params.id}`
    );
    materials.value = response.data.map(material => ({
      ...material,
      amount: Number(material.amount) // Преобразуем в число
    }));
  } catch (error) {
    console.error('Ошибка загрузки материалов:', error);
  }
}

// Загрузка платежей
async function fetchPayments() {
  try {
    const response = await useNuxtApp().$axios.get(
      `/payments/${route.params.id}`
    )
    payments.value = response.data
  } catch (error) {
    console.error('Ошибка загрузки платежей:', error)
  }
}

// Загрузка задач
async function fetchTasks() {
  try {
    const response = await useNuxtApp().$axios.get(
      `/tasks/${route.params.id}`
    )
    tasks.value = response.data
  } catch (error) {
    console.error('Ошибка загрузки задач:', error)
  }
}

// Сохранение объекта
async function saveObject() {
  try {
    await useNuxtApp().$axios.put(`/objects/${route.params.id}`, object.value)
    await fetchObject()
  } catch (error) {
    console.error('Ошибка обновления объекта:', error)
  }
}

// Обработка событий из компонентов
const handleAddMaterial = async (material) => {
  materials.value.push(material)
}

const handleUpdateMaterial = async (material) => {
  const index = materials.value.findIndex(m => m.id === material.id)
  if (index !== -1) materials.value.splice(index, 1, material)
}

const handleToggleCheck = async (material) => {
  const index = materials.value.findIndex(m => m.id === material.id)
  if (index !== -1) materials.value[index].has_receipt = material.has_receipt
}

const handleAddPayment = async (payment) => {
  payments.value.push(payment)
}

const handleUpdatePayment = async (payment) => {
  const index = payments.value.findIndex(p => p.id === payment.id)
  if (index !== -1) payments.value.splice(index, 1, payment)
}

const handleAddTask = async (task) => {
  tasks.value.push(task)
}

const handleUpdateTaskStatus = async (id, status) => {
  const task = tasks.value.find(t => t.id === id)
  if (task) task.status = status
}
</script>

<style scoped>
.object-detail {
  max-width: 1200px;
  margin: 20px auto;
  padding: 20px;
}

.tabs {
  display: flex;
  gap: 15px;
  margin: 20px 0;
}

.tabs button {
  padding: 8px 12px;
  border: 1px solid #ccc;
  background: #f0f0f0;
  cursor: pointer;
}

.tabs button.active {
  background: #007bff;
  color: white;
}

.balance-section {
  margin: 20px 0;
  padding: 15px;
  border: 1px solid #e0e0e0;
}

.balance-item {
  margin: 8px 0;
}

.content {
  margin-top: 30px;
}

.save-btn {
  background: #007bff;
  color: white;
  border: none;
  padding: 6px 12px;
  cursor: pointer;
}
</style>