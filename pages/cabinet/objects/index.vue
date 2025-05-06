<template>
  <div class="container">
    <h1>Объекты</h1>

    <!-- Вкладки -->
    <div class="tabs">
      <button
        v-for="tab in tabs"
        :key="tab.value"
        :class="{ active: currentTab === tab.value }"
        @click="currentTab = tab.value"
      >
        {{ tab.label }}
      </button>
    </div>

    <!-- Форма добавления объекта -->
    <div v-if="['admin', 'manager'].includes(user?.role)">
      <input
        v-model="newObjectName"
        placeholder="Название объекта"
        :class="{ error: !newObjectName }"
      />
      <button @click="addObject" :disabled="!newObjectName">Добавить объект</button>
    </div>

    <!-- Список объектов -->
    <ul>
      <li v-for="object in filteredObjects" :key="object.id">
        <router-link :to="`/cabinet/objects/${object.id}`">
          {{ object.name }} ({{ object.status }})
        </router-link>
        <div class="actions">
          <div class="balance">
            Баланс: <strong>{{ object.balance }} ₽</strong>
          </div>
          <button
            v-if="user?.role === 'admin'"
            @click="toggleStatus(object.id)"
          >
            Изменить статус
          </button>
          <button
            v-if="user?.role === 'admin'"
            @click="deleteObject(object.id)"
          >
            Удалить
          </button>
        </div>
      </li>
    </ul>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useNuxtApp } from '#app';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();
const user = ref(null);
const objects = ref([]);
const newObjectName = ref('');
const currentTab = ref('active');
const tabs = [
  { label: 'В работе', value: 'active' },
  { label: 'Завершенные', value: 'completed' },
];

// Загрузка данных пользователя
if (process.client) {
  const userData = localStorage.getItem('user');
  user.value = userData ? JSON.parse(userData) : null;
}

definePageMeta({
  layout: 'cabinet',
});

// Загрузка объектов
onMounted(async () => {
  await fetchObjects();
});

async function fetchObjects() {
  try {
    const response = await useNuxtApp().$axios.get('/objects', {
      params: { status: currentTab.value },
    });
    objects.value = response.data.map((obj) => ({
      ...obj,
      balance: 0, // Инициализация
    }));
    await updateObjectBalances(); // Обновите балансы после загрузки объектов
  } catch (error) {
    console.error('Ошибка загрузки объектов:', error);
  }
}

// Обновление баланса каждого объекта
async function updateObjectBalances() {
  try {
    const promises = objects.value.map(async (obj) => {
      const balanceResponse = await useNuxtApp().$axios.get(
        `/objects/${obj.id}/balance`
      );
      return {
        ...obj,
        balance: balanceResponse.data.balance, // <<-- Исправление здесь
      };
    });
    const updatedObjects = await Promise.all(promises);
    objects.value = updatedObjects;
  } catch (error) {
    console.error('Ошибка обновления балансов:', error);
  }
}

// Добавление объекта
async function addObject() {
  if (!newObjectName.value) return;
  try {
    await useNuxtApp().$axios.post('/objects', {
      name: newObjectName.value,
      status: currentTab.value,
    });
    await fetchObjects();
    newObjectName.value = '';
  } catch (error) {
    console.error('Ошибка добавления объекта:', error);
  }
}

// Удаление объекта
async function deleteObject(id) {
  try {
    await useNuxtApp().$axios.delete(`/objects/${id}`);
    objects.value = objects.value.filter((obj) => obj.id !== id);
    newObjectName.value = '';
  } catch (error) {
    console.error('Ошибка удаления объекта:', error);
  }
}

// Изменение статуса объекта
async function toggleStatus(id) {
  const object = objects.value.find((obj) => obj.id === id);
  if (!object) return;

  const newStatus =
    object.status === 'active' ? 'completed' : 'active';
  try {
    await useNuxtApp().$axios.put(`/objects/${id}`, { status: newStatus });
    object.status = newStatus;
  } catch (error) {
    console.error('Ошибка обновления статуса:', error);
  }
}

// Фильтрация объектов по текущей вкладке
const filteredObjects = computed(() => {
  // Если currentTab.value может быть 'completed', а в объектах 'completed' — используйте строгое сравнение
  return objects.value.filter(obj => 
    obj.status === currentTab.value
  );
});
</script>

<style scoped>
.container {
  margin: 2rem;
}

.tabs button {
  margin-right: 1rem;
  padding: 0.5rem 1rem;
  border: 1px solid #ccc;
  background: #f0f0f0;
  cursor: pointer;
}

.tabs button.active {
  background: #007bff;
  color: white;
}

ul {
  list-style: none;
  padding: 0;
}

li {
  margin: 1rem 0;
  padding: 1rem;
  background: #f8f8f8;
  border-radius: 5px;
}

.actions {
  display: flex;
  gap: 1rem;
  margin-top: 0.5rem;
}

.balance strong {
  font-weight: bold;
  color: #28a745;
}

button {
  padding: 0.5rem 1rem;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

button:hover {
  background: #0056b3;
}

button.delete {
  background: #dc3545;
}
</style>