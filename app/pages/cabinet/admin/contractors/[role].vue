<template>
  <div class="contractors-page">
    <div class="page-header">
      <h1 class="page-title">{{ title }}</h1>
      <button @click="showAddModal = true" class="btn btn-primary">
        <Icon name="solar:add-circle-bold" class="btn-icon" />
        Добавить контрагента
      </button>
    </div>

    <!-- Сообщение об ошибке -->
    <div v-if="errorMessage" class="alert alert-error">
      <Icon name="solar:danger-circle-bold" class="alert-icon" />
      {{ errorMessage }}
    </div>

    <!-- Счетчики -->
    <div class="card-tabs">
      <div class="card-tab" :class="{ active: currentTab === 'all' }" @click="currentTab = 'all'">
        <p class="tab-label">Все</p>
        <span class="tab-counter">{{ contractors.length }}</span>
      </div>
    </div>

    <!-- Поиск -->
    <div class="search-bar">
      <input 
        v-model="searchQuery" 
        type="text" 
        placeholder="Поиск по имени контрагента..." 
        class="form-input"
      />
    </div>

    <!-- Список контрагентов -->
    <div class="contractors-grid">
      <div 
        v-for="contractor in filteredContractors" 
        :key="contractor.id" 
        class="contractor-card"
      >
        <div class="card-header">
          <div class="card-title">
            <Icon name="solar:user-bold" class="card-icon" />
            <router-link 
              :to="`/cabinet/admin/contractors/${route.params.role}/${contractor.id}`"
              class="btn btn-icon"
            >
              <h3>{{ contractor.name }}</h3>
            </router-link>
          </div>
          <div class="card-actions">
            <!-- Кнопка для редактирования контрагента -->
            <button 
              @click="openEditModal(contractor)" 
              class="btn btn-icon"
            >
              <Icon name="solar:pen-bold" />
            </button>
            
            <!-- Кнопка удаления -->
            <button 
              @click="confirmDelete(contractor.id)" 
              class="btn btn-icon"
            >
              <Icon name="solar:trash-bin-minimalistic-bold" />
            </button>
          </div>
        </div>
        
        <div class="card-body">
          <div class="info-item">
            <Icon name="solar:wallet-money-bold" class="info-icon" />
            <div class="info-content">
              <label>Баланс</label>
              <b>{{ formatBalance(contractor.balance) }}</b>
            </div>
          </div>
          
          <div class="info-item">
            <Icon name="solar:chat-round-bold" class="info-icon" />
            <div class="info-content">
              <label>Комментарий</label>
              <span class="text-muted">{{ contractor.comment || 'Нет комментария' }}</span>
            </div>
          </div>
        </div>
        
        <div class="card-footer">
          <span class="badge" :class="getRoleBadgeClass(contractor.role)">
            {{ getRoleLabel(contractor.role) }}
          </span>
          <span class="text-muted">ID: {{ contractor.id }}</span>
        </div>
      </div>
    </div>

    <!-- Модальное окно добавления/редактирования -->
    <PagesCabinetUiModal
      :visible="showAddModal || showEditModal"
      @update:visible="closeModal"
      :title="isEditing ? 'Редактирование контрагента' : 'Добавление контрагента'"
      size="md"
      closable
    >
      <form @submit.prevent="handleSubmit" class="contractor-form">
        <div class="form-group">
          <label>Имя</label>
          <input v-model="form.name" type="text" class="form-input" required />
        </div>

        <div class="form-group">
          <label>Роль</label>
          <select v-model="form.role" class="form-select" required>
            <option value="master">Мастер</option>
            <option value="foreman">Прораб</option>
            <option value="worker">Рабочий</option>
            <option value="office">Офис</option>
          </select>
        </div>

        <div class="form-group">
          <label>Баланс</label>
          <input v-model="form.balance" type="number" class="form-input" min="0" step="0.01" />
        </div>

        <div class="form-group">
          <label>Комментарий</label>
          <textarea v-model="form.comment" class="form-input" rows="3"></textarea>
        </div>
      </form>

      <template #footer>
        <div class="modal-footer-controls">
          <button 
            type="button" 
            @click="closeModal" 
            class="btn btn-secondary"
          >
            Отмена
          </button>
          <button 
            type="submit" 
            @click="handleSubmit" 
            class="btn btn-primary"
          >
            {{ isEditing ? 'Сохранить' : 'Добавить' }}
          </button>
        </div>
      </template>
    </PagesCabinetUiModal>

    <!-- Модальное окно подтверждения удаления -->
    <PagesCabinetUiModal
      :visible="showDeleteConfirm"
      @update:visible="showDeleteConfirm = false"
      title="Подтверждение удаления"
      size="sm"
      closable
    >
      <p>Вы уверены, что хотите удалить этого контрагента? Это действие нельзя отменить.</p>
      
      <template #footer>
        <div class="modal-footer-controls">
          <button 
            type="button" 
            @click="showDeleteConfirm = false" 
            class="btn btn-secondary"
          >
            Отмена
          </button>
          <button 
            type="button" 
            @click="deleteContractor" 
            class="btn btn-danger"
          >
            Удалить
          </button>
        </div>
      </template>
    </PagesCabinetUiModal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useNuxtApp } from '#app'
