<!-- app/components/pages/cabinet/settings/permissions/shared/Toast.vue -->
 <template>
  <Teleport to="body">
    <Transition name="toast">
      <div
        v-if="show"
        :class="['toast', `toast-${type}`]"
        role="alert"
        aria-live="polite"
      >
        <div class="toast__icon">
          <Icon :name="iconName" size="20" />
        </div>
        <span class="toast__message">{{ message }}</span>
        <button
          class="toast__close"
          @click="hide"
          :aria-label="`Закрыть уведомление: ${message}`"
        >
          <Icon name="mdi:close" size="16" />
        </button>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, watch } from 'vue'

// ============================================
// ПРОПСЫ
// ============================================
const props = withDefaults(defineProps<{
  /** Флаг видимости (используется с v-model:show) */
  show: boolean
  /** Тип уведомления (определяет цвет и иконку) */
  type?: 'success' | 'error' | 'info' | 'warning'
  /** Текст уведомления */
  message: string
  /** Время автоскрытия в миллисекундах (0 = не скрывать автоматически) */
  duration?: number
}>(), {
  type: 'success',
  duration: 4000,
})

// ============================================
// ЭМИТТЫ
// ============================================
const emit = defineEmits<{
  'update:show': [value: boolean]
}>()

// ============================================
// ИКОНКА ПО ТИПУ
// ============================================
const iconName = computed(() => {
  switch (props.type) {
    case 'success': return 'mdi:check-circle'
    case 'error': return 'mdi:alert-circle'
    case 'info': return 'mdi:information'
    case 'warning': return 'mdi:alert'
    default: return 'mdi:information'
  }
})

// ============================================
// АВТОСКРЫТИЕ
// ============================================
let hideTimeout: ReturnType<typeof setTimeout> | null = null

function scheduleHide() {
  clearHideTimeout()
  if (props.duration > 0 && props.show) {
    hideTimeout = setTimeout(() => {
      hide()
    }, props.duration)
  }
}

function clearHideTimeout() {
  if (hideTimeout) {
    clearTimeout(hideTimeout)
    hideTimeout = null
  }
}

function hide() {
  clearHideTimeout()
  emit('update:show', false)
}

// При каждом появлении toast — запускаем таймер автоскрытия
watch(() => props.show, (newShow) => {
  if (newShow) {
    scheduleHide()
  } else {
    clearHideTimeout()
  }
}, { immediate: true })

// При смене duration пересчитываем таймер
watch(() => props.duration, () => {
  if (props.show) scheduleHide()
})

// Очистка таймера при размонтировании
onBeforeUnmount(() => {
  clearHideTimeout()
})
</script>

<style lang="scss" scoped>
.toast {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.875rem 1.25rem;
  background: var(--crm-bg-elevated);
  border: 1px solid var(--crm-border);
  border-radius: var(--crm-radius-md);
  box-shadow: var(--crm-shadow-lg);
  z-index: 2000;
  color: var(--crm-text-primary);
  font-size: var(--crm-text-md);
  max-width: calc(100vw - 2rem);

  &__icon {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  &__message {
    flex: 1;
    min-width: 0;
    word-break: break-word;
  }

  &__close {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    background: transparent;
    color: var(--crm-text-muted);
    border: none;
    border-radius: var(--crm-radius-sm);
    cursor: pointer;
    flex-shrink: 0;
    transition: all var(--crm-transition);

    &:hover {
      background: var(--crm-bg-overlay);
      color: var(--crm-text-primary);
    }
  }

  // ── ВАРИАНТЫ ПО ТИПУ ──────────────────────────────
  &-success {
    border-color: var(--crm-success);

    .toast__icon {
      color: var(--crm-success);
    }
  }

  &-error {
    border-color: var(--crm-danger);

    .toast__icon {
      color: var(--crm-danger);
    }
  }

  &-info {
    border-color: var(--crm-info);

    .toast__icon {
      color: var(--crm-info);
    }
  }

  &-warning {
    border-color: var(--crm-warning);

    .toast__icon {
      color: var(--crm-warning);
    }
  }
}

// ── АНИМАЦИЯ ПОЯВЛЕНИЯ/СКРЫТИЯ ──────────────────────
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(20px);
}

// ── АДАПТИВНОСТЬ ───────────────────────────────────
@media (max-width: 768px) {
  .toast {
    left: 1rem;
    right: 1rem;
    bottom: 1rem;
    max-width: none;
  }
}
</style>