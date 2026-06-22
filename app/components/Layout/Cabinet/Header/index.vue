<!-- app/components/Layout/Cabinet/Header/index.vue -->
<template>
  <!-- Мобильная шапка -->
  <div class="mobile-header">
    <button class="mobile-header__burger" @click="toggleSidebar" aria-label="Меню">
      <Icon name="bx:menu-alt-left" size="22" />
    </button>
    <span class="mobile-header__title">CRM</span>
  </div>

  <!-- Затемнение фона на мобиле при открытом сайдбаре -->
  <Transition name="overlay-fade">
    <div v-if="sidebarOpen && isMobile" class="sidebar-overlay" @click="toggleSidebar" />
  </Transition>

  <!-- Сайдбар -->
  <Transition name="sidebar-slide">
    <aside class="sidebar" :class="{ 'sidebar--mobile': isMobile, 'sidebar--open': sidebarOpen }">

      <!-- Логотип / заголовок -->
      <div class="sidebar-logo">
        <div class="sidebar-logo__icon">
          <Icon name="mdi:briefcase-outline" size="20" />
        </div>
        <div class="sidebar-logo__text">
          <span class="sidebar-logo__name">CRM Система</span>
          <span class="sidebar-logo__sub">{{ displayName }}</span>
        </div>
      </div>

      <!-- Переключатель режимов -->
      <div class="mode-switcher">
        <!-- Кнопка CRM -->
        <button
          class="mode-switcher__btn"
          :class="{ 'mode-switcher__btn--active': menuMode === 'crm' }"
          @click="setMenuMode('crm')"
        >
          <Icon name="mdi:database" size="16" />
          <span>CRM</span>
        </button>

        <!-- 🔐 Кнопка «Доски» — ЕДИНАЯ кнопка, классы вычисляются динамически -->
        <button
          class="mode-switcher__btn"
          :class="{
            'mode-switcher__btn--active': menuMode === 'boards',
            'mode-switcher__btn--disabled': !isBoardsAvailable
          }"
          :disabled="!isBoardsAvailable"
          :aria-disabled="!isBoardsAvailable ? 'true' : undefined"
          :title="!isBoardsAvailable ? 'Нет доступа к разделу' : 'Переключить на доски'"
          @click="handleBoardsClick"
        >
          <Icon name="mdi:clipboard-text-multiple-outline" size="16" />
          <span>Доски</span>
          <Icon
            v-if="!isBoardsAvailable"
            name="mdi:lock-outline"
            size="12"
            class="mode-switcher__lock"
            aria-hidden="true"
          />
        </button>
      </div>

      <!-- Меню -->
      <nav class="sidebar-nav">
        <CrmMenu v-if="menuMode === 'crm'" @close-sidebar="closeSidebarOnMobile" />
        <BoardsMenu v-else-if="menuMode === 'boards' && isBoardsAvailable" @close-sidebar="closeSidebarOnMobile" />

        <!-- Заглушка, если переключили на доски без прав -->
        <div v-else-if="menuMode === 'boards'" class="boards-restricted">
          <Icon name="mdi:lock-outline" size="24" />
          <p>Раздел «Доски» вам недоступен</p>
        </div>
      </nav>

      <!-- Футер сайдбара -->
      <div class="sidebar-footer">
        <div class="sidebar-footer__user">
          <div class="sidebar-footer__avatar">{{ userInitials }}</div>
          <div class="sidebar-footer__info">
            <span class="sidebar-footer__name">{{ displayName }}</span>
            <span class="sidebar-footer__role">{{ displayRole }}</span>
          </div>
        </div>
        <button class="sidebar-footer__logout" @click="handleLogout" title="Выйти">
          <Icon name="mdi:logout" size="18" />
        </button>
      </div>

    </aside>
  </Transition>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from 'stores/auth'
import { usePermissions } from '~/composables/usePermissions'
import CrmMenu from './ui/crm.vue'
import BoardsMenu from './ui/boards.vue'

const router = useRouter()
const authStore = useAuthStore()
const { can } = usePermissions()

// ============================================
// ЕДИНСТВЕННЫЙ ИСТОЧНИК USER — authStore
// ============================================
// Используем ТОЛЬКО authStore.user (а не useCurrentUser + useFetch)
// Это устраняет рассинхрон между двумя endpoint'ами (/api/me и /api/auth/check)
//
// На сервере authStore.user = null (init() вызывается в onMounted)
// На клиенте после гидратации — реактивно обновляется
const user = computed(() => authStore.user)

