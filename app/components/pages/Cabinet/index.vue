<!-- app/components/pages/cabinet/index.vue -->
<template>
  <PagesCabinetUiLayoutPageTitle title="Главная страница" />

  <div class="cabinet-page">
    <!-- Карточка профиля -->
    <Card :loading="isLoading" title="Ваш профиль" elevated class="profile-card">
      <template #icon>
        <Icon name="material-symbols-light:person" size="24" />
      </template>

      <div v-if="data" class="profile-content">
        <!-- Основная информация о пользователе -->
        <div class="user-section">
          <p class="welcome-text">Добро пожаловать, <strong>{{ data.user.name }}</strong>!</p>
          <p class="role"><Icon name="mdi:shield-account" size="16" /> Роль: <span>{{ data.user.role }}</span></p>
        </div>

        <!-- Информация о контрагенте (если есть) -->
        <div v-if="contractorData" class="contractor-section">
          <h3 class="section-title">Информация о контрагенте</h3>
          <ul class="info-list">
            <li><strong>Тип:</strong> {{ formatContractorType(contractorData.type) }}</li>
            <li><strong>Имя:</strong> {{ contractorData.name }}</li>
            <li><strong>Телефон:</strong> {{ contractorData.phone || 'Не указан' }}</li>
            <li>
              <strong>Баланс:</strong>
              <span class="balance">{{ formatBalance(contractorData.balance) }} ₽</span>
            </li>
          </ul>
        </div>

        <!-- Сообщение, если нет данных о контрагенте -->
        <div v-else class="no-contractor">
          <p>У вас пока нет привязанного контрагента.</p>
        </div>
      </div>

      <!-- Отображается при ошибке или отсутствии данных -->
      <div v-else class="error-state">
        <Icon name="ic:outline-warning" size="40" class="error-icon" />
        <p>Не удалось загрузить данные пользователя.</p>
      </div>

      <!-- Действия -->
      <template #actions>
        <button class="btn btn-secondary" @click="refreshData">
          <Icon name="mdi:refresh" size="18" />
          Обновить
        </button>
      </template>

      <!-- Футер с дополнительной информацией -->
      <template #footer>
        Последнее обновление: {{ new Date().toLocaleString('ru-RU') }}
      </template>
    </Card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useAuth } from '~/composables/useAuth'
import { navigateTo } from '#app'

// Компоненты
const Card = defineAsyncComponent(() => import('@/components/pages/cabinet/ui/cards/card.vue'))

// Состояние
const data = ref(null)
const contractorData = ref(null)
const isLoading = ref(true)

// Типы контрагентов для отображения
const contractorTypeMap = {
  office: 'offices',
  foreman: 'foremans',
  worker: 'workers',
  master: 'masters'
}

const displayTypeLabels = {
  office: 'Офис',
  foreman: 'Прораб',
  worker: 'Рабочий',
  master: 'Мастер'
}

// Форматирование типа
const formatContractorType = (type) => {
  return displayTypeLabels[type] || 'Неизвестно'
}

// Форматирование баланса
const formatBalance = (amount) => {
  return new Intl.NumberFormat('ru-RU').format(amount || 0)
}

// Загрузка данных
const fetchData = async () => {
  isLoading.value = true
  try {
    const response = await $fetch('/api/me', {
      method: 'GET',
      credentials: 'include'
    })

    if (response.status === 401) {
      const { logout } = useAuth()
      logout()
      return navigateTo('/login')
    }

    data.value = response

    const user = data.value.user
    if (user.contractorId && user.contractorType) {
      const type = contractorTypeMap[user.contractorType]
      if (type) {
        const res = await $fetch(`/api/contractors/${type}/${user.contractorId}`, {
          method: 'GET',
          credentials: 'include'
        })
        contractorData.value = res
      }
    }
  } catch (err) {
    console.error('Ошибка загрузки данных:', err)
    data.value = null
  } finally {
    isLoading.value = false
  }
}

// Обновление данных
const refreshData = () => {
  fetchData()
}

onMounted(() => {
  fetchData()
})
</script>

<style lang="scss" scoped>
.profile-card {
  width: 900px;
  :deep(.card__body) {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }
}

.profile-content {
  width: 100%;
}

.welcome-text {
  font-size: 1.25rem;
  margin: 0 0 0.5rem 0;

  strong {
    color: $blue;
    font-weight: 600;
  }
}

.role {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.95rem;
  color: $color-muted;

  span {
    font-weight: 500;
  }
}

.section-title {
  font-size: 1.1rem;
  color: $color-dark;
  margin: 0.5rem 0;
}

.info-list {
  list-style: none;
  padding: 0;
  margin: 0;

  li {
    display: flex;
    justify-content: space-between;
    padding: 0.5rem 0;
    border-bottom: 1px dashed $border-color;
    font-size: 0.95rem;
    color: $color-muted;

    &:last-child {
      border-bottom: none;
    }

    strong {
      color: $color-dark;
      min-width: 100px;
      font-weight: 500;
    }

    .balance {
      color: $color-success;
      font-weight: bold;
      font-size: 1.1rem;
    }
  }
}

.no-contractor {
  padding: 1rem;
  border-radius: 8px;
  border: 1px dashed $border-color;
  text-align: center;
  color: $color-muted;
  font-size: 0.95rem;
}

.error-state {
  text-align: center;
  padding: 2rem 1rem;
  color: $color-danger;

  .error-icon {
    margin-bottom: 0.75rem;
    opacity: 0.7;
  }
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s ease;

  &-secondary {
    background-color: $background-light;
    color: #495057;
    border: 1px solid $border-color;

    &:hover {
      border: 1px solid $blue;
    }
  }
}
</style>