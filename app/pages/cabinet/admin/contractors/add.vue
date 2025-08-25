<template>
  <div class="container">
    <h1>Добавить контрагента</h1>
    <div class="form">
      <!-- Имя -->
      <input v-model="formData.name" placeholder="Имя" required />

      <!-- Телефон -->
      <input v-model="formData.phone" placeholder="Телефон" />

      <!-- Роль (тип контрагента) -->
      <select v-model="formData.role" required>
        <option value="master">Мастер</option>
        <option value="foreman">Прораб</option>
        <option value="worker">Рабочий</option>
        <option value="office">Офис</option>
      </select>

      <!-- Привязка к пользователю -->
      <div v-if="showUserSelect">
        <label>Привязать к пользователю:</label>
        <select v-model="formData.userId">
          <option value="">Без привязки</option>
          <option v-for="user in availableUsers" :key="user.id" :value="user.id">
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
      <textarea v-model="formData.comment" placeholder="Комментарий"></textarea>

      <!-- Кнопка отправки -->
      <button @click="submitForm">Создать</button>
    </div>

    <!-- Сообщения -->
    <div v-if="successMessage" class="success-message">{{ successMessage }}</div>
    <div v-if="errorMessage" class="error-message">{{ errorMessage }}</div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useNuxtApp } from "#app";

// Список возможных работ для мастеров
const works = ["Малярка", "Сантехника", "Электрика", "Другое"];

// Список пользователей
const users = ref([]);

// Форма данных
const formData = ref({
  name: "",
  phone: "",
  role: "master",
  userId: "",
  works: [],
  comment: ""
});

// Сообщения
const successMessage = ref("");
const errorMessage = ref("");

// Отображать ли выпадающий список пользователей
const showUserSelect = computed(() => {
  return formData.value.role !== "";
});

definePageMeta({
  layout: "cabinet",
  middleware: 'role',
  allowedRoles: ['admin']
});

// Загрузка пользователей
onMounted(async () => {
  try {
    const data = await $fetch("/api/users", {
      method: "GET",
      credentials: "include"
    });
    users.value = data.users
  } catch (error) {
    console.error("Ошибка при загрузке пользователей:", error);
  }
});

// Отправка формы
const submitForm = async () => {
  // Проверка имени
  if (!formData.value.name.trim()) {
    errorMessage.value = "Имя обязательно";
    return;
  }

  // Проверка пользователя
  if (formData.value.userId) {
    const user = users.value.find(u => u.id === formData.value.userId);

    if (user && user.contractorId && user.contractorType) {
      const confirmChange = confirm(
        `Этот пользователь уже привязан к ${user.contractorType} #${user.contractorId}. Хотите изменить привязку?`
      );
      if (!confirmChange) return;
    }
  }

  try {
    const body = {
      type: formData.value.role,
      data: {
        name: formData.value.name,
        phone: formData.value.phone,
        comment: formData.value.comment,
        works: Array.isArray(formData.value.works)
          ? formData.value.works.join(", ")
          : formData.value.works || "",
        userId: formData.value.userId || null
      }
    };

    await $fetch("/api/contractors", {
      method: "POST",
      body,
      credentials: "include"
    });

    // Сброс формы
    formData.value = {
      name: "",
      phone: "",
      role: "master",
      userId: "",
      works: [],
      comment: ""
    };

    successMessage.value = "Контрагент успешно создан!";
    errorMessage.value = "";
  } catch (error) {
    console.error("Ошибка при создании контрагента:", error);
    errorMessage.value = "Не удалось создать контрагента";
    successMessage.value = "";
  }
};

const availableUsers = computed(() => {
  return users.value.filter(user => {
    // Показываем только пользователей без привязки или с той же ролью, что и контрагент
    return !user.contractorId || user.contractorType === formData.value.role
  })
})
</script>

<style lang="scss" scoped>
.container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.form {
  display: flex;
  flex-direction: column;
  gap: 15px;
  border: 1px solid #e0e0e0;
  padding: 20px;
  border-radius: 6px;
  background-color: #f9f9f9;
}

input,
select,
textarea {
  padding: 10px;
  font-size: 16px;
  border: 1px solid #ccc;
  border-radius: 4px;
  width: 100%;
}

select {
  cursor: pointer;
}

textarea {
  resize: vertical;
  min-height: 80px;
}

button {
  padding: 12px 20px;
  background-color: #00c3f5;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 16px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

button:hover {
  background-color: #00a8cc;
}

.success-message {
  margin-top: 20px;
  color: green;
  font-weight: bold;
}

.error-message {
  margin-top: 20px;
  color: red;
  font-weight: bold;
}
</style>