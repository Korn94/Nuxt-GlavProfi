<template>
  <div class="container">
    <h1>Платежи</h1>
    <!-- Вкладки -->
    <div class="tabs">
      <button :class="{ active: currentCategory === 'all' }" @click="currentCategory = 'all'">Все</button>
      <button :class="{ active: currentCategory === 'materials' }" @click="currentCategory = 'materials'">Материалы</button>
      <button :class="{ active: currentCategory === 'workers' }" @click="currentCategory = 'workers'">Рабочие</button>
      <button :class="{ active: currentCategory === 'enterprise' }" @click="currentCategory = 'enterprise'">Предприятие</button>
    </div>
    <!-- Форма добавления платежа -->
    <div v-if="['admin', 'foreman'].includes(user?.role)">
      <select v-model="newPayment.userId">
        <option v-for="user in users" :key="user.id" :value="user.id">{{ user.name }}</option>
      </select>
      <input v-model="newPayment.amount" placeholder="Сумма" type="number" step="0.01" />
      <input v-model="newPayment.date" type="date" />
      <select v-model="newPayment.category">
        <option value="materials">Материалы</option>
        <option value="workers">Рабочие</option>
        <option value="enterprise">Предприятие</option>
      </select>
      <button @click="addPayment">Добавить</button>
    </div>
    <!-- Список платежей -->
    <ul>
      <li v-for="payment in filteredPayments" :key="payment.id">
        {{ payment.User?.name }}:
        <strong>{{ payment.amount }} ₽</strong> (
        {{ payment.category }} | {{ payment.date }}
        )
        <button @click="deletePayment(payment.id)">Удалить</button>
      </li>
    </ul>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useNuxtApp } from '#app';

const payments = ref([]);
const users = ref([]);
const newPayment = ref({ userId: '', amount: 0, date: '', category: 'enterprise' });
const currentCategory = ref('all');
const user = ref(null);

definePageMeta({
  layout: 'cabinet',
  middleware: 'auth',
});

onMounted(async () => {
  if (process.client) {
    const userData = localStorage.getItem('user');
    if (userData) user.value = JSON.parse(userData);
  }
  await fetchUsers();
  await fetchPayments();
});

async function fetchUsers() {
  try {
    const response = await useNuxtApp().$axios.get('/api/users');
    users.value = response.data;
  } catch (error) {
    console.error('Ошибка загрузки пользователей:', error);
  }
}

async function fetchPayments() {
  try {
    const response = await useNuxtApp().$axios.get('/payments', {
      params: { category: currentCategory.value === 'all' ? undefined : currentCategory.value },
    });
    payments.value = response.data;
  } catch (error) {
    console.error('Ошибка загрузки платежей:', error);
  }
}

async function addPayment() {
  if (!newPayment.value.userId || !newPayment.value.amount || !newPayment.value.date) return;
  try {
    await useNuxtApp().$axios.post('/payments', newPayment.value);
    await fetchPayments();
    newPayment.value = { userId: '', amount: 0, date: '', category: 'enterprise' };
  } catch (error) {
    console.error('Ошибка добавления платежа:', error);
  }
}

async function deletePayment(id) {
  try {
    await useNuxtApp().$axios.delete(`/payments/${id}`);
    await fetchPayments();
  } catch (error) {
    console.error('Ошибка удаления платежа:', error);
  }
}

// Фильтруем платежи по текущей категории
const filteredPayments = computed(() => {
  if (currentCategory.value === 'all') return payments.value;
  return payments.value.filter((p) => p.category === currentCategory.value);
});
</script>

<style scoped>
.tabs button {
  margin-right: 10px;
  padding: 8px 12px;
  border: 1px solid #ccc;
  background: #f0f0f0;
}
.tabs button.active {
  background: #007bff;
  color: white;
}
</style>