const displayName = computed(() => user.value?.name || '...')
const displayRole = computed(() => roleLabels[user.value?.role || ''] || 'Пользователь')
const userInitials = computed(() => {
  const name = user.value?.name || ''
  if (!name || name === '...') return '?'
  return name.split(' ').slice(0, 2).map((w: string) => w[0]).join('').toUpperCase() || '?'
})

// ============================================
// СОСТОЯНИЕ
// ============================================
const sidebarOpen = ref(false)
const isMobile = ref(false)
const menuMode = ref<'crm' | 'boards'>('crm')

const roleLabels: Record<string, string> = {
  admin: 'Администратор',
  manager: 'Менеджер',
  foreman: 'Прораб',
  master: 'Мастер',
  worker: 'Рабочий'
}

// ============================================
// ПРАВА ДОСТУПА
// ============================================
/**
 * 🔐 Доступ к разделу «Доски»
 */
const isBoardsAvailable = computed(() => {
  if (!user.value) return true
  return can('objects', 'view')
})

// ============================================
// УПРАВЛЕНИЕ МЕНЮ
// ============================================
function setMenuMode(mode: 'crm' | 'boards') {
  if (mode === 'boards' && !isBoardsAvailable.value) return
  menuMode.value = mode
}

function handleBoardsClick() {
  if (!isBoardsAvailable.value) return
  setMenuMode('boards')
}

// ============================================
// МОБИЛЬНАЯ АДАПТАЦИЯ
// ============================================
function checkIsMobile() {
  if (typeof window !== 'undefined') {
    isMobile.value = window.innerWidth < 768
    if (!isMobile.value) sidebarOpen.value = false
  }
}

function toggleSidebar() {
  sidebarOpen.value = !sidebarOpen.value
}

function closeSidebarOnMobile() {
  if (isMobile.value) sidebarOpen.value = false
}

// ============================================
// ВЫХОД ИЗ СИСТЕМЫ
// ============================================
function handleLogout() {
  authStore.logout()
  router.push('/')
}

// ============================================
// ЖИЗНЕННЫЙ ЦИКЛ
// ============================================
onMounted(() => {
  checkIsMobile()
  window.addEventListener('resize', checkIsMobile)
})

onUnmounted(() => {
  window.removeEventListener('resize', checkIsMobile)
})
</script>

<style lang="scss" scoped>
// ── Константы ───────────────────────────────────────────────────────
$sidebar-width: 256px;

// ── Мобильная шапка ─────────────────────────────────────────────────
.mobile-header {
  display: none;
  align-items: center;
  gap: 12px;
  padding: 0 16px;
  height: 52px;
  background: var(--crm-bg-surface);
  border-bottom: 1px solid var(--crm-border);
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;

  &__burger {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    background: var(--crm-bg-elevated);
    border: 1px solid var(--crm-border);
    border-radius: var(--crm-radius-md);
    color: var(--crm-text-primary);
    cursor: pointer;
    transition: var(--crm-transition);

    &:hover {
      border-color: var(--crm-border-hover);
      background: var(--crm-bg-overlay);
    }
  }

  &__title {
    font-size: var(--crm-text-lg);
    font-weight: 600;
    color: var(--crm-text-primary);
  }

  @media (max-width: 767.98px) {
    display: flex;
  }
}

// ── Затемнение фона ──────────────────────────────────────────────────
.sidebar-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  z-index: 110;
  backdrop-filter: blur(2px);
}

.overlay-fade-enter-active,
.overlay-fade-leave-active {
  transition: opacity 0.25s ease;
}

.overlay-fade-enter-from,
.overlay-fade-leave-to {
  opacity: 0;
}

// ── Сайдбар ─────────────────────────────────────────────────────────
.sidebar {
  width: $sidebar-width;
  height: 100vh;
  background: var(--crm-bg-surface);
  border-right: 1px solid var(--crm-border);
  position: fixed;
  top: 0;
  left: 0;
  z-index: 120;
  display: flex;
  flex-direction: column;
  overflow: hidden;

  &--mobile {
    top: 0;
    transform: translateX(-100%);
    box-shadow: var(--crm-shadow-lg);
    transition: transform 0.28s cubic-bezier(0.4, 0, 0.2, 1);
  }

  &--mobile.sidebar--open {
    transform: translateX(0);
  }
}

