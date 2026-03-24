<!-- app/layouts/cabinet.vue -->
<template>
  <div class="crm">
    <LayoutCabinetHeader />
    <main>
      <NuxtPage />
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

const authStore = useAuthStore()
const socketStore = useSocketStore()
const activityTracker = useActivityTracker()

// Инициализируем отслеживание статусов других пользователей
const userStatusNotifications = useUserStatusNotifications()

onMounted(() => {
  authStore.init()
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
}

main {
  background: var(--crm-bg-base);

  @media (min-width: 767.98px) {
    margin-left: 250px;
  }
}
</style>
