<!-- app/components/pages/cabinet/objects/documents/ContractStatus.vue -->
<template>
  <div class="contract">

    <!-- Заголовок -->
    <div class="contract__header">
      <div class="contract__title">
        <Icon name="mdi:file-sign" size="16" />
        Договор
      </div>
      <template v-if="isAdmin">
        <button v-if="!contract" class="crm-btn crm-btn--accent crm-btn--sm" @click="openCreateModal">
          <Icon name="mdi:plus" size="14" /> Создать
        </button>
        <button v-else class="crm-btn crm-btn--ghost crm-btn--sm" @click="openEditModal">
          <Icon name="mdi:pencil-outline" size="14" /> Редактировать
        </button>
      </template>
    </div>

    <!-- Нет договора -->
    <div v-if="!contract" class="contract__empty">
      <Icon name="mdi:file-document-outline" size="28" />
      <span>Договор не создан</span>
    </div>

    <!-- Данные договора -->
    <div v-else class="contract__body">
      <div class="contract__row">
        <span class="contract__label">Тип</span>
        <span class="contract__value">{{ typeText }}</span>
      </div>
      <div class="contract__row">
        <span class="contract__label">Статус</span>
        <span :class="['status-badge', `status-badge--${contract.status}`]">
          {{ statusText }}
        </span>
      </div>
      <div class="contract__row">
        <span class="contract__label">Дата</span>
        <span class="contract__value">{{ formatDate(contract.statusDate) }}</span>
      </div>
      <div v-if="contract.comment" class="contract__row">
        <span class="contract__label">Комментарий</span>
        <span class="contract__value">{{ contract.comment }}</span>
      </div>
    </div>

    <!-- Модалка создания -->
    <PagesCabinetUiModal :visible="isCreateModalOpen" title="Создать договор" size="md" closable
      @update:visible="isCreateModalOpen = false">
      <div class="modal-form">
        <div class="field">
          <label class="field__label">Тип договора <span class="field__req">*</span></label>
          <select v-model="form.type" class="field__input">
            <option value="">— Выберите тип —</option>
            <option value="none">Не нужен</option>
            <option value="edo">ЭДО</option>
            <option value="paper">Бумажный</option>
            <option value="invoice">Счёт-договор</option>
          </select>
        </div>
        <div class="field">
          <label class="field__label">Статус <span class="field__req">*</span></label>
          <select v-model="form.status" class="field__input">
            <option value="prepared">Подготовлен</option>
            <option value="sent">Отправлен</option>
            <option value="awaiting">Ожидает подписи</option>
            <option value="signed">Подписан</option>
            <option value="cancelled">Отменён</option>
          </select>
        </div>
        <div class="field">
          <label class="field__label">Дата</label>
          <input type="date" v-model="form.statusDate" class="field__input" />
        </div>
        <div class="field">
          <label class="field__label">Комментарий</label>
          <textarea v-model="form.comment" class="field__input field__input--textarea" rows="2" />
        </div>
      </div>
      <template #footer>
        <button class="crm-btn crm-btn--ghost" @click="isCreateModalOpen = false">Отмена</button>
        <button class="crm-btn crm-btn--accent" @click="createContract">Создать</button>
      </template>
    </PagesCabinetUiModal>

    <!-- Модалка редактирования -->
    <PagesCabinetUiModal :visible="isEditModalOpen" title="Редактировать договор" size="md" closable
      @update:visible="isEditModalOpen = false">
      <div class="modal-form">
        <div class="field">
          <label class="field__label">Тип договора <span class="field__req">*</span></label>
          <select v-model="form.type" class="field__input">
            <option value="unassigned">— Не выбрано —</option>
            <option value="none">Не нужен</option>
            <option value="edo">ЭДО</option>
            <option value="paper">Бумажный</option>
            <option value="invoice">Счёт-договор</option>
          </select>
        </div>
        <div class="field">
          <label class="field__label">Статус <span class="field__req">*</span></label>
          <select v-model="form.status" class="field__input">
            <option value="prepared">Подготовлен</option>
            <option value="sent">Отправлен</option>
            <option value="awaiting">Ожидает подписи</option>
            <option value="signed">Подписан</option>
            <option value="cancelled">Отменён</option>
          </select>
        </div>
        <div class="field">
          <label class="field__label">Дата</label>
          <input type="date" v-model="form.statusDate" class="field__input" />
        </div>
        <div class="field">
          <label class="field__label">Комментарий</label>
          <textarea v-model="form.comment" class="field__input field__input--textarea" rows="2" />
        </div>
      </div>
      <template #footer>
        <button class="crm-btn crm-btn--ghost" @click="isEditModalOpen = false">Отмена</button>
        <button class="crm-btn crm-btn--accent" @click="updateContract">Сохранить</button>
      </template>
    </PagesCabinetUiModal>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useApi } from '~/composables/useApi'  // ✅ Добавляем импорт

const props = defineProps<{ object: any; isAdmin: boolean }>()
const emit = defineEmits<{ refresh: [] }>()

const api = useApi()  // ✅ Инициализируем

const contract = ref(props.object.contract || null)
const isCreateModalOpen = ref(false)
const isEditModalOpen = ref(false)

const form = ref({ type: '', status: 'prepared', statusDate: '', comment: '' })

