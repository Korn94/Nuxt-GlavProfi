<template>
  <div class="container">
    <h1>Мастер: {{ master.name }}</h1>

    <!-- Информация -->
    <div class="block">
      <h3>Данные мастера:</h3>
      <p><strong>Имя:</strong> {{ master.name }}</p>
      <p><strong>Телефон:</strong> {{ master.phone }}</p>
      <p><strong>Баланс:</strong> {{ balance }} ₽</p>
      <p><strong>Комментарий:</strong> {{ master.comment }}</p>
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
            {{ work.amount }} ₽ — {{ work.comment }} 
            ({{ new Date(work.paymentDate).toLocaleDateString() }}) <!-- Форматируем дату -->
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
            <b>{{ new Date(expense.paymentDate).toLocaleDateString() }}</b> -
            {{ expense.amount }} ₽ — {{ expense.comment }} 
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
      <ul>
        <li v-for="agreement in agreements" :key="agreement.id">
          <strong>{{ agreement.date }}</strong>:
          {{ agreement.text }} 
          <span v-if="agreement.status === 'completed'">(Завершено)</span>
        </li>
      </ul>
    </div>

    <!-- Форма редактирования мастера -->
    <div class="block" v-if="editing">
      <h3>Редактировать данные</h3>
      <input
        v-model="master.name"
        placeholder="Имя"
        required
      />
      <input
        v-model="master.phone"
        placeholder="Телефон"
      />
      <textarea v-model="master.comment" placeholder="Комментарий"></textarea>
      <button @click="saveMaster">Сохранить</button>
      <button @click="cancelEdit">Отмена</button>
    </div>
    
    <div v-else>
      <button @click="toggleEdit">Редактировать</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useNuxtApp } from '#app';

const route = useRoute();
const router = useRouter();
const masterId = route.params.id;
const contractorType = 'master';

// Данные
const master = ref({});
const objects = ref([]);
const works = ref([]);
const expenses = ref([]);
const newWork = ref({});
const newExpense = ref({});
const agreements = ref([]);
const formAgreementErrors = ref({});
const newAgreement = ref({ text: '', status: 'active' });
// const worksTypes = ref([]);

// Режим редактирования
const editing = ref(false);

// Вычисляемые свойства
const pendingWorks = computed(() => 
  works.value.filter(w => w.paid !== true)
);
const paidWorks = computed(() => 
  works.value.filter(w => w.paid === true)
);

// Новая формула баланса: сумма всех работ - сумма расходов
const totalWorks = computed(() => 
  works.value.reduce((sum, w) => sum + Number(w.amount), 0)
);
const totalExpenses = computed(() => 
  expenses.value.reduce((sum, e) => sum + Number(e.amount), 0)
);
const balance = computed(() => 
  (totalExpenses.value - totalWorks.value).toFixed(2)
);

// Загрузка данных
async function fetchMaster() {
  try {
    const response = await useNuxtApp().$axios.get(
      `/contractors/masters/${masterId}`
    );
    master.value = response.data;
  } catch (error) {
    console.error('Ошибка при получении мастера:', error);
    router.push('/cabinet/admin/contractors/masters');
  }
}

async function fetchObjects() {
  try {
    const response = await useNuxtApp().$axios.get('/objects');
    objects.value = response.data;
  } catch (error) {
    console.error('Ошибка при получении объектов:', error);
  }
}

async function fetchWorks() {
  try {
    const response = await useNuxtApp().$axios.get(
      `/works/${contractorType}/${masterId}`
    );
    works.value = response.data;
  } catch (error) {
    console.error('Ошибка при получении работ:', error);
  }
}

async function fetchExpenses() {
  try {
    const response = await useNuxtApp().$axios.get(
      `/expenses/contractor/${contractorType}/${masterId}`
    );
    expenses.value = response.data;
  } catch (error) {
    console.error('Ошибка при получении расходов:', error);
  }
}

