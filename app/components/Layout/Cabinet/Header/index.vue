<!-- app/components/Layout/Cabinet/Header/index.vue -->
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
      
      <!-- Переключатель режимов меню -->
      <div class="menu-mode-switcher">
        <button
          class="menu-mode-btn"
          :class="{ active: menuMode === 'crm' }"
          @click="setMenuMode('crm')"
          title="Режим CRM"
        >
          <Icon name="mdi:database" size="18" />
          <span>CRM</span>
        </button>
        <button
          class="menu-mode-btn"
          :class="{ active: menuMode === 'boards' }"
          @click="setMenuMode('boards')"
          title="Режим Досок"
        >
          <Icon name="mdi:clipboard-text-multiple-outline" size="18" />
          <span>Доски</span>
        </button>
      </div>
      
      <!-- Динамическое меню в зависимости от режима -->
      <CrmMenu v-if="menuMode === 'crm'" @close-sidebar="closeSidebarOnMobile" />
      <BoardsMenu v-else-if="menuMode === 'boards'" @close-sidebar="closeSidebarOnMobile" />
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

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '~~/stores/auth'
import CrmMenu from './ui/crm.vue'
import BoardsMenu from './ui/boards.vue'

const router = useRouter()
const authStore = useAuthStore()

const user = ref<any>(null)
const sidebarOpen = ref(false)
const isMobile = ref(false)
const menuMode = ref<'crm' | 'boards'>('crm') // Режим меню по умолчанию

// --- Перевод ролей на русский ---
const roleLabels: Record<string, string> = {
  admin: 'Админ',
  manager: 'Менеджер',
  foreman: 'Прораб',
  master: 'Мастер',
  worker: 'Рабочий'
}

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

// --- Установка режима меню ---
function setMenuMode(mode: 'crm' | 'boards') {
  menuMode.value = mode
}

// --- Проверка мобильного устройства ---
function checkIsMobile() {
  if (typeof window !== 'undefined') {
    isMobile.value = window.innerWidth < 768
  }
}

// --- Управление боковой панелью ---
function toggleSidebar() {
  sidebarOpen.value = !sidebarOpen.value
}

function closeSidebarOnMobile() {
  if (isMobile.value) {
    sidebarOpen.value = false
  }
}

// --- Обработка выхода из системы ---
function handleLogout() {
  authStore.logout()
  user.value = null
  router.push('/')
}

onMounted(() => {
  checkIsMobile()
  window.addEventListener('resize', checkIsMobile)
  fetchUserData()
})
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
    cursor: pointer;
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
    
    // Переключатель режимов меню
    .menu-mode-switcher {
      display: flex;
      gap: 4px;
      margin-bottom: 20px;
      background: rgba(0, 0, 0, 0.3);
      border-radius: 12px;
      overflow: hidden;
      padding: 4px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    }
    
    .menu-mode-btn {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 10px 14px;
      background: rgba(255, 255, 255, 0.05);
      border: none;
      border-radius: 8px;
      color: #aaa;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.3s ease;
      position: relative;
      overflow: hidden;
      
      &:hover {
        background: rgba(0, 195, 245, 0.15);
        color: #00c3f5;
        transform: translateY(-1px);
      }
      
      &.active {
        color: white;
        background: rgba(0, 195, 245, 0.2);
        
        &::before {
          content: '';
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: radial-gradient(circle, rgba(255, 255, 255, 0.2) 0%, transparent 70%);
          animation: pulse-glow 2s ease-in-out infinite;
        }
      }

      span {
        color: unset;
      }
      
      .icon {
        font-size: 18px;
        transition: transform 0.3s ease;
      }
      
      &.active .icon {
        transform: scale(1.1);
      }
    }

    @keyframes pulse-glow {
      0%, 100% {
        opacity: 0.3;
        transform: scale(1);
      }
      50% {
        opacity: 0.6;
        transform: scale(1.05);
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
      
      p {
        color: $color-light;
        font-size: 0.9rem;
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