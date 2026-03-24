<!-- app/components/pages/cabinet/objects/documents/Invoices.vue -->
<template>
  <div class="docs-card">

    <div class="docs-card__header">
      <div class="docs-card__title">
        <Icon name="mdi:receipt" size="16" />
        Счета
        <span v-if="localItems.length" class="docs-card__count">{{ localItems.length }}</span>
      </div>
      <button v-if="isAdmin" class="crm-btn crm-btn--accent crm-btn--sm" @click="openModal()">
        <Icon name="mdi:plus" size="14" /> Добавить
      </button>
    </div>

    <div v-if="!localItems.length" class="docs-card__empty">
      <Icon name="mdi:receipt-outline" size="28" />
      <span>Нет счётов</span>
    </div>

    <div v-else class="docs-table-wrap">
      <table class="docs-table">
        <thead>
          <tr>
            <th>Название</th>
            <th>Сумма</th>
            <th>Тип</th>
            <th>Статус</th>
            <th>Комментарий</th>
            <th v-if="isAdmin">—</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, idx) in localItems" :key="item.id" :class="{ 'tr--alt': idx % 2 === 1 }">
            <td class="td--name">{{ item.name }}</td>
            <td class="td--amount">{{ formatCurrency(item.amount) }}</td>
            <td>
              <span v-if="item.subtype" class="subtype-badge">
                {{ subtypeText[item.subtype] || item.subtype }}
              </span>
              <span v-else class="td--muted">—</span>
            </td>
            <td>
              <span :class="['status-badge', `status-badge--${item.status}`]">
                {{ statusText[item.status] || item.status }}
              </span>
            </td>
            <td class="td--comment">{{ item.comment || '—' }}</td>
            <td v-if="isAdmin" class="td--actions">
              <!-- Быстрые действия -->
              <button v-if="item.status === 'prepared'" class="action-btn action-btn--send"
                @click="setStatus(item, 'sent')" title="Отправить">
                <Icon name="mdi:send-outline" size="13" />
              </button>
              <button v-if="item.status === 'sent'" class="action-btn action-btn--pay" @click="setStatus(item, 'paid')"
                title="Оплачено">
                <Icon name="mdi:check" size="13" />
              </button>
              <button class="action-btn" @click="openModal(item)" title="Редактировать">
                <Icon name="mdi:pencil-outline" size="14" />
              </button>
              <button class="action-btn action-btn--danger" @click="confirmDelete(item.id)" title="Удалить">
                <Icon name="mdi:trash-can-outline" size="14" />
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Модалка -->
    <PagesCabinetUiModal :visible="isModalOpen" :title="editing ? 'Редактировать счёт' : 'Добавить счёт'" size="md"
      closable @update:visible="isModalOpen = false">
      <div class="modal-form">
        <div class="field">
          <label class="field__label">Название <span class="field__req">*</span></label>
          <input type="text" v-model="form.name" class="field__input" placeholder="Аванс, Закрывающий..." />
        </div>
        <div class="field-row">
          <div class="field field--grow">
            <label class="field__label">Сумма <span class="field__req">*</span></label>
            <input type="number" step="0.01" min="0" v-model="form.amount" class="field__input" placeholder="0" />
          </div>
          <div class="field field--grow">
            <label class="field__label">Тип</label>
            <select v-model="form.subtype" class="field__input">
              <option value="">— Не указан —</option>
              <option value="advance">Аванс</option>
              <option value="intermediate">Промежуточный</option>
              <option value="final">Закрывающий</option>
              <option value="additional">Дополнительный</option>
            </select>
          </div>
        </div>
        <div class="field">
          <label class="field__label">Комментарий</label>
          <textarea v-model="form.comment" class="field__input field__input--textarea" rows="2" />
        </div>
      </div>
      <template #footer>
        <button class="crm-btn crm-btn--ghost" @click="isModalOpen = false">Отмена</button>
        <button class="crm-btn crm-btn--accent" @click="save">
          {{ editing ? 'Сохранить' : 'Добавить' }}
        </button>
      </template>
    </PagesCabinetUiModal>

  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

const props = defineProps < {
  objectId: number
  invoices: any[]
  isAdmin: boolean
} > ()

const emit = defineEmits < {
  add: [item: any]
  update: [item: any]
  delete: [id: number]
} > ()

const localItems = ref < any[] > (props.invoices || [])
const isModalOpen = ref(false)
const editing = ref < any > (null)
const form = ref({ name: '', amount: '', comment: '', subtype: '' })

watch(() => props.invoices, v => { localItems.value = v || [] }, { deep: true })

const statusText: Record<string, string> = {
  prepared: 'Подготовлен', sent: 'Отправлен', paid: 'Оплачен'
}
const subtypeText: Record<string, string> = {
  advance: 'Аванс', intermediate: 'Промежуточный', final: 'Закрывающий', additional: 'Дополнительный'
}

function formatCurrency(v: any) {
  return new Intl.NumberFormat('ru-RU').format(Number(v) || 0) + ' ₽'
}

function openModal(item: any = null) {
  editing.value = item
  form.value = item
    ? { name: item.name, amount: item.amount, comment: item.comment || '', subtype: item.subtype || '' }
    : { name: '', amount: '', comment: '', subtype: '' }
  isModalOpen.value = true
}

