<template>
  <div class="admin-layout">
    <!-- Боковая панель -->
    <aside class="sidebar">
      <header class="sidebar-header">
        <h2>CRM Система</h2>
        <p v-if="user">Добро пожаловать, {{ user.name }}!</p>
        <p v-else>Пожалуйста, войдите в систему.</p>
      </header>
      <nav class="sidebar-nav">
        <ul>
          <!-- Динамическое меню -->
          <li v-for="item in filteredMenu" :key="item.path">
            <NuxtLink :to="item.path">{{ item.title }}</NuxtLink>
          </li>
        </ul>
        <ul>
          <li><button @click="handleLogout">Выйти</button></li>
        </ul>
      </nav>
    </aside>

    <!-- Основной контент -->
    <main class="main-content">
      <slot />
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()
const user = ref(null)

// Меню с указанием разрешенных ролей
const menuItems = [
  { title: 'Главная', path: '/cabinet', roles: ['admin', 'manager', 'foreman', 'master', 'worker'] },
  { title: 'Пользователи', path: '/cabinet/admin/users', roles: ['admin'] },
  { title: 'Сотрудники', path: '/cabinet/admin/contractors', roles: ['admin'] },
  { title: 'Объекты', path: '/cabinet/objects', roles: ['admin', 'foreman', 'master', 'worker'] },
  // { title: 'Платежи', path: '/cabinet/payments', roles: ['admin', 'manager', 'foreman'] },
  // { title: 'Прайс', path: '/cabinet/price', roles: ['admin', 'manager'] },
  { title: 'Прайс', path: '/cabinet/price/list', roles: ['admin', 'manager'] },
  { title: 'Баланс', path: '/cabinet/balance', roles: ['admin'] },
  { title: 'Аналитика', path: '/cabinet/analytics', roles: ['admin'] },
  { title: 'Операции', path: '/cabinet/operation', roles: ['admin'] },
  { title: 'На сайт', path: '/', roles: ['admin', 'manager', 'foreman', 'master', 'worker'] }
]

// Фильтрация меню по роли пользователя
const filteredMenu = computed(() => {
  if (!user.value) return []
  return menuItems.filter(item => {
    // Если нет ограничений по ролям - показываем всем
    if (!item.roles) return true
    // Проверяем соответствие роли пользователя
    return item.roles.includes(user.value.role)
  })
})

// Получение данных пользователя
async function fetchUserData() {
  try {
    const response = await fetch('/api/me', {
      method: 'GET',
      credentials: 'include'
    })
    
    if (!response.ok) {
      throw new Error('Не удалось загрузить данные пользователя')
    }
    
    const data = await response.json()
    user.value = data.user
  } catch (err) {
    console.error(err)
    router.push('/')
  }
}

// Обработка выхода
function handleLogout() {
  // Удаление токена из cookie
  document.cookie = 'token=; path=/; max-age=0'
  // Очистка данных пользователя
  user.value = null
  // Перенаправление на главную
  router.push('/')
}

onMounted(() => {
  fetchUserData()
})
</script>

<style lang="scss" scoped>
.admin-layout {
  display: flex;
  min-height: 100vh;
  background-color: #f5f6fa;
  margin-right: 250px;
  
  .sidebar {
    width: 250px;
    background-color: #27282a;
    box-shadow: 2px 0 5px rgba(0, 0, 0, 0.1);
    position: fixed;
    height: 100%;
    padding: 20px;
    
    .sidebar-header {
      margin-bottom: 20px;

      h2 {
        font-size: 1.5rem;
        margin: 0;
        color: #fff;
      }

      p {
        margin: 0;
        font-size: 0.9rem;
        color: #7f8c8d;
      }
    }

    .sidebar-nav {
      display: flex;
      height: 85vh;
      flex-direction: column;
      justify-content: space-between;

      ul {
        list-style: none;
        padding: 0;

        li {
          margin-bottom: 10px;

          a {
            display: block;
            color: #eeeeee;
            text-decoration: none;
            padding: 10px;
            border-radius: 5px;
            transition: background-color 0.3s ease;

            &:hover {
              background-color: #00c3f5;
              color: white;
            }
            
            &.router-link-active {
              background-color: #34495e;
              color: white;
            }
          }

          button {
            width: 100%;
            background: #662828;
            border: none;
            padding: 10px;
            cursor: pointer;
            font-size: 1rem;
            color: white;
            transition: background-color 0.3s ease;

            &:hover {
              background-color: #8d2222;
              color: white;
            }
          }
        }
      }
    }
  }

  .main-content {
    // margin-left: 250px;
    padding: 20px;
    width: calc(100% - 250px);
    min-height: 100vh;
  }
}
</style>