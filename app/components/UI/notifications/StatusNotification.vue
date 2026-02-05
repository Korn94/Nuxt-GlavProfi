<!-- app\components\ui\notifications\StatusNotification.vue -->
<template>
  <div 
    :class="['status-notification', `status-notification--${type}`]"
    v-if="visible"
    @click="handleClick"
  >
    <div class="status-notification-icon">
      <Icon :name="iconName" :size="24" />
    </div>
    
    <div class="status-notification-content">
      <div class="status-notification-header">
        <span class="status-notification-title">{{ title }}</span>
        <span class="status-notification-time">{{ timeAgo }}</span>
      </div>
      <p class="status-notification-message">{{ message }}</p>
    </div>
    
    <button 
      class="status-notification-close"
      @click.stop="close"
      aria-label="Закрыть"
    >
      <Icon name="mdi:close" :size="16" />
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'

const props = defineProps<{
  visible: boolean
  type: 'online' | 'offline' | 'afk'
  title: string
  message: string
  timestamp?: string
  duration?: number
  onClick?: () => void
}>()

const emit = defineEmits<{
  close: []
  click: []
}>()

const isVisible = ref(props.visible)
let timer: NodeJS.Timeout | null = null

// Иконки
const iconMap = {
  online: 'mdi:check-circle',
  offline: 'mdi:minus-circle',
  afk: 'mdi:clock-outline'
}

const iconName = computed(() => iconMap[props.type] || iconMap.offline)

// Время "сколько назад"
const timeAgo = computed(() => {
  if (!props.timestamp) return ''
  
  const now = new Date()
  const eventTime = new Date(props.timestamp)
  const diff = now.getTime() - eventTime.getTime()
  
  if (diff < 60000) return 'только что'
  if (diff < 3600000) return `${Math.floor(diff / 60000)} мин назад`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} ч назад`
  
  return eventTime.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
})

// Закрытие
const close = () => {
  isVisible.value = false
  if (timer) clearTimeout(timer)
  emit('close')
}

// Клик по уведомлению
const handleClick = () => {
  if (props.onClick) {
    props.onClick()
  }
  emit('click')
}

// Таймер авто-скрытия
onMounted(() => {
  const duration = props.duration || 3000
  timer = setTimeout(() => {
    close()
  }, duration)
})

onUnmounted(() => {
  if (timer) clearTimeout(timer)
})
</script>

<style lang="scss" scoped>
.status-notification {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: rgba(30, 30, 30, 0.95);
  border-radius: 8px;
  border-left: 4px solid;
  cursor: pointer;
  transition: all 0.3s ease;
  animation: slideIn 0.3s ease-out;

  &:hover {
    transform: translateX(4px);
    background: rgba(40, 40, 40, 0.95);
  }

  &--online {
    border-left-color: #28a745;
    .status-notification-icon {
      color: #28a745;
    }
  }

  &--offline {
    border-left-color: #6c757d;
    .status-notification-icon {
      color: #6c757d;
    }
  }

  &--afk {
    border-left-color: #ffc107;
    .status-notification-icon {
      color: #ffc107;
    }
  }
}

.status-notification-icon {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.status-notification-content {
  flex: 1;
  min-width: 0;
}

.status-notification-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.status-notification-title {
  font-size: 13px;
  font-weight: 600;
  color: #fff;
}

.status-notification-time {
  font-size: 11px;
  color: #888;
}

.status-notification-message {
  margin: 0;
  font-size: 12px;
  color: #ccc;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.status-notification-close {
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

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(100%);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}
</style>