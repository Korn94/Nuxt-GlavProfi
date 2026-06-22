<!-- app/layouts/cabinet.vue -->
<template>
  <!-- 🔄 Loading-screen: идёт проверка авторизации, но cookie есть -->
  <div v-if="showAuthLoading" class="auth-loading-screen">
    <div class="auth-loading-content">
      <div class="auth-loading-logo">
        <Icon name="mdi:briefcase-outline" size="32" />
      </div>
      <div class="auth-loading-spinner" />
      <p class="auth-loading-text">Проверка сессии...</p>
    </div>
  </div>

  <!-- ✅ Основной layout (рендерится после завершения проверки) -->
  <div v-else class="crm" :class="`crm--${themeStore.mode}`">
    <LayoutCabinetHeader />
    <main>
      <NuxtPage v-slot="{ Component }">
        <Transition name="page" mode="out-in" appear>
          <Component :is="Component" :key="$route.fullPath" />
        </Transition>
      </NuxtPage>
      <UiNotificationsContainer />
    </main>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, watch, ref } from 'vue'
import { useAuthStore } from '../../stores/auth'
import { useSocketStore } from '../../stores/socket'
import { useActivityTracker } from '~/composables/useActivityTracker'
import { useUserStatusNotifications } from '~/composables/notifications/useUserStatus'
import { useThemeStore } from 'stores/settings/theme'
import { useAuthCookie } from '~/composables/useAuthCookie'

const authStore = useAuthStore()
const socketStore = useSocketStore()
const activityTracker = useActivityTracker()
const themeStore = useThemeStore()
const { hasCookie } = useAuthCookie()

const userStatusNotifications = useUserStatusNotifications()

/**
 * Флаг: показывать loading-screen.
 * 
 * Логика:
 * - На клиенте: если isChecking && есть cookie → показываем
 * - Используется ref + watch для мгновенной реакции на изменения
 */
const showAuthLoading = ref(false)

// Обновляем showAuthLoading при изменении isChecking
watch(
  () => authStore.isChecking,
  (isChecking) => {
    if (!process.client) return
    showAuthLoading.value = isChecking && hasCookie.value
  },
  { immediate: true }
)

onMounted(() => {
  themeStore.initTheme()
  document.body.classList.add('crm')
})

onUnmounted(() => {
  document.body.classList.remove('crm')
})

watch(
  () => socketStore.isConnected,
  (isConnected) => {
    if (!isConnected && activityTracker.isTracking.value) {
      activityTracker.stopTracking()
    }
  }
)
</script>

<style lang="scss">
@use '@/assets/styles/crm-theme.scss';
</style>

<style lang="scss" scoped>
/* Стили без изменений — оставляем как было */
.crm {
  min-height: 100vh;
  background: var(--crm-bg-base);
  color: var(--crm-text-primary);
  font-family: var(--crm-font-sans);
  overflow-x: hidden;
}

main {
  background: var(--crm-bg-base);

  @media (min-width: 767.98px) {
    margin-left: 250px;
  }

  @media (max-width: 767.98px) {
    padding-top: 3em;
  }
}

.auth-loading-screen {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--crm-bg-base, #ffffff);
  z-index: 9999;
  animation: auth-loading-fade-in 0.15s ease;
}

.auth-loading-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.auth-loading-logo {
  width: 64px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--crm-accent-dim, rgba(0, 195, 245, 0.1));
  border: 1px solid var(--crm-accent-border, rgba(0, 195, 245, 0.3));
  border-radius: var(--crm-radius-lg, 16px);
  color: var(--crm-accent, #00c3f5);
  animation: auth-logo-pulse 2s ease-in-out infinite;
}

.auth-loading-spinner {
  width: 36px;
  height: 36px;
  border: 3px solid var(--crm-border, #e5e7eb);
  border-top-color: var(--crm-accent, #00c3f5);
  border-radius: 50%;
  animation: auth-spin 0.8s linear infinite;
}

.auth-loading-text {
  color: var(--crm-text-muted, #6b7280);
  font-size: 14px;
  font-weight: 500;
  letter-spacing: 0.02em;
}

@keyframes auth-spin {
  to { transform: rotate(360deg); }
}

@keyframes auth-logo-pulse {
  0%, 100% { opacity: 0.8; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.05); }
}

@keyframes auth-loading-fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

.page-enter-active,
.page-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}

.page-enter-from {
  opacity: 0;
  transform: translateX(12px);
}

.page-leave-to {
  opacity: 0;
  transform: translateX(-12px);
}
</style>