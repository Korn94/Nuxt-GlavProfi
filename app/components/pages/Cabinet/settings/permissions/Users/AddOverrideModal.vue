<!-- app/components/pages/cabinet/settings/permissions/Users/AddOverrideModal.vue -->
<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="isOpen"
        class="modal-overlay"
        @click.self="$emit('update:isOpen', false)"
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-override-modal-title"
      >
        <div class="modal-content">
          <!-- ───────── HEADER ───────── -->
          <div class="modal-header">
            <div class="modal-title">
              <div class="icon-circle primary">
                <Icon name="mdi:pencil-plus" size="24" />
              </div>
              <div>
                <h2 id="add-override-modal-title">Добавить переопределение</h2>
                <p v-if="user">
                  Для пользователя: <strong>{{ user.name }}</strong>
                  <span class="user-role-badge" :class="`role-${user.role}`">
                    {{ roleName }}
                  </span>
                </p>
              </div>
            </div>
            <button
              class="btn-close"
              @click="$emit('update:isOpen', false)"
              :disabled="saving"
            >
              <Icon name="mdi:close" size="20" />
            </button>
          </div>

          <!-- ───────── BODY ───────── -->
          <div class="modal-body">
            <!-- Информация -->
            <div class="info-block info-block--info">
              <Icon name="mdi:information-outline" size="18" />
              <span>
                Переопределение позволяет дать пользователю права, отличные от базовых прав его роли.
                Раздел автоматически появится в меню, если включено хотя бы одно действие.
              </span>
            </div>

            <!-- Выбор страницы -->
            <div class="form-group">
              <label class="form-label">
                Раздел системы
                <span class="required">*</span>
              </label>
              <div class="pages-select">
                <button
                  v-for="page in availablePages"
                  :key="page.slug"
                  :class="['page-option', {
                    selected: localForm.pageSlug === page.slug,
                    'page-option--has-override': hasExistingOverride(page.slug)
                  }]"
                  @click="selectPage(page.slug)"
                  :disabled="saving"
                >
                  <Icon :name="page.icon || 'mdi:file-outline'" size="16" />
                  <span class="page-option-name">{{ page.name }}</span>
                  <Icon
                    v-if="hasExistingOverride(page.slug)"
                    name="mdi:pencil-circle"
                    size="14"
                    class="override-indicator"
                    title="Уже есть переопределение"
                  />
                </button>
              </div>
              <p v-if="hasExistingOverride(localForm.pageSlug)" class="form-hint form-hint--warning">
                <Icon name="mdi:alert" size="12" />
                Для этого раздела уже есть переопределение — оно будет обновлено
              </p>
            </div>

            <!-- Права для выбранной страницы -->
            <div v-if="selectedPage" class="form-group">
              <label class="form-label">
                Переопределяемые права
                <span class="required">*</span>
              </label>

              <!-- Контекст: базовые права роли -->
              <div class="base-permissions-info">
                <Icon name="mdi:information-outline" size="14" />
                <span>
                  Базовые права роли <strong>«{{ roleName }}»</strong>:
                </span>
                <div class="base-perms-tags">
                  <span
                    v-for="perm in basePermissionsList"
                    :key="perm.key"
                    :class="['base-perm-tag', { active: perm.value }]"
                  >
                    {{ perm.label }}
                  </span>
                  <span v-if="basePermissionsList.length === 0" class="base-perm-tag empty">
                    нет прав
                  </span>
                </div>
              </div>

              <PagesCabinetSettingsPermissionsSharedPermCheckboxes
                :model-value="permissionsValue"
                :page="selectedPage"
                :disabled="saving"
                @update:model-value="handlePermissionsUpdate"
              />

              <p v-if="!hasAnyAction" class="form-hint form-hint--info">
                <Icon name="mdi:information-outline" size="14" />
                Включите хотя бы одно действие, чтобы раздел появился в меню пользователя
              </p>
            </div>

            <!-- Причина переопределения -->
            <div class="form-group">
              <label class="form-label">Причина (необязательно)</label>
              <textarea
                v-model="localForm.reason"
                placeholder="Например: Временный доступ на время ремонта"
                rows="2"
                :disabled="saving"
                maxlength="500"
              ></textarea>
              <div class="form-hint-row">
                <p class="form-hint">
                  <Icon name="mdi:information-outline" size="12" />
                  Будет видна администраторам в списке переопределений
                </p>
                <span v-if="localForm.reason" class="char-counter">
                  {{ localForm.reason.length }}/500
                </span>
              </div>
            </div>

            <!-- Срок действия -->
            <div class="form-group">
              <label class="form-label">Срок действия (необязательно)</label>
              <div class="expires-input-wrapper">
                <input
                  type="datetime-local"
                  v-model="localForm.expiresAt"
                  :min="minExpiresAt"
                  :disabled="saving"
                />
                <button
                  v-if="localForm.expiresAt"
                  class="clear-expires-btn"
                  @click="localForm.expiresAt = ''"
                  :disabled="saving"
                  title="Сделать бессрочным"
                >
                  <Icon name="mdi:close-circle" size="18" />
                </button>
              </div>
              <div class="expires-presets">
                <button
                  v-for="preset in expiresPresets"
                  :key="preset.label"
                  class="preset-btn"
                  :class="{ active: isPresetActive(preset.hours) }"
                  @click="setExpiresPreset(preset.hours)"
                  :disabled="saving"
                >
                  {{ preset.label }}
                </button>
              </div>
              <p class="form-hint">
                <Icon name="mdi:information-outline" size="12" />
                {{ localForm.expiresAt ? `Истекает: ${formatExpiresPreview(localForm.expiresAt)}` : 'Бессрочное переопределение' }}
              </p>
            </div>

            <!-- Предупреждение о критичных изменениях -->
            <div v-if="isCriticalChange" class="info-block info-block--danger">
              <Icon name="mdi:alert-octagon" size="20" />
              <div>
                <p>
                  <strong>Внимание!</strong> Вы отключаете доступ к критическому разделу.
                  Пользователь будет принудительно отключён от системы.
                </p>
              </div>
            </div>
          </div>

          <!-- ───────── FOOTER ───────── -->
          <div class="modal-footer">
            <button
              class="btn btn-secondary"
              @click="$emit('update:isOpen', false)"
              :disabled="saving"
            >
              Отмена
            </button>
            <button
              class="btn btn-primary"
              @click="handleSave"
              :disabled="saving || !isFormValid"
            >
              <Icon v-if="saving" name="mdi:loading" size="16" class="spin" />
              <Icon v-else name="mdi:content-save" size="16" />
              {{ saving ? 'Сохранение...' : 'Сохранить' }}
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
  createdAt: string
  createdBy: number | null
}

