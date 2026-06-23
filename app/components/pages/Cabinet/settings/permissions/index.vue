<!-- app/components/pages/cabinet/settings/permissions/index.vue -->
<template>
  <div class="permissions-page">
    <!-- ============================================
         БЛОКИРОВКА: нет прав на просмотр настроек
         ============================================ -->
    <div v-if="!canAccessPage && isReady" class="access-denied">
      <div class="access-denied__icon">
        <Icon name="mdi:shield-lock-outline" size="48" />
      </div>
      <h2>Доступ запрещён</h2>
      <p>У вас нет прав для просмотра и редактирования настроек системы</p>
      <NuxtLink to="/cabinet" class="btn btn-secondary">
        <Icon name="mdi:arrow-left" size="16" />
        Вернуться в кабинет
      </NuxtLink>
    </div>

    <!-- ============================================
         ОСНОВНОЕ СОДЕРЖИМОЕ (есть доступ)
         ============================================ -->
    <template v-else-if="canAccessPage">
      <!-- Индикатор синхронизации (когда другой админ что-то изменил) -->
      <Transition name="fade">
        <div v-if="syncMessage" class="sync-banner">
          <Icon name="mdi:sync" size="16" class="spin" />
          <span>{{ syncMessage }}</span>
        </div>
      </Transition>

      <!-- Заголовок страницы -->
      <header class="page-header">
        <div class="header-content">
          <div class="header-icon">
            <Icon name="mdi:shield-key" size="28" />
          </div>
          <div class="header-text">
            <h1>Настройки прав доступа</h1>
            <p>Управление доступом пользователей к разделам системы</p>
          </div>
        </div>

        <!-- Индикатор real-time статуса -->
        <div class="header-status">
          <span class="status-dot status-dot--live"></span>
          <span class="status-text">Real-time</span>
        </div>
      </header>

      <!-- Навигация по вкладкам -->
      <nav class="tabs-nav">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          :class="['tab-btn', { active: activeTab === tab.id }]"
          @click="activeTab = tab.id"
        >
          <Icon :name="tab.icon" size="18" />
          <span class="tab-label">{{ tab.label }}</span>
          <span v-if="tab.badge" class="tab-badge">{{ tab.badge }}</span>
        </button>
      </nav>

      <!-- Контент активной вкладки -->
      <div class="tab-content">
        <Transition name="fade-slide" mode="out-in">
          <PagesCabinetSettingsPermissionsRoles
            v-if="activeTab === 'roles'"
            key="roles"
          />
          <PagesCabinetSettingsPermissionsUsers
            v-else-if="activeTab === 'users'"
            key="users"
          />
          <PagesCabinetSettingsPermissionsPages
            v-else-if="activeTab === 'pages'"
            key="pages"
          />
        </Transition>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue'
import { useHead } from 'nuxt/app'
import { useAuthStore } from 'stores/auth'
import { usePermissions } from '~/composables/usePermissions'
import { usePermissionsSocket } from './composables/usePermissionsSocket'

// ============================================
// SEO И МЕТАДАННЫЕ
// ============================================
useHead({
  title: 'Настройки прав доступа',
})

// ============================================
// ПРАВА ДОСТУПА (новая система без canView)
// ============================================
const authStore = useAuthStore()
const { can, isReady } = usePermissions()

/**
 * Доступ к странице настроек
 * 
 * В новой модели (без canView) доступ определяется наличием права edit:
 * - Раздел виден в меню если есть хотя бы одно действие
 * - Для настроек критично canEdit (иначе нельзя ничего менять)
 */
const canAccessPage = computed(() => {
  // SSR: pages ещё не загружены — показываем контент
  if (!authStore.pages) return true
  
  // Клиент после загрузки: проверяем право редактирования
  return can('settings', 'edit')
})

// ============================================
// СОСТОЯНИЕ ВКЛАДОК
// ============================================
type TabId = 'roles' | 'users' | 'pages'
const activeTab = ref<TabId>('roles')

// ============================================
// REAL-TIME СИНХРОНИЗАЦИЯ НА УРОВНЕ СТРАНИЦЫ
// ============================================
/**
 * Баннер-индикатор синхронизации.
 * Показывается на 3 секунды при получении сокет-события
 * от другого администратора, чтобы пользователь видел,
 * что данные обновляются в реальном времени.
 */
