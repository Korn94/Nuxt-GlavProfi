<!-- app/components/pages/cabinet/settings/permissions/Pages/PageEditModal.vue -->
 <template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="isOpen"
        class="modal-overlay"
        @click.self="$emit('update:isOpen', false)"
      >
        <div class="modal-content">
          <!-- ───────── HEADER ───────── -->
          <div class="modal-header">
            <div class="modal-title">
              <div class="icon-circle primary">
                <Icon :name="isEdit ? 'mdi:pencil' : 'mdi:plus'" size="24" />
              </div>
              <div>
                <h2>{{ isEdit ? 'Редактировать раздел' : 'Новый раздел' }}</h2>
                <p v-if="isEdit">Slug: <code>{{ localForm.slug }}</code></p>
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
                  Только латинские буквы, цифры и дефисы. Изменить нельзя.
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
                </div>
                <p class="form-hint">
                  <Icon name="mdi:information-outline" size="12" />
                  Формат: <code>mdi:icon-name</code>. Найти можно на icon-sets.iconify.design
                </p>
              </div>

              <!-- Порядок -->
              <div class="form-group">
                <label class="form-label">Порядок отображения</label>
                <input
                  v-model.number="localForm.order"
                  type="number"
                  min="0"
                  placeholder="0"
                  :disabled="saving"
                />
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
              ></textarea>
            </div>

            <!-- Возможности страницы (новая система: create/edit/delete/special) -->
            <div class="form-group">
              <label class="form-label">Поддерживаемые действия</label>
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
                    <span>Создание</span>
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
                    <span>Редактирование</span>
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
                    <span>Удаление</span>
                  </div>
                </label>

                <!-- 🆕 НОВАЯ СИСТЕМА: Спец. операции (вместо hasExport + hasApprove) -->
                <label class="capability-option">
                  <input
                    type="checkbox"
                    v-model="localForm.hasSpecial"
                    :disabled="saving"
                  />
                  <div class="capability-content special">
                    <Icon name="mdi:lightning-bolt" size="18" />
                    <span>Спец. операции</span>
                  </div>
                </label>
              </div>
              <p class="form-hint mt-2">
                <Icon name="mdi:information-outline" size="12" />
                Спец. операции — приёмка работ, оплата, пересчёт баланса, toggle-check и т.п.
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
              {{ saving ? 'Сохранение...' : (isEdit ? 'Сохранить' : 'Создать') }}
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

// ============================================
// СИНХРОНИЗАЦИЯ С ПРОПСАМИ
// ============================================

/**
 * При открытии модалки — заполняем форму данными страницы (для режима редактирования)
 * или сбрасываем (для режима создания)
 */
watch(() => props.isOpen, (isOpen) => {
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
  }
}, { immediate: true })

// ============================================
// ВАЛИДАЦИЯ
// ============================================
const isFormValid = computed(() => {
  const f = localForm.value
  if (!f.slug.trim()) return false
  if (!f.name.trim()) return false
  if (!/^[a-z0-9-]+$/.test(f.slug)) return false
  return true
})

// ============================================
// ОБРАБОТЧИКИ
// ============================================
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

    code {
      font-family: var(--crm-font-mono);
      background: var(--crm-bg-overlay);
      padding: 0.125rem 0.375rem;
      border-radius: var(--crm-radius-sm);
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

  code {
    font-family: var(--crm-font-mono);
    background: var(--crm-bg-overlay);
    padding: 0.0625rem 0.25rem;
    border-radius: var(--crm-radius-sm);
    font-size: 0.9em;
  }

  &.mb-2 { margin-bottom: 0.5rem; }
  &.mt-2 { margin-top: 0.5rem; }
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

  svg {
    color: var(--crm-accent);
    flex-shrink: 0;
  }

  input {
    border: none;
    background: transparent;
    padding: 0.25rem 0;
    box-shadow: none !important;
  }
}

// ── ВОЗМОЖНОСТИ (ЧЕКБОКСЫ) ─────────────────────────────
.capabilities-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 0.5rem;
}

.capability-option {
  position: relative;
  cursor: pointer;

  input {
    position: absolute;
    opacity: 0;
    pointer-events: none;

    // Checked состояния для каждого типа
    &:checked ~ .capability-content {
      border-color: var(--crm-accent);
      background: var(--crm-accent-dim);
    }

    &:checked ~ .capability-content.create {
      border-color: var(--crm-success);
      background: var(--crm-success-dim);
      color: var(--crm-success);
    }

    &:checked ~ .capability-content.edit {
      border-color: var(--crm-info);
      background: var(--crm-info-dim);
      color: var(--crm-info);
    }

    &:checked ~ .capability-content.delete {
      border-color: var(--crm-danger);
      background: var(--crm-danger-dim);
      color: var(--crm-danger);
    }

    // 🆕 НОВАЯ СИСТЕМА: Спец. операции (фиолетовый)
    &:checked ~ .capability-content.special {
      border-color: #9c27b0;
      background: rgba(156, 39, 176, 0.15);
      color: #9c27b0;
    }

    &:disabled ~ .capability-content {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }

  .capability-content {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.625rem 0.75rem;
    background: var(--crm-bg-elevated);
    border: 1px solid var(--crm-border);
    border-radius: var(--crm-radius-md);
    font-size: var(--crm-text-sm);
    color: var(--crm-text-secondary);
    transition: all var(--crm-transition);

    &:hover {
      border-color: var(--crm-border-hover);
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
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  }
}
</style>