import { definePageMeta } from '#imports'

definePageMeta({
  layout: 'cabinet',
  middleware: 'role',
  allowedRoles: ['admin']
})

const route = useRoute()
const router = useRouter()

// Заголовок страницы
const title = computed(() => {
  switch (route.params.role) {
    case 'master': return 'Мастера'
    case 'foreman': return 'Прорабы'
    case 'worker': return 'Рабочие'
    case 'office': return 'Офисные сотрудники'
    default: return 'Контрагенты'
  }
})

// Данные
const contractors = ref([])
const errorMessage = ref(null)
const searchQuery = ref('')
const currentTab = ref('all')
const showAddModal = ref(false)
const showEditModal = ref(false)
const showDeleteConfirm = ref(false)
const deletingId = ref(null)
const isEditing = ref(false)

// Форма
const form = ref({
  id: null,
  name: '',
  role: 'worker',
  balance: 0,
  comment: ''
})

// Загрузка данных
onMounted(async () => {
  try {
    const data = await $fetch('/api/contractors', {
      method: 'GET',
      params: { type: route.params.role },
      credentials: 'include'
    })

    if (Array.isArray(data)) {
      contractors.value = data
    } else {
      console.warn('Неожиданный формат данных:', data)
      contractors.value = []
      errorMessage.value = 'Получены некорректные данные'
    }
  } catch (err) {
    console.error('Ошибка при загрузке контрагентов:', err)
    errorMessage.value = 'Не удалось загрузить список контрагентов.'
  }
})

// Вычисляемые свойства
const filteredContractors = computed(() => {
  let result = [...contractors.value]
  
  // Фильтрация по поиску
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(c => 
      c.name.toLowerCase().includes(query) ||
      (c.comment && c.comment.toLowerCase().includes(query))
    )
  }
  
  return result
})

// Методы
const openEditModal = (contractor) => {
  form.value = { ...contractor }
  isEditing.value = true
  showEditModal.value = true
}

const closeModal = () => {
  showAddModal.value = false
  showEditModal.value = false
  form.value = {
    id: null,
    name: '',
    role: 'worker',
    balance: 0,
    comment: ''
  }
}

const handleSubmit = async () => {
  try {
    let result
    const payload = {
      name: form.value.name,
      role: form.value.role,
      balance: Number(form.value.balance),
      comment: form.value.comment
    }
    
    if (isEditing.value) {
      result = await $fetch(`/api/contractors/${form.value.id}`, {
        method: 'PUT',
        body: payload,
        credentials: 'include'
      })
    } else {
      result = await $fetch('/api/contractors', {
        method: 'POST',
        body: {
          ...payload,
          type: route.params.role
        },
        credentials: 'include'
      })
    }
    
    // Обновляем список
    const index = contractors.value.findIndex(c => c.id === result.id)
    if (index > -1) {
      contractors.value[index] = result
    } else {
      contractors.value.push(result)
    }
    
    closeModal()
    alert('Контрагент успешно сохранен')
  } catch (err) {
    console.error('Ошибка сохранения контрагента:', err)
    alert('Ошибка при сохранении контрагента')
  }
}

