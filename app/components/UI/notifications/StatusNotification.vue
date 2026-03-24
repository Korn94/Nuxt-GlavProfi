<!-- app/components/ui/notifications/StatusNotification.vue -->
<template>
  <Transition name="status-notif">
    <div v-if="visible" :class="['status-notif', `status-notif--${type}`]" @click="handleClick">
      <!-- Иконка -->
      <div class="status-notif__icon">
        <Icon :name="iconName" size="18" />
      </div>

      <!-- Контент -->
      <div class="status-notif__body">
        <div class="status-notif__header">
          <span class="status-notif__title">{{ title }}</span>
          <span class="status-notif__time">{{ timeAgo }}</span>
        </div>
        <p class="status-notif__message">{{ message }}</p>
      </div>

      <!-- Закрыть -->
      <button class="status-notif__close" @click.stop="close">
        <Icon name="mdi:close" size="14" />
      </button>
    </div>
  </Transition>
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

const emit = defineEmits<{ close: []; click: [] }>()

let timer: ReturnType<typeof setTimeout> | null = null

const iconMap = {
  online: 'mdi:check-circle',
  offline: 'mdi:minus-circle',
  afk: 'mdi:clock-outline',
}

const iconName = computed(() => iconMap[props.type])

const timeAgo = computed(() => {
  if (!props.timestamp) return ''
  const diff = Date.now() - new Date(props.timestamp).getTime()
  if (diff < 60_000) return 'только что'
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)} мин назад`
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)} ч назад`
  return new Date(props.timestamp).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
})

function close() {
  if (timer) clearTimeout(timer)
  emit('close')
}

function handleClick() {
  props.onClick?.()
  emit('click')
}

onMounted(() => {
  timer = setTimeout(close, props.duration ?? 4000)
})

onUnmounted(() => {
  if (timer) clearTimeout(timer)
})
</script>

<style lang="scss" scoped>
.status-notif {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  background: var(--crm-bg-elevated);
  border: 1px solid var(--crm-border-hover);
  border-radius: var(--crm-radius-lg);
  box-shadow: var(--crm-shadow-md);
  cursor: pointer;
  transition: var(--crm-transition);

  &:hover {
    background: var(--crm-bg-overlay);
    transform: translateX(-3px);
  }

  // ── Варианты ──
  &--online {
    border-left: 3px solid var(--crm-success);

    .status-notif__icon {
      color: var(--crm-success);
      background: var(--crm-success-dim);
    }
  }

  &--offline {
    border-left: 3px solid var(--crm-text-muted);

    .status-notif__icon {
      color: var(--crm-text-muted);
      background: var(--crm-bg-overlay);
    }
  }

  &--afk {
    border-left: 3px solid var(--crm-warning);

    .status-notif__icon {
      color: var(--crm-warning);
      background: var(--crm-warning-dim);
    }
  }
}

// ── Иконка ──────────────────────────────────────────────────────────
.status-notif__icon {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

// ── Контент ─────────────────────────────────────────────────────────
.status-notif__body {
  flex: 1;
  min-width: 0;
}

.status-notif__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  margin-bottom: 2px;
}

.status-notif__title {
  font-size: var(--crm-text-sm);
  font-weight: 600;
  color: var(--crm-text-primary);
}

.status-notif__time {
  font-size: var(--crm-text-xs);
  color: var(--crm-text-muted);
  white-space: nowrap;
  flex-shrink: 0;
}

.status-notif__message {
  font-size: var(--crm-text-xs);
  color: var(--crm-text-secondary);
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

// ── Закрыть ─────────────────────────────────────────────────────────
.status-notif__close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  background: transparent;
  border: none;
  border-radius: var(--crm-radius-sm);
  color: var(--crm-text-muted);
  cursor: pointer;
  flex-shrink: 0;
  transition: var(--crm-transition);

  &:hover {
    background: var(--crm-bg-overlay);
    color: var(--crm-text-primary);
  }
}

// ── Анимация ────────────────────────────────────────────────────────
.status-notif-enter-active,
.status-notif-leave-active {
  transition: all 0.25s ease;
}

.status-notif-enter-from {
  opacity: 0;
  transform: translateX(100%) scale(0.95);
}

.status-notif-leave-to {
  opacity: 0;
  transform: translateX(100%) scale(0.95);
}
</style>