async function save() {
  const { name, amount, comment, subtype } = form.value
  if (!name || amount == null || Number(amount) < 0) { alert('Введите корректные название и сумму'); return }

  try {
    let result: any
    if (editing.value) {
      result = await $fetch < any > (`/api/objects/invoices/${editing.value.id}`, {
        method: 'PUT', body: { name, amount, comment, subtype }, credentials: 'include'
      })
      const idx = localItems.value.findIndex(i => i.id === editing.value.id)
      if (idx !== -1) localItems.value.splice(idx, 1, result)
      emit('update', result)
    } else {
      result = await $fetch < any > (`/api/objects/${props.objectId}/invoices`, {
        method: 'POST', body: { name, amount, comment, subtype }, credentials: 'include'
      })
      localItems.value.push(result)
      emit('add', result)
    }
    isModalOpen.value = false
  } catch { alert('Не удалось сохранить счёт') }
}

async function setStatus(item: any, newStatus: string) {
  try {
    const updated = await $fetch < any > (`/api/objects/invoices/${item.id}`, {
      method: 'PUT', body: { status: newStatus }, credentials: 'include'
    })
    const idx = localItems.value.findIndex(i => i.id === item.id)
    if (idx !== -1) localItems.value.splice(idx, 1, updated)
    emit('update', updated)
  } catch { alert('Не удалось изменить статус') }
}

function confirmDelete(id: number) {
  if (confirm('Удалить этот счёт?')) deleteItem(id)
}

async function deleteItem(id: number) {
  try {
    await $fetch(`/api/objects/invoices/${id}`, { method: 'DELETE', credentials: 'include' })
    localItems.value = localItems.value.filter(i => i.id !== id)
    emit('delete', id)
  } catch { alert('Не удалось удалить счёт') }
}
</script>

<style lang="scss" scoped>
.docs-card {
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

  &__count {
    font-size: var(--crm-text-xs);
    font-weight: 700;
    padding: 1px 7px;
    background: var(--crm-bg-overlay);
    border: 1px solid var(--crm-border-hover);
    border-radius: 10px;
    color: var(--crm-text-muted);
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
}

.docs-table-wrap {
  overflow-x: auto;
  scrollbar-width: thin;
  scrollbar-color: var(--crm-bg-overlay) transparent;
}

.docs-table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--crm-text-sm);

  th {
    padding: 9px 14px;
    background: var(--crm-bg-elevated);
    font-size: var(--crm-text-xs);
    font-weight: 600;
    color: var(--crm-text-muted);
    text-transform: uppercase;
    letter-spacing: .05em;
    text-align: left;
    white-space: nowrap;
    border-bottom: 1px solid var(--crm-border);
  }

  td {
    padding: 10px 14px;
    border-bottom: 1px solid var(--crm-border);
    color: var(--crm-text-secondary);
    vertical-align: middle;
  }

  tr:last-child td {
    border-bottom: none;
  }

  tr.tr--alt td {
    background: rgba(255, 255, 255, .02);
  }

  tr:hover td {
    background: var(--crm-bg-elevated);
  }
}

.td--name {
  font-weight: 500;
  color: var(--crm-text-primary);
}

.td--amount {
  font-weight: 700;
  color: var(--crm-text-primary);
  white-space: nowrap;
}

.td--comment {
  color: var(--crm-text-muted);
  max-width: 180px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.td--muted {
  color: var(--crm-text-disabled);
}

.td--actions {
  white-space: nowrap;
  display: flex;
  gap: 4px;
  align-items: center;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: var(--crm-radius-sm);
  font-size: var(--crm-text-xs);
  font-weight: 600;

  &--prepared {
    background: var(--crm-warning-dim);
    color: var(--crm-warning);
  }

  &--sent {
    background: var(--crm-accent-dim);
    color: var(--crm-accent);
  }

  &--paid {
    background: var(--crm-success-dim);
    color: var(--crm-success);
  }
}

.subtype-badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: var(--crm-radius-sm);
  font-size: var(--crm-text-xs);
  font-weight: 500;
  background: var(--crm-bg-overlay);
  border: 1px solid var(--crm-border-hover);
  color: var(--crm-text-muted);
}

.action-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  background: transparent;
  border: 1px solid transparent;
  border-radius: var(--crm-radius-sm);
  color: var(--crm-text-muted);
  cursor: pointer;
  transition: var(--crm-transition);

  &:hover {
    background: var(--crm-bg-overlay);
    border-color: var(--crm-border-hover);
    color: var(--crm-text-primary);
  }

  &--send:hover {
    background: var(--crm-accent-dim);
    border-color: var(--crm-accent-border);
    color: var(--crm-accent);
  }

  &--pay:hover {
    background: var(--crm-success-dim);
    border-color: rgba(61, 214, 140, .3);
    color: var(--crm-success);
  }

  &--danger:hover {
    background: var(--crm-danger-dim);
    border-color: rgba(242, 95, 92, .3);
    color: var(--crm-danger);
  }
}

.modal-form {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.field-row {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 5px;

  &--grow {
    flex: 1;
    min-width: 140px;
  }

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