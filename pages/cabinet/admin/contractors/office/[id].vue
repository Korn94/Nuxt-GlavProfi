<template>
  <div class="container">
    <h1>Мастер: {{ office.name }}</h1>

    <!-- Информация -->
    <div class="block">
      <h3>Данные мастера:</h3>
      <p><strong>Имя:</strong> {{ office.name }}</p>
      <p><strong>Телефон:</strong> {{ office.phone }}</p>
      <p><strong>Баланс:</strong> {{ office.balance }} ₽</p>
      <p><strong>Ожидает оплаты:</strong> {{ pendingTotal }} ₽</p>
      <p><strong>Комментарий:</strong> {{ office.comment }}</p>
    </div>

    <!-- Форма добавления работы -->
    <div class="block">
      <h3>Добавить работу</h3>
      <input
        type="number"
        step="100.00"
        v-model="newWork.amount"
        placeholder="Сумма"
        required
      />
      <select v-model="newWork.objectId">
        <option value="">Выберите объект</option>
        <option v-for="obj in objects" :key="obj.id" :value="obj.id">
          {{ obj.name }}
        </option>
      </select>
      <!-- <select v-model="newWork.worksList">
        <option value="">Выберите вид работы</option>
        <option v-for="work in worksTypes" :key="work.id" :value="work.id">
          {{ work.name }}
        </option>
      </select> -->
      <textarea v-model="newWork.comment" placeholder="Комментарий"></textarea>
      <button @click="addWork">Добавить работу</button>
    </div>

    <!-- Форма добавления расхода -->
    <div class="block">
      <h3>Добавить Оплату</h3>
      <input
        type="number"
        step="100.00"
        v-model="newExpense.amount"
        placeholder="Сумма"
        required
      />
      <select v-model="newExpense.objectId">
        <option value="">Выберите объект</option>
        <option v-for="obj in objects" :key="obj.id" :value="obj.id">
          {{ obj.name }}
        </option>
      </select>
      <!-- <select v-model="newExpense.works">
        <option value="">Выберите вид работы</option>
        <option v-for="work in worksTypes" :key="work.id" :value="work.id">
          {{ work.name }}
        </option>
      </select> -->
      <textarea v-model="newExpense.comment" placeholder="Комментарий"></textarea>
      <button @click="addExpense">Добавить расход</button>
    </div>

    <!-- Список работ -->
    <div class="block">
      <h3>Работы</h3>
      <div class="pending">
        <h4>Ожидает оплаты:</h4>
        <ul v-if="pendingWorks.length > 0">
          <li v-for="work in pendingWorks" :key="work.id">
            {{ work.amount }} ₽ — {{ work.comment }} 
            <span class="object-name">({{ getObjectName(work.objectId) }})</span>
            {{ (objects.find(obj => obj.id === work.objectId) || {}).name || 'Объект не найден' }}
            <button @click="payWork(work.id)">Оплатить</button>
          </li>
        </ul>
        <p v-else>Нет работ, ожидающих оплаты.</p>
      </div>
      <div class="paid">
        <h4>Оплачено:</h4>
        <ul v-if="paidWorks.length > 0">
          <li v-for="work in paidWorks" :key="work.id">
            <b>{{ new Date(work.paymentDate).toLocaleDateString() }}</b> <!-- Форматируем дату -->
            {{ work.amount }} ₽ — {{ work.comment }} 
            <span class="object-name">({{ getObjectName(work.objectId) }})</span>
          </li>
        </ul>
        <p v-else>Нет оплаченных работ.</p>
      </div>
    </div>

    <div class="block">
      <h3>Расходы</h3>
      <div class="pending">
        <h4>Все расходы:</h4>
        <ul v-if="expenses.length > 0">
          <li v-for="expense in expenses" :key="expense.id">
            <b>{{ new Date(expense.paymentDate).toLocaleDateString() }}</b>
            {{ expense.amount }} ₽ — {{ expense.comment }} 
            <span class="object-name">({{ getObjectName(expense.objectId) }})</span>
          </li>
        </ul>
        <p v-else>Нет расходов.</p>
      </div>
    </div>
    
    <!-- Блок договоренностей -->
    <div class="block">
      <h2>Договоренности</h2>
      <div class="form">
        <textarea
          v-model="newAgreement.text"
          placeholder="Текст договоренности"
          :class="{ error: formAgreementErrors.text }"
        />
        <select v-model="newAgreement.status">
          <option value="active">Активная</option>
          <option value="completed">Завершенная</option>
        </select>
        <button @click="addAgreement">Добавить договоренность</button>
      </div>
      <h4>Активные:</h4>
      <ul>
        <li v-for="a in activeAgreements" :key="a.id">
          {{ a.text }}
          <button @click="completeAgreement(a.id)">Завершить</button>
        </li>
      </ul>

      <h4>Завершённые:</h4>
      <ul>
        <li v-for="a in completedAgreements" :key="a.id">
          {{ a.text }} (Завершено)
        </li>
      </ul>
    </div>

    <!-- Форма редактирования мастера -->
    <div class="block" v-if="editing">
      <h3>Редактировать данные</h3>
      <input
        v-model="office.name"
        placeholder="Имя"
        required
      />
      <input
        v-model="office.phone"
        placeholder="Телефон"
      />
      <textarea v-model="office.comment" placeholder="Комментарий"></textarea>
      <button @click="saveoffice">Сохранить</button>
      <button @click="cancelEdit">Отмена</button>
    </div>
    
    <div v-else>
      <button @click="toggleEdit">Редактировать</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useNuxtApp } from '#app'