const syncMessage = ref('')
let syncTimeout: ReturnType<typeof setTimeout> | null = null

function showSyncMessage(message: string) {
  syncMessage.value = message
  if (syncTimeout) clearTimeout(syncTimeout)
  syncTimeout = setTimeout(() => {
    syncMessage.value = ''
  }, 3000)
}

/**
 * Подписываемся на глобальные события прав на уровне страницы.
 * 
 * Логика:
 * - permissions:changed → перезагружаем authStore.init() (права текущего юзера)
 * - permissions:page:created/updated/deleted → просто показываем уведомление
 *   (вкладки сами обновят свои списки через свои подписки)
 */
usePermissionsSocket({
  onPermissionsChanged: async (data: any) => {
    console.log('[Permissions/Index] 📥 Глобальное событие permissions:changed')
    showSyncMessage(`Права изменены: ${data?.reason || 'обновление применено'}`)
    
    // Перезагружаем права текущего пользователя
    // (на случай если другой админ изменил нашу роль или нам override)
    try {
      await authStore.reloadPermissions()
    } catch (error) {
      console.error('[Permissions/Index] Ошибка перезагрузки прав:', error)
    }
  },
  onPageCreated: (data: any) => {
    showSyncMessage(`Новый раздел создан: ${data?.page?.name || ''}`)
  },
  onPageUpdated: (data: any) => {
    showSyncMessage(`Раздел обновлён: ${data?.page?.name || ''}`)
  },
  onPageDeleted: (data: any) => {
    const modeText = data?.mode === 'hard' ? 'удалён' : 'скрыт'
    showSyncMessage(`Раздел ${modeText}: ${data?.name || ''}`)
  },
})

// Очистка таймера при размонтировании
onUnmounted(() => {
  if (syncTimeout) clearTimeout(syncTimeout)
})

// ============================================
// КОНФИГУРАЦИЯ ВКЛАДОК
// ============================================
const tabs = computed(() => [
  {
    id: 'roles' as const,
    label: 'Роли',
    icon: 'mdi:account-group',
    badge: null,
  },
  {
    id: 'users' as const,
    label: 'Пользователи',
    icon: 'mdi:account-cog',
    badge: null,
  },
  {
    id: 'pages' as const,
    label: 'Разделы',
    icon: 'mdi:file-document-multiple',
    badge: null,
  },
])
</script>

<style lang="scss" scoped>
.permissions-page {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;

  @media (min-width: 768px) {
    gap: 2rem;
  }
}

// ── БЛОКИРОВКА ДОСТУПА ──────────────────────────────────
.access-denied {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 4rem 2rem;
  text-align: center;
  background: var(--crm-bg-surface);
  border: 1px solid var(--crm-border);
  border-radius: var(--crm-radius-lg);

  &__icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 80px;
    height: 80px;
    background: var(--crm-danger-dim);
    color: var(--crm-danger);
    border-radius: 50%;
    border: 1px solid rgba(242, 95, 92, 0.2);
  }

  h2 {
    margin: 0;
    font-size: var(--crm-text-xl);
    font-weight: 600;
    color: var(--crm-text-primary);
  }

  p {
    margin: 0;
    max-width: 400px;
    font-size: var(--crm-text-md);
    color: var(--crm-text-secondary);
  }

  .btn {
    margin-top: 0.5rem;
  }
}

// ── БАННЕР СИНХРОНИЗАЦИИ ─────────────────────────────
.sync-banner {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1rem;
  background: var(--crm-accent-dim);
  border: 1px solid var(--crm-accent-border);
  border-radius: var(--crm-radius-md);
  font-size: var(--crm-text-sm);
  color: var(--crm-accent);
  font-weight: 500;

  svg {
    flex-shrink: 0;
  }
}

// ── ЗАГОЛОВОК СТРАНИЦЫ ──────────────────────────────────
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
}

.header-content {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.header-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  background: var(--crm-accent-dim);
  color: var(--crm-accent);
  border-radius: var(--crm-radius-lg);
  border: 1px solid var(--crm-accent-border);
  flex-shrink: 0;
}

