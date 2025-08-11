<template>
  <WorkerIndex
    :id="id"
    :contractor="contractor"
    :contractor-type="'worker'"
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
import WorkerIndex from '@/components/pages/Cabinet/Contractors/MasterWorker/Index.vue'

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
    const [contractorData, worksData, deductionsData, expensesData] = await Promise.all([
      $fetch(`/api/contractors/workers/${id}`, { method: 'GET', credentials: 'include' }),
      $fetch(`/api/works`, { 
        method: 'GET',
        params: { contractorType: 'worker', contractorId: id },
        credentials: 'include'
      }),
      $fetch(`/api/salary-deductions?contractorType=worker&contractorId=${id}`, {
        method: 'GET',
        credentials: 'include'
      }),
      $fetch(`/api/expenses`, {
        method: 'GET',
        params: { contractorType: 'worker', contractorId: id },
        credentials: 'include'
      }),

      $fetch('/api/objects', {
        method: 'GET',
        credentials: 'include'
      })
    ])
    
    contractor.value = contractorData
    works.value = formatWorks(worksData)
    salaryDeductions.value = deductionsData
    expenses.value = expensesData
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
    await $fetch(`/api/contractors/workers/${id}`, {
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