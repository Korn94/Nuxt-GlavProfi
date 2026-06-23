<!-- app/components/pages/cabinet/settings/permissions/Pages/PageEditModal.vue -->
<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="isOpen"
        class="modal-overlay"
        @click.self="$emit('update:isOpen', false)"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="`page-edit-title-${localForm.slug}`"
      >
        <div class="modal-content">
          <!-- ───────── HEADER ───────── -->
          <div class="modal-header">
            <div class="modal-title">
              <div :class="['icon-circle', isEdit ? 'primary' : 'success']">
                <Icon :name="isEdit ? 'mdi:pencil' : 'mdi:plus'" size="24" />
              </div>
              <div>
                <h2 :id="`page-edit-title-${localForm.slug}`">
                  {{ isEdit ? 'Редактировать раздел' : 'Новый раздел' }}
                </h2>
                <p v-if="isEdit">
                  Slug: <code>{{ localForm.slug }}</code>
                </p>
                <p v-else>Создание нового раздела системы</p>
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
            <!-- 🆕 AUDIT ИНФОРМАЦИЯ (для режима редактирования) -->
            <div v-if="isEdit && page" class="audit-block">
              <Icon name="mdi:history" size="14" />
              <span class="audit-text">
                Создано {{ formatDate(page.createdAt) }}
                <template v-if="page.updatedAt && page.updatedAt !== page.createdAt">
                  · Обновлено {{ formatDate(page.updatedAt) }}
                </template>
              </span>
            </div>

            <!-- Сетка основных полей -->
            <div class="form-grid">
              <!-- Slug -->
              <div class="form-group">
                <label class="form-label">
                  Slug (идентификатор)
                  <span class="required">*</span>
                </label>
                <input
                  v-model="localForm.slug"
                  type="text"
                  placeholder="например: finance"
                  :disabled="isEdit || saving"
                  pattern="[a-z0-9-]+"
                />
                <p class="form-hint">
                  <Icon name="mdi:information-outline" size="12" />
                  Только латинские буквы, цифры и дефисы.
                  {{ isEdit ? 'Изменить нельзя.' : 'Используется в правах доступа.' }}
                </p>
                <p v-if="slugError" class="form-hint form-hint--error">
                  <Icon name="mdi:alert-circle" size="12" />
                  {{ slugError }}
                </p>
              </div>

              <!-- Название -->
              <div class="form-group">
                <label class="form-label">
                  Название
                  <span class="required">*</span>
                </label>
                <input
                  v-model="localForm.name"
                  type="text"
                  placeholder="например: Финансы"
                  :disabled="saving"
                />
              </div>

              <!-- Иконка -->
              <div class="form-group">
                <label class="form-label">Иконка (Material Design Icons)</label>
                <div class="icon-input">
                  <Icon
                    v-if="localForm.icon"
                    :name="localForm.icon"
                    size="20"
                  />
                  <input
                    v-model="localForm.icon"
                    type="text"
                    placeholder="mdi:cash-multiple"
                    :disabled="saving"
                  />
                  <button
                    v-if="localForm.icon"
                    class="icon-clear"
                    @click="localForm.icon = ''"
                    :disabled="saving"
                    title="Убрать иконку"
                  >
                    <Icon name="mdi:close-circle" size="16" />
                  </button>
                </div>
                <p class="form-hint">
                  <Icon name="mdi:information-outline" size="12" />
                  Формат: <code>mdi:icon-name</code>.
                  <a
                    href="https://icon-sets.iconify.design/mdi/"
                    target="_blank"
                    rel="noopener"
                  >
                    Найти иконку ↗
                  </a>
                </p>
              </div>

              <!-- Порядок -->
              <div class="form-group">
                <label class="form-label">Порядок отображения</label>
                <div class="order-input">
                  <button
                    class="btn-icon"
                    @click="localForm.order = Math.max(0, localForm.order - 1)"
                    :disabled="saving || localForm.order <= 0"
                    title="Уменьшить"
                  >
                    <Icon name="mdi:minus" size="16" />
                  </button>
                  <input
                    v-model.number="localForm.order"
                    type="number"
                    min="0"
                    max="999"
                    placeholder="0"
                    :disabled="saving"
                    class="order-number"
                  />
                  <button
                    class="btn-icon"
                    @click="localForm.order++"
                    :disabled="saving"
                    title="Увеличить"
                  >
                    <Icon name="mdi:plus" size="16" />
                  </button>
                </div>
                <p class="form-hint">
                  <Icon name="mdi:information-outline" size="12" />
                  Определяет порядок в меню навигации (0 = первый)
                </p>
              </div>
            </div>

            <!-- Описание -->
            <div class="form-group">
              <label class="form-label">Описание</label>
              <textarea
                v-model="localForm.description"
                placeholder="Краткое описание раздела для подсказок в UI"
                rows="2"
                :disabled="saving"
                maxlength="500"
              ></textarea>
              <div class="form-hint-row">
                <p class="form-hint">
                  <Icon name="mdi:information-outline" size="12" />
                  Необязательно. Показывается в настройках прав.
                </p>
                <span v-if="localForm.description" class="char-counter">
                  {{ localForm.description.length }}/500
                </span>
              </div>
            </div>

            <!-- Возможности страницы (новая система: create/edit/delete/special) -->
            <div class="form-group">
              <label class="form-label">
                Поддерживаемые действия
                <span class="required">*</span>
              </label>
              <p class="form-hint mb-2">
                <Icon name="mdi:information-outline" size="12" />
                Эти действия будут доступны для настройки в правах ролей
              </p>
              <div class="capabilities-grid">
                <label class="capability-option">
                  <input
                    type="checkbox"
                    v-model="localForm.hasCreate"
                    :disabled="saving"
                  />
                  <div class="capability-content create">
                    <Icon name="mdi:plus-circle-outline" size="18" />
                    <div class="capability-info">
                      <span class="capability-name">Создание</span>
                      <span class="capability-desc">Новые записи</span>
                    </div>
                  </div>
                </label>
                <label class="capability-option">
                  <input
                    type="checkbox"
                    v-model="localForm.hasEdit"
                    :disabled="saving"
                  />
                  <div class="capability-content edit">
                    <Icon name="mdi:pencil-outline" size="18" />
                    <div class="capability-info">
                      <span class="capability-name">Редактирование</span>
                      <span class="capability-desc">Изменение данных</span>
                    </div>
                  </div>
                </label>
                <label class="capability-option">
                  <input
                    type="checkbox"
                    v-model="localForm.hasDelete"
                    :disabled="saving"
                  />
                  <div class="capability-content delete">
                    <Icon name="mdi:delete-outline" size="18" />
                    <div class="capability-info">
                      <span class="capability-name">Удаление</span>
                      <span class="capability-desc">Удаление записей</span>
                    </div>
                  </div>
                </label>
                <label class="capability-option">
                  <input
                    type="checkbox"
                    v-model="localForm.hasSpecial"
                    :disabled="saving"
                  />
                  <div class="capability-content special">
                    <Icon name="mdi:lightning-bolt" size="18" />
                    <div class="capability-info">
                      <span class="capability-name">Спец. операции</span>
                      <span class="capability-desc">Приёмка, оплата, toggle</span>
                    </div>
                  </div>
                </label>
              </div>
              <p class="form-hint mt-2">
                <Icon name="mdi:lightbulb-outline" size="12" />
                Отключите действие, если страница не поддерживает его.
                Отключённые действия не будут отображаться в настройках ролей.
              </p>
            </div>

            <!-- 🆕 ПРЕДПРОСМОТР: как раздел будет выглядеть в карточке -->
            <div class="form-group">
              <label class="form-label">Предпросмотр карточки</label>
              <div class="page-card-preview" :class="{ inactive: !isActivePreview }">
                <div class="preview-icon-wrapper">
                  <Icon :name="localForm.icon || 'mdi:file-outline'" size="24" />
                </div>
                <div class="preview-info">
                  <div class="preview-title">
                    <h3>{{ localForm.name || 'Название раздела' }}</h3>
                    <code>{{ localForm.slug || 'slug' }}</code>
                  </div>
                  <p v-if="localForm.description" class="preview-description">
                    {{ localForm.description }}
                  </p>
                  <div class="preview-capabilities">
                    <span v-if="localForm.hasCreate" class="cap-tag create">
                      <Icon name="mdi:plus-circle-outline" size="10" />
                      Создание
                    </span>
                    <span v-if="localForm.hasEdit" class="cap-tag edit">
                      <Icon name="mdi:pencil-outline" size="10" />
                      Ред.
                    </span>
                    <span v-if="localForm.hasDelete" class="cap-tag delete">
                      <Icon name="mdi:delete-outline" size="10" />
                      Удал.
                    </span>
                    <span v-if="localForm.hasSpecial" class="cap-tag special">
                      <Icon name="mdi:lightning-bolt" size="10" />
                      Спец.
                    </span>
                    <span
                      v-if="!localForm.hasCreate && !localForm.hasEdit && !localForm.hasDelete && !localForm.hasSpecial"
                      class="cap-tag none"
                    >
                      <Icon name="mdi:eye-outline" size="10" />
                      Только просмотр
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Предупреждение при отключении возможностей -->
            <Transition name="fade">
              <div v-if="hasDisabledCapabilities && isEdit" class="info-block info-block--warning">
                <Icon name="mdi:alert" size="20" />
                <div>
                  <p>
                    <strong>Внимание!</strong> Отключение возможности приведёт к тому,
                    что соответствующие чекбоксы в настройках ролей будут скрыты.
                    Существующие права ролей для отключённых действий будут игнорироваться.
                  </p>
                </div>
              </div>
            </Transition>
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
              {{ saving ? 'Сохранение...' : (isEdit ? 'Сохранить изменения' : 'Создать раздел') }}
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
interface PageFormData {
  slug: string
  name: string
  description: string
  icon: string
  order: number
  hasCreate: boolean
  hasEdit: boolean
  hasDelete: boolean
  hasSpecial: boolean
}

