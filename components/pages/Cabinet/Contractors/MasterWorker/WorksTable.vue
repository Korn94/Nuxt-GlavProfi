<template>
  <div class="block">
    <h3>Работы</h3>
    
    <table class="work-table">
      <thead>
        <tr>
          <th>Дата</th>
          <th>Сумма мастеру</th>
          <th>Сумма сметы</th>
          <th>Объект</th>
          <th>Вид работы</th>
          <th>Комментарий</th>
          <th>Статус</th>
          <th>Действия</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="work in works" :key="work.id">
          <td>{{ formatDate(work.createdAt) }}</td>
          <td>{{ work.amount }} ₽</td>
          <td>{{ work.clientAmount }} ₽</td>
          <td>{{ getObjectName(work.objectId) }}</td>
          <td>{{ work.workType }}</td>
          <td>{{ work.comment }}</td>
          <td :class="{
            'status-paid': work.paid,
            'status-pending': !work.paid
          }">
            {{ work.paid ? 'Оплачено' : 'Ожидает' }}
          </td>
          <td>
            <button 
              @click="openEditModal(work)" 
              class="btn-icon"
              title="Редактировать"
            >
              <Icon name="mdi:pencil" size="16px" />
            </button>
            <button 
              @click="deleteWork(work)" 
              class="btn-icon btn-delete"
              title="Удалить"
            >
              <Icon name="mdi:delete" size="16px" />
            </button>
          </td>
        </tr>
      </tbody>
    </table>

    <!-- Модальное окно редактирования -->
    <div v-if="editingWork" class="modal-overlay">
      <div class="modal">
        <h4>Редактировать работу</h4>
        
        <div class="form-group">
          <label>Сумма мастеру</label>
          <input v-model.number="editingWork.amount" type="number" />
        </div>

        <div class="form-group">
          <label>Сумма сметы</label>
          <input v-model.number="editingWork.clientAmount" type="number" />
        </div>

        <div class="form-group">
          <label>Объект</label>
          <select v-model="editingWork.objectId">
            <option v-for="obj in objects" :key="obj.id" :value="obj.id">
              {{ obj.name }}
            </option>
          </select>
        </div>

        <div class="form-group">
          <label>Вид работы</label>
          <select v-model="editingWork.workType">
            <option v-for="type in workTypes" :key="type" :value="type">
              {{ type }}
            </option>
          </select>
        </div>

        <div class="form-group">
          <label>Комментарий</label>
          <textarea v-model="editingWork.comment"></textarea>
        </div>

        <div class="modal-actions">
          <button @click="saveWork" class="btn primary">Сохранить</button>
          <button @click="closeModal" class="btn secondary">Отмена</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useNuxtApp } from '#app'
import { useRoute } from 'vue-router'

const props = defineProps({
  works: {
    type: Array,
    required: true
  },
  objects: {
    type: Array,
    required: true
  }
})

const emit = defineEmits(['update:work', 'delete:work'])

const { $fetch } = useNuxtApp()
const route = useRoute()

const workTypes = [
  'Отделка', 'Электрика', 'Плитка', 'Сантехника', 'Перегородки ГКЛ',
  'Сварка', 'Бетонные работы', 'Кровля', 'Перегородки Камень',
  'Демонтаж', 'Мусор', 'Прочее'
]

const editingWork = ref(null)

function formatDate(dateString) {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

function getObjectName(objectId) {
  const obj = props.objects.find(o => o.id === objectId)
  return obj ? obj.name : 'Объект не найден'
}

function openEditModal(work) {
  editingWork.value = { ...work }
}

function closeModal() {
  editingWork.value = null
}

async function saveWork() {
  try {
    const response = await $fetch(`/api/works/${editingWork.value.id}`, {
      method: 'PUT',
      body: {
        workerAmount: editingWork.value.amount,
        customerAmount: editingWork.value.clientAmount,
        objectId: editingWork.value.objectId,
        workTypes: editingWork.value.workType,
        comment: editingWork.value.comment
      },
      credentials: 'include'
    })

    // Обновляем данные в списке
    emit('update:work', {
      ...response,
      amount: parseFloat(response.workerAmount),
      clientAmount: parseFloat(response.customerAmount),
      paid: response.accepted,
      paymentDate: response.accepted ? response.acceptedDate : response.paymentDate
    })

    closeModal()
  } catch (error) {
    console.error('Ошибка сохранения работы:', error)
  }
}

async function deleteWork(work) {
  if (!confirm('Вы уверены, что хотите удалить эту работу?')) return

  try {
    await $fetch(`/api/works/${work.id}`, {
      method: 'DELETE',
      credentials: 'include'
    })

    emit('delete:work', work.id)
  } catch (error) {
    console.error('Ошибка удаления работы:', error)
  }
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

.status-paid {
  color: #28a745;
  font-weight: 500;
}

.status-pending {
  color: #6c757d;
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
</style>