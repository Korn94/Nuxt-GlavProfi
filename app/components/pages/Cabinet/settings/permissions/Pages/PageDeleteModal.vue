<!-- app/components/pages/cabinet/settings/permissions/Pages/PageDeleteModal.vue -->
 <template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="isOpen"
        class="modal-overlay"
        @click.self="$emit('update:isOpen', false)"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="`delete-modal-title-${page?.slug}`"
      >
        <div class="modal-content modal-small">
          <!-- ───────── HEADER ───────── -->
          <div class="modal-header">
            <div class="modal-title">
              <div :class="['icon-circle', hard ? 'danger' : 'warning']">
                <Icon :name="hard ? 'mdi:delete-forever' : 'mdi:eye-off'" size="24" />
              </div>
              <div>
                <h2 :id="`delete-modal-title-${page?.slug}`">
                  {{ hard ? 'Удалить раздел навсегда?' : 'Скрыть раздел?' }}
                </h2>
                <p v-if="page" class="page-name">
                  <Icon :name="page.icon || 'mdi:file-outline'" size="14" />
                  {{ page.name }}
                  <code>{{ page.slug }}</code>
                </p>
              </div>
            </div>
            <button
              class="btn-close"
              @click="$emit('update:isOpen', false)"
              :disabled="deleting"
            >
              <Icon name="mdi:close" size="20" />
            </button>
          </div>

          <!-- ───────── BODY ───────── -->
          <div class="modal-body">
            <!-- Мягкое удаление -->
            <div v-if="!hard" class="info-block info-block--warning">
              <Icon name="mdi:information-outline" size="20" />
              <div>
                <p>
                  Раздел будет <strong>скрыт из UI</strong>.
                  Все права ролей и переопределения пользователей <strong>сохранятся</strong> в базе данных.
                </p>
                <p class="hint">
                  Вы сможете восстановить раздел в любой момент, нажав кнопку «Показать».
                </p>
              </div>
            </div>

            <!-- Жёсткое удаление -->
            <div v-else class="info-block info-block--danger">
              <Icon name="mdi:alert" size="20" />
              <div>
                <p>
                  Раздел будет <strong>удалён полностью</strong> вместе со всеми связанными данными.
                </p>
                <ul class="impact-list">
                  <li>
                    <Icon name="mdi:account-group" size="14" />
                    Права ролей для этого раздела
                  </li>
                  <li>
                    <Icon name="mdi:account-cog" size="14" />
                    Переопределения пользователей
                  </li>
                </ul>
                <p class="hint danger-text">
                  ⚠️ Это действие <strong>необратимо</strong>. Для временного скрытия используйте кнопку «Скрыть».
                </p>
              </div>
            </div>
          </div>

          <!-- ───────── FOOTER ───────── -->
          <div class="modal-footer">
            <button
              class="btn btn-secondary"
              @click="$emit('update:isOpen', false)"
              :disabled="deleting"
            >
              Отмена
            </button>
            <button
              :class="['btn', hard ? 'btn-danger' : 'btn-warning']"
              @click="$emit('confirm', hard)"
              :disabled="deleting"
            >
              <Icon v-if="deleting" name="mdi:loading" size="16" class="spin" />
              <Icon v-else :name="hard ? 'mdi:delete-forever' : 'mdi:eye-off'" size="16" />
              {{ deleting ? 'Удаление...' : (hard ? 'Удалить навсегда' : 'Скрыть раздел') }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import type { SystemPage } from '~/composables/usePermissionsApi'

// ============================================
// ПРОПСЫ
// ============================================
defineProps<{
  /** Флаг видимости модалки (v-model:isOpen) */
  isOpen: boolean
  /** Данные страницы для удаления */
  page: SystemPage | null
  /** Режим удаления: true = полное удаление, false = скрытие */
  hard: boolean
  /** Флаг процесса удаления (блокирует кнопки) */
  deleting?: boolean
}>()

// ============================================
// ЭМИТТЫ
// ============================================
defineEmits<{
  'update:isOpen': [value: boolean]
  'confirm': [hard: boolean]
}>()
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
  max-width: 520px;
  display: flex;
  flex-direction: column;
  box-shadow: var(--crm-shadow-lg);

  &.modal-small {
    max-width: 480px;
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

  .page-name {
    margin: 0.375rem 0 0;
    display: flex;
    align-items: center;
    gap: 0.375rem;
    font-size: var(--crm-text-sm);
    color: var(--crm-text-secondary);

    code {
      font-family: var(--crm-font-mono);
      background: var(--crm-bg-overlay);
      padding: 0.125rem 0.375rem;
      border-radius: var(--crm-radius-sm);
      font-size: var(--crm-text-xs);
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

  &.danger {
    background: var(--crm-danger-dim);
    color: var(--crm-danger);
  }

  &.warning {
    background: var(--crm-warning-dim);
    color: var(--crm-warning);
  }
}

// ── BODY ────────────────────────────────────────────────
.modal-body {
  padding: 1.25rem 1.5rem;
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
      margin-top: 0.5rem;
      font-size: var(--crm-text-xs);
      color: var(--crm-text-secondary);
    }

    &.danger-text {
      color: var(--crm-danger);
    }
  }

  &--warning {
    background: var(--crm-warning-dim);
    border-color: rgba(245, 166, 35, 0.3);

    > svg {
      color: var(--crm-warning);
    }
  }

  &--danger {
    background: var(--crm-danger-dim);
    border-color: rgba(242, 95, 92, 0.3);

    > svg {
      color: var(--crm-danger);
    }
  }
}

.impact-list {
  margin: 0.625rem 0 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.375rem;

  li {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: var(--crm-text-xs);
    color: var(--crm-text-secondary);

    svg {
      color: var(--crm-danger);
      flex-shrink: 0;
    }
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

.btn-warning {
  background: var(--crm-warning);
  color: white;

  &:hover:not(:disabled) {
    background: #e09500;
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