interface PageForEdit {
  slug: string
  name: string
  description: string | null
  icon: string | null
  order: number
  hasCreate: boolean
  hasEdit: boolean
  hasDelete: boolean
  hasSpecial: boolean
  createdAt?: string
  updatedAt?: string
}

// ============================================
// ПРОПСЫ
// ============================================
const props = defineProps<{
  /** Флаг видимости модалки (v-model:isOpen) */
  isOpen: boolean
  /** Режим редактирования (true = обновление существующей страницы) */
  isEdit?: boolean
  /** Данные страницы для редактирования (только при isEdit = true) */
  page?: PageForEdit | null
  /** Флаг процесса сохранения */
  saving?: boolean
}>()

// ============================================
// ЭМИТТЫ
// ============================================
const emit = defineEmits<{
  'update:isOpen': [value: boolean]
  'save': [data: PageFormData]
}>()

// ============================================
// ЛОКАЛЬНОЕ СОСТОЯНИЕ ФОРМЫ
// ============================================
const localForm = ref<PageFormData>({
  slug: '',
  name: '',
  description: '',
  icon: '',
  order: 0,
  hasCreate: false,
  hasEdit: false,
  hasDelete: false,
  hasSpecial: false,
})

// Флаг активности (только для режима редактирования — предпросмотр)
const isActivePreview = ref(true)