.header-text {
  h1 {
    margin: 0;
    font-size: var(--crm-text-xl);
    font-weight: 600;
    color: var(--crm-text-primary);
    letter-spacing: -0.01em;
  }

  p {
    margin: 0.25rem 0 0;
    font-size: var(--crm-text-sm);
    color: var(--crm-text-secondary);
  }
}

// ── REAL-TIME СТАТУС ─────────────────────────────────
.header-status {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.75rem;
  background: var(--crm-success-dim);
  border: 1px solid rgba(61, 214, 140, 0.3);
  border-radius: var(--crm-radius-md);
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;

  &--live {
    background: var(--crm-success);
    box-shadow: 0 0 6px var(--crm-success);
    animation: pulse-dot 2s ease-in-out infinite;
  }
}

.status-text {
  font-size: var(--crm-text-xs);
  font-weight: 500;
  color: var(--crm-success);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

@keyframes pulse-dot {
  0%, 100% { opacity: 1; box-shadow: 0 0 6px var(--crm-success); }
  50% { opacity: 0.6; box-shadow: 0 0 12px var(--crm-success); }
}

// ── НАВИГАЦИЯ ПО ВКЛАДКАМ ───────────────────────────────
.tabs-nav {
  display: flex;
  gap: 0.5rem;
  padding: 0.25rem;
  background: var(--crm-bg-surface);
  border: 1px solid var(--crm-border);
  border-radius: var(--crm-radius-lg);
  overflow-x: auto;
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }
}

.tab-btn {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1rem;
  background: transparent;
  color: var(--crm-text-secondary);
  font-size: var(--crm-text-md);
  font-weight: 500;
  border: none;
  border-radius: var(--crm-radius-md);
  cursor: pointer;
  white-space: nowrap;
  transition: all var(--crm-transition);
  font-family: var(--crm-font-sans);

  &:hover {
    color: var(--crm-text-primary);
    background: var(--crm-bg-overlay);
  }

  &.active {
    color: var(--crm-accent);
    background: var(--crm-accent-dim);
    box-shadow: inset 0 0 0 1px var(--crm-accent-border);

    &:hover {
      background: var(--crm-accent-dim);
    }
  }
}

.tab-label {
  font-weight: inherit;
}

.tab-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  background: var(--crm-bg-overlay);
  color: var(--crm-text-muted);
  font-size: var(--crm-text-xs);
  font-weight: 600;
  border-radius: 10px;

  .tab-btn.active & {
    background: var(--crm-accent);
    color: var(--crm-bg-base);
  }
}

// ── КОНТЕНТ ВКЛАДКИ ─────────────────────────────────────
.tab-content {
  min-height: 400px;
}

// ── АНИМАЦИИ ПЕРЕКЛЮЧЕНИЯ ───────────────────────────────
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.25s ease;
}

.fade-slide-enter-from {
  opacity: 0;
  transform: translateY(8px);
}

.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.spin {
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

// ── КНОПКИ ──────────────────────────────────────────────
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.375rem;
  padding: 0.5rem 1rem;
  font-size: var(--crm-text-sm);
  font-weight: 500;
  font-family: var(--crm-font-sans);
  border-radius: var(--crm-radius-md);
  cursor: pointer;
  transition: all var(--crm-transition);
  border: 1px solid transparent;
  white-space: nowrap;
  text-decoration: none;
}

.btn-secondary {
  background: var(--crm-bg-overlay);
  color: var(--crm-text-primary);
  border-color: var(--crm-border);

  &:hover {
    background: var(--crm-bg-elevated);
    border-color: var(--crm-border-hover);
  }
}

// ── АДАПТИВНОСТЬ ────────────────────────────────────────
@media (max-width: 640px) {
  .header-icon {
    width: 40px;
    height: 40px;

    :deep(svg) {
      width: 22px !important;
      height: 22px !important;
    }
  }

  .header-text h1 {
    font-size: 18px;
  }

  .header-status {
    display: none;
  }

  .tab-btn {
    padding: 0.5rem 0.875rem;
    font-size: var(--crm-text-sm);
  }
}
</style>