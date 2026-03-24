<!-- app/components/pages/cabinet/objects/documents/Budget.vue -->
<template>
  <div class="budget">

    <!-- Заголовок -->
    <div class="budget__header">
      <div class="budget__title">
        <Icon name="mdi:calculator-variant-outline" size="16" />
        Смета
        <span v-if="items.length" class="budget__count">{{ items.length }}</span>
      </div>
      <button v-if="isAdmin" class="crm-btn crm-btn--accent crm-btn--sm" @click="openModal()">
        <Icon name="mdi:plus" size="14" /> Добавить
      </button>
    </div>

    <!-- Пусто -->
    <div v-if="!items.length" class="budget__empty">
      <Icon name="mdi:table-large" size="28" />
      <span>Смета пуста</span>
    </div>

    <!-- Таблица -->
    <div v-else class="budget__body">
      <div class="budget-table-wrap">
        <table class="budget-table">
          <thead>
            <tr>
              <th>Название</th>
              <th>Сумма</th>
              <th>Работы</th>
              <th>Приложение</th>
              <th>Комментарий</th>
              <th v-if="isAdmin">—</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, idx) in items" :key="item.id" :class="{ 'tr--alt': idx % 2 === 1 }">
              <td class="td--name">{{ item.name }}</td>
              <td class="td--amount">{{ formatCurrency(item.amount) }}</td>
              <td>
                <span :class="['work-badge', `work-badge--${item.workProgress}`]">
                  {{ workProgressText[item.workProgress] || item.workProgress }}
                </span>
              </td>
              <td>
                <span v-if="item.actStatus !== 'none'" :class="['act-badge', `act-badge--${item.actStatus}`]">
                  {{ actStatusText[item.actStatus] || '—' }}
                </span>
                <span v-else class="td--muted">—</span>
              </td>
              <td class="td--comment">{{ item.comment || '—' }}</td>
              <td v-if="isAdmin" class="td--actions">
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

      <!-- Итог -->
      <div class="budget__summary">
        <div class="summary-row">
          <span>Итого по смете</span>
          <strong>{{ formatCurrency(totalBudget) }}</strong>
        </div>
        <div class="summary-row summary-row--muted">
          <span>Фактический приход</span>
          <span>{{ formatCurrency(objectIncome) }}</span>
        </div>
        <div class="summary-row summary-row--divider">
          <span>Разница</span>
          <strong :class="difference >= 0 ? 'pos' : 'neg'">{{ formatCurrency(difference) }}</strong>
        </div>
      </div>
    </div>

    <!-- Модалка -->
    <PagesCabinetUiModal :visible="isModalOpen" :title="editingItem ? 'Редактировать позицию' : 'Добавить позицию'"
      size="lg" closable @update:visible="isModalOpen = false">
      <div class="modal-form">
        <div class="field-row">
          <div class="field field--grow">
            <label class="field__label">Название <span class="field__req">*</span></label>
            <input type="text" v-model="form.name" class="field__input" placeholder="Основная смета..." />
          </div>
          <div class="field" style="width: 150px;">
            <label class="field__label">Сумма <span class="field__req">*</span></label>
            <input type="number" step="0.01" min="0" v-model="form.amount" class="field__input" placeholder="0" />
          </div>
        </div>

        <div class="field-row">
          <div class="field field--grow">
            <label class="field__label">Ход работ</label>
            <select v-model="form.workProgress" class="field__input">
              <option value="queued">На очереди</option>
              <option value="in_progress">В работе</option>
              <option value="completed">Выполнено</option>
              <option value="cancelled">Отменено</option>
            </select>
          </div>
          <div class="field field--grow">
            <label class="field__label">Статус акта</label>
            <select v-model="form.actStatus" class="field__input">
              <option value="none">—</option>
              <option value="required">Нужно сделать</option>
              <option value="awaiting">Ждёт подписи</option>
              <option value="signed">Подписан</option>
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
          {{ editingItem ? 'Сохранить' : 'Добавить' }}
        </button>
      </template>
    </PagesCabinetUiModal>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'

const props = defineProps < {
  objectId: number
  isAdmin: boolean
  objectIncome: number
} > ()

const items = ref < any[] > ([])
const isModalOpen = ref(false)
const editingItem = ref < any > (null)
const form = ref({ name: '', amount: '', comment: '', workProgress: 'queued', actStatus: 'none' })

const workProgressText: Record<string, string> = {
  queued: 'На очереди', in_progress: 'В работе', completed: 'Выполнено', cancelled: 'Отменено'
}
const actStatusText: Record<string, string> = {
  none: '—', required: 'Нужно сделать', awaiting: 'Без подписи', signed: 'Подписан'
}

const totalBudget = computed(() =>
  items.value.reduce((s, i) => s + (Number(i.amount) || 0), 0)
)
const difference = computed(() => props.objectIncome - totalBudget.value)

