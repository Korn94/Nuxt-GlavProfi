<!-- app/components/pages/cabinet/objects/documents/Budget.vue -->
<template>
  <Card title="Смета" bordered elevated>
    <!-- Заголовок с кнопкой -->
    <template #actions>
      <button v-if="isAdmin" @click="openModal()" class="btn btn-sm primary">+ Добавить</button>
    </template>

    <!-- Список позиций -->
    <div v-if="items.length === 0" class="empty-state">
      Пока нет данных о смете
    </div>

    <table v-else class="budget-table">
      <thead>
        <tr>
          <th>Название</th>
          <th>Сумма</th>
          <th>Комментарий</th>
          <th>Работы</th>
          <th>Приложение</th>
          <th v-if="isAdmin" width="80">Действия</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="item in items" :key="item.id">
          <td>{{ item.name }}</td>
          <td>{{ formatCurrency(item.amount) }}</td>
          <td>{{ item.comment || '—' }}</td>
          <td>
            <span :class="`badge work-${item.workProgress}`">
              {{ workProgressText[item.workProgress] }}
            </span>
          </td>
          <td>
            <span v-if="item.actStatus !== 'none'" :class="`badge act-${item.actStatus}`">
              {{ actStatusText[item.actStatus] }}
            </span>
            <span v-else class="text-muted">—</span>
          </td>
          <td v-if="isAdmin" class="actions-cell">
            <div class="action-buttons">
              <button @click="openModal(item)" class="btn btn-xs">Ред</button>
              <button @click="confirmDelete(item.id)" class="btn btn-danger btn-xs">✕</button>
            </div>
          </td>
        </tr>
      </tbody>
    </table>

    <!-- Итог -->
    <div v-if="items.length > 0" class="budget-summary">
      <div class="divider"></div>
      <div class="summary-row">
        <strong>Итого по смете:</strong>
        <strong>{{ formatCurrency(totalBudget) }}</strong>
      </div>
      <div class="summary-row muted">
        <span>Фактический приход:</span>
        <span>{{ formatCurrency(objectIncome) }}</span>
      </div>
      <div class="summary-row" :class="{ 'text-danger': difference < 0 }">
        <strong>Разница:</strong>
        <strong>{{ formatCurrency(difference) }}</strong>
      </div>
    </div>

    <!-- Модальное окно -->
    <PagesCabinetUiModal
      :visible="isModalOpen"
      @update:visible="isModalOpen = false"
      :title="editingItem ? 'Редактировать позицию' : 'Добавить позицию'"
      size="lg"
      closable
    >
      <!-- Форма -->
      <form @submit.prevent="save" class="modal-form">
        <div class="form-row">
          <div class="form-group flex-1">
            <label>Название *</label>
            <input
              v-model="form.name"
              type="text"
              class="form-input"
              placeholder="Основная смета, Утепление пола..."
              required
            />
          </div>
          <div class="form-group" style="width: 140px;">
            <label>Сумма *</label>
            <input
              v-model="form.amount"
              type="number"
              step="0.01"
              min="0"
              class="form-input text-right"
              placeholder="0.00"
              required
            />
          </div>
        </div>

        <div class="form-group">
          <label>Комментарий</label>
          <textarea
            v-model="form.comment"
            class="form-input"
            rows="3"
            placeholder="Дополнительная информация..."
          ></textarea>
        </div>

        <!-- Статусы -->
        <div class="form-row">
          <div class="form-group flex-1">
            <label>Ход работ</label>
            <select v-model="form.workProgress" class="form-select">
              <option value="queued">На очереди</option>
              <option value="in_progress">В работе</option>
              <option value="completed">Выполнено</option>
              <option value="cancelled">Отменено</option>
            </select>
          </div>
          <div class="form-group flex-1">
            <label>Статус акта</label>
            <select v-model="form.actStatus" class="form-select" :disabled="form.workProgress !== 'completed' && form.actStatus === 'none'">
              <option value="none">—</option>
              <option value="required">Нужно сделать</option>
              <option value="awaiting">Ждёт подписи</option>
              <option value="signed">Подписан</option>
            </select>
            <small v-if="form.workProgress === 'completed' && form.actStatus === 'none'" class="text-muted">
              Рекомендуется установить "Нужно сделать"
            </small>
          </div>
        </div>
      </form>

      <!-- Кнопки в футере -->
      <template #footer>
        <div class="modal-footer-controls">
          <button type="button" @click="isModalOpen = false" class="btn btn-secondary">
            Отмена
          </button>
          <button type="submit" @click="save" class="btn btn-primary">
            {{ editingItem ? 'Сохранить' : 'Добавить' }}
          </button>
        </div>
      </template>
    </PagesCabinetUiModal>
  </Card>
