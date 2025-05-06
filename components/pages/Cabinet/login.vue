<template>
  <div class="background">
    <img src="/main/login2.jpg" alt="Фон для входа в CRM" class="background-image">
    <div class="container">
      <h1>Вход в систему</h1>
      <div class="input-container">
        <Icon name="mdi:account" class="icon" />
        <input v-model="login" placeholder="Логин" />
      </div>
      <div class="input-container">
        <Icon :name="showPassword ? 'mdi:lock-open-variant' : 'mdi:password'" class="icon hover" @click="togglePasswordVisibility" />
        <input :type="showPassword ? 'text' : 'password'" v-model="password" placeholder="Пароль" />
      </div>
      <button @click="handleLogin">Войти</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useNuxtApp } from '#app';

const login = ref('');
const password = ref('');
const showPassword = ref(false);

function togglePasswordVisibility() {
  showPassword.value = !showPassword.value;
}

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

<style lang="scss" scoped>
.background {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 0;

  .background-image {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    z-index: -1;
  }
}

.container {
  position: relative;
  width: 400px;
  padding: 20px;

  background: -moz-linear-gradient(-45deg, rgb(255,255,255, 0.1) 0%, rgb(0,195,245, 0.1) 50%, rgb(255,255,255, 0.1) 100%);
  background: -webkit-linear-gradient(-45deg, rgb(255,255,255, 0.1) 0%, rgb(0,195,245, 0.1) 50%, rgb(255,255,255, 0.1) 100%);
  background: linear-gradient(135deg, rgb(255,255,255, 0.1) 0%, rgb(0,195,245, 0.1) 50%, rgb(255,255,255, 0.1) 100%);
  
  backdrop-filter: blur(5px); /* Размытие внутри контейнера */
  border-radius: 5px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  text-align: center;
  z-index: 1; /* Убедитесь, что контейнер находится поверх изображения */

  h1 {
    color: white;
    font-size: 2rem;
    margin-bottom: 20px;
  }

  input {
    width: 100%;
    padding: 10px;
    margin-bottom: 10px;
  }

  .input-container {
    position: relative;

    .icon {
      position: absolute;
      top: 25%;
      right: 10px;
      color: #34495e;
    }
      
      .hover {
        cursor: pointer;
      }
  }

  button {
    width: 100%;
    padding: 12px;
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