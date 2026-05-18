<!-- app/components/pages/cabinet/objects/EditModal.vue -->
<template>
  <PagesCabinetUiModal :visible="modelValue" title="Редактирование объекта" size="lg" closable
    @update:visible="$emit('update:modelValue', false)">
    <div class="edit-form">

      <!-- Название -->
      <div class="field">
        <label class="field__label">Название</label>
        <input v-model="form.name" type="text" class="field__input" required />
      </div>

      <!-- Адрес -->
      <div class="field">
        <label class="field__label">Адрес</label>
        <textarea v-model="form.address" class="field__input field__input--textarea" rows="2" />
      </div>

      <!-- Даты -->
      <div class="field-row">
        <div class="field">
          <label class="field__label">Дата начала</label>
          <input v-model="form.startDate" type="date" class="field__input" />
        </div>
        <div class="field">
          <label class="field__label">Плановая дата завершения</label>
          <input v-model="form.plannedEndDate" type="date" class="field__input" />
        </div>
        <div class="field">
          <label class="field__label">Фактическая дата завершения</label>
          <input v-model="form.completedDate" type="date" class="field__input" />
        </div>
      </div>

      <!-- Источник + тип договора -->
      <div class="field-row">
        <div class="field">
          <label class="field__label">Источник</label>
          <select v-model="form.source" class="field__input">
            <option value="">— Не указан —</option>
            <option value="Avito">Avito</option>
            <option value="Сарафанка">Сарафанка</option>
            <option value="Сайт">Сайт</option>
            <option value="Сайт + Директ">Сайт + Директ</option>
            <option value="Вновь обратившийся">Вновь обратившийся</option>
            <option value="Прочее">Прочее</option>
          </select>
        </div>
        <div class="field">
          <label class="field__label">Тип договора</label>
          <select v-model="form.contractType" class="field__input">
            <option value="unassigned">— Не выбрано —</option>
            <option value="none">Не нужен</option>
            <option value="edo">ЭДО</option>
            <option value="paper">Бумажный</option>
            <option value="invoice">Счёт-договор</option>
          </select>
        </div>
      </div>

      <!-- Прораб -->
      <div class="field">
        <label class="field__label">Прораб</label>
        <select v-model="form.foremanId" class="field__input">
          <option :value="null">— Не выбран —</option>
          <option v-for="f in foremans" :key="f.id" :value="f.id">{{ f.name }}</option>
        </select>
      </div>

      <!-- Комментарий -->
      <div class="field">
        <label class="field__label">Комментарий</label>
        <textarea v-model="form.comment" class="field__input field__input--textarea" rows="3" />
      </div>

    </div>

    <template #footer>
      <div class="modal-footer">

        <!-- Статусные действия слева -->
        <div class="modal-footer__actions">
          <!-- Активный -->
          <template v-if="object.status === 'active'">
            <button class="crm-btn crm-btn--warning" @click="setStatus('waiting')">
              <Icon name="mdi:clock-outline" size="14" /> В ожидание
            </button>
            <button class="crm-btn crm-btn--success" @click="confirmAction('complete')">
              <Icon name="mdi:check" size="14" /> Завершить
            </button>
            <button class="crm-btn crm-btn--danger" @click="confirmAction('cancel')">
              <Icon name="mdi:close" size="14" /> Отменить
            </button>
          </template>

          <!-- Ожидание -->
          <template v-else-if="object.status === 'waiting'">
            <button class="crm-btn crm-btn--success" @click="setStatus('active')">
              <Icon name="mdi:play" size="14" /> Возобновить
            </button>
            <button class="crm-btn crm-btn--danger" @click="confirmAction('cancel')">
              <Icon name="mdi:close" size="14" /> Отменить
            </button>
          </template>

          <!-- Завершён / Отменён -->
          <template v-else>
            <button class="crm-btn crm-btn--success" @click="setStatus('active')">
              <Icon name="mdi:play" size="14" /> Возобновить
            </button>
          </template>

          <button class="crm-btn crm-btn--ghost-danger" @click="confirmAction('delete')">
            <Icon name="mdi:trash-can-outline" size="14" /> Удалить
          </button>
        </div>

        <!-- Сохранить / Отмена справа -->
        <div class="modal-footer__submit">
          <button class="crm-btn crm-btn--ghost" @click="$emit('update:modelValue', false)">
            Отмена
          </button>
          <button class="crm-btn crm-btn--accent" :disabled="saving" @click="handleSubmit">
            <Icon v-if="saving" name="mdi:loading" class="spin" size="14" />
            {{ saving ? 'Сохранение...' : 'Сохранить' }}
          </button>
        </div>

      </div>
    </template>

  </PagesCabinetUiModal>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useApi } from '~/composables/useApi'

const props = defineProps<{
  modelValue: boolean
  object: any
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'updated': [obj: any]
  'completed': [obj: any]
  'deleted': []
}>()

const router = useRouter()
const api = useApi()
const form = ref<any>({ ...props.object })
const foremans = ref<any[]>([])
const saving = ref(false)

// ── Синхронизация формы при изменении объекта ────────────────────────
watch(() => props.object, obj => { form.value = { ...obj } }, { deep: true })

