<template>
<div>
  <LayaoutCabinetHeaderWorkersMenu />
  <div class="list">
    <h2>{{ title }}</h2>
    <table>
      <thead>
        <tr>
          <th>Имя</th>
          <th>Телефон</th>
          <th>Роль</th>
          <th>Специальность</th>
          <th>Комментарий</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="contractor in contractors" :key="contractor.id">
          <td>{{ contractor.name }}</td>
          <td>{{ contractor.phone }}</td>
          <td>{{ contractor.role }}</td>
          <td>{{ contractor.works }}</td>
          <td>{{ contractor.comment }}</td>
          <!-- Добавляем ссылку на детальную страницу -->
          <td>
            <router-link 
              :to="`/cabinet/admin/contractors/${route.params.role}/${contractor.id}`"
              class="button"
            >
              Просмотреть
            </router-link>
            <button 
              @click="deleteContractor(contractor.id)" 
              class="button delete"
            >
              Удалить
            </button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useNuxtApp } from '#app';

const route = useRoute();
const contractors = ref([]);
const title = computed(() => {
  return route.params.role === 'master'
    ? 'Мастера'
    : route.params.role === 'foreman'
    ? 'Прорабы'
    : 'Рабочие';
});

definePageMeta({
  middleware: 'auth',
  allowedRoles: ['admin'],
  layout: 'cabinet',
});

onMounted(async () => {
  try {
    const response = await useNuxtApp().$axios.get(`/contractors/${route.params.role}`);
    contractors.value = response.data;
  } catch (error) {
    console.error('Ошибка:', error);
  }
});
</script>

<style lang="scss" scoped>
.list {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

h2 {
  margin-bottom: 20px;
}

table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 20px;
}

th,
td {
  border: 1px solid #ddd;
  padding: 12px;
  text-align: left;
}

th {
  background-color: #f5f5f5;
}

button {
  margin: 5px;
  padding: 8px 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  background-color: #007bff;
  color: #fff;
}

button:hover {
  background-color: #0056b3;
}

.error {
  border-color: red;
}

.error-message {
  color: red;
  margin-top: 5px;
}

.form {
  margin-bottom: 20px;
  border: 1px solid #e0e0e0;
  padding: 15px;
  border-radius: 4px;
}

textarea {
  width: 100%;
  height: 100px;
  margin-bottom: 10px;
}

.block {
  margin-bottom: 30px;
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
</style>