const confirmDelete = (id) => {
  deletingId.value = id
  showDeleteConfirm = true
}

const deleteContractor = async () => {
  try {
    await $fetch(`/api/contractors/${deletingId.value}`, {
      method: 'DELETE',
      credentials: 'include'
    })
    
    contractors.value = contractors.value.filter(c => c.id !== deletingId.value)
    showDeleteConfirm = false
    alert('Контрагент успешно удален')
  } catch (err) {
    console.error('Ошибка удаления:', err)
    alert('Ошибка при удалении контрагента')
  }
}

const formatBalance = (balance) => {
  return new Intl.NumberFormat('ru-RU', { 
    style: 'currency', 
    currency: 'RUB' 
  }).format(balance)
}

const getRoleLabel = (role) => {
  const labels = {
    master: 'Мастер',
    foreman: 'Прораб',
    worker: 'Рабочий',
    office: 'Офис'
  }
  return labels[role] || role
}

const getRoleBadgeClass = (role) => {
  const classes = {
    master: 'badge-master',
    foreman: 'badge-foreman',
    worker: 'badge-worker',
    office: 'badge-office'
  }
  return classes[role] || ''
}
</script>

<style lang="scss" scoped>
.contractors-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-title {
  font-size: 1.8rem;
  color: $text-dark;
}

.contractors-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
  margin-top: 1.5rem;
}

.contractor-card {
  background: white;
  border-radius: $border-radius;
  transition: $transition;
  border: 1px solid $border-color;
  
  &:hover {
    transform: translateY(-5px);
    box-shadow: $box-shadow;
  }
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid $border-color;
}

.card-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  
  h3 {
    font-size: 1.2rem;
    margin: 0;
  }
}

.card-actions {
  display: flex;
  gap: 0.5rem;
}

.card-body {
  padding: 1rem;
}

.info-item {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  margin-bottom: 1rem;
  
  &:last-child {
    margin-bottom: 0;
  }
}

.info-icon {
  color: $blue;
  font-size: 1.2rem;
  min-width: 20px;
}

.info-content {
  label {
    display: block;
    font-weight: 500;
    color: $text-dark;
    font-size: 0.9rem;
    margin-bottom: 0.25rem;
  }
  
  b {
    font-weight: 600;
    color: $text-dark;
  }
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  background: $sub-item-bg;
  border-top: 1px solid $border-color;
  border-radius: 0 0 $border-radius $border-radius;
}

.badge {
  padding: 0.25rem 0.75rem;
  border-radius: $border-radius;
  font-weight: 500;
  font-size: 0.8rem;
  
  &-master {
    background: #e3f2fd;
    color: #1565c0;
  }
  
  &-foreman {
    background: #e8f5e9;
    color: #2e7d32;
  }
  
  &-worker {
    background: #fff8e1;
    color: #f57f17;
  }
  
  &-office {
    background: #f3e5f5;
    color: #6a1b9a;
  }
}

// Стили для табов
.card-tabs {
  display: flex;
  gap: 0.5rem;
  margin: 1rem 0;
}

.card-tab {
  padding: 0.5rem 1rem;
  border-radius: $border-radius;
  background: $sub-item-bg;
  cursor: pointer;
  transition: $transition;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  
  &.active {
    background: $blue;
    color: white;
    
    .tab-counter {
      background: rgba(255, 255, 255, 0.2);
    }
  }
  
  .tab-counter {
    background: $border-color;
    color: $text-dark;
    border-radius: 12px;
    padding: 0.15rem 0.5rem;
    font-size: 0.85rem;
  }
}

// Поиск
.search-bar {
  margin-bottom: 1.5rem;
}

// Модальное окно
.contractor-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

// Адаптивность
@media (max-width: 768px) {
  .contractors-grid {
    grid-template-columns: 1fr;
  }
  
  .card-tabs {
    flex-wrap: wrap;
  }
}

// Анимация
.contractor-card {
  opacity: 0;
  transform: translateY(10px);
  animation: fadeInUp 0.3s ease forwards;
  
  @for $i from 1 through 20 {
    &:nth-child(#{$i}) {
      animation-delay: #{$i * 0.05}s;
    }
  }
}

@keyframes fadeInUp {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>