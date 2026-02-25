<!-- app/components/Layout/Cabinet/Header/ui/crm.vue -->
<template>
  <ul>
    <template v-for="(item, index) in filteredMenu" :key="index">
      <!-- Обычный пункт меню -->
      <li v-if="!item.divider" class="menu-item">
        <NuxtLink :to="item.path" @click="handleClick" class="menu-link">
          <Icon :name="item.icon" class="menu-icon" />
          <span class="menu-text">{{ item.title }}</span>
        </NuxtLink>
      </li>
      <!-- Разделитель -->
      <li v-else class="divider">
        <hr />
      </li>
    </template>
  </ul>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useAuthStore } from 'stores/auth'

// Emits
const emit = defineEmits<{
  closeSidebar: []
}>()

// Store
const authStore = useAuthStore()

// Menu items с иконками
const menuItems = [
  { 
    title: 'Главная', 
    path: '/cabinet', 
    icon: 'mdi:home-outline',
    roles: ['admin', 'manager', 'foreman', 'master', 'worker'] 
  },
  { 
    title: 'Сотрудники', 
    path: '/cabinet/admin/contractors', 
    icon: 'mdi:account-group-outline',
    roles: ['admin'] 
  },
  { 
    title: 'Объекты', 
    path: '/cabinet/objects', 
    icon: 'mdi:office-building-outline',
    roles: ['admin', 'foreman', 'master', 'worker'] 
  },
  { 
    title: 'Чеки', 
    path: '/cabinet/materials', 
    icon: 'mdi:receipt-text-outline',
    roles: ['admin'] 
  },
  { 
    title: 'Операции', 
    path: '/cabinet/operation', 
    icon: 'mdi:instant-transfer',
    roles: ['admin'] 
  },
  { 
    title: 'Онлайн', 
    path: '/cabinet/online', 
    icon: 'mdi:account-multiple-check-outline',
    roles: ['admin'] 
  },
  { 
    title: 'Тест', 
    path: '/cabinet/testpage', 
    icon: 'mdi:flask-outline',
    roles: ['admin'] 
  },
  { divider: true },
  { 
    title: 'На сайт', 
    path: '/', 
    icon: 'mdi:web',
    roles: ['admin', 'manager', 'foreman', 'master', 'worker'] 
  },
  { 
    title: 'Новый кейс', 
    path: '/projects/create', 
    icon: 'mdi:plus-circle-outline',
    roles: ['admin', 'manager'] 
  },
  { divider: true },
  { 
    title: 'Баланс', 
    path: '/cabinet/balance', 
    icon: 'mdi:currency-rub',
    roles: ['admin'] 
  },
]

// Filtered menu based on user role
const filteredMenu = computed(() => {
  const user = authStore.user
  if (!user) return []
  
  const filtered: any[] = []
  let previousItem: any = null
  
  for (const item of menuItems) {
    // Divider - add only if there was a visible item before
    if (item.divider) {
      if (previousItem) {
        filtered.push(item)
      }
      continue
    }
    // Regular menu item - check roles
    if (!item.roles || item.roles.includes(user.role)) {
      filtered.push(item)
      previousItem = item
    }
  }
  
  return filtered
})

// Handle click on menu item
const handleClick = () => {
  emit('closeSidebar')
}
</script>

<style lang="scss" scoped>
ul {
  list-style: none;
  padding: 12px 0;
  margin: 0;
  
  li {
    margin-bottom: 0;
    
    &.menu-item {
      .menu-link {
        display: flex;
        align-items: center;
        gap: 12px;
        color: #ccc;
        text-decoration: none;
        padding: 10px 16px;
        border-radius: 6px;
        transition: all 0.2s ease;
        
        &:hover {
          background: rgba(0, 195, 245, 0.15);
          color: #00c3f5;
          
          .menu-icon {
            color: #00c3f5;
          }
        }
        
        &.router-link-active {
          background: rgba(52, 73, 94, 0.5);
          color: white;
          
          .menu-icon {
            color: white;
          }
        }
        
        .menu-icon {
          width: 20px;
          height: 20px;
          color: #7f8c8d;
          flex-shrink: 0;
          transition: color 0.2s ease;
        }
        
        .menu-text {
          font-size: 14px;
          font-weight: 500;
          white-space: nowrap;
        }
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
</style>