</template>

<script setup>
import { ref, computed, defineProps, nextTick } from 'vue'
import PagesCabinetUiModal from '@/components/pages/cabinet/ui/Modal.vue'
import Card from '@/components/pages/cabinet/ui/cards/card.vue'

const props = defineProps({
  objectId: {
    type: Number,
    required: true
  },
  isAdmin: {
    type: Boolean,
    default: false
  },
  objectIncome: {
    type: Number,
    default: 0
  }
})

// Данные
const items = ref([])

// Модальное окно
const isModalOpen = ref(false)
const editingItem = ref(null)
const form = ref({
  name: '',
  amount: '',
  comment: '',
  workProgress: 'queued',
  actStatus: 'none'
})

// Текстовые отображения
const workProgressText = {
  queued: 'На очереди',
  in_progress: 'В работе',
  completed: 'Выполнено',
  cancelled: 'Отменено'
}

const actStatusText = {
  none: '—',
  required: 'Нужно сделать',
  awaiting: 'Ждёт подписи',
  signed: 'Подписан'
}

// --- Загрузка ---
async function loadBudget() {
  try {
    const data = await $fetch(`/api/objects/${props.objectId}/budget`)
    items.value = data.map(i => ({
      ...i,
      amount: typeof i.amount === 'string' ? parseFloat(i.amount) : i.amount
    }))
  } catch (error) {
    console.error('Ошибка загрузки сметы:', error)
    alert('Не удалось загрузить смету')
  }
}

loadBudget()

// --- Модальное окно ---
function openModal(item = null) {
  editingItem.value = item

  if (item) {
    // Редактирование
    form.value = { ...item }
  } else {
    // Новая позиция
    form.value = {
      name: '',
      amount: '',
      comment: '',
      workProgress: 'queued',
      actStatus: 'none'
    }
  }

  isModalOpen.value = true

  nextTick(() => {
    const input = document.querySelector('.modal-body .form-input')
    input?.focus()
  })
}

// --- Сохранение ---
async function save() {
  const { name, amount, comment, workProgress, actStatus } = form.value
  if (!name || amount == null || amount < 0) {
    alert('Заполните корректные название и сумму')
    return
  }

  try {
    let updatedItem
    if (editingItem.value) {
      // Обновляем позицию
      updatedItem = await $fetch(`/api/objects/budget/${editingItem.value.id}`, {
        method: 'PUT',
        body: { name, amount, comment },
        credentials: 'include'
      })

      // Обновляем статусы отдельно
      if (
        workProgress !== editingItem.value.workProgress ||
        actStatus !== editingItem.value.actStatus
      ) {
        await $fetch(`/api/objects/budget/${editingItem.value.id}/status`, {
          method: 'PUT',
          body: { workProgress, actStatus },
          credentials: 'include'
        })
      }

      Object.assign(updatedItem, { workProgress, actStatus })
      const index = items.value.findIndex(i => i.id === editingItem.value.id)
      if (index !== -1) {
        items.value.splice(index, 1, updatedItem)
      }
    } else {
      // Создаём новую
      updatedItem = await $fetch(`/api/objects/${props.objectId}/budget`, {
        method: 'POST',
        body: { name, amount, comment, workProgress, actStatus, order: items.value.length },
        credentials: 'include'
      })
      items.value.push(updatedItem)
    }

    isModalOpen.value = false
  } catch (error) {
    console.error('Ошибка сохранения:', error)
    alert(`Не удалось ${editingItem.value ? 'обновить' : 'добавить'} позицию`)
  }
}

