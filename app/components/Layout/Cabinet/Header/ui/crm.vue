<!-- app/components/Layout/Cabinet/Header/ui/crm.vue -->
<template>
  <ul class="nav-list">
    <template v-for="(item, index) in filteredMenu" :key="index">

      <!-- Разделитель -->
      <li v-if="item.divider" class="nav-divider" />

      <!-- Пункт меню -->
      <li v-else class="nav-item">
        <NuxtLink :to="item.path" class="nav-link" @click="handleClick">
          <span class="nav-link__icon">
            <Icon :name="item.icon" size="18" />
          </span>
          <span class="nav-link__label">{{ item.title }}</span>
        </NuxtLink>
      </li>

    </template>

    <!-- Переключатель темы -->
    <li class="nav-divider" />
    <li class="nav-item">
      <button class="nav-link nav-link--theme" @click="toggleTheme" title="Переключить тему">
        <span class="nav-link__icon">
          <Icon :name="isDark ? 'mdi:weather-sunny' : 'mdi:weather-night'" size="18" />
        </span>
        <span class="nav-link__label">{{ isDark ? 'Светлая тема' : 'Тёмная тема' }}</span>
      </button>
    </li>

  </ul>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useAuthStore } from 'stores/auth'
import { useThemeStore } from 'stores/settings/theme'
import { usePermissions } from '~/composables/usePermissions'

const emit = defineEmits<{ closeSidebar: [] }>()
const authStore = useAuthStore()
const themeStore = useThemeStore()
const { can, hasRole } = usePermissions()

const isDark = computed(() => themeStore.isDark)

function toggleTheme() {
  themeStore.toggleTheme()
}

const menuItems = [
  {
    title: 'Главная',
    path: '/cabinet',
    icon: 'mdi:home-outline',
    permission: 'canViewDashboard' as const
  },
  {
    title: 'Сотрудники',
    path: '/cabinet/contractors',
    icon: 'mdi:account-group-outline',
    permission: 'canManageUsers' as const
  },
  {
    title: 'Подневка',
    path: '/cabinet/daily-work',
    icon: 'mdi:calendar-today-outline',
    check: () => hasRole('foreman') || hasRole('admin')
  },
  {
    title: 'Объекты',
    path: '/cabinet/objects',
    icon: 'mdi:house-export-outline',
    permission: 'canViewObjects' as const
  },
  {
    title: 'Чеки',
    path: '/cabinet/materials',
    icon: 'mdi:receipt-text-outline',
    permission: 'canViewFinance' as const
  },
  {
    title: 'Операции',
    path: '/cabinet/operation',
    icon: 'mdi:instant-transfer',
    permission: 'canEditFinance' as const
  },
  { divider: true },
  {
    title: 'Онлайн',
    path: '/cabinet/online',
    icon: 'mdi:account-multiple-check-outline',
    permission: 'canViewWorkers' as const
  },
  {
    title: 'Тест',
    path: '/cabinet/testpage',
    icon: 'mdi:flask-outline',
    permission: 'canViewDashboard' as const,
    roleCheck: 'admin' as const
  },
  { divider: true },
  {
    title: 'На сайт',
    path: '/',
    icon: 'mdi:web',
    alwaysShow: true
  },
  {
    title: 'Кейсы',
    path: '/cabinet/portfolio',
    icon: 'mdi:plus-circle-outline',
    check: () => hasRole('manager') || hasRole('admin')
  },
  { divider: true },
  {
    title: 'Баланс',
    path: '/cabinet/balance',
    icon: 'mdi:currency-rub',
    permission: 'canViewSalary' as const
  },
]

// Фильтрация по правам доступа
const filteredMenu = computed(() => {
  const result: any[] = []
  let hasPrevItem = false

  for (const item of menuItems) {
    if (item.divider) {
      if (hasPrevItem) result.push(item)
      continue
    }

    let isVisible = false

    // Если всегда показывать
    if (item.alwaysShow) {
      isVisible = true
    }
    // Если есть явная проверка
    else if (item.check) {
      isVisible = item.check()
    }
    // Если есть проверка по конкретному праву
    else if (item.permission) {
      isVisible = can(item.permission)
      // Дополнительная проверка по роли если указана
      if (isVisible && item.roleCheck) {
        isVisible = hasRole(item.roleCheck)
      }
    }

    if (isVisible) {
      result.push(item)
      hasPrevItem = true
    }
  }

  // Убираем разделитель в конце если он последний
  while (result.length && result[result.length - 1].divider) {
    result.pop()
  }

  return result
})

function handleClick() {
  emit('closeSidebar')
}
</script>

<style lang="scss" scoped>
.nav-list {
  list-style: none;
  padding: 4px 8px;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.nav-divider {
  height: 1px;
  background: var(--crm-border);
  margin: 6px 8px;
}

// .nav-item {
  // пустой — стили на .nav-link
// }

.nav-link {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border-radius: var(--crm-radius-md);
  color: var(--crm-text-secondary);
  text-decoration: none;
  font-size: var(--crm-text-md);
  font-weight: 400;
  transition: var(--crm-transition);

  &__icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    color: var(--crm-accent);
    flex-shrink: 0;
    transition: var(--crm-transition);
  }

  &__label {
    color: inherit;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &:hover {
    background: var(--crm-bg-elevated);
    color: var(--crm-text-primary);

    .nav-link__icon {
      color: var(--crm-accent);
    }
  }

  // Активная страница
  &.router-link-exact-active {
    background: var(--crm-accent-dim);
    color: var(--crm-accent);

    .nav-link__icon {
      color: var(--crm-accent);
    }

    &:hover {
      background: var(--crm-accent-dim);
    }
  }
  // Кнопка переключения темы
  &--theme {
    width: 100%;
    background: transparent;
    border: none;
    cursor: pointer;
    text-align: left;

    &:hover {
      background: var(--crm-bg-elevated);
      color: var(--crm-text-primary);
    }
  }
}
</style>