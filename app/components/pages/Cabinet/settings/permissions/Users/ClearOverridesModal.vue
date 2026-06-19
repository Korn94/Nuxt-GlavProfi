<!-- app/components/pages/cabinet/settings/permissions/Users/ClearOverridesModal.vue -->
 <template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="isOpen"
        class="modal-overlay"
        @click.self="$emit('update:isOpen', false)"
        role="dialog"
        aria-modal="true"
        aria-labelledby="clear-overrides-title"
      >
        <div class="modal-content modal-small">
          <!-- ───────── HEADER ───────── -->
          <div class="modal-header">
            <div class="modal-title">
              <div class="icon-circle warning">
                <Icon name="mdi:broom" size="24" />
              </div>
              <div>
                <h2 id="clear-overrides-title">
                  Сбросить все переопределения?
                </h2>
                <p v-if="user" class="user-context">
                  Для пользователя:
                  <strong>{{ user.name }}</strong>
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
                  Будут удалены <strong>все {{ overridesCount }}</strong>
                  {{ pluralizeOverrides(overridesCount) }} пользователя.
                </p>
                <p class="hint">
                  Пользователь вернётся к базовым правам своей роли
                  <span class="role-badge" :class="`role-${user?.role}`">
                    {{ roleName }}
                  </span>
                  для всех разделов.
                </p>
              </div>
            </div>

            <!-- Список затронутых разделов -->
            <div v-if="user && user.overrides.length > 0" class="info-block info-block--info">
              <Icon name="mdi:format-list-bulleted" size="20" />
              <div>
                <p class="info-title">Затронутые разделы:</p>
                <ul class="affected-pages-list">
                  <li
                    v-for="override in user.overrides"
                    :key="override.id"
                    class="affected-page"
                  >
                    <Icon :name="getPageIcon(override.pageSlug)" size="14" />
                    <span class="page-name">{{ getPageName(override.pageSlug) }}</span>
                    <div class="page-perms">
                      <span
                        v-for="perm in getOverridePermsSummary(override)"
                        :key="perm.key"
                        :class="['perm-tag', `perm-${perm.value ? 'on' : 'off'}`]"
                      >
                        {{ perm.label }}
                      </span>
                    </div>
                  </li>
                </ul>
              </div>
            </div>

            <!-- Пустое состояние (на всякий случай) -->
            <div v-else class="info-block info-block--info">
              <Icon name="mdi:information-outline" size="20" />
              <p>У пользователя нет активных переопределений.</p>
            </div>
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
              @click="$emit('confirm')"
              :disabled="clearing || overridesCount === 0"
            >
              <Icon v-if="clearing" name="mdi:loading" size="16" class="spin" />
              <Icon v-else name="mdi:broom" size="16" />
              {{ clearing ? 'Сброс...' : 'Сбросить все' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed } from 'vue'

// ============================================
// ТИПЫ
// ============================================
interface UserOverride {
  id: number
  pageSlug: string
  canView: boolean | null
  canCreate: boolean | null
  canEdit: boolean | null
  canDelete: boolean | null
  canSpecial: boolean | null
  reason: string | null
  expiresAt: string | null
}

interface UserWithPermissions {
  id: number
  name: string
  login: string
  role: string
  overrides: UserOverride[]
}

interface SystemPage {
  slug: string
  name: string
  icon: string | null
}

// ============================================
// ПРОПСЫ
// ============================================
const props = defineProps<{
  /** Флаг видимости модалки (v-model:isOpen) */
  isOpen: boolean
  /** Пользователь, у которого сбрасываются переопределения */
  user: UserWithPermissions | null
  /** Список всех страниц (для получения названий и иконок) */
  pages: SystemPage[]
  /** Флаг процесса сброса (блокирует кнопки) */
  clearing?: boolean
}>()

// ============================================
// ЭМИТТЫ
// ============================================
defineEmits<{
  'update:isOpen': [value: boolean]
  'confirm': []
}>()

// ============================================
// СЛОВАРИ
// ============================================
const ROLE_NAMES: Record<string, string> = {
  admin: 'Администратор',
  manager: 'Менеджер',
  foreman: 'Прораб',
  master: 'Мастер',
  worker: 'Рабочий',
}

// ============================================
// COMPUTED
// ============================================

/**
 * Название роли на русском
 */
const roleName = computed(() =>
  ROLE_NAMES[props.user?.role || ''] || props.user?.role || ''
)

/**
 * Количество переопределений
 */
const overridesCount = computed(() => props.user?.overrides.length || 0)

// ============================================
// МЕТОДЫ
// ============================================

/**
 * Получить название страницы по slug
 */
function getPageName(slug: string): string {
  const page = props.pages.find(p => p.slug === slug)
  return page?.name || slug
}

/**
 * Получить иконку страницы по slug
 */
function getPageIcon(slug: string): string {
  const page = props.pages.find(p => p.slug === slug)
  return page?.icon || 'mdi:file-outline'
}

/**
 * Плюрализация слова "переопределение"
 */
function pluralizeOverrides(count: number): string {
  const mod10 = count % 10
  const mod100 = count % 100
  if (mod10 === 1 && mod100 !== 11) return 'переопределение'
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return 'переопределения'
  return 'переопределений'
}

/**
 * Сформировать краткую сводку переопределённых прав для строки списка
 * Новая система: canView, canCreate, canEdit, canDelete, canSpecial
 */
function getOverridePermsSummary(
  override: UserOverride
): Array<{ key: string; label: string; value: boolean | null }> {
  const result: Array<{ key: string; label: string; value: boolean | null }> = []

  if (override.canView !== null) {
    result.push({ key: 'canView', label: '👁', value: override.canView })
  }
  if (override.canCreate !== null) {
    result.push({ key: 'canCreate', label: '➕', value: override.canCreate })
  }
  if (override.canEdit !== null) {
    result.push({ key: 'canEdit', label: '✏', value: override.canEdit })
  }
  if (override.canDelete !== null) {
    result.push({ key: 'canDelete', label: '🗑', value: override.canDelete })
  }
  if (override.canSpecial !== null) {
    result.push({ key: 'canSpecial', label: '⚡', value: override.canSpecial })
  }

  return result
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

  .user-context {
    margin: 0.375rem 0 0;
    font-size: var(--crm-text-sm);
    color: var(--crm-text-secondary);

    strong {
      color: var(--crm-text-primary);
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

  .role-badge {
    display: inline-flex;
    align-items: center;
    padding: 0.0625rem 0.5rem;
    border-radius: 10px;
    font-size: var(--crm-text-xs);
    font-weight: 500;

    &.role-admin { background: var(--crm-danger-dim); color: var(--crm-danger); }
    &.role-manager { background: var(--crm-warning-dim); color: var(--crm-warning); }
    &.role-foreman { background: var(--crm-success-dim); color: var(--crm-success); }
    &.role-master { background: var(--crm-accent-dim); color: var(--crm-accent); }
    &.role-worker { background: var(--crm-bg-overlay); color: var(--crm-text-secondary); }
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
}

// ── СПИСОК ЗАТРОНУТЫХ РАЗДЕЛОВ ──────────────────────────
.affected-pages-list {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.affected-page {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.375rem 0.5rem;
  background: var(--crm-bg-surface);
  border-radius: var(--crm-radius-sm);
  font-size: var(--crm-text-xs);
  flex-wrap: wrap;

  > svg {
    color: var(--crm-accent);
    flex-shrink: 0;
  }

  .page-name {
    color: var(--crm-text-primary);
    font-weight: 500;
    margin-right: auto;
  }

  .page-perms {
    display: flex;
    gap: 0.25rem;
    flex-wrap: wrap;
  }
}

.perm-tag {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  height: 18px;
  padding: 0 0.25rem;
  font-size: 0.625rem;
  border-radius: 3px;
  white-space: nowrap;

  &.perm-on {
    background: var(--crm-success-dim);
    color: var(--crm-success);
  }

  &.perm-off {
    background: var(--crm-danger-dim);
    color: var(--crm-danger);
    text-decoration: line-through;
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