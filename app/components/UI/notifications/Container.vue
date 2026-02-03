<!-- app/components/ui/notifications/Container.vue -->
<template>
  <div class="notification-container">
    <UiNotifications
      v-for="notification in notifications"
      :key="notification.id"
      v-model:visible="notification.visible"
      :type="notification.type"
      :title="notification.title"
      :message="notification.message"
      :duration="notification.duration"
      :actions="notification.actions"
      @update:visible="handleClose(notification.id)"
      @action="handleAction(notification.id, $event)"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useNotificationStore } from '../../../../stores/notifications'

const notificationStore = useNotificationStore()

const notifications = computed(() => notificationStore.notifications)

const handleClose = (id: string) => {
  notificationStore.close(id)
}

const handleAction = (id: string, action: any) => {
  notificationStore.handleAction(id, action)
}
</script>

<style lang="scss" scoped>
.notification-container {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 10000;
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: calc(100vh - 40px);
  overflow-y: auto;
  padding-right: 4px;
  
  &::-webkit-scrollbar {
    width: 4px;
  }
  
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  
  &::-webkit-scrollbar-thumb {
    background: rgba(0, 0, 0, 0.2);
    border-radius: 2px;
  }
}
</style>