// --- Удаление ---
function confirmDelete(id) {
  const confirmed = window.confirm('Удалить эту позицию сметы?')
  if (confirmed) deleteItem(id)
}

async function deleteItem(id) {
  try {
    await $fetch(`/api/objects/budget/${id}`, {
      method: 'DELETE',
      credentials: 'include'
    })
    items.value = items.value.filter(i => i.id !== id)
  } catch (error) {
    console.error('Ошибка удаления:', error)
    alert('Не удалось удалить позицию')
  }
}

// --- Вычисляемые значения ---
const totalBudget = computed(() => {
  return items.value.reduce((sum, i) => sum + (Number(i.amount) || 0), 0)
})

const difference = computed(() => {
  return props.objectIncome - totalBudget.value
})

// --- Утилиты ---
const formatCurrency = (value) => {
  return new Intl.NumberFormat('ru-RU').format(value || 0) + ' ₽'
}
</script>

<style lang="scss" scoped>
.empty-state {
  padding: 2rem;
  text-align: center;
  color: $color-muted;
  background: #f9f9f9;
  border-radius: $border-radius;
  font-style: italic;
}

.budget-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.95rem;

  th {
    text-align: left;
    padding: 0.75rem;
    background: $sub-item-bg;
    color: $text-dark;
    font-weight: 600;
    border-bottom: 2px solid $border-color;
  }

  td {
    padding: 0.75rem;
    border-bottom: 1px solid $border-color;
  }

  .actions-cell {
    text-align: right;
  }

  .action-buttons {
    display: flex;
    gap: 0.5rem;
    justify-content: flex-end;
  }
}

// Бейджи статусов
.badge {
  padding: 0.25rem 0.5rem;
  border-radius: 999px;
  font-size: 0.85rem;
  font-weight: 500;

  &.work-queued { background: #e3f2fd; color: #1565c0; }
  &.work-in_progress { background: #fff8e1; color: #f57f17; }
  &.work-completed { background: #e8f5e9; color: #2e7d32; }
  &.work-cancelled { background: #ffebee; color: #c62828; }

  &.act-required { background: #ffecb3; color: #ff8f00; }
  &.act-awaiting { background: #bbdefb; color: #0d47a1; }
  &.act-signed { background: #c8e6c9; color: #1b5e20; }
}

.text-muted {
  color: $color-muted !important;
  font-style: italic;
}

// Форма в модалке
.modal-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-row {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;

  .flex-1 {
    flex: 1 1 200px;
  }
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;

  label {
    font-weight: 500;
    color: $text-dark;
  }

  .form-input,
  .form-select {
    padding: 0.5rem;
    border: 1px solid $border-color;
    border-radius: $border-radius;
    font-size: 0.95rem;
    background: white;
  }

  .text-right {
    text-align: right;
  }
}

// Итог
.budget-summary {
  margin-top: 1rem;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  padding: 0.5rem 0;

  &.muted {
    color: $color-muted;
    font-size: 0.95rem;
  }
}

.divider {
  height: 1px;
  background-color: $border-color;
  margin: 1rem 0;
}

.text-danger {
  color: #c62828 !important;
}

.btn-xs {
  padding: 0.25rem 0.5rem;
  font-size: 0.8rem;
}

// Футер модалки
.modal-footer-controls {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
  width: 100%;

  .btn {
    padding: 0.4rem 0.8rem;
    font-size: 0.9rem;
  }
}
</style>