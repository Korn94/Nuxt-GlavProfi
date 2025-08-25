<template>
  <div class="container">
    <h1>Объекты</h1>

    <!-- Статистика -->
    <div class="stats">
      <div class="stat-card">
        <h3>В работе</h3>
        <p><strong>{{ activeCount }}</strong></p>
      </div>
      <div class="stat-card">
        <h3>Завершено</h3>
        <p><strong>{{ completedCount }}</strong></p>
      </div>
    </div>

    <!-- Вкладки -->
    <div class="tabs">
      <button
        v-for="tab in tabs"
        :key="tab.value"
        :class="{ active: currentTab === tab.value }"
        @click="currentTab = tab.value"
      >
        {{ tab.label }}
      </button>
    </div>

    <!-- Форма добавления объекта -->
    <div v-if="['admin', 'manager'].includes(user?.role)" class="add-form">
      <input
        v-model="newObjectName"
        placeholder="Название объекта"
        :class="{ error: !newObjectName }"
      />
      <button @click="addObject" :disabled="!newObjectName">Добавить объект</button>
    </div>

    <!-- Список объектов -->
    <ul class="object-list">
      <li v-for="object in filteredObjects" :key="object.id" class="object-item">
        <router-link :to="`/cabinet/objects/${object.id}`">
          {{ object.name }}
        </router-link>
        <div class="actions">
          <div class="balance">
            Баланс: <strong>{{ object.totalBalance }} ₽</strong>
            <!-- Баланс: <strong>{{ object.balance }} ₽</strong> -->
          </div>
          <button
            v-if="user?.role === 'admin'"
            @click="toggleStatus(object.id)"
            class="status-button"
          >
            {{ object.status === 'active' ? 'Завершить' : 'Возобновить' }}
          </button>
          <button
            v-if="user?.role === 'admin'"
            @click="deleteObject(object.id)"
            class="delete-button"
          >
            Удалить
          </button>
        </div>
      </li>
    </ul>

    <!-- Сообщения -->
    <div v-if="errorMessage" class="error-message">{{ errorMessage }}</div>
    <div v-if="successMessage" class="success-message">{{ successMessage }}</div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

definePageMeta({
  layout: 'cabinet',
  middleware: 'role',
  allowedRoles: ['admin']
})

const route = useRoute()
const router = useRouter()

// Текущий пользователь
const user = ref(null)

// Данные объектов
const objects = ref([])
const newObjectName = ref('')
const currentTab = ref('active')
const tabs = [
  { label: 'В работе', value: 'active' },
  { label: 'Завершённые', value: 'completed' }
]

// Сообщения
const errorMessage = ref('')
const successMessage = ref('')

// Загрузка пользователя из localStorage
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
  }

  await fetchObjects()
})

// Загрузка объектов
onMounted(async () => {
  await fetchObjects()
})

async function fetchObjects() {
  try {
    const data = await $fetch('/api/objects', {
      method: 'GET',
      params: { status: currentTab.value },
      credentials: 'include'
    })

    // Инициализируем баланс
    objects.value = data.map(obj => ({
      ...obj,
      balance: 0
    }))

    await updateObjectBalances()
  } catch (error) {
    console.error('Ошибка загрузки объектов:', error)
    errorMessage.value = 'Не удалось загрузить список объектов'
    setTimeout(() => errorMessage.value = '', 5000)
  }
}

// Обновление баланса каждого объекта
async function updateObjectBalances() {
  try {
    const updated = await Promise.all(
      objects.value.map(async (obj) => {
        const res = await $fetch(`/api/objects/${obj.id}/balance`, {
          method: 'GET',
          credentials: 'include'
        })
        return {
          ...obj,
          balance: res.balance || 0
        }
      })
    )
    objects.value = updated
  } catch (error) {
    console.error('Ошибка обновления балансов:', error)
    errorMessage.value = 'Не удалось загрузить балансы объектов'
    setTimeout(() => errorMessage.value = '', 5000)
  }
}

// Добавление нового объекта
async function addObject() {
  if (!newObjectName.value.trim()) return

  try {
    const created = await $fetch('/api/objects', {
      method: 'POST',
      body: {
        name: newObjectName.value,
        status: currentTab.value
      },
      credentials: 'include'
    })

    objects.value.push({
      ...created,
      balance: 0
    })

    newObjectName.value = ''
    successMessage.value = 'Объект успешно создан!'
    setTimeout(() => successMessage.value = '', 3000)
  } catch (error) {
    console.error('Ошибка при создании объекта:', error)
    errorMessage.value = 'Не удалось создать объект'
    setTimeout(() => errorMessage.value = '', 5000)
  }
}