// async function fetchWorksTypes() {
//   try {
//     const response = await useNuxtApp().$axios.get('/works/types');
//     worksTypes.value = response.data;
//   } catch (error) {
//     console.error('Ошибка при получении типов работ:', error);
//   }
// }

definePageMeta({
  middleware: 'auth',
  allowedRoles: ['admin'],
  layout: 'cabinet',
});

onMounted(async () => {
  await fetchMaster();
  await fetchObjects();
  await fetchWorks();
  await fetchExpenses();
  // await fetchWorksTypes();
  await fetchAgreements();
});

// Методы
async function addWork() {
  try {
    const payload = {
      ...newWork.value,
      contractorType,
      contractorId: masterId,
      paid: false,
      paymentDate: null,
      operationDate: new Date(),
      modifiedAt: new Date(),
    };
    await useNuxtApp().$axios.post('/works', payload);
    works.value.push(payload);
    newWork.value = {};
  } catch (error) {
    console.error('Ошибка добавления работы:', error);
  }
}

async function addExpense() {
  try {
    const payload = {
      ...newExpense.value,
      contractorType,
      contractorId: masterId,
      paid: true,
      paymentDate: new Date(),
      operationDate: new Date(),
      modifiedAt: new Date(),
    };
    await useNuxtApp().$axios.post('/expenses', payload);
    expenses.value.push(payload);
    newExpense.value = {};
  } catch (error) {
    console.error('Ошибка добавления расхода:', error);
  }
}

async function payWork(workId) {
  try {
    const response = await useNuxtApp().$axios.post(`/works/pay-work/${workId}`);
    if (response.data.success) {
      // Обновляем данные локально, чтобы не ждать повторной загрузки
      const index = works.value.findIndex(w => w.id === workId);
      if (index !== -1) {
        works.value[index].paid = true;
        works.value[index].paymentDate = response.data.work.paymentDate;
      }
      await fetchWorks(); // Повторная загрузка для синхронизации
      await fetchExpenses();
    }
  } catch (error) {
    console.error('Ошибка оплаты работы:', error);
  }
}

function toggleEdit() {
  editing.value = true;
}

async function saveMaster() {
  try {
    await useNuxtApp().$axios.put(
      `/contractors/masters/${masterId}`,
      master.value
    );
    editing.value = false;
  } catch (error) {
    console.error('Ошибка обновления мастера:', error);
  }
}

async function fetchAgreements() {
  try {
    const response = await useNuxtApp().$axios.get(`/agreements/master/${route.params.id}`);
    agreements.value = response.data;
  } catch (error) {
    console.error('Ошибка при получении договоренностей:', error);
  }
}

// Добавление договоренности
async function addAgreement() {
  formAgreementErrors.value = {};

  if (!newAgreement.value.text) {
    formAgreementErrors.value.text = 'Укажите текст договоренности';
  }

  if (Object.keys(formAgreementErrors.value).length > 0) return;

  try {
    const payload = {
      contractorType: 'master',
      contractorId: route.params.id,
      ...newAgreement.value,
    };
    await useNuxtApp().$axios.post('/agreements', payload);
    await fetchAgreements();
    newAgreement.value = { text: '', status: 'active' };
    successMessage.value = 'Договоренность добавлена';
  } catch (error) {
    console.error('Ошибка:', error);
    errorMessage.value = 'Не удалось добавить договоренность';
  }
}

function cancelEdit() {
  editing.value = false;
  fetchMaster();
}
</script>

<style scoped>
.container {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.block {
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: #f8f8f8;
}

.pending,
.paid {
  margin-top: 1rem;
}

.pending h4,
.paid h4 {
  margin-bottom: 0.5rem;
}

button {
  margin: 0.5rem 0;
  padding: 0.5rem 1rem;
  background: #0d6efd;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

button:hover {
  background: #0b5ed7;
}

input,
select,
textarea {
  width: 100%;
  margin: 0.5rem 0;
  padding: 0.5rem;
}
</style>