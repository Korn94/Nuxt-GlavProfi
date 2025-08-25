<template>
  <div class="block">
    <h3>История прибыли</h3>
    <div v-if="history.length === 0" class="no-data">
      Нет записей об истории прибыли
    </div>
    <table v-else class="work-table">
      <thead>
        <tr>
          <th>Дата</th>
          <th>Сумма</th>
          <th>Объект</th>
          <th>Описание</th>
          <th>Действия</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="item in history" :key="item.id">
          <td>{{ formatDate(item.date) }}</td>
          <td :class="{ 'text-success': item.amount > 0, 'text-danger': item.amount < 0 }">
            {{ formatAmount(item.amount) }} ₽
          </td>
          <td>{{ getObjectName(item.objectId) }}</td>
          <td>{{ item.description }}</td>
          <td>
            <button @click="openEditModal(item)" class="btn-icon" title="Редактировать">
              <Icon name="mdi:pencil" size="16px" />
            </button>
            <button @click="deleteItem(item)" class="btn-icon btn-delete" title="Удалить">
              <Icon name="mdi:delete" size="16px" />
            </button>
          </td>
        </tr>
      </tbody>
    </table>

    <!-- Модальное окно редактирования -->
    <div v-if="editingItem" class="modal-overlay">
      <div class="modal">
        <h4>Редактировать запись</h4>
        <div class="form-group">
          <label>Сумма</label>
          <input
            v-model.number="editingItem.amount"
            type="number"
            step="0.01"
            :class="{ error: formErrors.amount }"
          />
          <div v-if="formErrors.amount" class="error-message">{{ formErrors.amount }}</div>
        </div>
        <div class="form-group">
          <label>Объект</label>
          <select v-model="editingItem.objectId" :class="{ error: formErrors.object }">
            <option value="">Выберите объект</option>
            <option v-for="obj in objects" :key="obj.id" :value="obj.id">
              {{ obj.name }}
            </option>
          </select>
          <div v-if="formErrors.object" class="error-message">{{ formErrors.object }}</div>
        </div>
        <div class="form-group">
          <label>Описание</label>
          <textarea v-model="editingItem.description"></textarea>
        </div>
        <div class="form-group">
          <label>Дата</label>
          <input v-model="editingItem.date" type="date" />
        </div>
        <div class="modal-actions">
          <button @click="saveItem" class="btn primary">Сохранить</button>
          <button @click="closeModal" class="btn secondary">Отмена</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useNuxtApp } from '#app'

const props = defineProps({
  history: {
    type: Array,
    required: true
  },
  objects: {
    type: Array,
    required: true
  }
})

const emit = defineEmits(['update:item', 'delete:item', 'error'])

const { $fetch } = useNuxtApp()

// Используем глобально объявленную функцию formatDate
const formatDate = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

const formatAmount = (amount) => {
  return parseFloat(amount).toFixed(2)
}

const getObjectName = (objectId) => {
  const obj = props.objects.find(o => o.id === objectId)
  return obj ? obj.name : 'Объект не найден'
}

const editingItem = ref(null)
const formErrors = ref({})
const errorMessage = ref(null)

function openEditModal(item) {
  editingItem.value = { ...item }
}

function closeModal() {
  editingItem.value = null
  formErrors.value = {}
}

async function saveItem() {
  if (!validateForm()) return
  try {
    const response = await $fetch(`/api/foreman-profit/${editingItem.value.id}`, {
      method: 'PUT',
      body: {
        amount: editingItem.value.amount,
        objectId: editingItem.value.objectId,
        description: editingItem.value.description,
        date: editingItem.value.date
      },
      credentials: 'include'
    })
    const formattedItem = {
      ...response,
      amount: parseFloat(response.amount),
      date: response.date
    }
    emit('update:item', formattedItem)
    closeModal()
  } catch (error) {
    console.error('Ошибка сохранения записи:', error)
    errorMessage.value = 'Не удалось сохранить изменения'
  }
}

async function deleteItem(item) {
  if (!confirm('Вы уверены, что хотите удалить эту запись?')) return
  try {
    await $fetch(`/api/foreman-profit/${item.id}`, {
      method: 'DELETE',
      credentials: 'include'
    })
    emit('delete:item', item.id)
  } catch (error) {
    console.error('Ошибка удаления записи:', error)
    emit('error', 'Не удалось удалить запись')
  }
}

function validateForm() {
  formErrors.value = {}
  if (editingItem.value.amount === null || isNaN(editingItem.value.amount)) {
    formErrors.value.amount = 'Сумма обязательна'
  }
  if (!editingItem.value.objectId) {
    formErrors.value.object = 'Объект обязателен'
  }
  return Object.keys(formErrors.value).length === 0
}
</script>

<style scoped>
.work-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 1rem;
}

.work-table thead {
  background: #f8f9fa;
  text-align: left;
}

.work-table th,
.work-table td {
  padding: 0.8rem 1rem;
  border-bottom: 1px solid #eee;
}

.text-success {
  color: #28a745;
  font-weight: 500;
}

.text-danger {
  color: #dc3545;
  font-weight: 500;
}

.btn-icon {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.4rem;
  margin-right: 0.4rem;
}

.btn-delete {
  color: #dc3545;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  max-width: 500px;
  width: 100%;
  position: relative;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 0.6rem 0.8rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.95rem;
}

.form-group input.error,
.form-group select.error {
  border-color: #dc3545;
}

.error-message {
  color: #dc3545;
  font-size: 0.85rem;
  margin-top: 0.25rem;
  display: block;
}

.modal-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 1.5rem;
}

.btn {
  padding: 0.6rem 1.2rem;
  border-radius: 4px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn.primary {
  background: #007bff;
  color: white;
  border: none;
}

.btn.secondary {
  background: #6c757d;
  color: white;
  border: none;
}

.no-data {
  padding: 1.5rem;
  text-align: center;
  color: #6c757d;
  font-style: italic;
}
</style>