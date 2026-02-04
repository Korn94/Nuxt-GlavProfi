<!-- components/ui/notifications/Container.vue -->
<template>
  <Teleport to="body">
    <TransitionGroup
      name="notification"
      tag="div"
      class="notifications-container"
    >
      <div
        v-for="notification in notificationStore.notifications"
        :key="notification.id"
        :class="['notification', `notification--${notification.type}`, { 'notification--visible': notification.visible }]"
      >
        <div class="notification-header">
          <Icon
            :name="getIcon(notification.type)"
            class="notification-icon"
          />
          <h4 class="notification-title">{{ notification.title }}</h4>
          <button
            class="notification-close"
            @click="notificationStore.close(notification.id)"
          >
            <Icon name="mdi:close" />
          </button>
        </div>
        
        <p class="notification-message">{{ notification.message }}</p>
        
        <div v-if="notification.actions && notification.actions.length" class="notification-actions">
          <button
            v-for="(action, index) in notification.actions"
            :key="index"
            :class="['notification-action', action.class]"
            @click="notificationStore.handleAction(notification.id, action)"
          >
            {{ action.text }}
          </button>
        </div>
      </div>
    </TransitionGroup>
  </Teleport>
</template>

<script setup lang="ts">
import { useNotificationStore } from '../../../../stores/notifications'

const notificationStore = useNotificationStore()

const getIcon = (type: string) => {
  const icons: Record<string, string> = {
    success: 'mdi:check-circle',
    error: 'mdi:alert-circle',
    warning: 'mdi:alert',
    info: 'mdi:information'
  }
  return icons[type] || 'mdi:information'
}
</script>

<style lang="scss" scoped>
.notifications-container {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-width: 400px;
  pointer-events: none;
}

.notification {
  background: rgba(30, 30, 30, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  border-left: 4px solid;
  pointer-events: auto;
  
  &--success {
    border-left-color: #28a745;
    
    .notification-icon {
      color: #28a745;
    }
  }
  
  &--error {
    border-left-color: #dc3545;
    
    .notification-icon {
      color: #dc3545;
    }
  }
  
  &--warning {
    border-left-color: #ffc107;
    
    .notification-icon {
      color: #ffc107;
    }
  }
  
  &--info {
    border-left-color: #17a2b8;
    
    .notification-icon {
      color: #17a2b8;
    }
  }
}

.notification-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.notification-icon {
  font-size: 20px;
  flex-shrink: 0;
}

.notification-title {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #fff;
  flex: 1;
}

.notification-close {
  background: none;
  border: none;
  color: #888;
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.2s;
  
  &:hover {
    color: #fff;
  }
}

.notification-message {
  margin: 0;
  font-size: 13px;
  color: #ccc;
  line-height: 1.4;
}

.notification-actions {
  display: flex;
  gap: 8px;
  margin-top: 12px;
}

.notification-action {
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  
  &:hover {
    background: rgba(255, 255, 255, 0.2);
  }
}

// Анимации
.notification-enter-active,
.notification-leave-active {
  transition: all 0.3s ease;
}

.notification-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.notification-leave-to {
  opacity: 0;
  transform: translateX(100%) scale(0.9);
}

@media (max-width: 640px) {
  .notifications-container {
    top: 10px;
    right: 10px;
    left: 10px;
    max-width: none;
  }
}
</style>