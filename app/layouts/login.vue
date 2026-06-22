<!-- app/layouts/login.vue -->
<template>
  <main>
    <!-- 🔄 Loading: есть cookie + идёт проверка (SSR → клиент переход) -->
    <div v-if="showLoading" class="login-layout-loading">
      <div class="login-layout-spinner" />
    </div>

    <!-- ✅ Контент: проверка завершена ИЛИ cookie нет (гость) -->
    <template v-else>
      <NuxtPage />
      <UiNotificationsContainer />
    </template>
  </main>
</template>

<script setup>
import { computed } from 'vue'
import { useAuthStore } from 'stores/auth'
import { useAuthCookie } from '~/composables/useAuthCookie'

const authStore = useAuthStore()
const { hasCookie } = useAuthCookie()

/**
 * Показывать loading на странице логина ТОЛЬКО когда:
 * 1. Идёт проверка (isChecking = true)
 * 2. В cookie есть токен (значит пользователь был авторизован)
 *
 * Если cookie нет — сразу показываем форму (гость пришёл на логин).
 */
const showLoading = computed(() => {
  if (!process.client) return false
  if (!authStore.isChecking) return false
  return hasCookie.value
})
</script>

<style scoped>
.login-layout-loading {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f9fafb;
  z-index: 9999;
}

.login-layout-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #e5e7eb;
  border-top-color: #00c3f5;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>