// ============================================
// СИНХРОНИЗАЦИЯ С ПРОПСАМИ
// ============================================
watch(
  () => props.isOpen,
  (isOpen) => {
    if (!isOpen) return

    if (props.isEdit && props.page) {
      localForm.value = {
        slug: props.page.slug,
        name: props.page.name,
        description: props.page.description || '',
        icon: props.page.icon || '',
        order: props.page.order,
        hasCreate: props.page.hasCreate,
        hasEdit: props.page.hasEdit,
        hasDelete: props.page.hasDelete,
        hasSpecial: props.page.hasSpecial,
      }
      isActivePreview.value = true
    } else {
      // Режим создания — сброс формы
      localForm.value = {
        slug: '',
        name: '',
        description: '',
        icon: '',
        order: 0,
        hasCreate: false,
        hasEdit: false,
        hasDelete: false,
        hasSpecial: false,
      }
      isActivePreview.value = true
    }
  },
  { immediate: true }
)

// ============================================
// ВАЛИДАЦИЯ
// ============================================
const slugError = computed(() => {
  const slug = localForm.value.slug.trim()
  if (!slug) return ''
  if (!/^[a-z0-9-]+$/.test(slug)) {
    return 'Только строчные латинские буквы, цифры и дефисы'
  }
  if (slug.length < 2) return 'Минимум 2 символа'
  if (slug.length > 50) return 'Максимум 50 символов'
  if (slug.startsWith('-') || slug.endsWith('-')) {
    return 'Не может начинаться или заканчиваться дефисом'
  }
  if (slug.includes('--')) return 'Двойной дефис недопустим'
  return ''
})

