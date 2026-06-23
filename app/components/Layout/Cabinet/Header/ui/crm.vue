<!-- app/components/Layout/Cabinet/Header/ui/crm.vue -->
<template>
  <ul class="nav-list">
    <template v-for="item in filteredMenu" :key="item.id">
      <!-- 🔘 Скелетон загрузки (пока права не проверены) -->
      <li v-if="item.skeleton" class="nav-item nav-item--skeleton">
        <span class="nav-link__icon nav-link__icon--skeleton">
          <span class="skeleton-icon" />
        </span>
        <span class="nav-link__label nav-link__label--skeleton">
          <span class="skeleton-text" />
        </span>
      </li>
      <!-- ➖ Разделитель -->
      <li v-else-if="item.divider" class="nav-divider" />
      <!-- ✅ Обычный пункт меню -->
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
import { ref, computed, onMounted } from 'vue'
import { useThemeStore } from 'stores/settings/theme'
import { usePermissions } from '~/composables/usePermissions'
import type { Role } from 'shared/constants/roles'
import type { PageSlug, PageAction } from 'shared/constants/permissions'

const emit = defineEmits<{ closeSidebar: [] }>()
const themeStore = useThemeStore()
const { can, hasRole, isReady } = usePermissions()

// Флаг завершения гидратации
const isHydrated = ref(false)
const isDark = computed(() => themeStore.isDark)

function toggleTheme() {
  themeStore.toggleTheme()
}

// ============================================
// ТИПИЗАЦИЯ ПУНКТА МЕНЮ (новая система)
// ============================================

interface MenuItem {
  id: string
  title?: string
  path?: string
  icon?: string
  page?: PageSlug          // slug страницы для проверки прав
  action?: PageAction      // действие (default: 'view')
  roleCheck?: Role         // дополнительная проверка роли
  check?: () => boolean    // кастомная проверка (если нужна сложная логика)
  alwaysShow?: boolean     // показывать всегда (независимо от прав)
  divider?: boolean
  skeleton?: boolean
}

// ============================================
// СКЕЛЕТОН (статичный для гидратации)
// ============================================

function getSkeletonMenu(): MenuItem[] {
  return [
    { id: 'sk-1', skeleton: true },
    { id: 'sk-2', skeleton: true },
    { id: 'sk-3', skeleton: true },
    { id: 'sk-div-1', divider: true },
    { id: 'sk-4', skeleton: true },
    { id: 'sk-5', skeleton: true },
    { id: 'sk-div-2', divider: true },
    { id: 'sk-6', skeleton: true },
  ]
}

// ============================================
// КОНФИГУРАЦИЯ МЕНЮ (соответствует реальным страницам)
// ============================================
// Реальные разделы меню:
// - Главная (dashboard)
// - Сотрудники (contractors)
// - Подневка (daily-work)
// - Объекты (objects)
// - Чеки (materials)
// - Операции (operations) — объединены приходы + расходы
// - Онлайн (online) — мониторинг, отдельный от users
// - Тест (test) — только admin
// - На сайт — публичный, всегда показываем
// - Кейсы (portfolio)
// - Настройки (settings)
//
// Прайс-лист (price) — в меню НЕ показывается, управляется
// непосредственно на публичной странице сайта
// ============================================

