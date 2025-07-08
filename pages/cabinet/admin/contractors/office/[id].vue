<template>
  <OfficeIndex
    :id="id"
    :contractor="contractor"
    :contractor-type="'office'" 
    :expenses="expenses"
    :salary-deductions="salaryDeductions"
    :objects="objects"
    @update-contractor="updateContractor"
    @add-payment="addPayment"
  />
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import OfficeIndex from '@/components/pages/Cabinet/Contractors/Office/Index.vue'

const route = useRoute()
const id = route.params.id

// Основные данные
const contractor = ref({})
const salaryDeductions = ref([])
const expenses = ref([])
const objects = ref([])

// Состояния
const loading = ref(true)
const error = ref(null)

definePageMeta({
  layout: 'cabinet',
});

// API
async function fetchData() {
  try {
    loading.value = true
    const [contractorData, deductionsData, expensesData, objectsData] = await Promise.all([
      $fetch(`/api/contractors/offices/${id}`, { 
        method: 'GET',
        credentials: 'include'
      }),
      $fetch(`/api/salary-deductions?contractorType=office&contractorId=${id}`, {
        method: 'GET',
        credentials: 'include'
      }),
      
      // Расходы
      $fetch(`/api/expenses`, {
        method: 'GET',
        params: { contractorType: 'office', contractorId: id },
        credentials: 'include'
      }),

      $fetch('/api/objects', {
        method: 'GET',
        credentials: 'include'
      })
    ])
    
    contractor.value = contractorData
    salaryDeductions.value = deductionsData
    expenses.value = expensesData
    objects.value = objectsData
  } catch (err) {
    error.value = 'Не удалось загрузить данные'
    console.error('Ошибка загрузки:', err)
  } finally {
    loading.value = false
  }
}

// Обработчики
async function updateContractor(updatedData) {
  try {
    await $fetch(`/api/contractors/offices/${id}`, {
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