import { useFetch } from '#app'

definePageMeta({ layout: 'cabinet' })

const route = useRoute()
const router = useRouter()

// Данные
const office = ref({})
const objects = ref([])
const works = ref([])
const expenses = ref([])
const agreements = ref([])

// Формы
const newWork = ref({ amount: null, objectId: null, comment: '' })
const newExpense = ref({ amount: null, objectId: null, comment: '' })
const newAgreement = ref({ text: '', status: 'active' })

// Режим редактирования
const editing = ref(false)
const formAgreementErrors = ref({})
const errorMessage = ref(null)
const successMessage = ref(null)

// Вычисляемые свойства
const pendingWorks = computed(() => works.value.filter(w => !w.paid))
const paidWorks = computed(() => works.value.filter(w => w.paid))

const totalWorks = computed(() => {
  return works.value.reduce((sum, w) => sum + Number(w.amount), 0)
})

const totalExpenses = computed(() => {
  return expenses.value.reduce((sum, e) => sum + Number(e.amount), 0)
})

const pendingTotal = computed(() => {
  return pendingWorks.value.reduce((sum, work) => sum + Number(work.amount), 0)
})

const balance = computed(() => (totalExpenses.value - totalWorks.value).toFixed(2))

const activeAgreements = computed(() => agreements.value.filter(a => a.status === 'active'))
const completedAgreements = computed(() => agreements.value.filter(a => a.status === 'completed'))

// Получить имя объекта по ID
const getObjectName = (objectId) => {
  const obj = objects.value.find(o => o.id === objectId)
  return obj ? obj.name : 'Объект не найден'
}

function getObjectById(id) {
  const obj = objects.value.find(o => o.id === id)
  return obj ? `(${obj.name})` : '(Объект не найден)'
}

function formatDate(date) {
  return date ? new Date(date).toLocaleDateString() : ''
}

// Загрузка данных
async function fetchoffice() {
  try {
    const data = await $fetch(`/api/contractors/offices/${route.params.id}`, {
      method: 'GET',
      credentials: 'include'
    })
    office.value = data
  } catch (error) {
    console.error('Ошибка при получении мастера:', error)
    router.push('/cabinet/admin/contractors/office')
  }
}

