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
      >
      <button 
        @click="addObject" 
        :disabled="!newObjectName"
      >
        Добавить объект
      </button>
    </div>

    <!-- Список объектов -->
    <ul>
      <li 
        v-for="object in filteredObjects" 
        :key="object.id"
      >
        <router-link :to="`/cabinet/objects/${object.id}`">
          {{ object.name }} ({{ object.status }})
        </router-link>
        <div class="actions">
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

const objects = ref([]);
const newObjectName = ref('');
const currentTab = ref('active');
const user = ref(null);
const tabs = [
  { label: 'В работе', value: 'active' },
  { label: 'Завершенные', value: 'completed' }
];

definePageMeta({
  layout: 'cabinet',
  middleware: 'auth',
});

onMounted(async () => {
  if (process.client) {
    const userData = localStorage.getItem('user');
    user.value = userData ? JSON.parse(userData) : null;
  }
  await fetchObjects();
});

// Загрузка объектов
async function fetchObjects() {
  try {
    const response = await useNuxtApp().$axios.get('/objects', {
      params: { status: currentTab.value }
    });
    objects.value = response.data;
  } catch (error) {
    console.error('Ошибка загрузки объектов:', error);
  }
}

// Добавление объекта
async function addObject() {
  if (!newObjectName.value) return;
  try {
    await useNuxtApp().$axios.post('/objects', {
      name: newObjectName.value,
      status: currentTab.value
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
    objects.value = objects.value.filter(obj => obj.id !== id);
    newObjectName.value = '';
  } catch (error) {
    console.error('Ошибка удаления объекта:', error);
  }
}

// Изменение статуса объекта
async function toggleStatus(id) {
  const object = objects.value.find(obj => obj.id === id);
  if (object) {
    const newStatus = object.status === 'active' ? 'completed' : 'active';
    try {
      await useNuxtApp().$axios.put(`/objects/${id}`, { status: newStatus });
      object.status = newStatus;
    } catch (error) {
      console.error('Ошибка обновления статуса:', error);
    }
  }
}

// Фильтрация объектов по текущей вкладке
const filteredObjects = computed(() => {
  return objects.value.filter(obj => obj.status === currentTab.value);
});
</script>

<style scoped>
.container {
  max-width: 800px;
  margin: 20px auto;
}

.tabs {
  display: flex;
  gap: 1rem;
  margin-bottom: 20px;
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
  border-color: #007bff;
}

ul {
  list-style: none;
  padding: 0;
}

li {
  border: 1px solid #e0e0e0;
  margin: 10px 0;
  padding: 15px;
  border-radius: 4px;
}

.actions {
  display: flex;
  gap: 10px;
  margin-top: 10px;
}

.error {
  border: 1px solid red;
}

input.error {
  border-color: red;
}
</style>