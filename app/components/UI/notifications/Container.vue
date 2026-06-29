<!-- components/ui/notifications/Container.vue -->
<template>
  <!-- Позиция снизу справа, как в Toast, но работа через store -->
  <Teleport to="body">
    <TransitionGroup name="notif" tag="div" class="notif-container">
      <div
        v-for="n in notificationStore.notifications"
        :key="n.id"
        :class="['notif', `notif--${n.type}`]"
        role="alert"
        aria-live="polite"
      >
        <!-- Иконка -->
        <div class="notif__icon">
          <Icon :name="getIcon(n.type)" size="20" />
        </div>

        <!-- Контент -->
        <div class="notif__body">
          <p v-if="n.title" class="notif__title">{{ n.title }}</p>
          <p class="notif__message">{{ n.message }}</p>

          <!-- Кнопки действий -->
          <div v-if="n.actions?.length" class="notif__actions">
            <button
              v-for="(action, i) in n.actions"
              :key="i"
              class="notif__action"
              :class="action.class"
              @click="notificationStore.handleAction(n.id, action)"
            >
              {{ action.text }}
            </button>
          </div>
        </div>

        <!-- Закрыть -->
        <button
          class="notif__close"
          @click="notificationStore.close(n.id)"
          :aria-label="`Закрыть уведомление: ${n.message}`"
        >
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
  bottom: 2rem;
  right: 2rem;
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 360px;
  z-index: 9999;
  pointer-events: none;
}

// ── Уведомление ─────────────────────────────────────────────────────
.notif {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.875rem 1.25rem;
  background: var(--crm-bg-elevated, #ffffff);
  border: 1px solid var(--crm-border, #e5e7eb);
  border-radius: var(--crm-radius-md, 8px);
  box-shadow: var(--crm-shadow-lg, 0 10px 25px rgba(0,0,0,0.15));
  color: var(--crm-text-primary, #1f2937);
  font-size: var(--crm-text-md, 14px);
  pointer-events: auto;
  overflow: hidden;
  max-width: calc(100vw - 2rem);

  // ── Цветовые варианты ──
  &--success {
    border-color: var(--crm-success, #22c55e);

    .notif__icon {
      color: var(--crm-success, #22c55e);
    }
  }

  &--error {
    border-color: var(--crm-danger, #ef4444);

    .notif__icon {
      color: var(--crm-danger, #ef4444);
    }
  }

  &--warning {
    border-color: var(--crm-warning, #f59e0b);

    .notif__icon {
      color: var(--crm-warning, #f59e0b);
    }
  }

  &--info {
    border-color: var(--crm-info, #3b82f6);

    .notif__icon {
      color: var(--crm-info, #3b82f6);
    }
  }
}

// ── Иконка ──────────────────────────────────────────────────────────
.notif__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-top: 1px;
}

// ── Текст ───────────────────────────────────────────────────────────
.notif__body {
  flex: 1;
  min-width: 0;
}

.notif__title {
  font-size: var(--crm-text-md, 14px);
  font-weight: 600;
  color: var(--crm-text-primary);
  margin: 0 0 3px;
  line-height: 1.3;
}

.notif__message {
  font-size: var(--crm-text-sm, 13px);
  color: var(--crm-text-secondary, #6b7280);
  margin: 0;
  line-height: 1.5;
  word-break: break-word;
}

// ── Кнопки действий ─────────────────────────────────────────────────
.notif__actions {
  display: flex;
  gap: 6px;
  margin-top: 10px;
}

.notif__action {
  padding: 4px 10px;
  background: var(--crm-bg-overlay, #f3f4f6);
  border: 1px solid var(--crm-border-hover, #d1d5db);
  border-radius: var(--crm-radius-sm, 6px);
  color: var(--crm-text-primary, #1f2937);
  font-size: var(--crm-text-xs, 12px);
  font-weight: 500;
  cursor: pointer;
  transition: var(--crm-transition);

  &:hover {
    background: var(--crm-accent-dim, rgba(0, 195, 245, 0.1));
    border-color: var(--crm-accent-border, rgba(0, 195, 245, 0.3));
    color: var(--crm-accent, #00c3f5);
  }
}

// ── Кнопка закрытия ─────────────────────────────────────────────────
.notif__close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  background: transparent;
  border: none;
  border-radius: var(--crm-radius-sm);
  color: var(--crm-text-muted, #9ca3af);
  cursor: pointer;
  flex-shrink: 0;
  transition: all var(--crm-transition, 0.2s);

  &:hover {
    background: var(--crm-bg-overlay, #f3f4f6);
    color: var(--crm-text-primary, #1f2937);
  }
}

// ── Анимация ────────────────────────────────────────────────────────
.notif-enter-active,
.notif-leave-active {
  transition: all 0.3s ease;
}

.notif-enter-from,
.notif-leave-to {
  opacity: 0;
  transform: translateY(20px);
}

// ── Адаптивность ────────────────────────────────────────────────────
@media (max-width: 768px) {
  .notif-container {
    left: 1rem;
    right: 1rem;
    bottom: 1rem;
    width: auto;
  }

  .notif {
    max-width: none;
  }
}
</style>