const menuItems: MenuItem[] = [
  // Главная — dashboard (view-only страница, всегда видима если есть в правах)
  {
    id: 'dashboard',
    title: 'Главная',
    path: '/cabinet',
    icon: 'mdi:home-outline',
    page: 'dashboard'
  },

  // Сотрудники — contractors
  {
    id: 'contractors',
    title: 'Сотрудники',
    path: '/cabinet/contractors',
    icon: 'mdi:account-group-outline',
    page: 'contractors'
  },

  // Подневка — daily-work (самостоятельная страница)
  {
    id: 'daily-work',
    title: 'Подневка',
    path: '/cabinet/daily-work',
    icon: 'mdi:calendar-today-outline',
    page: 'daily-work'
  },

  // Объекты — objects
  {
    id: 'objects',
    title: 'Объекты',
    path: '/cabinet/objects',
    icon: 'mdi:house-export-outline',
    page: 'objects'
  },

  // Чеки — materials (раздел "Чеки" в меню, slug materials)
  {
    id: 'materials',
    title: 'Чеки',
    path: '/cabinet/materials',
    icon: 'mdi:receipt-text-outline',
    page: 'materials'
  },

  // Операции — operations (объединены приходы и расходы)
  {
    id: 'operations',
    title: 'Операции',
    path: '/cabinet/operation',
    icon: 'mdi:instant-transfer',
    page: 'operations'
  },

  { id: 'div-1', divider: true },

  // Онлайн — online (мониторинг, отдельная страница)
  {
    id: 'online',
    title: 'Онлайн',
    path: '/cabinet/online',
    icon: 'mdi:account-multiple-check-outline',
    page: 'online'
  },

  // Тест — test (только admin)
  {
    id: 'test',
    title: 'Тест',
    path: '/cabinet/testpage',
    icon: 'mdi:flask-outline',
    page: 'test',
    roleCheck: 'admin'
  },

  { id: 'div-2', divider: true },

  // Переход на публичный сайт — всегда показываем
  {
    id: 'website',
    title: 'На сайт',
    path: '/',
    icon: 'mdi:web',
    alwaysShow: true
  },

  // Кейсы — portfolio
  {
    id: 'portfolio',
    title: 'Кейсы',
    path: '/cabinet/portfolio',
    icon: 'mdi:briefcase-outline',
    page: 'portfolio'
  },

  { id: 'div-3', divider: true },

  // Настройки — settings (требуется canEdit)
  {
    id: 'permissions',
    title: 'Настройки',
    path: '/cabinet/settings/permissions',
    icon: 'mdi:cog',
    page: 'settings',
    action: 'edit'
  },
]

// ============================================
// ЛОГИКА ФИЛЬТРАЦИИ
// ============================================
//
// Видимость определяется через usePermissions.can():
// - Для view-only страниц (dashboard, online, test) — can(page, 'view') = true
//   если страница есть в authStore.pages
// - Для CRUD страниц — раздел виден если есть хотя бы одно действие
//   (canCreate || canEdit || canDelete || canSpecial)
// - canView упразднён — видимость = наличие любого права
// ============================================

const filteredMenu = computed(() => {
  // Пока идёт гидратация или проверка прав — статичный скелетон
  if (!isHydrated.value || !isReady.value) {
    return getSkeletonMenu()
  }

  const result: MenuItem[] = []
  let hasPrevItem = false

  for (const item of menuItems) {
    if (item.divider) {
      if (hasPrevItem) result.push(item)
      continue
    }

    let isVisible = false

    if (item.alwaysShow) {
      // Всегда показываем (например, "На сайт")
      isVisible = true
    } else if (item.check) {
      // Кастомная функция проверки (для сложной логики)
      isVisible = item.check()
    } else if (item.page) {
      // Стандартная проверка через страницу + действие
      const action: PageAction = item.action || 'view'
      isVisible = can(item.page, action)

      // Дополнительная проверка роли (если указана)
      if (isVisible && item.roleCheck) {
        isVisible = hasRole(item.roleCheck)
      }
    }

    if (isVisible) {
      result.push(item)
      hasPrevItem = true
    }
  }

  // Убираем лишние разделители в конце
  while (result.length > 0 && result[result.length - 1]?.divider) {
    result.pop()
  }

  return result
})

function handleClick() {
  emit('closeSidebar')
}

onMounted(() => {
  isHydrated.value = true
})
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

// ── Скелетон загрузки ─────────────────────────────────────────────
@keyframes skeleton-pulse {
  0% { opacity: 0.5; }
  50% { opacity: 1; }
  100% { opacity: 0.5; }
}

.nav-item--skeleton {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  pointer-events: none;
}

.nav-link__icon--skeleton .skeleton-icon,
.nav-link__label--skeleton .skeleton-text {
  display: block;
  background: var(--crm-bg-elevated);
  border-radius: var(--crm-radius-sm);
  animation: skeleton-pulse 1.5s ease-in-out infinite;
}

.skeleton-icon {
  width: 18px;
  height: 18px;
}

.skeleton-text {
  width: 70px;
  height: 14px;
}

// Плавное появление реальных пунктов после замены скелетона
.nav-item:not(.nav-item--skeleton) {
  animation: nav-fade-in 0.25s ease forwards;
}

@keyframes nav-fade-in {
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>