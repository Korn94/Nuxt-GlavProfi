<template>
  <MasterIndex
    :id="id"
    :contractor="contractor"
    :contractor-type="'master'" 
    :works="works"
    :expenses="expenses"
    :salary-deductions="salaryDeductions"
    :pending-total="pendingTotal"
    :objects="objects"
    @update-contractor="updateContractor"
    @add-work="addWork"
    @add-payment="addPayment"
  />
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import MasterIndex from '@/components/pages/cabinet/Contractors/MasterWorker/Index.vue'

const route = useRoute()
const id = route.params.id

// Основные данные
const contractor = ref({})
const works = ref([])
const salaryDeductions = ref([])
const expenses = ref([])
const objects = ref([])

// Состояния
const loading = ref(true)
const error = ref(null)

// Вычисления
const pendingTotal = computed(() => {
  return works.value
    .filter(w => !w.paid)
    .reduce((sum, w) => sum + parseFloat(w.amount || 0), 0)
})

definePageMeta({
  layout: 'cabinet',
  middleware: 'role',
  allowedRoles: ['admin']
});

// API
async function fetchData() {
  try {
    loading.value = true
    
    // Параллельные запросы
    const [contractorData, worksData, deductionsData, expensesData, objectsData] = await Promise.all([
      // Данные контрагента
      $fetch(`/api/contractors/masters/${id}`, { 
        method: 'GET', 
        credentials: 'include' 
      }),
      
      // Работы
      $fetch(`/api/works`, { 
        method: 'GET',
        params: { contractorType: 'master', contractorId: id },
        credentials: 'include'
      }),
      
      // Зарплатные удержания
      $fetch(`/api/salary-deductions?contractorType=master&contractorId=${id}`, {
        method: 'GET',
        credentials: 'include'
      }),
      
      // Расходы
      $fetch(`/api/expenses`, {
        method: 'GET',
        params: { contractorType: 'master', contractorId: id },
        credentials: 'include'
      }),
      
      // Список объектов (важно!)
      $fetch('/api/objects', {
        method: 'GET',
        credentials: 'include'
      })
    ])

    // Сохраняем данные
    contractor.value = contractorData
    works.value = formatWorks(worksData)
    salaryDeductions.value = deductionsData
    expenses.value = expensesData
    objects.value = objectsData // Сохраняем объекты

  } catch (err) {
    error.value = 'Не удалось загрузить данные'
    console.error('Ошибка загрузки:', err)
  } finally {
    loading.value = false
  }
}

function formatWorks(data) {
  return data.map(work => ({
    id: work.id,
    amount: parseFloat(work.workerAmount),
    clientAmount: parseFloat(work.customerAmount),
    comment: work.comment || '',
    contractorId: work.contractorId,
    contractorType: work.contractorType,
    workType: work.workTypes,
    objectId: work.objectId,
    paid: work.accepted,
    paymentDate: work.accepted ? work.acceptedDate : work.paymentDate,
    createdAt: work.createdAt
  }))
}

// Обработчики
async function updateContractor(updatedData) {
  try {
    await $fetch(`/api/contractors/masters/${id}`, {
      method: 'PUT',
      body: updatedData,
      credentials: 'include'
    })
    contractor.value = updatedData
  } catch (err) {
    console.error('Ошибка обновления:', err)
  }
}

function addWork(newWork) {
  works.value.unshift(newWork)
}

function addPayment(newPayment) {
  expenses.value.unshift(newPayment)
}

// Жизненный цикл
onMounted(async () => {
  await fetchData()
})
</script>