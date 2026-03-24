<!-- components/ui/notifications/Container.vue -->
<template>
  <Teleport to="body">
    <TransitionGroup name="notif" tag="div" class="notif-container">
      <div v-for="n in notificationStore.notifications" :key="n.id" :class="['notif', `notif--${n.type}`]">
        <!-- Левая полоса + иконка -->
        <div class="notif__aside">
          <Icon :name="getIcon(n.type)" size="18" />
        </div>

        <!-- Контент -->
        <div class="notif__body">
          <p class="notif__title">{{ n.title }}</p>
          <p class="notif__message">{{ n.message }}</p>

          <!-- Кнопки действий -->
          <div v-if="n.actions?.length" class="notif__actions">
            <button v-for="(action, i) in n.actions" :key="i" class="notif__action" :class="action.class"
              @click="notificationStore.handleAction(n.id, action)">
              {{ action.text }}
            </button>
          </div>
        </div>

        <!-- Закрыть -->
        <button class="notif__close" @click="notificationStore.close(n.id)">
          <Icon name="mdi:close" size="16" />
        </button>
      </div>
    </TransitionGroup>
  </Teleport>
</template>

<script setup lang="ts">
import { useNotificationStore } from '../../../../stores/notifications'

const notificationStore = useNotificationStore()

const getIcon = (type: string) => ({
  success: 'mdi:check-circle',
  error: 'mdi:alert-circle',
  warning: 'mdi:alert',
  info: 'mdi:information',
}[type] ?? 'mdi:information')
</script>

<style lang="scss" scoped>
// ── Контейнер ───────────────────────────────────────────────────────
.notif-container {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 340px;
  pointer-events: none;
}

// ── Уведомление ─────────────────────────────────────────────────────
.notif {
  display: flex;
  align-items: flex-start;
  gap: 0;
  background: var(--crm-bg-elevated);
  border: 1px solid var(--crm-border-hover);
  border-radius: var(--crm-radius-lg);
  box-shadow: var(--crm-shadow-lg);
  overflow: hidden;
  pointer-events: auto;

  // ── Цветовые варианты ──
  &--success {
    border-left: 3px solid var(--crm-success);

    .notif__aside {
      color: var(--crm-success);
      background: var(--crm-success-dim);
    }
  }

  &--error {
    border-left: 3px solid var(--crm-danger);

    .notif__aside {
      color: var(--crm-danger);
      background: var(--crm-danger-dim);
    }
  }

  &--warning {
    border-left: 3px solid var(--crm-warning);

    .notif__aside {
      color: var(--crm-warning);
      background: var(--crm-warning-dim);
    }
  }

  &--info {
    border-left: 3px solid var(--crm-info);

    .notif__aside {
      color: var(--crm-info);
      background: var(--crm-info-dim);
    }
  }
}

// ── Иконка слева ────────────────────────────────────────────────────
.notif__aside {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  min-height: 100%;
  flex-shrink: 0;
  padding: 14px 0;
}

// ── Текст ───────────────────────────────────────────────────────────
.notif__body {
  flex: 1;
  padding: 12px 8px 12px 0;
  min-width: 0;
}

.notif__title {
  font-size: var(--crm-text-md);
  font-weight: 600;
  color: var(--crm-text-primary);
  margin: 0 0 3px;
  line-height: 1.3;
}

.notif__message {
  font-size: var(--crm-text-sm);
  color: var(--crm-text-secondary);
  margin: 0;
  line-height: 1.5;
}

// ── Кнопки действий ─────────────────────────────────────────────────
.notif__actions {
  display: flex;
  gap: 6px;
  margin-top: 10px;
}

.notif__action {
  padding: 4px 10px;
  background: var(--crm-bg-overlay);
  border: 1px solid var(--crm-border-hover);
  border-radius: var(--crm-radius-sm);
  color: var(--crm-text-primary);
  font-size: var(--crm-text-xs);
  font-weight: 500;
  cursor: pointer;
  transition: var(--crm-transition);

  &:hover {
    background: var(--crm-accent-dim);
    border-color: var(--crm-accent-border);
    color: var(--crm-accent);
  }
}

// ── Кнопка закрытия ─────────────────────────────────────────────────
.notif__close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  margin: 6px 6px 0 0;
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
.notif-enter-active,
.notif-leave-active {
  transition: all 0.25s ease;
}

.notif-enter-from {
  opacity: 0;
  transform: translateX(100%) scale(0.95);
}

.notif-leave-to {
  opacity: 0;
  transform: translateX(100%) scale(0.95);
}

// ── Мобиле ──────────────────────────────────────────────────────────
@media (max-width: 640px) {
  .notif-container {
    top: 62px; // под мобильной шапкой
    right: 12px;
    left: 12px;
    width: auto;
  }
}
</style>