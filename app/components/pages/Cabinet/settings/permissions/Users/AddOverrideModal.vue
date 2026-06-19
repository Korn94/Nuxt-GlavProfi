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
            <!-- Выбор страницы -->
            <div class="form-group">
              <label class="form-label">
                Раздел системы
                <span class="required">*</span>
              </label>
              <div class="pages-select">
                <button
                  v-for="page in pages"
                  :key="page.slug"
                  :class="['page-option', { selected: localForm.pageSlug === page.slug }]"
                  @click="selectPage(page.slug)"
                  :disabled="saving"
                >
                  <Icon :name="page.icon || 'mdi:file-outline'" size="16" />
                  {{ page.name }}
                </button>
              </div>
            </div>

            <!-- Права для выбранной страницы (через shared компонент) -->
            <div v-if="selectedPage" class="form-group">
              <label class="form-label">
                Переопределяемые права
                <span class="required">*</span>
              </label>
              <PagesCabinetSettingsPermissionsSharedPermCheckboxes
                :model-value="permissionsValue"
                :page="selectedPage"
                :disabled="saving"
                @update:model-value="handlePermissionsUpdate"
              />
              <p v-if="!localForm.canView" class="form-hint form-hint--info">
                <Icon name="mdi:information-outline" size="14" />
                Включите просмотр, чтобы активировать остальные права
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
              ></textarea>
              <p class="form-hint">
                <Icon name="mdi:information-outline" size="12" />
                Будет видна администраторам в списке переопределений
              </p>
            </div>

            <!-- Срок действия -->
            <div class="form-group">
              <label class="form-label">Срок действия (необязательно)</label>
              <input
                type="datetime-local"
                v-model="localForm.expiresAt"
                :min="minExpiresAt"
                :disabled="saving"
              />
              <p class="form-hint">
                <Icon name="mdi:information-outline" size="12" />
                Оставьте пустым для бессрочного переопределения
              </p>
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
}

interface UserWithPermissions {
  id: number
  name: string
  login: string
  role: string
  contractorType: string | null
  contractorId: number | null
  overrides: UserOverride[]
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
  /** Флаг видимости модалки (v-model:isOpen) */
  isOpen: boolean
  /** Пользователь для которого создаём переопределение */
  user: UserWithPermissions | null
  /** Список всех страниц системы */
  pages: SystemPage[]
  /** Флаг процесса сохранения */
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

/**
 * Текущая выбранная страница
 */
const selectedPage = computed(() =>
  props.pages.find(p => p.slug === localForm.value.pageSlug) || null
)

/**
 * Значение прав для передачи в PermCheckboxes
 */
const permissionsValue = computed<PagePermissions>(() => ({
  canView: localForm.value.canView,
  canCreate: localForm.value.canCreate,
  canEdit: localForm.value.canEdit,
  canDelete: localForm.value.canDelete,
  canSpecial: localForm.value.canSpecial,
}))

/**
 * Минимальное допустимое время для expiresAt (текущий момент)
 * Формат: YYYY-MM-DDTHH:MM (для input[type="datetime-local"])
 */
const minExpiresAt = computed(() => {
  const now = new Date()
  // Корректируем под локальный часовой пояс
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset())
  return now.toISOString().slice(0, 16)
})

/**
 * Валидация формы
 * Обязательные условия: выбрана страница + включён canView
 */
const isFormValid = computed(() => {
  const f = localForm.value
  if (!f.pageSlug) return false
  if (!f.canView) return false
  return true
})

// ============================================
// СИНХРОНИЗАЦИЯ: СБРОС ФОРМЫ ПРИ ОТКРЫТИИ
// ============================================
watch(
  () => props.isOpen,
  (isOpen) => {
    if (!isOpen) return

    // Сбрасываем форму, выбираем первую страницу по умолчанию
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
// ОБРАБОТЧИКИ
// ============================================

/**
 * Выбор страницы
 * При смене страницы — сбрасываем все права
 */
function selectPage(slug: string) {
  localForm.value.pageSlug = slug
  localForm.value.canView = false
  localForm.value.canCreate = false
  localForm.value.canEdit = false
  localForm.value.canDelete = false
  localForm.value.canSpecial = false
}

/**
 * Обновление прав из PermCheckboxes
 * Именованная функция для избежания ошибки TS7006 (неявный any)
 */
function handlePermissionsUpdate(perms: PagePermissions) {
  localForm.value.canView = perms.canView
  localForm.value.canCreate = perms.canCreate
  localForm.value.canEdit = perms.canEdit
  localForm.value.canDelete = perms.canDelete
  localForm.value.canSpecial = perms.canSpecial
}

/**
 * Сохранение переопределения — эмитим данные в родителя
 */
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
  margin: 0.25rem 0 0;
  font-size: var(--crm-text-xs);
  color: var(--crm-text-muted);

  &--info {
    color: var(--crm-info);

    svg {
      flex-shrink: 0;
    }
  }
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

// ── ВЫБОР СТРАНИЦЫ ──────────────────────────────────────
.pages-select {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 0.5rem;
}

.page-option {
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