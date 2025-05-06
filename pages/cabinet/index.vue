<template>
  <div class="container">
    <h1>Главная страница</h1>
    <p v-if="user">Добро пожаловать, {{ user.role }}!</p>
    <p v-else>Пожалуйста, войдите в систему.</p>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const user = ref(null);

onMounted(() => {
  if (process.client) {
    const userData = localStorage.getItem('user');
    if (userData) {
      user.value = JSON.parse(userData);
    }
  }
});

definePageMeta({
  layout: 'cabinet',
  middleware: 'auth',
});
</script>

<style lang="scss" scoped>
.container {
  margin: 2rem auto;
  max-width: 800px;
  padding: 20px;
  background-color: #ffffff;
  border-radius: 10px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);

  h1 {
    text-align: center;
    color: #34495e;
    font-size: 2rem;
    margin-bottom: 20px;
  }

  p {
    text-align: center;
    color: #7f8c8d;
    font-size: 1.2rem;
  }
}
</style>