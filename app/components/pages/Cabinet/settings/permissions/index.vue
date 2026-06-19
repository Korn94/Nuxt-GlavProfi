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
          <!-- 🔄 Временные импорты: пока используем старые файлы,
               в следующих шагах заменим на новые из поддиректорий -->
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
import { ref, computed } from 'vue'
import { useHead } from 'nuxt/app'
import { useAuthStore } from 'stores/auth'
import { usePermissions } from '~/composables/usePermissions'

// ============================================
// SEO И МЕТАДАННЫЕ
// ============================================
useHead({
  title: 'Настройки прав доступа',
})

// ============================================
// ПРАВА ДОСТУПА (новая система)
// ============================================
const authStore = useAuthStore()
const { canView, isReady } = usePermissions()

/**
 * Доступ к странице настроек
 * Требуется: canView('settings') + can('settings', 'edit')
 * Пока права не загружены (isReady = false) — рендерим контент
 * для предотвращения гидратационных расхождений
 */

const canAccessPage = computed(() => {
  // SSR: pages ещё не загружены — показываем контент
  if (!authStore.pages) return true
  // Клиент после загрузки: проверяем права
  return canView('settings')
})

// ============================================
// СОСТОЯНИЕ ВКЛАДОК
// ============================================
type TabId = 'roles' | 'users' | 'pages'

const activeTab = ref<TabId>('roles')

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

// ── ЗАГОЛОВОК СТРАНИЦЫ ──────────────────────────────────
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
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

  .tab-btn {
    padding: 0.5rem 0.875rem;
    font-size: var(--crm-text-sm);
  }
}
</style>