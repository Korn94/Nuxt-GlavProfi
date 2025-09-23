<!-- app/pages/cabinet/objects/index.vue -->
<template>
  <!-- Заголовок страницы с кнопкой добавления -->
  <PagesCabinetUiLayoutPageTitle title="Объекты">
    <template #actions>
      <div v-if="['admin', 'manager'].includes(user?.role)" class="add-object-form">
        <input
          v-model="newObjectName"
          placeholder="Название объекта"
          @keyup.enter="addObject"
          :class="{ error: addError }"
        />
        <button @click="addObject" :disabled="!newObjectName || loading" class="btn-primary">
          Добавить
        </button>
      </div>
    </template>
  </PagesCabinetUiLayoutPageTitle>

  <!-- Основной контент -->
  <div class="cabinet-page">
    <Card :loading="loading" elevated>
      <!-- Вкладки слева в заголовке карточки -->
      <template #header>
        <div class="tabs-container">
          <button
            v-for="tab in tabs"
            :key="tab.value"
            :class="{ active: currentTab === tab.value }"
            @click="switchTab(tab.value)"
          >
            {{ tab.label }}
          </button>
        </div>
      </template>

      <!-- Счётчик "X / Y" справа -->
      <template #actions>
        <div class="card-tab-counter" title="Активные / Завершённые">
          {{ counts.active }} / {{ counts.completed }}
        </div>
      </template>

      <!-- Сообщение об ошибке или успехе -->
      <div v-if="errorMessage" class="alert alert-error">
        {{ errorMessage }}
      </div>
      <div v-else-if="successMessage" class="alert alert-success">
        {{ successMessage }}
      </div>

      <!-- Список объектов -->
      <ul v-if="filteredObjects.length" class="object-list">
        <li v-for="object in filteredObjects" :key="object.id" class="object-item">
          <router-link :to="`/cabinet/objects/${object.id}`" class="object-name">
            {{ object.name }}
          </router-link>
          <div class="object-actions">
            <span class="balance">Баланс: <strong>{{ formatNumber(object.totalBalance) }} ₽</strong></span>
          </div>
        </li>
      </ul>

      <!-- Пустое состояние -->
      <div v-else class="empty-state">
        Нет объектов в категории "{{ currentTabLabel }}"
      </div>

      <!-- Футер с общим количеством -->
      <template #footer>
        Всего: {{ filteredObjects.length }} объект(а)
      </template>
    </Card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import Card from '~/components/pages/cabinet/ui/cards/card.vue'

definePageMeta({
  layout: 'cabinet',
  middleware: 'role',
  allowedRoles: ['admin']
})

const router = useRouter()

// Текущий пользователь
const user = ref(null)

// Данные
const objects = ref([])
const newObjectName = ref('')
const currentTab = ref('active')
const loading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

// Вкладки
const tabs = [
  { label: 'В работе', value: 'active' },
  { label: 'Завершённые', value: 'completed' }
]

// Вычисляем активную вкладку для отображения
const currentTabLabel = computed(() => {
  return tabs.find(t => t.value === currentTab.value)?.label || 'Объекты'
})

// Подсчёты по статусам
const counts = computed(() => {
  const active = objects.value.filter(obj => obj.status === 'active').length
  const completed = objects.value.filter(obj => obj.status === 'completed').length
  return { active, completed }
})

// Отфильтрованные объекты (для текущей вкладки)
const filteredObjects = computed(() => {
  return objects.value.filter(obj => obj.status === currentTab.value)
})

// Ошибки
const addError = computed(() => !newObjectName.value.trim())

// Форматирование чисел
const formatNumber = (num) => num.toLocaleString('ru-RU')

// Переключение вкладок
async function switchTab(tabValue) {
  currentTab.value = tabValue
  await fetchObjects()
}

// Загрузка пользователя и объектов
onMounted(async () => {
  try {
    const currentUser = await $fetch('/api/me', {
      method: 'GET',
      credentials: 'include'
    })
    user.value = currentUser.user
  } catch (error) {
    console.error('Ошибка получения пользователя:', error)
    user.value = null
    errorMessage.value = 'Не удалось загрузить данные пользователя'
    setTimeout(() => (errorMessage.value = ''), 5000)
  }

  await fetchObjects()
})

// Получение объектов
async function fetchObjects() {
  loading.value = true
  errorMessage.value = ''
  try {
    const data = await $fetch('/api/objects', {
      method: 'GET',
      params: { status: currentTab.value },
      credentials: 'include'
    })

    // Инициализируем объекты с нулевым балансом
    objects.value = data.map(obj => ({
      ...obj,
      totalBalance: 0
    }))

    // Загружаем актуальные балансы
    await updateBalances()
  } catch (error) {
    console.error('Ошибка загрузки объектов:', error)
    errorMessage.value = 'Не удалось загрузить объекты'
  } finally {
    loading.value = false
  }
}

