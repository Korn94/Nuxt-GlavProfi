<!-- app/components/pages/cabinet/settings/permissions/Roles/RoleCopyModal.vue -->
<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="isOpen"
        class="modal-overlay"
        @click.self="$emit('update:isOpen', false)"
        role="dialog"
        aria-modal="true"
        aria-labelledby="role-copy-title"
      >
        <div class="modal-content modal-small">
          <!-- ───────── HEADER ───────── -->
          <div class="modal-header">
            <div class="modal-title">
              <div class="icon-circle primary">
                <Icon name="mdi:content-copy" size="24" />
              </div>
              <div>
                <h2 id="role-copy-title">Копирование прав</h2>
                <p v-if="targetRole" class="target-context">
                  Целевая роль:
                  <span class="role-badge" :style="{ background: targetRoleColor }">
                    <Icon :name="targetRoleIcon" size="14" />
                    {{ targetRoleName }}
                  </span>
                </p>
              </div>
            </div>
            <button
              class="btn-close"
              @click="$emit('update:isOpen', false)"
              :disabled="copying"
            >
              <Icon name="mdi:close" size="20" />
            </button>
          </div>

          <!-- ───────── BODY ───────── -->
          <div class="modal-body">
            <!-- Предупреждение -->
            <div class="info-block info-block--warning">
              <Icon name="mdi:alert" size="20" />
              <div>
                <p>
                  Все текущие права роли <strong>«{{ targetRoleName }}»</strong> будут
                  <strong>полностью заменены</strong> правами выбранной роли.
                </p>
                <p class="hint">
                  Это действие нельзя отменить. Пользователи целевой роли будут
                  принудительно отключены от системы.
                </p>
              </div>
            </div>

            <!-- Выбор исходной роли -->
            <div class="form-group">
              <label class="form-label">
                Скопировать права из роли
                <span class="required">*</span>
              </label>
              <div class="roles-grid">
                <button
                  v-for="role in availableSourceRoles"
                  :key="role.role"
                  :class="['role-option', { selected: selectedSourceRole === role.role }]"
                  @click="selectedSourceRole = role.role"
                  :disabled="copying"
                >
                  <div class="role-option-badge" :style="{ background: role.color }">
                    <Icon :name="getRoleIcon(role.role)" size="16" />
                  </div>
                  <div class="role-option-info">
                    <span class="role-option-name">{{ role.label }}</span>
                    <span class="role-option-meta">
                      <Icon name="mdi:account" size="12" />
                      {{ role.userCount }} {{ pluralizeUsers(role.userCount) }}
                      · {{ countVisible(role) }} разделов
                    </span>
                  </div>
                  <Icon
                    v-if="selectedSourceRole === role.role"
                    name="mdi:check-circle"
                    size="20"
                    class="role-option-check"
                  />
                </button>
              </div>
            </div>

            <!-- Превью: что будет скопировано (новая модель без canView) -->
            <div v-if="selectedSourceRole && sourceRoleData" class="info-block info-block--info">
              <Icon name="mdi:eye-outline" size="20" />
              <div>
                <p class="info-title">Будет скопировано:</p>
                <div class="copy-preview">
                  <div class="preview-stat">
                    <Icon name="mdi:eye" size="14" />
                    <span>{{ countVisible(sourceRoleData) }} видимых разделов</span>
                  </div>
                  <div class="preview-stat">
                    <Icon name="mdi:eye-outline" size="14" />
                    <span>{{ countReadOnly(sourceRoleData) }} только просмотр</span>
                  </div>
                  <div class="preview-stat">
                    <Icon name="mdi:plus-circle" size="14" />
                    <span>{{ countAction(sourceRoleData, 'canCreate') }} с созданием</span>
                  </div>
                  <div class="preview-stat">
                    <Icon name="mdi:pencil" size="14" />
                    <span>{{ countAction(sourceRoleData, 'canEdit') }} с редактированием</span>
                  </div>
                  <div class="preview-stat">
                    <Icon name="mdi:delete" size="14" />
                    <span>{{ countAction(sourceRoleData, 'canDelete') }} с удалением</span>
                  </div>
                  <div class="preview-stat preview-stat--special">
                    <Icon name="mdi:lightning-bolt" size="14" />
                    <span>{{ countAction(sourceRoleData, 'canSpecial') }} со спец. операциями</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Подтверждение -->
            <label class="confirm-label">
              <input
                type="checkbox"
                v-model="confirmed"
                :disabled="copying"
              />
              <span class="checkmark"></span>
              <span>
                Я понимаю, что текущие права роли
                <strong>«{{ targetRoleName }}»</strong> будут полностью заменены,
                а {{ targetRole?.userCount || 0 }}
                {{ pluralizeUsers(targetRole?.userCount || 0) }} будут отключены от системы.
              </span>
            </label>
          </div>

          <!-- ───────── FOOTER ───────── -->
          <div class="modal-footer">
            <button
              class="btn btn-secondary"
              @click="$emit('update:isOpen', false)"
              :disabled="copying"
            >
              Отмена
            </button>
            <button
              class="btn btn-primary"
              @click="handleCopy"
              :disabled="copying || !isFormValid"
            >
              <Icon v-if="copying" name="mdi:loading" size="16" class="spin" />
              <Icon v-else name="mdi:content-copy" size="16" />
              {{ copying ? 'Копирование...' : 'Скопировать права' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'

// ============================================
// ТИПЫ (новая модель без canView)
// ============================================

interface PagePermissions {
  canView: boolean
  canCreate: boolean
  canEdit: boolean
  canDelete: boolean
  canSpecial: boolean
}

interface RoleWithPermissions {
  role: string
  label: string
  color: string
  level: number
  userCount: number
  permissions: Record<string, PagePermissions>
}

// ============================================
// ПРОПСЫ
// ============================================

const props = defineProps<{
  /** Флаг видимости модалки (v-model:isOpen) */
  isOpen: boolean
  /** Целевая роль (в которую копируем) */
  targetRole: RoleWithPermissions | null
  /** Все роли системы (для выбора источника) */
  allRoles: RoleWithPermissions[]
  /** Флаг процесса копирования */
  copying?: boolean
}>()

// ============================================
// ЭМИТТЫ
// ============================================

const emit = defineEmits<{
  'update:isOpen': [value: boolean]
  'copy': [data: { from: string; to: string }]
}>()

// ============================================
// СЛОВАРИ
// ============================================

const ROLE_ICONS: Record<string, string> = {
  admin: 'mdi:shield-crown',
  manager: 'mdi:briefcase',
  foreman: 'mdi:hard-hat',
  master: 'mdi:wrench',
  worker: 'mdi:account-hard-hat',
}

// ============================================
// ЛОКАЛЬНОЕ СОСТОЯНИЕ
// ============================================

const selectedSourceRole = ref<string>('')
const confirmed = ref(false)

// ============================================
// COMPUTED
// ============================================

const targetRoleName = computed(() => props.targetRole?.label || '')
const targetRoleColor = computed(() =>
  props.targetRole?.color || 'linear-gradient(135deg, #6c757d 0%, #495057 100%)'
)
const targetRoleIcon = computed(() =>
  ROLE_ICONS[props.targetRole?.role || ''] || 'mdi:account'
)

/**
 * Доступные роли-источники (все, кроме целевой)
 */
const availableSourceRoles = computed(() =>
  props.allRoles.filter(r => r.role !== props.targetRole?.role)
)

/**
 * Данные выбранной роли-источника
 */
const sourceRoleData = computed(() =>
  props.allRoles.find(r => r.role === selectedSourceRole.value) || null
)

/**
 * Валидация формы
 */
const isFormValid = computed(() =>
  !!selectedSourceRole.value && confirmed.value
)

// ============================================
// СБРОС ПРИ ОТКРЫТИИ
// ============================================

watch(
  () => props.isOpen,
  (isOpen) => {
    if (isOpen) {
      selectedSourceRole.value = ''
      confirmed.value = false
    }
  }
)

// ============================================
// ХЕЛПЕРЫ
// ============================================

function getRoleIcon(role: string): string {
  return ROLE_ICONS[role] || 'mdi:account'
}

/**
 * Подсчёт видимых разделов
 *
 * Раздел виден в меню если:
 * canView || canCreate || canEdit || canDelete || canSpecial
 */
function countVisible(role: RoleWithPermissions): number {
  return Object.values(role.permissions).filter(p =>
    p.canView || p.canCreate || p.canEdit || p.canDelete || p.canSpecial
  ).length
}

function countAction(
  role: RoleWithPermissions,
  action: keyof PagePermissions
): number {
  return Object.values(role.permissions).filter(p => p[action]).length
}

function countReadOnly(role: RoleWithPermissions): number {
  return Object.values(role.permissions).filter(p =>
    p.canView && !p.canCreate && !p.canEdit && !p.canDelete && !p.canSpecial
  ).length
}

function pluralizeUsers(count: number): string {
  const mod10 = count % 10
  const mod100 = count % 100
  if (mod10 === 1 && mod100 !== 11) return 'пользователь'
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return 'пользователя'
  return 'пользователей'
}

// ============================================
// ОБРАБОТЧИКИ
// ============================================

function handleCopy() {
  if (!isFormValid.value || props.copying || !props.targetRole) return
  emit('copy', {
    from: selectedSourceRole.value,
    to: props.targetRole.role
  })
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

  .target-context {
    margin: 0.375rem 0 0;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: var(--crm-text-sm);
    color: var(--crm-text-secondary);
    flex-wrap: wrap;
  }
}

.role-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.125rem 0.5rem;
  border-radius: 10px;
  font-size: var(--crm-text-xs);
  font-weight: 600;
  color: white;
  white-space: nowrap;
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

  &.primary {
    background: var(--crm-accent-dim);
    color: var(--crm-accent);
  }
}

// ── BODY ────────────────────────────────────────────────
.modal-body {
  padding: 1.25rem 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
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
}

// ── ФОРМА ───────────────────────────────────────────────
.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-label {
  font-size: var(--crm-text-sm);
  font-weight: 500;
  color: var(--crm-text-primary);

  .required {
    color: var(--crm-danger);
  }
}

// ── СЕТКА ВЫБОРА РОЛЕЙ ─────────────────────────────────
.roles-grid {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.role-option {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background: var(--crm-bg-elevated);
  border: 1px solid var(--crm-border);
  border-radius: var(--crm-radius-md);
  cursor: pointer;
  transition: all var(--crm-transition);
  text-align: left;
  font-family: var(--crm-font-sans);
  width: 100%;
  color: var(--crm-text-primary);

  &:hover:not(:disabled) {
    border-color: var(--crm-border-hover);
    background: var(--crm-bg-overlay);
  }

  &.selected {
    border-color: var(--crm-accent);
    background: var(--crm-accent-dim);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.role-option-badge {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  color: white;
  border-radius: var(--crm-radius-sm);
  flex-shrink: 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.role-option-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.role-option-name {
  font-size: var(--crm-text-sm);
  font-weight: 600;
  color: var(--crm-text-primary);
}

.role-option-meta {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: var(--crm-text-xs);
  color: var(--crm-text-muted);

  svg {
    flex-shrink: 0;
  }
}

.role-option-check {
  color: var(--crm-accent);
  flex-shrink: 0;
}

// ── ПРЕВЬЮ КОПИРОВАНИЯ ─────────────────────────────────
.copy-preview {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.preview-stat {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: var(--crm-text-xs);
  color: var(--crm-text-secondary);

  svg {
    color: var(--crm-text-muted);
    flex-shrink: 0;
  }

  &--special svg {
    color: #9c27b0;
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

.btn-primary {
  background: var(--crm-accent);
  color: white;

  &:hover:not(:disabled) {
    background: var(--crm-accent-hover);
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