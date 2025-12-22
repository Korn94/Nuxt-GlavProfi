<!-- app/components/pages/cabinet/objects/documents/Acts.vue -->
<template>
  <Card title="Акты" bordered elevated no-padding-body>
    <!-- Заголовок + кнопка -->
    <template #actions>
      <button v-if="isAdmin" @click="isModalOpen = true" class="btn btn-sm primary">+ Добавить</button>
    </template>

    <!-- Пусто -->
    <div v-if="items.length === 0" class="empty-state">
      Пока не создано ни одного акта
    </div>

    <!-- Таблица -->
    <table v-else class="acts-table">
      <thead>
        <tr>
          <th>Название</th>
          <th>Сумма</th>
          <th>Комментарий</th>
          <th>Статус</th>
          <th v-if="isAdmin">Действия</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="item in items" :key="item.id">
          <td>{{ item.name }}</td>
          <td>{{ formatCurrency(item.amount) }}</td>
          <td>{{ item.comment || '—' }}</td>
          <td>
            <span :class="`badge status-${item.status}`">{{ statusText[item.status] }}</span>
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

    <!-- Модальное окно -->
    <PagesCabinetUiModal
      :visible="isModalOpen"
      @update:visible="isModalOpen = false"
      :title="editing ? 'Редактировать акт' : 'Добавить акт'"
      size="md"
    >
      <form @submit.prevent="save" class="modal-form">
        <div class="form-group">
          <label>Название *</label>
          <input v-model="form.name" type="text" class="form-input" required placeholder="Акт выполненных работ №1" />
        </div>
        <div class="form-row">
          <div class="form-group flex-1">
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
          <div class="form-group" style="width: 140px;">
            <label>Статус</label>
            <select v-model="form.status" class="form-select">
              <option value="prepared">Подготовлен</option>
              <option value="awaiting">Ждёт подписи</option>
              <option value="signed">Подписан</option>
            </select>
          </div>
        </div>
        <div class="form-group">
          <label>Комментарий</label>
          <textarea v-model="form.comment" class="form-input" rows="3" placeholder="Дополнительная информация..."></textarea>
        </div>
      </form>

      <template #footer>
        <div class="modal-footer-controls">
          <button type="button" @click="isModalOpen = false" class="btn btn-secondary">Отмена</button>
          <button type="button" @click="save" class="btn btn-primary">{{ editing ? 'Сохранить' : 'Добавить' }}</button>
        </div>
      </template>
    </PagesCabinetUiModal>
  </Card>
</template>

<script setup>
import { ref, computed } from 'vue'
import PagesCabinetUiModal from '@/components/pages/cabinet/ui/Modal.vue'
import Card from '@/components/pages/cabinet/ui/cards/card.vue'

const props = defineProps({
  objectId: Number,
  isAdmin: Boolean,
  items: Array
})

const emit = defineEmits(['refresh'])

const isModalOpen = ref(false)
const editing = ref(null)
const form = ref({ name: '', amount: '', comment: '', status: 'prepared' })

const statusText = {
  prepared: 'Нужно сделать',
  awaiting: 'Без подписи',
  signed: 'Подписан'
}

function openModal(item = null) {
  editing.value = item
  if (item) {
    form.value = { ...item }
  } else {
    form.value = { name: '', amount: '', comment: '', status: 'prepared' }
  }
  isModalOpen.value = true
}

async function save() {
  const { name, amount, comment, status } = form.value
  if (!name || amount == null || amount < 0) {
    alert('Введите корректные название и сумму')
    return
  }

  try {
    let result
    if (editing.value) {
      result = await $fetch(`/api/objects/acts/${editing.value.id}`, {
        method: 'PUT',
        body: { name, amount, comment, status }
      })
      const index = props.items.findIndex(i => i.id === editing.value.id)
      if (index !== -1) props.items.splice(index, 1, result)
      emit('update', result)
    } else {
      result = await $fetch(`/api/objects/${props.objectId}/acts`, {
        method: 'POST',
        body: { name, amount, comment, status }
      })
      emit('refresh', result)
    }
    isModalOpen.value = false
  } catch (error) {
    console.error('Ошибка сохранения акта:', error)
    alert('Не удалось сохранить акт')
  }
}

function confirmDelete(id) {
  if (window.confirm('Удалить этот акт?')) deleteItem(id)
}

async function deleteItem(id) {
  try {
    await $fetch(`/api/objects/acts/${id}`, { method: 'DELETE' })
    emit('refresh', id)
  } catch (error) {
    console.error('Ошибка удаления акта:', error)
    alert('Не удалось удалить акт')
  }
}

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

.acts-table {
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

.badge {
  padding: 0.25rem 0.75rem;
  border-radius: 999px;
  font-size: 0.85rem;
  font-weight: 500;

  &.status-prepared { background: #fff3e0; color: #ef6c00; }
  &.status-awaiting { background: #bbdefb; color: #0d47a1; }
  &.status-signed { background: #c8e6c9; color: #1b5e20; }
}

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
