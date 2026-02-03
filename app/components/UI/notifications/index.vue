<!-- app/components/ui/notifications/index.vue -->
<template>
  <transition name="notification-slide">
    <div 
      v-if="visible" 
      :class="['notification', `notification--${type}`]"
      @mouseenter="pauseTimer"
      @mouseleave="resumeTimer"
    >
      <!-- Иконка -->
      <div class="notification-icon">
        <Icon :name="iconName" :size="24" />
      </div>
      
      <!-- Содержимое -->
      <div class="notification-content">
        <div class="notification-header">
          <h4>{{ title }}</h4>
          <button 
            class="notification-close" 
            @click="close"
            :aria-label="`Закрыть уведомление: ${title}`"
          >
            <Icon name="mdi:close" :size="18" />
          </button>
        </div>
        <p>{{ message }}</p>
        
        <!-- Действия -->
        <div v-if="actions.length > 0" class="notification-actions">
          <button 
            v-for="(action, index) in actions" 
            :key="index"
            :class="['notification-action', action.class]"
            @click="handleAction(action)"
          >
            {{ action.text }}
          </button>
        </div>
      </div>
      
      <!-- Прогресс-бар -->
      <div class="notification-progress" :style="{ width: `${progress}%` }"></div>
    </div>
  </transition>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
  message: {
    type: String,
    default: 'Уведомление',
  },
  title: {
    type: String,
    default: '',
  },
  type: {
    type: String,
    default: 'info',
    validator: (value) => ['success', 'error', 'warning', 'info'].includes(value),
  },
  duration: {
    type: Number,
    default: 6000,
  },
  actions: {
    type: Array,
    default: () => [],
  },
  onClose: {
    type: Function,
    default: () => {},
  },
})

const emit = defineEmits(['update:visible', 'action'])

const progress = ref(100)
let timer = null
let animationFrame = null
let isPaused = false

// Иконки для каждого типа уведомления
const iconMap = {
  success: 'mdi:check-circle-outline',
  error: 'mdi:alert-circle-outline',
  warning: 'mdi:alert-outline',
  info: 'mdi:information-outline',
}

const iconName = computed(() => iconMap[props.type] || iconMap.info)

// Запуск таймера
const startTimer = () => {
  if (timer) return
  
  const startTime = Date.now()
  const duration = props.duration
  
  const animate = () => {
    if (isPaused) {
      animationFrame = requestAnimationFrame(animate)
      return
    }
    
    const elapsed = Date.now() - startTime
    const remaining = duration - elapsed
    
    if (remaining <= 0) {
      close()
      return
    }
    
    progress.value = (remaining / duration) * 100
    animationFrame = requestAnimationFrame(animate)
  }
  
  timer = setTimeout(() => {
    close()
  }, duration)
  
  animate()
}

// Остановка таймера
const pauseTimer = () => {
  isPaused = true
}

// Возобновление таймера
const resumeTimer = () => {
  isPaused = false
}

// Закрытие уведомления
const close = () => {
  if (timer) clearTimeout(timer)
  if (animationFrame) cancelAnimationFrame(animationFrame)
  emit('update:visible', false)
  props.onClose()
}

// Обработка действий
const handleAction = (action) => {
  emit('action', action)
  if (action.closeOnAction !== false) {
    close()
  }
}

// Запуск таймера при монтировании
onMounted(() => {
  if (props.visible) {
    startTimer()
  }
})

// Очистка при размонтировании
onUnmounted(() => {
  if (timer) clearTimeout(timer)
  if (animationFrame) cancelAnimationFrame(animationFrame)
})
</script>

<style lang="scss" scoped>
.notification {
  position: fixed;
  top: 20px;
  right: 20px;
  min-width: 320px;
  max-width: 500px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-radius: $border-radius;
  box-shadow: $box-shadow;
  padding: 16px;
  z-index: 10000;
  display: flex;
  gap: 12px;
  border: 2px solid transparent;
  animation: notification-pop 0.3s ease-out;
  cursor: default;
  
  @media (max-width: 768px) {
    min-width: 280px;
    max-width: 100%;
    right: 10px;
    left: 10px;
  }
  
  &-slide-enter-active,
  &-slide-leave-active {
    transition: all 0.3s ease;
  }
  
  &-slide-enter-from,
  &-slide-leave-to {
    opacity: 0;
    transform: translateX(100%);
  }
  
  &--success {
    border-color: $color-success;
    
    .notification-icon {
      background: rgba(40, 167, 69, 0.1);
      color: $color-success;
    }
  }
  
  &--error {
    border-color: $color-danger;
    
    .notification-icon {
      background: rgba(220, 53, 69, 0.1);
      color: $color-danger;
    }
  }
  
  &--warning {
    border-color: $color-warning;
    
    .notification-icon {
      background: rgba(255, 193, 7, 0.1);
      color: #856404;
    }
  }
  
  &--info {
    border-color: $color-info;
    
    .notification-icon {
      background: rgba(23, 162, 184, 0.1);
      color: $color-info;
    }
  }
}

.notification-icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.notification-content {
  flex: 1;
}

.notification-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  
  h4 {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    color: $text-dark;
  }
}

.notification-close {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  color: $text-gray;
  transition: $transition;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    color: $text-dark;
    transform: rotate(90deg);
  }
}

.notification-content p {
  margin: 0 0 12px 0;
  font-size: 14px;
  line-height: 1.5;
  color: $text-gray;
}

.notification-actions {
  display: flex;
  gap: 8px;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid rgba(0, 0, 0, 0.05);
}

.notification-action {
  padding: 8px 16px;
  border-radius: 4px;
  border: none;
  background: $sub-item-bg;
  color: $text-dark;
  font-size: 14px;
  cursor: pointer;
  transition: $transition;
  
  // &:hover {
  //   background: darken($sub-item-bg, 5%);
  // }
  
  &.primary {
    background: $blue;
    color: white;
    
    // &:hover {
    //   background: darken($blue, 10%);
    // }
  }
  
  &.danger {
    background: $color-danger;
    color: white;
    
    // &:hover {
    //   background: darken($color-danger, 10%);
    // }
  }
}

.notification-progress {
  position: absolute;
  bottom: 0;
  left: 0;
  height: 3px;
  background: currentColor;
  transition: width 0.3s linear;
  border-radius: 0 0 4px 4px;
}

@keyframes notification-pop {
  0% {
    transform: scale(0.9);
    opacity: 0;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}
</style>