watch(() => props.object.contract, v => { contract.value = v || null }, { deep: true })

const typeMap: Record<string, string> = {
  unassigned: '—', none: 'Не нужен', edo: 'ЭДО', paper: 'Бумажный', invoice: 'Счёт-договор'
}
const statusMap: Record<string, string> = {
  prepared: 'Подготовлен', sent: 'Отправлен',
  awaiting: 'Ожидает подписи', signed: 'Подписан', cancelled: 'Отменён'
}

const typeText = computed(() => typeMap[contract.value?.type] || '—')
const statusText = computed(() => statusMap[contract.value?.status] || '—')

function formatDate(d: string) {
  if (!d) return '—'
  const part = d.split(' ')[0]
  if (!part || !/^\d{4}-\d{2}-\d{2}$/.test(part)) return '—'
  return new Date(part).toLocaleDateString('ru-RU')
}

function openCreateModal() {
  form.value = {
    type: '',
    status: 'prepared',
    statusDate: new Date().toISOString().slice(0, 10),
    comment: ''
  }
  isCreateModalOpen.value = true
}

function openEditModal() {
  if (!contract.value) return
  const raw = (contract.value.statusDate ?? '') as string
  const datePart = raw.split(' ')[0] ?? ''
  form.value = {
    type: contract.value.type ?? '',
    status: contract.value.status ?? 'prepared',
    statusDate: /^\d{4}-\d{2}-\d{2}$/.test(datePart) ? datePart : '',
    comment: contract.value.comment ?? '',
  }
  isEditModalOpen.value = true
}

// ✅ ИСПРАВЛЕНО: используем api.post вместо $fetch
async function createContract() {
  if (!form.value.type || !form.value.status) { alert('Заполните тип и статус'); return }
  try {
    await api.post(`/api/objects/${props.object.id}/contract`, {
      type: form.value.type,
      status: form.value.status,
      statusDate: form.value.statusDate || null,
      comment: form.value.comment || null
    })
    isCreateModalOpen.value = false
    emit('refresh')
  } catch (err: any) {
    console.error('[ContractStatus] Ошибка создания:', err)
    alert('Не удалось создать договор')
  }
}

// ✅ ИСПРАВЛЕНО: используем api.put вместо $fetch
async function updateContract() {
  if (!form.value.type || !form.value.status) { alert('Заполните тип и статус'); return }
  try {
    await api.put(`/api/objects/contract/${contract.value!.id}`, {
      type: form.value.type,
      status: form.value.status,
      statusDate: form.value.statusDate || null,
      comment: form.value.comment || null
    })
    isEditModalOpen.value = false
    emit('refresh')
  } catch (err: any) {
    console.error('[ContractStatus] Ошибка обновления:', err)
    alert('Не удалось обновить договор')
  }
}
</script>

<style lang="scss" scoped>
.contract {
  background: var(--crm-bg-surface);
  border: 1px solid var(--crm-border);
  border-radius: var(--crm-radius-lg);
  overflow: hidden;

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px;
    border-bottom: 1px solid var(--crm-border);
    background: var(--crm-bg-elevated);
  }

  &__title {
    display: flex;
    align-items: center;
    gap: 7px;
    font-size: var(--crm-text-md);
    font-weight: 600;
    color: var(--crm-text-primary);
  }

  &__empty {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 30px;
    color: var(--crm-text-muted);
    font-size: var(--crm-text-sm);
  }

  &__body {
    padding: 14px 16px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  &__row {
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: var(--crm-text-sm);
  }

  &__label {
    min-width: 100px;
    color: var(--crm-text-muted);
    flex-shrink: 0;
  }

  &__value {
    color: var(--crm-text-primary);
    font-weight: 500;
  }
}

.status-badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 10px;
  border-radius: 20px;
  font-size: var(--crm-text-xs);
  font-weight: 600;

  &--prepared {
    background: var(--crm-warning-dim);
    border: 1px solid rgba(245, 166, 35, .3);
    color: var(--crm-warning);
  }

  &--sent {
    background: var(--crm-accent-dim);
    border: 1px solid var(--crm-accent-border);
    color: var(--crm-accent);
  }

  &--awaiting {
    background: var(--crm-info-dim);
    border: 1px solid rgba(91, 141, 239, .3);
    color: var(--crm-info);
  }

  &--signed {
    background: var(--crm-success-dim);
    border: 1px solid rgba(61, 214, 140, .3);
    color: var(--crm-success);
  }

  &--cancelled {
    background: var(--crm-danger-dim);
    border: 1px solid rgba(242, 95, 92, .3);
    color: var(--crm-danger);
  }
}

.modal-form {
  display: flex;
  flex-direction: column;
  gap: 14px;
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

  &__req {
    color: var(--crm-danger);
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
      min-height: 60px;
    }

    option {
      background: var(--crm-bg-elevated);
      color: var(--crm-text-primary);
    }
  }
}

.crm-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  border-radius: var(--crm-radius-md);
  font-weight: 500;
  cursor: pointer;
  transition: var(--crm-transition);

  &--sm {
    padding: 6px 12px;
    font-size: var(--crm-text-sm);
  }

  &--accent {
    background: var(--crm-accent-dim);
    border: 1px solid var(--crm-accent-border);
    color: var(--crm-accent);

    &:hover {
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
}
</style>