interface UserWithPermissions {
  id: number
  name: string
  login: string
  role: string
  contractorType: string | null
  contractorId: number | null
  createdAt: string
  basePermissions: Record<string, PagePermissions>
  overrides: UserOverride[]
  effectivePermissions: Record<string, PagePermissions>
}

interface SystemPage {
  slug: string
  name: string
  icon: string | null
  hasCreate: boolean
  hasEdit: boolean
  hasDelete: boolean
  hasSpecial: boolean
}

interface PagePermissions {
  canView: boolean
  canCreate: boolean
  canEdit: boolean
  canDelete: boolean
  canSpecial: boolean
}

interface OverrideFormData {
  pageSlug: string
  canView: boolean
  canCreate: boolean
  canEdit: boolean
  canDelete: boolean
  canSpecial: boolean
  reason: string
  expiresAt: string
}

// ============================================
// ПРОПСЫ
// ============================================

const props = defineProps<{
  isOpen: boolean
  user: UserWithPermissions | null
  pages: SystemPage[]
  saving?: boolean
}>()

// ============================================
// ЭМИТТЫ
// ============================================

const emit = defineEmits<{
  'update:isOpen': [value: boolean]
  'save': [data: OverrideFormData]
}>()

// ============================================
// СЛОВАРЬ РОЛЕЙ
// ============================================

const ROLE_NAMES: Record<string, string> = {
  admin: 'Администратор',
  manager: 'Менеджер',
  foreman: 'Прораб',
  master: 'Мастер',
  worker: 'Рабочий',
}

// ============================================
// ПРЕСЕТЫ СРОКОВ ДЕЙСТВИЯ
// ============================================

const expiresPresets = [
  { label: '1 час', hours: 1 },
  { label: '24 часа', hours: 24 },
  { label: '7 дней', hours: 24 * 7 },
  { label: '30 дней', hours: 24 * 30 },
]

// ============================================
// ЛОКАЛЬНОЕ СОСТОЯНИЕ ФОРМЫ
// ============================================

