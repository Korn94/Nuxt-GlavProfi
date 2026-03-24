<!-- app/components/pages/cabinet/ui/Modal.vue -->
<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="visible" class="modal-overlay" @click.self="handleOverlayClick">
        <div class="modal" :class="{
          'modal--sm': size === 'sm',
          'modal--md': size === 'md',
          'modal--lg': size === 'lg',
        }">
          <!-- Заголовок -->
          <div v-if="title || closable" class="modal__header">
            <h3 v-if="title" class="modal__title">{{ title }}</h3>
            <button v-if="closable" class="modal__close" @click="close">
              <Icon name="mdi:close" size="18" />
            </button>
          </div>

          <!-- Контент -->
          <div class="modal__body">
            <slot />
          </div>

          <!-- Футер -->
          <div v-if="$slots.footer" class="modal__footer">
            <slot name="footer" />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{
  visible?: boolean
  title?: string
  closable?: boolean
  size?: 'sm' | 'md' | 'lg'
  closeOnClickOutside?: boolean
}>(), {
  visible: false,
  closable: true,
  size: 'md',
  closeOnClickOutside: true,
})

const emit = defineEmits<{
  'update:visible': [value: boolean]
  'close': []
}>()

function close() {
  emit('update:visible', false)
  emit('close')
}

function handleOverlayClick() {
  if (props.closeOnClickOutside) close()
}
</script>

<style lang="scss" scoped>
// ── Оверлей ─────────────────────────────────────────────────────────
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
  backdrop-filter: blur(3px);
}

// ── Окно ────────────────────────────────────────────────────────────
.modal {
  background: var(--crm-bg-surface);
  border: 1px solid var(--crm-border-hover);
  border-radius: var(--crm-radius-xl);
  box-shadow: var(--crm-shadow-lg);
  width: 100%;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;

  &--sm {
    max-width: 380px;
  }

  &--md {
    max-width: 520px;
  }

  &--lg {
    max-width: 820px;
  }
}

// ── Заголовок ───────────────────────────────────────────────────────
.modal__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 16px 20px;
  border-bottom: 1px solid var(--crm-border);
  flex-shrink: 0;
}

.modal__title {
  margin: 0;
  font-size: var(--crm-text-lg);
  font-weight: 600;
  color: var(--crm-text-primary);
}

.modal__close {
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: 1px solid transparent;
  border-radius: var(--crm-radius-md);
  color: var(--crm-text-muted);
  cursor: pointer;
  flex-shrink: 0;
  transition: var(--crm-transition);

  &:hover {
    background: var(--crm-danger-dim);
    border-color: rgba(242, 95, 92, 0.3);
    color: var(--crm-danger);
  }
}

// ── Контент ─────────────────────────────────────────────────────────
.modal__body {
  padding: 20px;
  color: var(--crm-text-secondary);
  overflow-y: auto;
  flex: 1;
  scrollbar-width: thin;
  scrollbar-color: var(--crm-bg-overlay) transparent;

  &::-webkit-scrollbar {
    width: 4px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: var(--crm-bg-overlay);
    border-radius: 2px;
  }
}

// ── Футер ───────────────────────────────────────────────────────────
.modal__footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  padding: 14px 20px;
  border-top: 1px solid var(--crm-border);
  background: var(--crm-bg-elevated);
  flex-shrink: 0;
}

// ── Анимация ────────────────────────────────────────────────────────
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;

  .modal {
    transition: transform 0.2s ease, opacity 0.2s ease;
  }
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;

  .modal {
    transform: translateY(-12px) scale(0.97);
    opacity: 0;
  }
}

// ── Мобиле ──────────────────────────────────────────────────────────
@media (max-width: 576px) {
  .modal-overlay {
    padding: 12px;
    align-items: flex-end;
  }

  .modal {
    max-width: 100%;
    border-bottom-left-radius: 0;
    border-bottom-right-radius: 0;
  }

  .modal-enter-from,
  .modal-leave-to {
    .modal {
      transform: translateY(20px);
    }
  }
}
</style>