// ── Загрузка прорабов при открытии ───────────────────────────────────
watch(() => props.modelValue, async visible => {
  if (!visible) return
  try {
    const response = await api.get<{ contractors: any[] }>('/api/contractors/foreman')
    foremans.value = response?.contractors || []
  } catch (e) {
    console.error('[EditModal] Ошибка загрузки прорабов:', e)
  }
})

// ── Сохранение ───────────────────────────────────────────────────────
async function handleSubmit() {
  saving.value = true
  try {
    const updated = await api.put<any>(`/api/objects/${props.object.id}`, form.value)
    emit('updated', updated)
    emit('update:modelValue', false)
  } catch (e) {
    console.error('[EditModal] Ошибка сохранения:', e)
    alert('Не удалось сохранить изменения')
  } finally {
    saving.value = false
  }
}

// ── Смена статуса ────────────────────────────────────────────────────
async function setStatus(status: string) {
  try {
    const updated = await api.put<any>(`/api/objects/${props.object.id}`, { status })
    emit('updated', updated)
    emit('completed', updated)
    emit('update:modelValue', false)
  } catch (e) {
    console.error('[EditModal] Ошибка смены статуса:', e)
    alert('Не удалось изменить статус')
  }
}

// ── Подтверждение опасных действий ───────────────────────────────────
function confirmAction(action: 'complete' | 'cancel' | 'delete') {
  const messages = {
    complete: 'Завершить объект?',
    cancel: 'Отменить объект?',
    delete: 'Удалить объект? Это действие нельзя отменить.',
  }
  if (!confirm(messages[action])) return

  if (action === 'complete') setStatus('completed')
  else if (action === 'cancel') setStatus('canceled')
  else deleteObject()
}

async function deleteObject() {
  try {
    await api.delete(`/api/objects/${props.object.id}`)
    emit('deleted')
    emit('update:modelValue', false)
    router.push('/cabinet/objects')
  } catch (e) {
    console.error('[EditModal] Ошибка удаления:', e)
    alert('Не удалось удалить объект')
  }
}
</script>

<style lang="scss" scoped>
.edit-form {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.field-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 5px;

  &__label {
    font-size: var(--crm-text-sm);
    font-weight: 500;
    color: var(--crm-text-secondary);
  }

  &__input {
    background: var(--crm-bg-elevated);
    border: 1px solid var(--crm-border-hover);
    border-radius: var(--crm-radius-md);
    color: var(--crm-text-primary);
    font-size: var(--crm-text-md);
    font-family: var(--crm-font-sans);
    padding: 8px 12px;
    outline: none;
    transition: var(--crm-transition);
    width: 100%;
    color-scheme: dark;

    &::placeholder {
      color: var(--crm-text-disabled);
    }

    &:focus {
      border-color: var(--crm-accent);
      box-shadow: 0 0 0 3px var(--crm-accent-dim);
    }

    &--textarea {
      resize: vertical;
      min-height: 64px;
    }

    option {
      background: var(--crm-bg-elevated);
      color: var(--crm-text-primary);
    }
  }
}

// ── Футер ───────────────────────────────────────────────────────────
.modal-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  width: 100%;
  flex-wrap: wrap;

  &__actions {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-wrap: wrap;
  }

  &__submit {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-left: auto;
  }
}

// ── Кнопки ──────────────────────────────────────────────────────────
.crm-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 7px 12px;
  border-radius: var(--crm-radius-md);
  font-size: var(--crm-text-sm);
  font-weight: 500;
  cursor: pointer;
  transition: var(--crm-transition);
  white-space: nowrap;

  &:disabled {
    opacity: .5;
    cursor: not-allowed;
  }

  &--accent {
    background: var(--crm-accent-dim);
    border: 1px solid var(--crm-accent-border);
    color: var(--crm-accent);

    &:hover:not(:disabled) {
      background: rgba(0, 195, 245, .25);
    }
  }

  &--ghost {
    background: var(--crm-bg-elevated);
    border: 1px solid var(--crm-border-hover);
    color: var(--crm-text-secondary);

    &:hover {
      background: var(--crm-bg-overlay);
      color: var(--crm-text-primary);
    }
  }

  &--success {
    background: var(--crm-success-dim);
    border: 1px solid rgba(61, 214, 140, .35);
    color: var(--crm-success);

    &:hover {
      background: rgba(61, 214, 140, .25);
    }
  }

  &--warning {
    background: var(--crm-warning-dim);
    border: 1px solid rgba(245, 166, 35, .35);
    color: var(--crm-warning);

    &:hover {
      background: rgba(245, 166, 35, .25);
    }
  }

  &--danger {
    background: var(--crm-danger-dim);
    border: 1px solid rgba(242, 95, 92, .35);
    color: var(--crm-danger);

    &:hover {
      background: rgba(242, 95, 92, .25);
    }
  }

  &--ghost-danger {
    background: transparent;
    border: 1px solid var(--crm-border-hover);
    color: var(--crm-text-muted);

    &:hover {
      background: var(--crm-danger-dim);
      border-color: rgba(242, 95, 92, .35);
      color: var(--crm-danger);
    }
  }
}

.spin {
  animation: spin 1s linear infinite;
  display: inline-block;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 600px) {
  .modal-footer {
    flex-direction: column;
    align-items: stretch;

    &__actions,
    &__submit {
      width: 100%;
      justify-content: center;
    }
  }
}
</style>