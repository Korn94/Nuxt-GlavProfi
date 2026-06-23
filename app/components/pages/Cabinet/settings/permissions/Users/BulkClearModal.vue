<!-- app/components/pages/cabinet/settings/permissions/Users/BulkClearModal.vue -->
<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="isOpen"
        class="modal-overlay"
        @click.self="$emit('update:isOpen', false)"
        role="dialog"
        aria-modal="true"
        aria-labelledby="bulk-clear-title"
      >
        <div class="modal-content modal-small">
          <!-- ───────── HEADER ───────── -->
          <div class="modal-header">
            <div class="modal-title">
              <div class="icon-circle warning">
                <Icon name="mdi:account-multiple-remove" size="24" />
              </div>
              <div>
                <h2 id="bulk-clear-title">
                  Массовый сброс переопределений
                </h2>
                <p class="subtitle">
                  Будет затронуто <strong>{{ count }}</strong>
                  {{ pluralizeUsers(count) }}
                </p>
              </div>
            </div>
            <button
              class="btn-close"
              @click="$emit('update:isOpen', false)"
              :disabled="clearing"
            >
              <Icon name="mdi:close" size="20" />
            </button>
          </div>

          <!-- ───────── BODY ───────── -->
          <div class="modal-body">
            <!-- Основное предупреждение -->
            <div class="info-block info-block--warning">
              <Icon name="mdi:alert-circle" size="20" />
              <div>
                <p>
                  У <strong>всех {{ count }}</strong> выбранных
                  {{ pluralizeUsers(count) }} будут удалены
                  <strong>все индивидуальные переопределения</strong> прав.
                </p>
                <p class="hint">
                  Каждый пользователь вернётся к базовым правам своей роли
                  для всех разделов системы.
                </p>
              </div>
            </div>

            <!-- Что произойдёт -->
            <div class="info-block info-block--info">
              <Icon name="mdi:information-outline" size="20" />
              <div>
                <p class="info-title">Последствия операции:</p>
                <ul class="impact-list">
                  <li>
                    <Icon name="mdi:check" size="14" class="icon-success" />
                    Удаление всех override'ов для выбранных пользователей
                  </li>
                  <li>
                    <Icon name="mdi:check" size="14" class="icon-success" />
                    Автоматическая инвалидация кэша прав
                  </li>
                  <li>
                    <Icon name="mdi:alert" size="14" class="icon-warning" />
                    Пользователи, потерявшие доступ к критичным разделам
                    (dashboard, objects, works), будут принудительно
                    отключены от системы
                  </li>
                  <li>
                    <Icon name="mdi:history" size="14" class="icon-info" />
                    Операция параллельная — выполняется для всех одновременно
                  </li>
                </ul>
              </div>
            </div>

            <!-- Рекомендация -->
            <div class="info-block info-block--hint">
              <Icon name="mdi:lightbulb-outline" size="20" />
              <p>
                Если нужно сбросить переопределения выборочно —
                обрабатывайте пользователей по одному через кнопку
                «Сбросить все» в карточке пользователя.
              </p>
            </div>

            <!-- Чекбокс подтверждения -->
            <label class="confirm-label">
              <input
                type="checkbox"
                v-model="confirmed"
                :disabled="clearing"
              />
              <span class="checkmark"></span>
              <span>
                Я понимаю, что индивидуальные переопределения
                <strong>{{ count }}</strong> {{ pluralizeUsers(count) }}
                будут полностью удалены без возможности восстановления.
              </span>
            </label>
          </div>

          <!-- ───────── FOOTER ───────── -->
          <div class="modal-footer">
            <button
              class="btn btn-secondary"
              @click="$emit('update:isOpen', false)"
              :disabled="clearing"
            >
              Отмена
            </button>
            <button
              class="btn btn-danger"
              @click="handleConfirm"
              :disabled="clearing || !confirmed"
            >
              <Icon v-if="clearing" name="mdi:loading" size="16" class="spin" />
              <Icon v-else name="mdi:broom" size="16" />
              {{ clearing ? 'Выполняется...' : 'Сбросить у всех' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

// ============================================
// ПРОПСЫ
// ============================================
const props = defineProps<{
  /** Флаг видимости модалки (v-model:isOpen) */
  isOpen: boolean
  /** Количество выбранных пользователей */
  count: number
  /** Флаг процесса массового сброса */
  clearing?: boolean
}>()

// ============================================
// ЭМИТТЫ
// ============================================
const emit = defineEmits<{
  'update:isOpen': [value: boolean]
  'confirm': []
}>()

// ============================================
// ЛОКАЛЬНОЕ СОСТОЯНИЕ
// ============================================
const confirmed = ref(false)

// ============================================
// СБРОС ПРИ ОТКРЫТИИ
// ============================================
watch(
  () => props.isOpen,
  (isOpen) => {
    if (isOpen) {
      confirmed.value = false
    }
  }
)

// ============================================
// ПЛЮРАЛИЗАЦИЯ
// ============================================
function pluralizeUsers(count: number): string {
  const mod10 = count % 10
  const mod100 = count % 100
  if (mod10 === 1 && mod100 !== 11) return 'пользователя'
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return 'пользователей'
  return 'пользователей'
}

// ============================================
// ОБРАБОТЧИКИ
// ============================================
function handleConfirm() {
  if (!confirmed.value || props.clearing) return
  emit('confirm')
}
</script>

<style lang="scss" scoped>
// ── ОВЕРЛЕЙ И КОНТЕЙНЕР ─────────────────────────────────
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.modal-content {
  background: var(--crm-bg-surface);
  border: 1px solid var(--crm-border);
  border-radius: var(--crm-radius-xl);
  width: 100%;
  max-width: 580px;
  display: flex;
  flex-direction: column;
  box-shadow: var(--crm-shadow-lg);

  &.modal-small {
    max-width: 540px;
  }
}

// ── HEADER ──────────────────────────────────────────────
.modal-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid var(--crm-border);
}

.modal-title {
  display: flex;
  align-items: flex-start;
  gap: 0.875rem;
  flex: 1;
  min-width: 0;

  h2 {
    margin: 0;
    font-size: var(--crm-text-lg);
    font-weight: 600;
    color: var(--crm-text-primary);
  }

  .subtitle {
    margin: 0.375rem 0 0;
    font-size: var(--crm-text-sm);
    color: var(--crm-text-secondary);

    strong {
      color: var(--crm-warning);
      font-weight: 600;
    }
  }
}

.btn-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  background: transparent;
  color: var(--crm-text-secondary);
  border: none;
  border-radius: var(--crm-radius-md);
  cursor: pointer;
  transition: all var(--crm-transition);
  flex-shrink: 0;

  &:hover:not(:disabled) {
    background: var(--crm-bg-overlay);
    color: var(--crm-text-primary);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.icon-circle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  flex-shrink: 0;

  &.warning {
    background: var(--crm-warning-dim);
    color: var(--crm-warning);
  }
}

// ── BODY ────────────────────────────────────────────────
.modal-body {
  padding: 1.25rem 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.875rem;
}

.info-block {
  display: flex;
  gap: 0.875rem;
  padding: 1rem;
  border-radius: var(--crm-radius-md);
  border: 1px solid;

  > svg {
    flex-shrink: 0;
    margin-top: 2px;
  }

  p {
    margin: 0;
    font-size: var(--crm-text-sm);
    line-height: 1.5;
    color: var(--crm-text-primary);

    strong {
      font-weight: 600;
    }

    &.hint {
      margin-top: 0.375rem;
      font-size: var(--crm-text-xs);
      color: var(--crm-text-secondary);
    }

    &.info-title {
      font-size: var(--crm-text-xs);
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: var(--crm-text-secondary);
      margin-bottom: 0.5rem;
    }
  }

  &--warning {
    background: var(--crm-warning-dim);
    border-color: rgba(245, 166, 35, 0.3);

    > svg {
      color: var(--crm-warning);
    }
  }

  &--info {
    background: var(--crm-info-dim, rgba(0, 195, 245, 0.1));
    border-color: rgba(0, 195, 245, 0.2);

    > svg {
      color: var(--crm-info);
    }
  }

  &--hint {
    background: var(--crm-bg-elevated);
    border-color: var(--crm-border);

    > svg {
      color: var(--crm-text-muted);
    }

    p {
      font-size: var(--crm-text-xs);
      color: var(--crm-text-secondary);
    }
  }
}

.impact-list {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.375rem;

  li {
    display: flex;
    align-items: flex-start;
    gap: 0.5rem;
    font-size: var(--crm-text-xs);
    color: var(--crm-text-secondary);
    line-height: 1.4;

    svg {
      flex-shrink: 0;
      margin-top: 1px;

      &.icon-success { color: var(--crm-success); }
      &.icon-warning { color: var(--crm-warning); }
      &.icon-info { color: var(--crm-info); }
    }
  }
}

// ── ЧЕКБОКС ПОДТВЕРЖДЕНИЯ ──────────────────────────────
.confirm-label {
  display: flex;
  align-items: flex-start;
  gap: 0.625rem;
  padding: 0.875rem;
  background: var(--crm-bg-elevated);
  border: 1px solid var(--crm-border);
  border-radius: var(--crm-radius-md);
  cursor: pointer;
  user-select: none;
  transition: all var(--crm-transition);
  font-size: var(--crm-text-sm);
  color: var(--crm-text-secondary);
  line-height: 1.5;

  &:hover:not(:has(input:disabled)) {
    border-color: var(--crm-border-hover);
  }

  input {
    position: absolute;
    opacity: 0;
    pointer-events: none;
    width: 0;
    height: 0;

    &:checked ~ .checkmark {
      background: var(--crm-accent);
      border-color: var(--crm-accent);

      &::after {
        opacity: 1;
      }
    }

    &:disabled ~ .checkmark {
      opacity: 0.4;
      cursor: not-allowed;
    }

    &:disabled ~ * {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }

  .checkmark {
    position: relative;
    width: 18px;
    height: 18px;
    border: 1.5px solid var(--crm-border-hover);
    border-radius: 4px;
    transition: all var(--crm-transition);
    flex-shrink: 0;
    margin-top: 2px;

    &::after {
      content: '';
      position: absolute;
      left: 5px;
      top: 2px;
      width: 5px;
      height: 9px;
      border: solid white;
      border-width: 0 2px 2px 0;
      transform: rotate(45deg);
      opacity: 0;
      transition: opacity var(--crm-transition);
    }
  }

  strong {
    color: var(--crm-text-primary);
    font-weight: 600;
  }
}

// ── FOOTER ──────────────────────────────────────────────
.modal-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  border-top: 1px solid var(--crm-border);
  background: var(--crm-bg-elevated);
}

// ── КНОПКИ ──────────────────────────────────────────────
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.375rem;
  padding: 0.5rem 1rem;
  font-size: var(--crm-text-sm);
  font-weight: 500;
  font-family: var(--crm-font-sans);
  border-radius: var(--crm-radius-md);
  cursor: pointer;
  transition: all var(--crm-transition);
  border: 1px solid transparent;
  white-space: nowrap;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.btn-secondary {
  background: var(--crm-bg-overlay);
  color: var(--crm-text-primary);
  border-color: var(--crm-border);

  &:hover:not(:disabled) {
    background: var(--crm-bg-elevated);
    border-color: var(--crm-border-hover);
  }
}

.btn-danger {
  background: var(--crm-danger);
  color: white;

  &:hover:not(:disabled) {
    background: #d63a37;
  }
}

// ── АНИМАЦИИ ────────────────────────────────────────────
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;

  .modal-content {
    transition: transform 0.2s ease;
  }
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;

  .modal-content {
    transform: scale(0.95);
  }
}

.spin {
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

// ── АДАПТИВНОСТЬ ────────────────────────────────────────
@media (max-width: 768px) {
  .modal-header,
  .modal-body,
  .modal-footer {
    padding-left: 1rem;
    padding-right: 1rem;
  }

  .modal-footer {
    flex-direction: column-reverse;

    .btn {
      width: 100%;
    }
  }
}
</style>