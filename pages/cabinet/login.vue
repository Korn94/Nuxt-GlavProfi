<script setup>
import { ref, onMounted } from 'vue';
import { useNuxtApp } from '#app';

const login = ref('');
const password = ref('');

onMounted(() => {
  if (process.client) {
    const userData = localStorage.getItem('user');
    if (userData) {
      navigateTo('/cabinet'); // Перенаправляем авторизованного пользователя
    }
  }
});

async function handleLogin() {
  try {
    const response = await useNuxtApp().$axios.post('/auth/login', {
      login: login.value,
      password: password.value,
    });

    // Сохраняем данные пользователя
    localStorage.setItem('user', JSON.stringify(response.data));

    // Перенаправляем на главную страницу
    navigateTo('/cabinet');
  } catch (error) {
    alert('Неверный логин или пароль');
  }
}
</script>

<template>
  <div class="container">
    <h1>Вход в систему</h1>
    <input v-model="login" placeholder="Логин" />
    <input v-model="password" type="password" placeholder="Пароль" />
    <button @click="handleLogin">Войти</button>
  </div>
</template>

<style lang="scss" scoped>
.container {
  margin: 10em auto;
  max-width: 400px;
  padding: 20px;
  background-color: #ffffff;
  border-radius: 10px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  text-align: center;

  h1 {
    color: #34495e;
    font-size: 2rem;
    margin-bottom: 20px;
  }

  input {
    width: 100%;
    padding: 10px;
    margin-bottom: 10px;
    border: 1px solid #bdc3c7;
    border-radius: 5px;
    font-size: 1rem;
  }

  button {
    width: 100%;
    padding: 10px;
    background-color: #00c3f5;
    color: white;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    transition: background-color 0.3s ease;

    &:hover {
      background-color: #34495e;
    }
  }
}
</style>