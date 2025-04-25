<template>
  <div class="container">
    <h1>Контрагенты</h1>
    <div class="form">
      <h2>Добавить контрагента</h2>
      <!-- Имя -->
      <input v-model="formData.name" placeholder="Имя" required />
      <!-- Телефон -->
      <input v-model="formData.phone" placeholder="Телефон" />
      <!-- Выбор роли -->
      <select v-model="formData.role" required>
        <option value="master">Мастер</option>
        <option value="foreman">Прораб</option>
        <option value="worker">Рабочий</option>
      </select>
      <!-- Привязка к пользователю -->
      <div v-if="showUserSelect">
        <select v-model="formData.userId">
          <option value="">Без привязки</option>
          <option v-for="user in users" :key="user.id" :value="user.id">
            {{ user.name }} ({{ user.role }})
          </option>
        </select>
      </div>
      <!-- Выполняемые работы (только для мастеров) -->
      <div v-if="formData.role === 'master'">
        <h3>Работы:</h3>
        <div v-for="work in works" :key="work">
          <input
            type="checkbox"
            :id="work"
            :value="work"
            v-model="formData.works"
          />
          <label :for="work">{{ work }}</label>
        </div>
      </div>
      <!-- Комментарий -->
      <textarea v-model="formData.comment" placeholder="Комментарий" />
      <!-- Кнопка отправки -->
      <button @click="submitForm">Создать</button>
    </div>
    <router-view />
  </div>
</template>

<script setup>
import { ref } from "vue";
import { useNuxtApp } from "#app";

const works = ["Малярка", "Сантехника", "Электрика", "Другое"];
const users = ref([]);

const formData = ref({
  name: "",
  phone: "",
  role: "master",
  userId: "",
  works: [],
  comment: "",
});

const showUserSelect = computed(() => formData.value.role !== "");

definePageMeta({
  middleware: 'auth',
  allowedRoles: ['admin'],
  layout: 'cabinet',
});

// Загрузка пользователей
onMounted(async () => {
  try {
    const response = await useNuxtApp().$axios.get("/api/users");
    users.value = response.data;
  } catch (error) {
    console.error("Ошибка при получении пользователей:", error);
  }
});

const submitForm = async () => {
  try {
    await useNuxtApp().$axios.post("/contractors", formData.value);
    // Очистить форму
    formData.value = {
      name: "",
      phone: "",
      role: "master",
      userId: "",
      works: [],
      comment: "",
    };
  } catch (error) {
    console.error("Ошибка:", error);
  }
};
</script>

<style lang="scss" scoped>
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.tabs {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
}

.tabs a {
  padding: 10px 20px;
  background-color: #f5f5f5;
  border: 1px solid #ddd;
  border-radius: 4px;
  text-decoration: none;
  color: #333;
}

.tabs a.active {
  background-color: #fff;
  border-bottom: 2px solid #00c3f5;
}

.form {
  border: 1px solid #e0e0e0;
  padding: 15px;
  border-radius: 4px;
  margin-bottom: 20px;
}

.form input,
.form select,
.form textarea {
  width: 100%;
  padding: 10px;
  margin-bottom: 10px;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
}

.form button {
  padding: 10px 20px;
  background-color: #00c3f5;
  color: #fff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.form button:hover {
  background-color: #00c3f5;
}

.works-list {
  margin-bottom: 20px;
}

.works-list label {
  display: inline-block;
  margin-right: 10px;
}
</style>