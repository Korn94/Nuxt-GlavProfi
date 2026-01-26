<template>
  <LayoutCabinetHeader />
  <main>
    <NuxtPage />
  </main>
</template>

<script setup lang="ts">
import { useWebSocketStore } from '~~/stores/websocket'
import { usePresenceStore } from '~~/stores/presence'
import { onMounted, onBeforeUnmount } from 'vue'

const websocketStore = useWebSocketStore()
const presenceStore = usePresenceStore()

onMounted(() => {
  // Инициализируем WebSocket соединение
  websocketStore.connect()
  
  // Подписываемся на каналы присутствия
  websocketStore.subscribe('presence:all')
  websocketStore.subscribe('notifications:all')
  
  // Если нужно подписаться на другие каналы:
  // websocketStore.subscribe('tasks:all')
  // websocketStore.subscribe('notifications:all')
})

onBeforeUnmount(() => {
  // Отписываемся от каналов
  websocketStore.unsubscribe('presence:all')
  
  // Закрываем соединение
  websocketStore.disconnect()
})
</script>

<style lang="scss" scoped>
@media (min-width: 767.98px) {
  main {
    margin-left: 250px;
  }
}
</style>