<!-- app/layouts/cabinet.vue -->
<template>
  <LayoutCabinetHeader />
  <main>
    <NuxtPage />
    <UiNotificationsContainer />
  </main>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useAuthStore } from '../../stores/auth'
import { useActivityTracker } from '~/composables/useActivityTracker'

const authStore = useAuthStore()

// Инициализируем аутентификацию и сокет при входе в кабинет
onMounted(() => {
  authStore.init()
})

// Инициализируем отслеживание активности
useActivityTracker()
</script>

<style lang="scss" scoped>
@media (min-width: 767.98px) {
  main {
    margin-left: 250px;
  }
}
</style>