.sidebar-slide-enter-active,
.sidebar-slide-leave-active {
  transition: transform 0.28s cubic-bezier(0.4, 0, 0.2, 1);
}

.sidebar-slide-enter-from,
.sidebar-slide-leave-to {
  transform: translateX(-100%);
}

// ── Логотип ─────────────────────────────────────────────────────────
.sidebar-logo {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 18px 16px 14px;
  border-bottom: 1px solid var(--crm-border);
  flex-shrink: 0;

  &__icon {
    width: 36px;
    height: 36px;
    background: var(--crm-accent-dim);
    border: 1px solid var(--crm-accent-border);
    border-radius: var(--crm-radius-lg);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--crm-accent);
    flex-shrink: 0;
  }

  &__name {
    display: block;
    font-size: var(--crm-text-md);
    font-weight: 600;
    color: var(--crm-text-primary);
    line-height: 1.2;
  }

  &__sub {
    display: block;
    font-size: var(--crm-text-xs);
    color: var(--crm-text-muted);
    margin-top: 1px;
  }
}

// ── Переключатель режимов ────────────────────────────────────────────
.mode-switcher {
  display: flex;
  gap: 4px;
  padding: 10px 12px;
  border-bottom: 1px solid var(--crm-border);
  flex-shrink: 0;

  &__btn {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 7px 10px;
    background: transparent;
    border: 1px solid transparent;
    border-radius: var(--crm-radius-md);
    color: var(--crm-text-muted);
    font-size: var(--crm-text-sm);
    font-weight: 500;
    cursor: pointer;
    transition: var(--crm-transition);
    position: relative;

    span {
      color: inherit;
    }

    &:hover:not(:disabled) {
      background: var(--crm-bg-elevated);
      color: var(--crm-text-secondary);
    }

    &--active {
      background: var(--crm-accent-dim);
      border-color: var(--crm-accent-border);
      color: var(--crm-accent);

      &:hover:not(:disabled) {
        background: var(--crm-accent-dim);
        color: var(--crm-accent);
      }
    }

    &--disabled {
      opacity: 0.5;
      cursor: not-allowed;
      border-color: var(--crm-border);
      background: var(--crm-bg-elevated);
      color: var(--crm-text-disabled);

      &:hover {
        background: var(--crm-bg-elevated);
        color: var(--crm-text-disabled);
      }
    }
  }

  &__lock {
    position: absolute;
    top: 2px;
    right: 4px;
    color: var(--crm-text-muted);
    opacity: 0.8;
  }
}

// ── Заглушка для заблокированного раздела ────────────────────────────
.boards-restricted {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 40px 20px;
  text-align: center;
  color: var(--crm-text-muted);

  p {
    font-size: var(--crm-text-sm);
    margin: 0;
  }
}

// ── Навигация ────────────────────────────────────────────────────────
.sidebar-nav {
  flex: 1;
  overflow-y: auto;
  padding: 8px 0;
  scrollbar-width: thin;
  scrollbar-color: var(--crm-bg-overlay) transparent;

  &::-webkit-scrollbar {
    width: 4px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: var(--crm-bg-overlay);
    border-radius: 2px;
  }
}

// ── Футер сайдбара ───────────────────────────────────────────────────
.sidebar-footer {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  border-top: 1px solid var(--crm-border);
  flex-shrink: 0;

  &__user {
    display: flex;
    align-items: center;
    gap: 10px;
    flex: 1;
    min-width: 0;
  }

  &__avatar {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: var(--crm-accent-dim);
    border: 1px solid var(--crm-accent-border);
    color: var(--crm-accent);
    font-size: var(--crm-text-sm);
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  &__info {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }

  &__name {
    font-size: var(--crm-text-sm);
    font-weight: 500;
    color: var(--crm-text-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__role {
    font-size: var(--crm-text-xs);
    color: var(--crm-text-muted);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__logout {
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    border: 1px solid transparent;
    border-radius: var(--crm-radius-md);
    color: var(--crm-text-muted);
    cursor: pointer;
    flex-shrink: 0;
    transition: var(--crm-transition);

    &:hover {
      background: var(--crm-danger-dim);
      border-color: rgba(242, 95, 92, 0.3);
      color: var(--crm-danger);
    }
  }
}

// ── Адаптив ─────────────────────────────────────────────────────────
@media (max-width: 767.98px) {
  .sidebar:not(.sidebar--mobile) {
    display: none;
  }
}
</style>