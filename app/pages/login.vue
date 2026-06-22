<!-- app/pages/login.vue -->
<template>
  <!-- 🔄 Loading ТОЛЬКО когда идёт проверка И есть cookie (значит пользователь был авторизован) -->
  <div v-if="showLoading" class="login-loading">
    <div class="login-loading-logo">
      <Icon name="mdi:briefcase-outline" size="32" />
    </div>
    <div class="login-loading-spinner" />
    <p>Проверка сессии...</p>
  </div>

  <!-- ✅ Форма логина (рендерится когда: проверка завершена ИЛИ cookie нет) -->
  <PagesCabinetLogin v-else-if="!authStore.isAuthenticated" />
</template>

<script setup>
import { computed } from 'vue'
import { useAuthStore } from 'stores/auth'
import { useAuthCookie } from '~/composables/useAuthCookie'

const authStore = useAuthStore()
const { hasCookie } = useAuthCookie()

definePageMeta({
  layout: 'login',
  middleware: 'auth'
});

/**
 * Показывать loading ТОЛЬКО когда:
 * 1. isChecking = true (идёт проверка авторизации)
 * 2. В cookie есть токен (значит пользователь был авторизован и мы проверяем его сессию)
 * 
 * Если cookie нет — это гость, сразу показываем форму входа (без спиннера).
 * Если isChecking = false — проверка завершена, показываем форму.
 */
const showLoading = computed(() => {
  if (!process.client) return false
  if (!authStore.isChecking) return false
  return hasCookie.value
})

useHead({
  title: 'Вход в CRM-систему',
  meta: [
    { name: 'description', content: 'Вход в CRM-систему компании ГлавПрофи' },
    { property: 'og:title', content: 'Вход в CRM-систему' },
    { property: 'og:description', content: 'Вход в CRM-систему компании ГлавПрофи' },
  ]
})
</script>

<style scoped>
.login-loading {
  position: fixed;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  background: #f9fafb;
  color: #6b7280;
  z-index: 1000;
}

.login-loading-logo {
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 195, 245, 0.1);
  border: 1px solid rgba(0, 195, 245, 0.3);
  border-radius: 12px;
  color: #00c3f5;
  animation: logo-pulse 2s ease-in-out infinite;
}

.login-loading-spinner {
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

@keyframes logo-pulse {
  0%, 100% { opacity: 0.8; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.05); }
}
</style>