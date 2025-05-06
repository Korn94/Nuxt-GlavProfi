<script setup>
import { ref, onMounted } from 'vue';
import { logout } from '~/middleware/auth';

const user = ref(null);

const handleLogout = () => {
  logout();
};

onMounted(() => {
  if (process.client) {
    const userData = localStorage.getItem('user');
    if (userData) {
      user.value = JSON.parse(userData);
    }
  }
});

definePageMeta({
  middleware: 'auth',
});
</script>

<template>
  <div class="admin-layout">
    <!-- Боковая панель -->
    <aside class="sidebar">
      <header class="sidebar-header">
        <h2>Админ панель</h2>
        <p v-if="user">Добро пожаловать, {{ user.name }}!</p>
        <p v-else>Пожалуйста, войдите в систему.</p>
      </header>
      <nav class="sidebar-nav">
        <ul>
          <li><NuxtLink to="/cabinet">Главная</NuxtLink></li>
          <!-- <li><NuxtLink to="/cabinet/admin">Сотрудники</NuxtLink></li> -->
          <li><NuxtLink to="/cabinet/admin/contractors">Рабочие</NuxtLink></li>
          <li><NuxtLink to="/cabinet/admin/users">Пользователи</NuxtLink></li>
          <li><NuxtLink to="/cabinet/objects">Объекты</NuxtLink></li>
          <!-- <li><NuxtLink to="/cabinet/tasks">Выполнение работ</NuxtLink></li> -->
          <li><NuxtLink to="/cabinet/payments">Платежи</NuxtLink></li>
          <li><NuxtLink to="/cabinet/balance">Баланс</NuxtLink></li>
          <li><NuxtLink to="/cabinet/analytics">Аналитика</NuxtLink></li>
          <li><button @click="handleLogout">Выйти</button></li>
        </ul>
      </nav>
    </aside>
  </div>
</template>

<style lang="scss" scoped>
.admin-layout {
  display: flex;
  min-height: 100vh;
  background-color: #bdc3c7;
  width: 250px;
  box-shadow: 2px 0 5px rgba(0, 0, 0, 0.1);
  
  .sidebar {
    position: fixed;
    padding: 20px;

    .sidebar-header {
      margin-bottom: 20px;

      h2 {
        font-size: 1.5rem;
        margin: 0;
      }

      p {
        margin: 0;
        font-size: 0.9rem;
      }
    }

    .sidebar-nav {
      ul {
        list-style: none;
        padding: 0;

        li {
          margin-bottom: 10px;

          a {
            display: block;
            color: #34495e;
            text-decoration: none;
            padding: 10px;
            border-radius: 5px;
            transition: background-color 0.3s ease;

            &:hover {
              background-color: #34495e;
              color: white;
            }

            &.router-link-active {
              background-color: #00c3f5;
              color: white;
            }
          }
        }
      }
    }
  }
}
</style>