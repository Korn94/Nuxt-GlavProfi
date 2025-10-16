<!-- app/components/Cabinet/Sidebar.vue -->
<template>
  <!-- Мобильный хедер -->
  <div class="mobile-header">
    <span class="burger-btn" @click="toggleSidebar" aria-label="Меню">
      <Icon name="bx:menu-alt-left" size="24" />
    </span>
    <h2>CRM</h2>
  </div>

  <!-- Боковая панель -->
  <aside
    class="sidebar"
    :class="{
      open: sidebarOpen,
      mobile: isMobile
    }"
  >
    <!-- Основное содержимое (шапка и меню) -->
    <div class="sidebar-content">
      <header class="sidebar-header">
        <h2>CRM Система</h2>
        <p>Добро пожаловать, {{ user?.name || 'Загрузка...' }}!</p>
      </header>

      <nav class="sidebar-nav">
        <ul>
          <template v-for="(item, index) in filteredMenu" :key="index">
            <!-- Обычный пункт меню -->
            <li v-if="!item.divider">
              <NuxtLink :to="item.path" @click="closeSidebarOnMobile">
                {{ item.title }}
              </NuxtLink>
            </li>

            <!-- Разделитель -->
            <li v-else class="divider">
              <hr />
            </li>
          </template>
        </ul>
      </nav>
    </div>

    <!-- Кнопка "Выйти" в самом низу -->
    <div class="sidebar-footer">
      <div class="role">
        <p>{{ roleLabels[user?.role] || 'Пользователь' }}</p>
      </div>
      <button @click="handleLogout">Выйти</button>
    </div>
  </aside>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const user = ref(null)
const sidebarOpen = ref(false)
const isMobile = ref(false)

// --- Перевод ролей на русский ---
const roleLabels = {
  admin: 'Администратор',
  manager: 'Менеджер',
  foreman: 'Прораб',
  master: 'Мастер',
  worker: 'Рабочий'
}

// --- Меню с разделителем после "Операции" ---
const menuItems = [
  { title: 'Главная', path: '/cabinet', roles: ['admin', 'manager', 'foreman', 'master', 'worker'] },
  { title: 'Сотрудники', path: '/cabinet/admin/contractors', roles: ['admin'] },
  { title: 'Объекты', path: '/cabinet/objects', roles: ['admin', 'foreman', 'master', 'worker'] },
  { title: 'Операции', path: '/cabinet/operation', roles: ['admin'] },
  { divider: true }, // Разделитель после "Операции"
  { title: 'На сайт', path: '/', roles: ['admin', 'manager', 'foreman', 'master', 'worker'] },
  { title: 'Новый кейс', path: '/projects/create', roles: ['admin', 'manager'] },
  { title: 'Прайс', path: '/prices/floor', roles: ['admin', 'manager'] },
  { divider: true }, // Разделитель после "Операции"
  { title: 'Баланс', path: '/cabinet/balance', roles: ['admin'] },
  { title: 'Аналитика', path: '/cabinet/analytics', roles: ['admin'] }
]

// --- Фильтрация меню с сохранением разделителей ---
const filteredMenu = computed(() => {
  if (!user.value) return []

  const filtered = []
  let previousItem = null

  for (const item of menuItems) {
    // Если это разделитель — добавляем только если перед ним был видимый пункт
    if (item.divider) {
      if (previousItem) {
        filtered.push(item)
      }
      continue
    }

    // Обычный пункт меню — проверяем по ролям
    if (!item.roles || item.roles.includes(user.value.role)) {
      filtered.push(item)
      previousItem = item
    }
  }

  return filtered
})

// --- Загрузка данных пользователя ---
async function fetchUserData() {
  try {
    const response = await fetch('/api/me', { method: 'GET', credentials: 'include' })
    if (!response.ok) throw new Error('Не удалось загрузить данные')
    const data = await response.json()
    user.value = data.user
  } catch (err) {
    console.error(err)
    router.push('/')
  }
}

// --- Проверка мобильного устройства ---
function checkIsMobile() {
  if (typeof window !== 'undefined') {
    isMobile.value = window.innerWidth < 768
  }
}

onMounted(() => {
  checkIsMobile()
  window.addEventListener('resize', checkIsMobile)
  fetchUserData()
})

// --- Управление боковой панелью ---
function toggleSidebar() {
  sidebarOpen.value = !sidebarOpen.value
}

function closeSidebarOnMobile() {
  if (isMobile.value) {
    sidebarOpen.value = false
  }
}

function handleLogout() {
  document.cookie = 'token=; path=/; max-age=0'
  user.value = null
  router.push('/')
}
</script>

<style lang="scss" scoped>
.mobile-header {
  display: none;
  align-items: center;
  justify-content: space-between;
  padding: 10px 15px;
  background-color: #27282a;
  color: $color-light;
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  z-index: 1000;
  box-shadow: $box-shadow;

  h2 {
    margin: 0;
    font-size: 1.3rem;
  }

  span {
    color: $color-light;
  }
}

.sidebar {
  width: 250px;
  background-color: #27282a;
  box-shadow: 2px 0 5px rgba(0, 0, 0, 0.1);
  position: fixed;
  height: 100%;
  padding: 20px;
  z-index: 900;
  transform: translateX(0);
  transition: transform 0.3s ease;
  display: flex;
  flex-direction: column;

  &.mobile {
    transform: translateX(-100%);
  }

  &.open {
    transform: translateX(0);
  }

  .sidebar-content {
    flex: 1;
    display: flex;
    flex-direction: column;

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

          &.divider {
            margin: 12px 0;
            pointer-events: none;

            hr {
              border: 0;
              border-top: 1px solid #444;
              margin: 0;
            }
          }
        }
      }
    }
  }

  .sidebar-footer {
    margin-top: auto;
    
    .role {
      text-align: center;
      border-bottom: 1px solid #444;
      padding-bottom: 10px;
      margin-bottom: 10px;
      font-size: .9rem;
      
      p {
        color: $color-light;
      }
    }

    button {
      width: 100%;
      background: $color-danger;
      border: none;
      padding: 10px;
      cursor: pointer;
      font-size: 1rem;
      color: white;
      border-radius: 5px;
      transition: background-color 0.3s ease;

      &:hover {
        background-color: $red;
        color: white;
      }
    }
  }
}

@media (max-width: 767.98px) {
  .mobile-header {
    display: flex;
  }

  .sidebar {
    &.mobile {
      position: fixed;
      top: 0;
      left: 0;
      width: 250px;
      height: 100%;
      overflow-y: auto;
      z-index: 950;
    }
  }
}
</style>