// Обновление балансов
async function updateBalances() {
  try {
    const updatedObjects = await Promise.all(
      objects.value.map(async (obj) => {
        const balanceData = await $fetch(`/api/objects/${obj.id}/balance`, {
          method: 'GET',
          credentials: 'include'
        })
        return {
          ...obj,
          totalBalance: parseFloat(balanceData.totalBalance) || 0
        }
      })
    )
    objects.value = updatedObjects
  } catch (error) {
    console.error('Не удалось загрузить балансы', error)
  }
}

// Добавление объекта
async function addObject() {
  if (!newObjectName.value.trim()) return

  loading.value = true
  errorMessage.value = ''
  try {
    const created = await $fetch('/api/objects', {
      method: 'POST',
      body: { name: newObjectName.value.trim(), status: currentTab.value },
      credentials: 'include'
    })

    objects.value.unshift({
      ...created,
      totalBalance: 0
    })

    newObjectName.value = ''
    successMessage.value = 'Объект успешно создан!'
    setTimeout(() => (successMessage.value = ''), 3000)
  } catch (error) {
    console.error('Ошибка создания объекта:', error)
    errorMessage.value = 'Не удалось создать объект'
  } finally {
    loading.value = false
  }
}
</script>

<style lang="scss" scoped>
.cabinet-page {
  max-width: 1000px;
  margin: 0 auto;
  padding: 1.5rem;
}

.tabs-container {
  display: flex;
  gap: 0.5rem;

  button {
    padding: 0.5rem 1rem;
    border: none;
    background: $background-light;
    border-radius: $border-radius;
    cursor: pointer;
    transition: all 0.2s ease;
    font-size: 0.9rem;

    &.active {
      background: $blue;
      color: white;
    }

    &:hover:not(.active) {
      background: #d8d8d8;
    }
  }
}

// Счётчик в правой части заголовка карточки
.card-tab-counter {
  font-size: 0.95rem;
  color: $color-muted;
  font-weight: 600;
  padding: 0.5rem 1rem;
  background: rgba($blue, 0.05);
  border-radius: $border-radius;
  min-width: 80px;
  text-align: end;
  font-family: 'Courier', monospace; // улучшает выравнивание цифр
}

.add-object-form {
  display: flex;
  gap: 0.5rem;
  align-items: center;

  input {
    flex: 1;
    padding: 0.6rem 0.8rem;
    border: 1px solid $border-color;
    border-radius: $border-radius;
    font-size: 0.9rem;
  }

  .btn-primary {
    padding: 0.6rem 1rem;
    background: $color-success;
    color: white;
    border: none;
    border-radius: $border-radius;
    cursor: pointer;
    font-size: 0.9rem;

    &:disabled {
      background: #868282;
      cursor: not-allowed;
    }
  }
}

.alert {
  padding: 0.75rem 1rem;
  border-radius: $border-radius;
  font-size: 0.875rem;
  margin-bottom: 1rem;

  &-error {
    background: #ffeaea;
    color: $color-danger;
    border: 1px solid #f1948a;
  }

  &-success {
    background: #ecfde4;
    color: $color-success;
    border: 1px solid #a3e635;
  }
}

.object-list {
  list-style: none;
  padding: 0;
  margin: 0;

  .object-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem 1rem;
    border-bottom: 1px solid $border-color;
    transition: background 0.2s ease;

    &:last-child {
      border-bottom: none;
    }

    &:hover {
      background: rgba($blue, 0.02);
    }
  }

  .object-name {
    flex: 1;
    font-size: 1rem;
    color: $text-dark;
    text-decoration: none;
    font-weight: 500;

    &:hover {
      color: $blue;
    }
  }

  .object-actions {
    display: flex;
    gap: 0.75rem;
    align-items: center;
    font-size: 0.875rem;
    white-space: nowrap;
  }

  .balance {
    color: $color-muted;
  }
}

.empty-state {
  text-align: center;
  padding: 2rem;
  color: $color-muted;
  font-style: italic;
}

.btn-sm {
  padding: 0.4rem 0.75rem;
  border: none;
  border-radius: $border-radius;
  font-size: 0.8rem;
  cursor: pointer;

  &.btn-success {
    background: $color-success;
    color: white;
  }

  &.btn-warning {
    background: $color-danger;
    color: white;
  }

  &.btn-danger {
    background: $color-danger;
    color: white;
  }
}
</style>