async function fetchObjects() {
  try {
    objects.value = await $fetch('/api/objects', { method: 'GET', credentials: 'include' })
  } catch (error) {
    console.error('Ошибка при получении объектов:', error)
  }
}

async function fetchWorks() {
  try {
    works.value = await $fetch(`/api/works`, {
      method: 'GET',
      params: { contractorType: 'office', contractorId: route.params.id },
      credentials: 'include'
    })
  } catch (error) {
    console.error('Ошибка при получении работ:', error)
  }
}

async function fetchExpenses() {
  try {
    expenses.value = await $fetch(`/api/expenses`, {
      method: 'GET',
      params: { contractorType: 'office', contractorId: route.params.id },
      credentials: 'include'
    })
  } catch (error) {
    console.error('Ошибка при получении расходов:', error)
  }
}

onMounted(async () => {
  await Promise.all([
    fetchoffice(),
    fetchObjects(),
    fetchWorks(),
    fetchExpenses(),
    fetchAgreements()
  ])
})

// Методы
async function addWork() {
  if (!newWork.value.amount || !newWork.value.objectId) {
    alert('Укажите сумму и объект')
    return
  }

  try {
    const payload = {
      ...newWork.value,
      contractorType: 'office',
      contractorId: route.params.id,
      paid: false,
      paymentDate: null,
      operationDate: new Date().toISOString(),
    }

    const result = await $fetch('/api/works', {
      method: 'POST',
      body: payload,
      credentials: 'include'
    })

    works.value.unshift(result)
    newWork.value = { amount: null, objectId: null, comment: '' }
    successMessage.value = 'Работа добавлена'
  } catch (error) {
    console.error('Ошибка добавления работы:', error)
    errorMessage.value = 'Не удалось добавить работу'
  }
}

async function addExpense() {
  if (!newExpense.value.amount || !newExpense.value.objectId) {
    alert('Укажите сумму и объект')
    return
  }

  try {
    const payload = {
      ...newExpense.value,
      contractorType: 'office',
      contractorId: route.params.id,
      paymentDate: new Date().toISOString(),
      operationDate: new Date().toISOString()
    }

    const result = await $fetch('/api/expenses', {
      method: 'POST',
      body: payload,
      credentials: 'include'
    })

    expenses.value.unshift(result)
    newExpense.value = { amount: null, objectId: null, comment: '' }
    successMessage.value = 'Расход добавлен'
  } catch (error) {
    console.error('Ошибка добавления расхода:', error)
    errorMessage.value = 'Не удалось добавить расход'
  }
}

async function payWork(workId) {
  try {
    await $fetch(`/api/works/pay-work/${workId}`, {
      method: 'POST',
      credentials: 'include'
    })

    await fetchWorks()
    await fetchExpenses()
    successMessage.value = 'Работа оплачена'
  } catch (error) {
    console.error('Ошибка оплаты работы:', error)
    errorMessage.value = 'Ошибка оплаты работы'
  }
}

function toggleEdit() {
  editing.value = true
}

async function saveoffice() {
  try {
    await $fetch(`/api/contractors/offices/${route.params.id}`, {
      method: 'PUT',
      body: office.value,
      credentials: 'include'
    })

    editing.value = false
    successMessage.value = 'Данные мастера обновлены'
  } catch (error) {
    console.error('Ошибка обновления мастера:', error)
    errorMessage.value = 'Не удалось сохранить изменения'
  }
}

async function addAgreement() {
  if (!newAgreement.value.text.trim()) {
    formAgreementErrors.value.text = 'Текст договоренности обязателен'
    return
  }

  try {
    const payload = {
      text: newAgreement.value.text,
      status: newAgreement.value.status,
      officeId: parseInt(route.params.id) // передаем ID мастера из URL
    }

    const result = await $fetch('/api/agreements', {
      method: 'POST',
      body: payload,
      credentials: 'include'
    })

    agreements.value.unshift(result)
    newAgreement.value = { text: '', status: 'active' }
    successMessage.value = 'Договорённость добавлена'
  } catch (error) {
    console.error('Ошибка добавления договорённости:', error)
    errorMessage.value = 'Не удалось добавить договорённость'
  }
}