const localForm = ref<OverrideFormData>({
  pageSlug: '',
  canView: false,
  canCreate: false,
  canEdit: false,
  canDelete: false,
  canSpecial: false,
  reason: '',
  expiresAt: '',
})

// ============================================
// COMPUTED
// ============================================

const roleName = computed(() =>
  ROLE_NAMES[props.user?.role || ''] || props.user?.role || ''
)

const selectedPage = computed(() =>
  props.pages.find(p => p.slug === localForm.value.pageSlug) || null
)

const availablePages = computed(() => props.pages)

const permissionsValue = computed<PagePermissions>(() => ({
  canView: localForm.value.canView,
  canCreate: localForm.value.canCreate,
  canEdit: localForm.value.canEdit,
  canDelete: localForm.value.canDelete,
  canSpecial: localForm.value.canSpecial,
}))

/**
 * Есть ли хотя бы одно действие включено
 */
const hasAnyAction = computed(() => {
  return (
    localForm.value.canView ||
    localForm.value.canCreate ||
    localForm.value.canEdit ||
    localForm.value.canDelete ||
    localForm.value.canSpecial
  )
})

/**
 * Список базовых прав роли для выбранной страницы (для контекста)
 */
const basePermissionsList = computed(() => {
  if (!props.user || !localForm.value.pageSlug) return []
  const base = props.user.basePermissions[localForm.value.pageSlug]
  if (!base) return []
  const result: Array<{ key: string; label: string; value: boolean }> = []
  if (base.canView) result.push({ key: 'canView', label: '👁 Просмотр', value: true })
  if (base.canCreate) result.push({ key: 'canCreate', label: '➕ Создание', value: true })
  if (base.canEdit) result.push({ key: 'canEdit', label: '✏ Ред.', value: true })
  if (base.canDelete) result.push({ key: 'canDelete', label: '🗑 Удал.', value: true })
  if (base.canSpecial) result.push({ key: 'canSpecial', label: '⚡ Спец.', value: true })
  return result
})

const minExpiresAt = computed(() => {
  const now = new Date()
  now.setMinutes(now.getMinutes() + 1 - now.getTimezoneOffset())
  return now.toISOString().slice(0, 16)
})

const CRITICAL_PAGES = ['dashboard', 'objects', 'works']

/**
 * Является ли текущее изменение критичным
 * (отключение всех действий у критической страницы, где у роли были права)
 */
const isCriticalChange = computed(() => {
  if (!props.user || !localForm.value.pageSlug) return false
  if (!CRITICAL_PAGES.includes(localForm.value.pageSlug)) return false
  if (hasAnyAction.value) return false // есть хотя бы одно действие — не критично
  const base = props.user.basePermissions[localForm.value.pageSlug]
  if (!base) return false
  // Критично если у роли были какие-то действия, а мы все отключаем
  return base.canView || base.canCreate || base.canEdit || base.canDelete || base.canSpecial
})

/**
 * Валидация формы: страница выбрана + хотя бы одно действие включено
 */
const isFormValid = computed(() => {
  const f = localForm.value
  if (!f.pageSlug) return false
  if (!hasAnyAction.value) return false
  return true
})

// ============================================
// СИНХРОНИЗАЦИЯ: СБРОС ФОРМЫ ПРИ ОТКРЫТИИ
// ============================================

watch(
  () => props.isOpen,
  (isOpen) => {
    if (!isOpen) return
    localForm.value = {
      pageSlug: props.pages[0]?.slug || '',
      canView: false,
      canCreate: false,
      canEdit: false,
      canDelete: false,
      canSpecial: false,
      reason: '',
      expiresAt: '',
    }
  },
  { immediate: true }
)

// ============================================
// МЕТОДЫ
// ============================================

function hasExistingOverride(pageSlug: string): boolean {
  return props.user?.overrides.some(o => o.pageSlug === pageSlug) || false
}