// Удаление объекта
async function deleteObject(id) {
  if (!confirm('Вы уверены, что хотите удалить этот объект?')) return

  try {
    await $fetch(`/api/objects/${id}`, {
      method: 'DELETE',
      credentials: 'include'
    })

    objects.value = objects.value.filter(obj => obj.id !== id)
    successMessage.value = 'Объект удален'
    setTimeout(() => successMessage.value = '', 3000)
  } catch (error) {
    console.error('Ошибка удаления объекта:', error)
    errorMessage.value = 'Не удалось удалить объект'
    setTimeout(() => errorMessage.value = '', 5000)
  }
}

// Изменение статуса объекта
async function toggleStatus(id) {
  const object = objects.value.find(obj => obj.id === id)
  if (!object) return

  const newStatus = object.status === 'active' ? 'completed' : 'active'

  try {
    await $fetch(`/api/objects/${id}`, {
      method: 'PUT',
      body: { status: newStatus },
      credentials: 'include'
    })

    object.status = newStatus
    successMessage.value = 'Статус объекта изменён'
    setTimeout(() => successMessage.value = '', 3000)
  } catch (error) {
    console.error('Ошибка изменения статуса:', error)
    errorMessage.value = 'Не удалось изменить статус объекта'
    setTimeout(() => errorMessage.value = '', 5000)
  }
}

// Фильтрация по вкладкам
const filteredObjects = computed(() => {
  return objects.value.filter(obj => obj.status === currentTab.value)
})

const activeCount = computed(() => {
  return filteredObjects.value.filter(obj => obj.status === 'active').length
})

// Вычисляемое количество завершённых объектов
const completedCount = computed(() => {
  return filteredObjects.value.filter(obj => obj.status === 'completed').length
})
</script>

<style lang="scss" scoped>
.container {
  max-width: 1000px;
  margin: 40px auto;
  padding: 20px;

  h1 {
    text-align: center;
    color: #333;
    margin-bottom: 30px;
  }

  .stats {
    display: flex;
    justify-content: space-between;
    gap: 20px;
    margin-bottom: 30px;

    .stat-card {
      flex: 1;
      background: #f9f9f9;
      border-radius: 8px;
      padding: 20px;
      box-shadow: 0 2px 6px rgba(0,0,0,0.05);
      transition: transform 0.2s ease;

      &:hover {
        transform: translateY(-2px);
      }

      h3 {
        margin-bottom: 10px;
        color: #555;
      }

      p {
        font-size: 24px;
        font-weight: bold;
        color: #2c3e50;
      }
    }
  }

  .tabs {
    display: flex;
    gap: 10px;
    margin-bottom: 30px;

    button {
      padding: 10px 20px;
      border: none;
      background: #eee;
      border-radius: 5px;
      cursor: pointer;
      transition: all 0.3s ease;

      &.active {
        background: #3498db;
        color: white;
      }

      &:hover:not(.active) {
        background: #ddd;
      }
    }
  }

  .add-form {
    display: flex;
    gap: 10px;
    margin-bottom: 30px;

    input {
      flex: 1;
      padding: 10px;
      border: 1px solid #ccc;
      border-radius: 5px;
      font-size: 16px;

      &.error {
        // border-color: #e74c3c;
        background-color: #f5f5f5;
      }
    }

    button {
      padding: 10px 20px;
      background: #2ecc71;
      color: white;
      border: none;
      border-radius: 5px;
      cursor: pointer;
      transition: background 0.3s ease;

      &:disabled {
        background: #b2dfbb;
        cursor: not-allowed;
      }
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
      background: #fff;
      border: 1px solid #eee;
      border-radius: 8px;
      padding: 15px 20px;
      margin-bottom: 10px;
      box-shadow: 0 1px 4px rgba(0,0,0,0.05);

      a {
        text-decoration: none;
        color: #2c3e50;
        font-weight: 500;
        transition: color 0.3s ease;

        &:hover {
          color: #3498db;
        }
      }

      .actions {
        display: flex;
        gap: 10px;
        align-items: center;

        .balance {
          font-size: 14px;
          color: #555;
        }

        .status-button,
        .delete-button {
          padding: 6px 12px;
          border: none;
          border-radius: 5px;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .status-button {
          background: #27ae60;
          color: white;

          &:hover {
            background: #219150;
          }
        }

        .delete-button {
          background: #e74c3c;
          color: white;

          &:hover {
            background: #c0392b;
          }
        }
      }
    }
  }

  .error-message,
  .success-message {
    padding: 15px;
    border-radius: 5px;
    text-align: center;
    margin-top: 20px;
  }

  .error-message {
    background: #ffeaea;
    color: #e74c3c;
    border: 1px solid #f1948a;
  }

  .success-message {
    background: #ecfde4;
    color: #27ae60;
    border: 1px solid #a3e635;
  }
}
</style>