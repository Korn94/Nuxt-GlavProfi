<!-- app/components/ui/status/OnlineStatus.vue -->
<template>
  <div :class="['online-status', `online-status--${status}`]" :title="statusText">
    <span class="online-status-dot"></span>
    <span class="online-status-text">{{ statusText }}</span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  status: 'online' | 'afk' | 'offline'
  showText?: boolean
}>()

const statusText = computed(() => {
  const texts: Record<string, string> = {
    online: 'Онлайн',
    afk: 'Отсутствует',
    offline: 'Оффлайн'
  }
  return texts[props.status] || ''
})
</script>

<style lang="scss" scoped>
.online-status {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  padding: 4px 8px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.1);
  
  &--online {
    background: rgba(40, 167, 69, 0.1);
    color: #28a745;
    
    .online-status-dot {
      background: #28a745;
    }
  }
  
  &--afk {
    background: rgba(255, 193, 7, 0.1);
    color: #ffc107;
    
    .online-status-dot {
      background: #ffc107;
    }
  }
  
  &--offline {
    background: rgba(108, 117, 125, 0.1);
    color: #6c757d;
    
    .online-status-dot {
      background: #6c757d;
    }
  }
}

.online-status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}
</style>