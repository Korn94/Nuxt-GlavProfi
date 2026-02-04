<!-- app/layouts/cabinet.vue -->
<template>
  <LayoutCabinetHeader />
  <main>
    <NuxtPage />
    <Container />
  </main>
</template>

<!-- app/layouts/cabinet.vue -->
<script setup lang="ts">
import { onMounted, watch } from 'vue'
import { useAuthStore } from '../../stores/auth'
import { useSocketStore } from '../../stores/socket'
import { useActivityTracker } from '~/composables/useActivityTracker'
import Container from '~/components/ui/notifications/Container.vue'

const authStore = useAuthStore()
const socketStore = useSocketStore()
const activityTracker = useActivityTracker()

onMounted(() => {
  authStore.init()
})

// ✅ Останавливаем трекер при отключении сокета
watch(
  () => socketStore.isConnected,
  (isConnected) => {
    if (!isConnected && activityTracker.isTracking.value) {
      activityTracker.stopTracking()
    }
  }
)
</script>

<style lang="scss" scoped>
@media (min-width: 767.98px) {
  main {
    margin-left: 250px;
  }
}

main {
  background: $background-dark;
}
</style>