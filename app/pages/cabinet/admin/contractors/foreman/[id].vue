<template>
  <ForemanIndex
    :id="id"
    :contractor-type="'foreman'"
    :contractor="contractor"
    :expenses="expenses"
    :objects="objects"
    :salary-deductions="salaryDeductions"
    :profit-history="profitHistory"
    @update-contractor="updateContractor"
    @add-payment="addPayment"
  />
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import ForemanIndex from '@/components/pages/Cabinet/Contractors/Foreman/Index.vue'

const route = useRoute()
const id = route.params.id

// Основные данные
const contractor = ref({})
const salaryDeductions = ref([])
const profitHistory = ref([])
const expenses = ref([])
const objects = ref([])

// Состояния
const loading = ref(true)
const error = ref(null)

definePageMeta({
  layout: 'cabinet',
  middleware: 'role',
  allowedRoles: ['admin']
});

// API
async function fetchData() {
  try {
    loading.value = true
    const [contractorData, deductionsData, historyData, expensesData, objectsData] = await Promise.all([
      $fetch(`/api/contractors/foremans/${id}`, { 
        method: 'GET',
        credentials: 'include'
      }),

      $fetch(`/api/salary-deductions?contractorType=foreman&contractorId=${id}`, {
        method: 'GET',
        credentials: 'include'
      }),

      $fetch(`/api/contractors/foremans/profit-history/${id}`, {
        method: 'GET',
        params: { foremanId: id },
        credentials: 'include'
      }),

      // Расходы
      $fetch(`/api/expenses`, {
        method: 'GET',
        params: { contractorType: 'foreman', contractorId: id },
        credentials: 'include'
      }),
      
      // Список объектов (важно!)
      $fetch('/api/objects', {
        method: 'GET',
        credentials: 'include'
      })
    ])
    
    contractor.value = contractorData
    salaryDeductions.value = deductionsData
    expenses.value = expensesData
    objects.value = objectsData // Сохраняем объекты
    profitHistory.value = formatProfitHistory(historyData)
  } catch (err) {
    error.value = 'Не удалось загрузить данные'
    console.error('Ошибка загрузки:', err)
  } finally {
    loading.value = false
  }
}

function formatProfitHistory(data) {
  // Берём данные из поля `profitHistory`
  return (data.profitHistory || []).map(item => ({
    id: item.id,
    amount: parseFloat(item.amount),
    description: item.description || '',
    objectId: item.objectId,
    objectName: item.objectName || 'Не указан',
    date: item.date ? new Date(item.date) : new Date(),
    createdAt: item.createdAt ? new Date(item.createdAt) : new Date()
  }))
}

// Обработчики
async function updateContractor(updatedData) {
  try {
    await $fetch(`/api/contractors/foremans/${id}`, {
      method: 'PUT',
      body: updatedData,
      credentials: 'include'
    })
    contractor.value = updatedData
  } catch (err) {
    console.error('Ошибка обновления:', err)
  }
}

function addPayment(newPayment) {
  // Обновляем данные напрямую или вызываем повторный fetch
  // В реальной реализации лучше обновлять через API
  salaryDeductions.value.unshift(newPayment)
}

// Жизненный цикл
onMounted(async () => {
  await fetchData()
})
</script>