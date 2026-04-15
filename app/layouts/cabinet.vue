<!-- app/layouts/cabinet.vue -->
<template>
  <div class="crm" :class="`crm--${themeStore.mode}`">
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
import { onMounted, onUnmounted, watch } from 'vue'
import { useAuthStore } from '../../stores/auth'
import { useSocketStore } from '../../stores/socket'
import { useActivityTracker } from '~/composables/useActivityTracker'
import { useUserStatusNotifications } from '~/composables/notifications/useUserStatus'
import { useThemeStore } from 'stores/settings/theme'

const authStore = useAuthStore()
const socketStore = useSocketStore()
const activityTracker = useActivityTracker()
const themeStore = useThemeStore()

// Инициализируем отслеживание статусов других пользователей
const userStatusNotifications = useUserStatusNotifications()

onMounted(() => {
  authStore.init()
  themeStore.initTheme()
  // ✅ Добавляем класс на body — все Teleport-элементы получат CRM-токены
  document.body.classList.add('crm')
})

onUnmounted(() => {
  // ✅ Убираем класс при выходе из CRM
  document.body.classList.remove('crm')
})

// Останавливаем трекер при отключении сокета
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
// Подключаем токены CRM-темы (без scoped — чтобы переменные были доступны дочерним компонентам)
@use '@/assets/styles/crm-theme.scss';
</style>

<style lang="scss" scoped>
.crm {
  min-height: 100vh;
  background: var(--crm-bg-base);
  color: var(--crm-text-primary);
  font-family: var(--crm-font-sans);
  overflow-x: hidden; // Предотвращает горизонтальную прокрутку во время анимации
}

main {
  background: var(--crm-bg-base);

  @media (min-width: 767.98px) {
    margin-left: 250px;
  }
}

// ── Анимация перехода между страницами ─────────────────────
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