function selectPage(slug: string) {
  localForm.value.pageSlug = slug
  localForm.value.canView = false
  localForm.value.canCreate = false
  localForm.value.canEdit = false
  localForm.value.canDelete = false
  localForm.value.canSpecial = false
  // Если есть существующий override — предзаполняем
  const existing = props.user?.overrides.find(o => o.pageSlug === slug)
  if (existing) {
    localForm.value.canView = existing.canView ?? false
    localForm.value.canCreate = existing.canCreate ?? false
    localForm.value.canEdit = existing.canEdit ?? false
    localForm.value.canDelete = existing.canDelete ?? false
    localForm.value.canSpecial = existing.canSpecial ?? false
    localForm.value.reason = existing.reason || ''
    if (existing.expiresAt) {
      const d = new Date(existing.expiresAt)
      d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
      localForm.value.expiresAt = d.toISOString().slice(0, 16)
    }
  }
}

function handlePermissionsUpdate(perms: PagePermissions) {
  localForm.value.canView = perms.canView
  localForm.value.canCreate = perms.canCreate
  localForm.value.canEdit = perms.canEdit
  localForm.value.canDelete = perms.canDelete
  localForm.value.canSpecial = perms.canSpecial
}

function setExpiresPreset(hours: number) {
  const date = new Date()
  date.setHours(date.getHours() + hours)
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset())
  localForm.value.expiresAt = date.toISOString().slice(0, 16)
}

function isPresetActive(hours: number): boolean {
  if (!localForm.value.expiresAt) return false
  const selected = new Date(localForm.value.expiresAt).getTime()
  const now = Date.now()
  const diffHours = (selected - now) / (1000 * 60 * 60)
  return Math.abs(diffHours - hours) < 0.5
}

function formatExpiresPreview(expiresAt: string): string {
  const date = new Date(expiresAt)
  return date.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function handleSave() {
  if (!isFormValid.value || props.saving) return
  emit('save', { ...localForm.value })
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
  max-width: 640px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: var(--crm-shadow-lg);
}

// ── HEADER ──────────────────────────────────────────────
.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid var(--crm-border);
  flex-shrink: 0;
}

.modal-title {
  display: flex;
  align-items: center;
  gap: 0.875rem;
  flex: 1;
  min-width: 0;

  h2 {
    margin: 0;
    font-size: var(--crm-text-lg);
    font-weight: 600;
    color: var(--crm-text-primary);
  }

  p {
    margin: 0.25rem 0 0;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: var(--crm-text-sm);
    color: var(--crm-text-secondary);
    flex-wrap: wrap;

    strong {
      color: var(--crm-text-primary);
      font-weight: 600;
    }
  }
}