function formatCurrency(v: any) {
  return new Intl.NumberFormat('ru-RU').format(Number(v) || 0) + ' ₽'
}

async function loadBudget() {
  try {
    const data = await $fetch < any[] > (`/api/objects/${props.objectId}/budget`)
    items.value = (data || []).map(i => ({ ...i, amount: parseFloat(i.amount) || 0 }))
  } catch (e) { console.error('[Смета] Ошибка загрузки:', e) }
}

function openModal(item: any = null) {
  editingItem.value = item
  form.value = item
    ? { name: item.name, amount: item.amount, comment: item.comment || '', workProgress: item.workProgress, actStatus: item.actStatus }
    : { name: '', amount: '', comment: '', workProgress: 'queued', actStatus: 'none' }
  isModalOpen.value = true
}

async function save() {
  const { name, amount, comment, workProgress, actStatus } = form.value
  if (!name || amount == null || Number(amount) < 0) { alert('Введите корректные название и сумму'); return }

  try {
    if (editingItem.value) {
      const updated = await $fetch < any > (`/api/objects/budget/${editingItem.value.id}`, {
        method: 'PUT', body: { name, amount, comment }, credentials: 'include'
      })
      if (workProgress !== editingItem.value.workProgress || actStatus !== editingItem.value.actStatus) {
        await $fetch(`/api/objects/budget/${editingItem.value.id}/status`, {
          method: 'PUT', body: { workProgress, actStatus }, credentials: 'include'
        })
      }
      const idx = items.value.findIndex(i => i.id === editingItem.value.id)
      if (idx !== -1) items.value.splice(idx, 1, { ...updated, workProgress, actStatus })
    } else {
      const created = await $fetch < any > (`/api/objects/${props.objectId}/budget`, {
        method: 'POST',
        body: { name, amount, comment, workProgress, actStatus, order: items.value.length },
        credentials: 'include'
      })
      items.value.push(created)
    }
    isModalOpen.value = false
  } catch (e) { console.error('[Смета] Ошибка сохранения:', e) }
}

function confirmDelete(id: number) {
  if (confirm('Удалить позицию сметы?')) deleteItem(id)
}

async function deleteItem(id: number) {
  try {
    await $fetch(`/api/objects/budget/${id}`, { method: 'DELETE', credentials: 'include' })
    items.value = items.value.filter(i => i.id !== id)
  } catch (e) { console.error('[Смета] Ошибка удаления:', e) }
}

loadBudget()
</script>

<style lang="scss" scoped>
.budget {
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

  &__body {
    display: flex;
    flex-direction: column;
  }

  &__summary {
    padding: 12px 16px;
    border-top: 1px solid var(--crm-border);
    display: flex;
    flex-direction: column;
    gap: 6px;
    background: var(--crm-bg-elevated);
  }
}

.summary-row {
  display: flex;
  justify-content: space-between;
  font-size: var(--crm-text-sm);
  color: var(--crm-text-secondary);

  strong {
    font-weight: 700;
    color: var(--crm-text-primary);
  }

  &--muted {
    color: var(--crm-text-muted);
    font-size: var(--crm-text-xs);
  }

  &--divider {
    padding-top: 8px;
    border-top: 1px solid var(--crm-border-hover);
    margin-top: 2px;
    font-weight: 500;
    color: var(--crm-text-primary);
  }
}

.budget-table-wrap {
  overflow-x: auto;
  scrollbar-width: thin;
  scrollbar-color: var(--crm-bg-overlay) transparent;
}

.budget-table {
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
  max-width: 160px;
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
}

.work-badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: var(--crm-radius-sm);
  font-size: var(--crm-text-xs);
  font-weight: 600;

  &--queued {
    background: var(--crm-info-dim);
    color: var(--crm-info);
  }

  &--in_progress {
    background: var(--crm-warning-dim);
    color: var(--crm-warning);
  }

  &--completed {
    background: var(--crm-success-dim);
    color: var(--crm-success);
  }

  &--cancelled {
    background: var(--crm-danger-dim);
    color: var(--crm-danger);
  }
}

.act-badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: var(--crm-radius-sm);
  font-size: var(--crm-text-xs);
  font-weight: 600;

  &--required {
    background: var(--crm-warning-dim);
    color: var(--crm-warning);
  }

  &--awaiting {
    background: var(--crm-info-dim);
    color: var(--crm-info);
  }

  &--signed {
    background: var(--crm-success-dim);
    color: var(--crm-success);
  }
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

  &--danger:hover {
    background: var(--crm-danger-dim);
    border-color: rgba(242, 95, 92, .3);
    color: var(--crm-danger);
  }
}

.pos {
  color: var(--crm-success);
}

.neg {
  color: var(--crm-danger);
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
    min-width: 160px;
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