const isFormValid = computed(() => {
  const f = localForm.value
  if (!f.slug.trim()) return false
  if (!f.name.trim()) return false
  if (slugError.value) return false
  return true
})

const hasDisabledCapabilities = computed(() => {
  if (!props.isEdit || !props.page) return false
  return (
    (props.page.hasCreate && !localForm.value.hasCreate) ||
    (props.page.hasEdit && !localForm.value.hasEdit) ||
    (props.page.hasDelete && !localForm.value.hasDelete) ||
    (props.page.hasSpecial && !localForm.value.hasSpecial)
  )
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
  max-width: 680px;
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
    font-size: var(--crm-text-sm);
    color: var(--crm-text-secondary);
    display: flex;
    align-items: center;
    gap: 0.5rem;

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

  &.primary {
    background: var(--crm-accent-dim);
    color: var(--crm-accent);
  }

  &.success {
    background: var(--crm-success-dim);
    color: var(--crm-success);
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

// ── ФОРМЫ ───────────────────────────────────────────────
.form-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
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
  line-height: 1.4;

  &--error {
    color: var(--crm-danger);
  }

  code {
    font-family: var(--crm-font-mono);
    background: var(--crm-bg-overlay);
    padding: 0.0625rem 0.25rem;
    border-radius: var(--crm-radius-sm);
    font-size: 0.9em;
  }

  a {
    color: var(--crm-accent);
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }

  &.mb-2 { margin-bottom: 0.5rem; }
  &.mt-2 { margin-top: 0.5rem; }
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
  flex-shrink: 0;
}

input,
textarea {
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

// ── ИКОНКА ──────────────────────────────────────────────
.icon-input {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.25rem 0.75rem;
  background: var(--crm-bg-elevated);
  border: 1px solid var(--crm-border);
  border-radius: var(--crm-radius-md);
  transition: all var(--crm-transition);

  &:focus-within {
    border-color: var(--crm-accent);
    box-shadow: 0 0 0 3px var(--crm-accent-dim);
  }

  > svg:first-child {
    color: var(--crm-accent);
    flex-shrink: 0;
  }

  input {
    border: none;
    background: transparent;
    padding: 0.25rem 0;
    box-shadow: none !important;

    &:focus {
      box-shadow: none !important;
    }
  }

  .icon-clear {
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
    flex-shrink: 0;

    &:hover:not(:disabled) {
      background: var(--crm-danger-dim);
      color: var(--crm-danger);
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }
}

// ── ПОРЯДОК ─────────────────────────────────────────────
.order-input {
  display: flex;
  align-items: center;
  gap: 0.25rem;

  .order-number {
    flex: 1;
    text-align: center;
    appearance: textfield;
    -moz-appearance: textfield;

    &::-webkit-outer-spin-button,
    &::-webkit-inner-spin-button {
      -webkit-appearance: none;
      margin: 0;
    }
  }
}

.btn-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: var(--crm-bg-elevated);
  color: var(--crm-text-secondary);
  border: 1px solid var(--crm-border);
  border-radius: var(--crm-radius-md);
  cursor: pointer;
  transition: all var(--crm-transition);
  flex-shrink: 0;

  &:hover:not(:disabled) {
    background: var(--crm-bg-overlay);
    color: var(--crm-text-primary);
    border-color: var(--crm-border-hover);
  }

  &:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }
}

// ── ВОЗМОЖНОСТИ (ЧЕКБОКСЫ) ─────────────────────────────
.capabilities-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.5rem;
}

.capability-option {
  position: relative;
  cursor: pointer;

  input {
    position: absolute;
    opacity: 0;
    pointer-events: none;
    width: 0;
    height: 0;

    &:checked ~ .capability-content {
      border-color: var(--crm-accent);
      background: var(--crm-accent-dim);
    }

    &:checked ~ .capability-content.create {
      border-color: var(--crm-success);
      background: var(--crm-success-dim);

      .capability-name, svg { color: var(--crm-success); }
    }

    &:checked ~ .capability-content.edit {
      border-color: var(--crm-info);
      background: var(--crm-info-dim);

      .capability-name, svg { color: var(--crm-info); }
    }

    &:checked ~ .capability-content.delete {
      border-color: var(--crm-danger);
      background: var(--crm-danger-dim);

      .capability-name, svg { color: var(--crm-danger); }
    }

    &:checked ~ .capability-content.special {
      border-color: #9c27b0;
      background: rgba(156, 39, 176, 0.15);

      .capability-name, svg { color: #9c27b0; }
    }

    &:disabled ~ .capability-content {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }

  .capability-content {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem;
    background: var(--crm-bg-elevated);
    border: 1px solid var(--crm-border);
    border-radius: var(--crm-radius-md);
    transition: all var(--crm-transition);

    &:hover {
      border-color: var(--crm-border-hover);
    }

    > svg {
      color: var(--crm-text-muted);
      flex-shrink: 0;
      transition: color var(--crm-transition);
    }
  }

  .capability-info {
    display: flex;
    flex-direction: column;
    gap: 0.125rem;
  }

  .capability-name {
    font-size: var(--crm-text-sm);
    font-weight: 500;
    color: var(--crm-text-primary);
    transition: color var(--crm-transition);
  }

  .capability-desc {
    font-size: var(--crm-text-xs);
    color: var(--crm-text-muted);
  }
}

// ── ПРЕДПРОСМОТР КАРТОЧКИ ───────────────────────────────
.page-card-preview {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: var(--crm-bg-surface);
  border: 1px solid var(--crm-border);
  border-radius: var(--crm-radius-lg);
  transition: all var(--crm-transition);

  &.inactive {
    opacity: 0.5;

    .preview-icon-wrapper {
      background: var(--crm-bg-overlay);
      color: var(--crm-text-muted);
    }
  }
}

.preview-icon-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  background: var(--crm-accent-dim);
  color: var(--crm-accent);
  border-radius: var(--crm-radius-md);
  flex-shrink: 0;
  transition: all var(--crm-transition);
}

.preview-info {
  flex: 1;
  min-width: 0;
}

.preview-title {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;

  h3 {
    margin: 0;
    font-size: var(--crm-text-md);
    font-weight: 600;
    color: var(--crm-text-primary);
    transition: color var(--crm-transition);
  }

  code {
    padding: 0.125rem 0.5rem;
    background: var(--crm-bg-overlay);
    color: var(--crm-text-muted);
    font-size: var(--crm-text-xs);
    border-radius: var(--crm-radius-sm);
    font-family: var(--crm-font-mono);
  }
}

.preview-description {
  margin: 0.25rem 0 0.5rem;
  font-size: var(--crm-text-xs);
  color: var(--crm-text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.preview-capabilities {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
}

.cap-tag {
  display: inline-flex;
  align-items: center;
  gap: 0.125rem;
  padding: 0.0625rem 0.375rem;
  font-size: 0.6875rem;
  font-weight: 500;
  border-radius: 10px;
  white-space: nowrap;
  line-height: 1.4;

  &.create { background: var(--crm-success-dim); color: var(--crm-success); }
  &.edit { background: var(--crm-info-dim); color: var(--crm-info); }
  &.delete { background: var(--crm-danger-dim); color: var(--crm-danger); }
  &.special { background: rgba(156, 39, 176, 0.15); color: #9c27b0; }
  &.none { background: var(--crm-bg-overlay); color: var(--crm-text-muted); }
}

// ── ИНФО-БЛОКИ ──────────────────────────────────────────
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
  }

  &--warning {
    background: var(--crm-warning-dim);
    border-color: rgba(245, 166, 35, 0.3);

    > svg {
      color: var(--crm-warning);
    }
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

  &:hover:not(:disabled) { background: var(--crm-accent-hover); }
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

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
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

  .form-grid {
    grid-template-columns: 1fr;
  }

  .capabilities-grid {
    grid-template-columns: 1fr;
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