.user-role-badge {
  display: inline-flex;
  align-items: center;
  padding: 0.125rem 0.5rem;
  border-radius: 10px;
  font-size: var(--crm-text-xs);
  font-weight: 500;

  &.role-admin { background: var(--crm-danger-dim); color: var(--crm-danger); }
  &.role-manager { background: var(--crm-warning-dim); color: var(--crm-warning); }
  &.role-foreman { background: var(--crm-success-dim); color: var(--crm-success); }
  &.role-master { background: var(--crm-accent-dim); color: var(--crm-accent); }
  &.role-worker { background: var(--crm-bg-overlay); color: var(--crm-text-secondary); }
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
  flex: 1;
  overflow-y: auto;
  padding: 1.25rem 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
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

// ── ФОРМЫ ───────────────────────────────────────────────
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

.form-hint {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  margin: 0;
  font-size: var(--crm-text-xs);
  color: var(--crm-text-muted);

  &--info { color: var(--crm-info); }
  &--warning { color: var(--crm-warning); }

  svg { flex-shrink: 0; }
}

.form-hint-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.char-counter {
  font-size: var(--crm-text-xs);
  color: var(--crm-text-muted);
  font-variant-numeric: tabular-nums;
}

textarea,
input[type="datetime-local"] {
  width: 100%;
  padding: 0.5rem 0.75rem;
  background: var(--crm-bg-elevated);
  border: 1px solid var(--crm-border);
  border-radius: var(--crm-radius-md);
  color: var(--crm-text-primary);
  font-size: var(--crm-text-sm);
  font-family: var(--crm-font-sans);
  transition: all var(--crm-transition);
  outline: none;

  &:focus {
    border-color: var(--crm-accent);
    box-shadow: 0 0 0 3px var(--crm-accent-dim);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  &::placeholder {
    color: var(--crm-text-muted);
  }
}

textarea {
  resize: vertical;
  min-height: 60px;
}

// ── ИНФО-БЛОКИ ──────────────────────────────────────────
.info-block {
  display: flex;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border-radius: var(--crm-radius-md);
  border: 1px solid;
  font-size: var(--crm-text-sm);
  line-height: 1.4;
  color: var(--crm-text-secondary);

  > svg {
    flex-shrink: 0;
    margin-top: 2px;
  }

  strong {
    color: var(--crm-text-primary);
    font-weight: 600;
  }

  &--info {
    background: var(--crm-info-dim, rgba(0, 195, 245, 0.1));
    border-color: rgba(0, 195, 245, 0.2);

    > svg { color: var(--crm-info); }
  }

  &--danger {
    background: var(--crm-danger-dim);
    border-color: rgba(242, 95, 92, 0.3);

    > svg { color: var(--crm-danger); }

    p {
      margin: 0;
      color: var(--crm-text-primary);
    }
  }
}

// ── БАЗОВЫЕ ПРАВА РОЛИ (КОНТЕКСТ) ──────────────────────
.base-permissions-info {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.5rem 0.75rem;
  background: var(--crm-bg-elevated);
  border: 1px solid var(--crm-border);
  border-radius: var(--crm-radius-md);
  font-size: var(--crm-text-xs);
  color: var(--crm-text-secondary);
  flex-wrap: wrap;
  margin-bottom: 0.5rem;

  > svg {
    color: var(--crm-info);
    flex-shrink: 0;
  }

  strong {
    color: var(--crm-text-primary);
    font-weight: 600;
  }
}

.base-perms-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
  margin-left: auto;
}

.base-perm-tag {
  display: inline-flex;
  align-items: center;
  padding: 0.0625rem 0.375rem;
  font-size: 0.6875rem;
  border-radius: 3px;
  background: var(--crm-bg-overlay);
  color: var(--crm-text-muted);
  white-space: nowrap;

  &.active {
    background: var(--crm-success-dim);
    color: var(--crm-success);
  }

  &.empty {
    background: var(--crm-danger-dim);
    color: var(--crm-danger);
    font-style: italic;
  }
}

// ── ВЫБОР СТРАНИЦЫ ──────────────────────────────────────
.pages-select {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 0.5rem;
}

.page-option {
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: var(--crm-bg-elevated);
  border: 1px solid var(--crm-border);
  border-radius: var(--crm-radius-md);
  color: var(--crm-text-secondary);
  font-size: var(--crm-text-sm);
  cursor: pointer;
  transition: all var(--crm-transition);
  font-family: var(--crm-font-sans);
  text-align: left;

  &:hover:not(:disabled) {
    border-color: var(--crm-border-hover);
    color: var(--crm-text-primary);
  }

  &.selected {
    border-color: var(--crm-accent);
    background: var(--crm-accent-dim);
    color: var(--crm-accent);
  }

  &--has-override {
    border-color: var(--crm-warning-dim);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.page-option-name {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.override-indicator {
  color: var(--crm-warning);
  flex-shrink: 0;
}

// ── СРОК ДЕЙСТВИЯ ───────────────────────────────────────
.expires-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;

  input {
    padding-right: 2.5rem;
  }
}

.clear-expires-btn {
  position: absolute;
  right: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  background: transparent;
  color: var(--crm-text-muted);
  border: none;
  border-radius: 50%;
  cursor: pointer;
  transition: all var(--crm-transition);

  &:hover:not(:disabled) {
    background: var(--crm-danger-dim);
    color: var(--crm-danger);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.expires-presets {
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem;
  margin-top: 0.375rem;
}

.preset-btn {
  padding: 0.25rem 0.625rem;
  background: var(--crm-bg-elevated);
  color: var(--crm-text-secondary);
  border: 1px solid var(--crm-border);
  border-radius: var(--crm-radius-sm);
  font-size: var(--crm-text-xs);
  font-family: var(--crm-font-sans);
  cursor: pointer;
  transition: all var(--crm-transition);

  &:hover:not(:disabled) {
    border-color: var(--crm-border-hover);
    color: var(--crm-text-primary);
  }

  &.active {
    border-color: var(--crm-accent);
    background: var(--crm-accent-dim);
    color: var(--crm-accent);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
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
  .modal-content {
    max-height: 95vh;
  }

  .modal-header,
  .modal-body,
  .modal-footer {
    padding-left: 1rem;
    padding-right: 1rem;
  }

  .pages-select {
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  }

  .modal-footer {
    flex-wrap: wrap;

    .btn {
      flex: 1;
      min-width: 120px;
    }
  }
}
</style>