<template>
  <div class="container">
    <h1>Привязка аккаунта</h1>
    <p v-if="userData">Привет, {{ userData.firstName }}!</p>
    <button @click="bindAccount" :disabled="isBinding">Привязать аккаунт</button>
    <p v-if="message">{{ message }}</p>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const userData = ref(null);
const isBinding = ref(false);
const message = ref('');

onMounted(() => {
  if (window.Telegram && window.Telegram.WebApp) {
    const tg = window.Telegram.WebApp;

    // Расширяем окно на весь экран
    tg.expand();

    // Получаем данные пользователя
    userData.value = tg.initDataUnsafe?.user;
  }
});

async function bindAccount() {
  if (!userData.value) {
    message.value = 'Ошибка: Данные пользователя не найдены';
    return;
  }

  isBinding.value = true;

  try {
    const response = await fetch('/api/bind-telegram', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        telegramId: userData.value.id,
        username: userData.value.first_name
      })
    });

    const result = await response.json();

    if (result.success) {
      message.value = result.message;
    } else {
      message.value = result.message || 'Ошибка при привязке аккаунта';
    }
  } catch (error) {
    message.value = 'Произошла ошибка при отправке запроса';
  } finally {
    isBinding.value = false;
  }
}

useHead({
  title: 'Авторизации в CRM-систему через Telegram',
  meta: [
    { name: 'description', content: 'Страница авторизации в CRM-систему через Telegram' },
    { property: 'og:title', content: 'Авторизации в CRM-систему через Telegram' },
    { property: 'og:description', content: 'Страница авторизации в CRM-систему через Telegram' },
  ]
})
</script>

<style lang="scss" scoped>
.container {
  margin-top: 5em;
}
</style>