async function completeAgreement(id) {
  try {
    const result = await $fetch(`/api/agreements/${id}`, {
      method: 'PATCH',
      body: {
        status: 'completed'
      },
      credentials: 'include'
    })

    // Обновляем список договоренностей
    const index = agreements.value.findIndex(a => a.id === id)
    if (index !== -1) {
      agreements.value[index] = result
    }

    successMessage.value = 'Договорённость завершена'
  } catch (error) {
    console.error('Ошибка завершения договорённости:', error)
    errorMessage.value = 'Не удалось завершить договорённость'
  }
}

async function fetchAgreements() {
  try {
    agreements.value = await $fetch(`/api/agreements`, {
      method: 'GET',
      params: { officeId: route.params.id },
      credentials: 'include'
    })
  } catch (error) {
    console.error('Ошибка получения договоренностей:', error)
  }
}

function cancelEdit() {
  editing.value = false
  fetchoffice()
}
</script>

<style lang="scss" scoped>
$primary-color: #4a90e2;
$secondary-color: #f5f7fa;
$error-color: #ff4d4d;
$border-radius: 8px;
$spacing: 1rem;

.container {
  max-width: 1000px;
  margin: 2rem auto;
  padding: $spacing * 1.5;
  background: #fff;
  border-radius: $border-radius;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

h1, h2, h3, h4 {
  color: #333;
  margin-top: $spacing * 1.5;
}

.block {
  background: $secondary-color;
  padding: $spacing;
  border-radius: $border-radius;
  margin-bottom: $spacing * 1.5;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.03);

  h3 {
    margin-top: 0;
    margin-bottom: $spacing;
    color: $primary-color;
  }

  p {
    margin: 0.4rem 0;
    color: #555;
  }
}

.pending, .paid {
  margin-top: $spacing;
  ul {
    list-style-type: none;
    padding-left: 0;
  }

  li {
    background: white;
    padding: 0.6rem 1rem;
    margin-bottom: 0.5rem;
    border-radius: $border-radius;
    display: flex;
    justify-content: space-between;
    align-items: center;
    box-shadow: 0 1px 5px rgba(0, 0, 0, 0.05);

    button {
      background-color: $primary-color;
      color: white;
      border: none;
      padding: 0.4rem 0.8rem;
      border-radius: 4px;
      cursor: pointer;
      transition: background 0.3s ease;

      &:hover {
        background-color: #223244;
      }
    }
  }
}

.object-name {
  color: #888;
  font-size: 0.9em;
  margin-left: 0.5rem;
}

input, select, textarea {
  // display: block;
  width: 100%;
  padding: 0.6rem;
  margin: 0.5rem 0 $spacing;
  border: 1px solid #ddd;
  border-radius: $border-radius;
  font-size: 1rem;
  box-sizing: border-box;
}

button {
  background-color: $primary-color;
  color: white;
  border: none;
  padding: 0.6rem 1.2rem;
  font-size: 1rem;
  border-radius: $border-radius;
  cursor: pointer;
  transition: background 0.3s ease;

  &:hover {
    background-color: #223244;
  }
}

.form {
  display: flex;
  flex-direction: column;
  gap: $spacing;
}

textarea.error {
  border-color: $error-color;
  background-color: #fff0f0;
}

ul {
  padding-left: 1rem;
}

li {
  margin-bottom: 0.4rem;
}

@media (max-width: 600px) {
  .container {
    padding: $spacing;
  }

  input, select, textarea {
    font-size: 0.95rem;
  }
}
</style>