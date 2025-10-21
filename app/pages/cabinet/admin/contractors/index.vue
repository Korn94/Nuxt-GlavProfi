<!-- app/components/pages/cabinet/workers/index.vue -->
<template>
  <PagesCabinetUiLayoutPageTitle title="Контрагенты">
    <template #actions>
      <button class="btn btn-primary" @click="openAddModal">
        <Icon name="mdi:plus" size="16" />
        Новый
      </button>
    </template>
  </PagesCabinetUiLayoutPageTitle>

  <!-- Модальное окно -->
  <PagesCabinetUiModal
    :visible="isAddModalOpen"
    @close="closeAddModal"
    title="Добавить контрагента"
    size="md"
    :closable="true"
  >
    <!-- Форма -->
    <ContractorAddForm
      v-model:formData="modalFormData"
      v-model:errors="formErrors"
      :users="availableUsers"
    />

    <!-- Футер -->
    <template #footer>
      <button type="button" @click="closeAddModal" class="btn btn-secondary">Отмена</button>
      <button type="button" @click="submitForm" class="btn btn-primary" :disabled="loading">
        {{ loading ? 'Сохранение...' : 'Создать контрагента' }}
      </button>
    </template>
  </PagesCabinetUiModal>

  <!-- Основной контент -->
  <div class="cabinet-page">
    <Card title="Категории контрагентов" elevated>
      <template #icon>
        <Icon name="mdi:account-group" size="24" />
      </template>

      <div v-if="contractors.length > 0" class="categories-content">
        <ul class="categories-list">
          <li v-for="category in categories" :key="category.type" class="category-item">
            <NuxtLink :to="`/cabinet/admin/contractors/${category.path}`" class="category-link">
              <span class="label">{{ category.title }}</span>
              <span class="count">{{ category.count }}</span>
            </NuxtLink>
          </li>
          <NuxtLink :to="`/cabinet/admin/users`" class="category-link">Пользователи CRM</NuxtLink>
        </ul>
      </div>

      <div v-else class="empty-state">
        <Icon name="ic:outline-people-alt" size="40" />
        <p>Нет доступных контрагентов</p>
      </div>

      <template #footer>
        Всего контрагентов: {{ contractors.length }}
      </template>
    </Card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import ContractorAddForm from '@/components/pages/cabinet/Admin/contractors/AddForm.vue'

const Card = defineAsyncComponent(() => import('@/components/pages/cabinet/ui/cards/card.vue'))

// Состояние
const contractors = ref([])
const isAddModalOpen = ref(false)
const loading = ref(false)

// Данные формы
const modalFormData = ref({
  name: '',
  phone: '',
  role: 'master',
  userId: '',
  works: [],
  comment: ''
})
const formErrors = ref({})

// Все пользователи
const allUsers = ref([])

// Доступные пользователи (для передачи в форму)
const availableUsers = computed(() => {
  return allUsers.value.filter(user => {
    return !user.contractorId || user.contractorType === modalFormData.value.role
  })
})

// Категории
const categoryMap = {
  master: { path: 'master', title: 'Мастера' },
  worker: { path: 'worker', title: 'Разнорабочие' },
  foreman: { path: 'foreman', title: 'Прорабы' },
  office: { path: 'office', title: 'Офис' }
}

const categories = computed(() =>
  Object.values(categoryMap).map(cat => ({
    ...cat,
    count: contractors.value.filter(c => c.type === cat.path).length
  }))
)

// Открыть модалку
function openAddModal() {
  resetForm()
  isAddModalOpen.value = true
}

// Закрыть модалку
function closeAddModal() {
  isAddModalOpen.value = false
  formErrors.value = {}
}

// Сброс формы
function resetForm() {
  modalFormData.value = {
    name: '',
    phone: '',
    role: 'master',
    userId: '',
    works: [],
    comment: ''
  }
  formErrors.value = {}
}

// Валидация
function validateForm() {
  formErrors.value = {}
  let valid = true

  if (!modalFormData.value.name.trim()) {
    formErrors.value.name = 'Имя обязательно'
    valid = false
  }

  return valid
}

// Отправка формы
async function submitForm() {
  if (!validateForm()) return

  loading.value = true
  try {
    const body = {
      type: modalFormData.value.role,
      data: {
        name: modalFormData.value.name,
        phone: modalFormData.value.phone,
        comment: modalFormData.value.comment,
        works: Array.isArray(modalFormData.value.works)
          ? modalFormData.value.works.join(', ')
          : modalFormData.value.works || '',
        userId: modalFormData.value.userId || null
      }
    }

    await $fetch('/api/contractors', {
      method: 'POST',
      body,
      credentials: 'include'
    })

    successMessage.value = 'Контрагент успешно создан!'
    await fetchContractors() // обновляем список
    closeAddModal()
  } catch (error) {
    formErrors.value.form = 'Не удалось создать контрагента'
    console.error(error)
  } finally {
    loading.value = false
  }
}

// Загрузка данных
async function fetchContractors() {
  try {
    const res = await $fetch('/api/contractors', { credentials: 'include' })
    contractors.value = Array.isArray(res) ? res : []
  } catch (err) {
    console.error('Ошибка загрузки контрагентов:', err)
    contractors.value = []
  }
}

async function fetchUsers() {
  try {
    const data = await $fetch('/api/users', { credentials: 'include' })
    allUsers.value = data.users || []
  } catch (err) {
    console.error('Ошибка загрузки пользователей:', err)
  }
}

onMounted(() => {
  fetchContractors()
  fetchUsers()
})

definePageMeta({
  layout: 'cabinet',
  middleware: 'role',
  allowedRoles: ['admin']
})

useHead({
  meta: [
    { name: 'robots', content: 'noindex, nofollow' },
  ],
  title: 'CRM — Контрагенты'
})
</script>

<style lang="scss" scoped>
@use 'sass:map';

.cabinet-page {
  max-width: 900px;
  margin: 0 auto;
  padding: 1rem;
}

.categories-content {
  width: 100%;
}

.categories-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;

  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }
}

.category-item {
  border-radius: 8px;
  overflow: hidden;
}

.category-link {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  background-color: $sub-item-bg;
  border: 1px solid $border-color;
  border-radius: 8px;
  font-size: 0.95rem;
  color: $text-gray;
  text-decoration: none;
  transition: all 0.2s ease;

  .label {
    font-weight: 500;
    color: $text-dark;
  }

  .count {
    font-weight: bold;
    color: $blue;
    min-width: 36px;
    text-align: right;
  }

  &:hover {
    background-color: $blue20;
    transform: translateY(-1px);
    box-shadow: $box-shadow;
  }
}

.empty-state {
  text-align: center;
  padding: 2rem 1rem;
  color: $text-gray;

  svg {
    opacity: 0.6;
    margin-bottom: 0.5rem;
  }

  p {
    font-size: 0.95rem;
  }
}
</style>