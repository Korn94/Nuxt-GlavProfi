<!-- app\pages\cabinet\index.vue -->
<template>
  <div class="cabinet-router-loader">
    <Icon name="mdi:loading" class="animate-spin" size="24" />
    <span class="ml-2">Загрузка...</span>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { navigateTo, useHead, useRouter } from 'nuxt/app'
import { useAuthStore } from 'stores/auth'
import { definePageMeta } from 'node_modules/nuxt/dist/pages/runtime'

const authStore = useAuthStore()
const router = useRouter()

definePageMeta({
  layout: 'cabinet',
  middleware: ['auth', 'role'],
});

// Карта: роль → целевой роут
const ROLE_ROUTES: Record<string, string> = {
  admin: '/cabinet/admin',
  manager: '/cabinet/admin',    // менеджеры пока видят как админы
  foreman: '/cabinet/foreman',
  master: '/cabinet/foreman',   // мастера → интерфейс прораба
  worker: '/cabinet/foreman',   // рабочие → минималка
}

onMounted(async () => {
  // Ждём завершения проверки авторизации, если она ещё идёт
  if (authStore.isChecking) {
    await authStore.init().catch(() => {
      // Если проверка упала — init() сам сделает редирект на /login
    })
  }
  
  const role = authStore.user?.role || 'worker'
  const targetRoute = ROLE_ROUTES[role] || '/cabinet/foreman'
  
  // replace вместо push — чтобы не ломать историю навигации
  await router.replace(targetRoute)
})

useHead({
  meta: [
    { name: 'robots', content: 'noindex, nofollow' },
  ],
  title: 'CRM — Главная'
})
</script>

<style lang="scss" scoped>
.cabinet-router-loader {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  color: var(--crm-text-muted);
  font-size: var(--crm-text-md);
}

.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>