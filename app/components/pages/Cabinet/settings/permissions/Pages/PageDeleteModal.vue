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
            <!-- 🆕 AUDIT ИНФОРМАЦИЯ -->
            <div v-if="page" class="audit-block">
              <Icon name="mdi:history" size="14" />
              <span class="audit-text">
                Создано {{ formatDate(page.createdAt) }}
                <template v-if="page.updatedAt && page.updatedAt !== page.createdAt">
                  · Обновлено {{ formatDate(page.updatedAt) }}
                </template>
              </span>
            </div>

            <!-- Статистика затронутых записей -->
            <div v-if="page && (affectedStats.roles > 0 || affectedStats.users > 0)" class="info-block info-block--neutral">
              <Icon name="mdi:chart-box-outline" size="20" />
              <div>
                <p class="info-title">Связанные данные в системе:</p>
                <div class="stats-grid">
                  <div v-if="affectedStats.roles > 0" class="stat-item">
                    <span class="stat-value">{{ affectedStats.roles }}</span>
                    <span class="stat-label">{{ pluralizeRoles(affectedStats.roles) }}</span>
                  </div>
                  <div v-if="affectedStats.users > 0" class="stat-item">
                    <span class="stat-value">{{ affectedStats.users }}</span>
                    <span class="stat-label">{{ pluralizeUsers(affectedStats.users) }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Мягкое удаление (скрытие) -->
            <div v-if="!hard" class="info-block info-block--warning">
              <Icon name="mdi:information-outline" size="20" />
              <div>
                <p>
                  Раздел будет <strong>скрыт из UI</strong> для всех пользователей.
                </p>
                <ul class="impact-list">
                  <li>
                    <Icon name="mdi:check" size="14" class="icon-success" />
                    Все права ролей <strong>сохранятся</strong> в базе данных
                  </li>
                  <li>
                    <Icon name="mdi:check" size="14" class="icon-success" />
                    Индивидуальные переопределения <strong>сохранятся</strong>
                  </li>
                  <li>
                    <Icon name="mdi:check" size="14" class="icon-success" />
                    Можно восстановить в любой момент кнопкой «Показать»
                  </li>
                </ul>
              </div>
            </div>

            <!-- Жёсткое удаление (полное) -->
            <div v-else class="info-block info-block--danger">
              <Icon name="mdi:alert-octagon" size="20" />
              <div>
                <p>
                  Раздел будет <strong>удалён полностью</strong> вместе со всеми связанными данными.
                </p>
                <ul class="impact-list">
                  <li>
                    <Icon name="mdi:delete" size="14" class="icon-danger" />
                    Права ролей для этого раздела ({{ affectedStats.roles }} {{ pluralizeRoles(affectedStats.roles) }})
                  </li>
                  <li>
                    <Icon name="mdi:delete" size="14" class="icon-danger" />
                    Переопределения пользователей ({{ affectedStats.users }} {{ pluralizeUsers(affectedStats.users) }})
                  </li>
                  <li>
                    <Icon name="mdi:alert" size="14" class="icon-warning" />
                    Пользователи потеряют доступ к функционалу раздела
                  </li>
                </ul>
                <p class="hint danger-text">
                  ⚠️ Это действие <strong>необратимо</strong>. Для временного скрытия используйте кнопку «Скрыть».
                </p>
              </div>
            </div>

            <!-- Предупреждение о защищённых страницах -->
            <div v-if="isProtectedPage" class="info-block info-block--danger">
              <Icon name="mdi:shield-lock" size="20" />
              <div>
                <p>
                  <strong>Системная страница!</strong>
                  Раздел <code>{{ page?.slug }}</code> является критическим для работы системы.
                  Удаление может нарушить работу приложения.
                </p>
              </div>
            </div>

            <!-- Чекбокс подтверждения для жёсткого удаления -->
            <label v-if="hard && !isProtectedPage" class="confirm-label">
              <input
                type="checkbox"
                v-model="confirmed"
                :disabled="deleting"
              />
              <span class="checkmark"></span>
              <span>
                Я понимаю, что раздел <strong>«{{ page?.name }}»</strong> будет удалён
                навсегда вместе со всеми связанными правами и переопределениями.
              </span>
            </label>
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
              :disabled="deleting || (hard && !confirmed) || isProtectedPage"
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
import { ref, computed, watch } from 'vue'
import type { SystemPage } from '~/composables/usePermissionsApi'

// ============================================
// ПРОПСЫ
// ============================================
const props = defineProps<{
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

// ============================================
// КОНСТАНТЫ
// ============================================
const PROTECTED_PAGES = ['dashboard', 'settings', 'users']

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
// COMPUTED
// ============================================
const isProtectedPage = computed(() =>
  props.page ? PROTECTED_PAGES.includes(props.page.slug) : false
)

/**
 * Примерная статистика затронутых записей.
 * В реальности сервер возвращает точные числа, но для UI
 * мы можем оценить по количеству ролей (5) и пользователей с override'ами.
 *
 * TODO: В идеале — передавать эти данные через props с сервера
 * при открытии модалки через отдельный API-запрос.
 */
const affectedStats = computed(() => {
  if (!props.page) return { roles: 0, users: 0 }
  // Примерная оценка: все 5 ролей имеют какие-то права
  // Точное количество пользователей с override'ами неизвестно без запроса
  return {
    roles: 5, // все роли могут иметь права на эту страницу
    users: 0, // TODO: получать через API
  }
})

// ============================================
// МЕТОДЫ
// ============================================
function formatDate(dateStr?: string): string {
  if (!dateStr) return '—'
  const date = new Date(dateStr)
  return date.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

function pluralizeRoles(count: number): string {
  const mod10 = count % 10
  const mod100 = count % 100
  if (mod10 === 1 && mod100 !== 11) return 'роли'
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return 'ролей'
  return 'ролей'
}

function pluralizeUsers(count: number): string {
  const mod10 = count % 10
  const mod100 = count % 100
  if (mod10 === 1 && mod100 !== 11) return 'пользователя'
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return 'пользователей'
  return 'пользователей'
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
  max-width: 560px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: var(--crm-shadow-lg);

  &.modal-small {
    max-width: 520px;
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
  flex-shrink: 0;
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
    flex-wrap: wrap;

    svg {
      color: var(--crm-accent);
      flex-shrink: 0;
    }

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
  flex: 1;
  overflow-y: auto;
  padding: 1.25rem 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.875rem;
}

// ── AUDIT БЛОК ──────────────────────────────────────────
.audit-block {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: var(--crm-bg-elevated);
  border: 1px dashed var(--crm-border);
  border-radius: var(--crm-radius-sm);

  svg {
    color: var(--crm-text-muted);
    flex-shrink: 0;
  }

  .audit-text {
    font-size: var(--crm-text-xs);
    color: var(--crm-text-muted);
  }
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
      margin-top: 0.75rem;
    }

    &.info-title {
      font-size: var(--crm-text-xs);
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: var(--crm-text-secondary);
      margin-bottom: 0.5rem;
    }

    code {
      font-family: var(--crm-font-mono);
      background: var(--crm-bg-overlay);
      padding: 0.0625rem 0.25rem;
      border-radius: var(--crm-radius-sm);
      font-size: 0.9em;
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

  &--neutral {
    background: var(--crm-bg-elevated);
    border-color: var(--crm-border);

    > svg {
      color: var(--crm-text-muted);
    }
  }
}

// ── СТАТИСТИКА ──────────────────────────────────────────
.stats-grid {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0.5rem 0.75rem;
  background: var(--crm-bg-surface);
  border: 1px solid var(--crm-border);
  border-radius: var(--crm-radius-sm);
  min-width: 80px;

  .stat-value {
    font-size: var(--crm-text-lg);
    font-weight: 600;
    color: var(--crm-text-primary);
  }

  .stat-label {
    font-size: var(--crm-text-xs);
    color: var(--crm-text-muted);
  }
}

// ── СПИСОК ПОСЛЕДСТВИЙ ──────────────────────────────────
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
      flex-shrink: 0;

      &.icon-success { color: var(--crm-success); }
      &.icon-danger { color: var(--crm-danger); }
      &.icon-warning { color: var(--crm-warning); }
    }

    strong {
      color: var(--crm-text-primary);
      font-weight: 600;
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
      background: var(--crm-danger);
      border-color: var(--crm-danger);

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
  flex-shrink: 0;
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

  .stats-grid {
    flex-direction: column;
  }
}
</style>