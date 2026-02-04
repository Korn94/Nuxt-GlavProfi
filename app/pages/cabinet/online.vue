<!-- app/pages/cabinet/online.vue -->
<template>
  <div class="online-page">
    <h1>Онлайн пользователи</h1>
    
    <div class="online-stats">
      <div class="stat-card">
        <h3>Всего онлайн</h3>
        <p class="stat-number">{{ onlineStore.getOnlineCount }}</p>
      </div>
      <div class="stat-card">
        <h3>Активны</h3>
        <p class="stat-number">{{ onlineStore.getActiveUsers.length }}</p>
      </div>
      <div class="stat-card">
        <h3>В АФК</h3>
        <p class="stat-number">{{ onlineStore.getAFKUsers.length }}</p>
      </div>
    </div>
    
    <div v-if="onlineStore.isLoadingUsers" class="loading">
      <Icon name="mdi:loading" class="loading-icon" />
      <span>Загрузка...</span>
    </div>
    
    <div v-else-if="onlineStore.hasError" class="error">
      <Icon name="mdi:alert" />
      <span>{{ onlineStore.error }}</span>
    </div>
    
    <div v-else-if="onlineStore.getOnlineUsers.length === 0" class="empty">
      <Icon name="mdi:account-off" size="48" />
      <p>Нет онлайн-пользователей</p>
    </div>
    
    <div v-else class="online-table-container">
      <table class="online-table">
        <thead>
          <tr>
            <th>Пользователь</th>
            <th>Статус</th>
            <th>В сети</th>
            <th>Последняя активность</th>
            <th>IP-адрес</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="session in onlineStore.getOnlineUsers" :key="session.id">
            <td>
              <div class="user-info">
                <Icon name="mdi:account" class="user-icon" />
                <span>{{ session.user?.name || 'Неизвестный пользователь' }}</span>
                <span class="user-role">{{ roleLabels[session.user?.role || 'worker'] }}</span>
              </div>
            </td>
            <td>
              <OnlineStatus :status="session.status" :show-text="true" />
            </td>
            <td>
              {{ formatDuration(session.startedAt) }}
            </td>
            <td>
              {{ formatTime(session.lastActivity) }}
            </td>
            <td>
              {{ session.ipAddress || '—' }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { useOnlineStore } from '../../../stores/online'
import { useAuthStore } from '../../../stores/auth'
import OnlineStatus from '~/components/ui/status/OnlineStatus.vue'

definePageMeta({
  layout: 'cabinet',
  middleware: ['require-auth']
})

const onlineStore = useOnlineStore()
const authStore = useAuthStore()

const roleLabels = {
  admin: 'Админ',
  manager: 'Менеджер',
  foreman: 'Прораб',
  master: 'Мастер',
  worker: 'Рабочий'
}

// Форматирование времени
const formatTime = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Форматирование длительности
const formatDuration = (dateString: string) => {
  const startDate = new Date(dateString)
  const now = new Date()
  const diff = now.getTime() - startDate.getTime()
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  
  if (hours > 0) {
    return `${hours}ч ${minutes}м`
  }
  return `${minutes}м`
}

onMounted(() => {
  console.log('[OnlinePage] Mounted')
  
  // Загружаем данные
  onlineStore.fetchOnlineUsers()
  
  // Подписываемся на сокет-обновления
  onlineStore.subscribeToUpdates()
})

onUnmounted(() => {
  console.log('[OnlinePage] Unmounted')
  
  // Отписываемся от сокетов
  onlineStore.unsubscribeFromUpdates()
})

// Добавьте отслеживание изменений
watch(
  () => onlineStore.getOnlineUsers,
  (newUsers) => {
    console.log('[OnlinePage] Users changed:', {
      count: newUsers.length,
      users: newUsers.map(u => ({
        id: u.id,
        userId: u.userId,
        sessionId: u.sessionId,
        status: u.status,
        hasUser: !!u.user,
        userName: u.user?.name,
        userRole: u.user?.role,
        raw: u
      }))
    })
  },
  { deep: true }
)
</script>

<style lang="scss" scoped>
.online-page {
  padding: 20px;
  
  h1 {
    margin-bottom: 20px;
    color: #fff;
    font-size: 24px;
  }
}

.online-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border-radius: 8px;
  padding: 16px;
  text-align: center;
  
  h3 {
    margin: 0 0 8px 0;
    color: #ccc;
    font-size: 14px;
    font-weight: 500;
  }
  
  .stat-number {
    margin: 0;
    font-size: 32px;
    font-weight: 700;
    color: #fff;
  }
}

.loading,
.error,
.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  text-align: center;
  color: #fff;
  
  .loading-icon {
    animation: spin 1s linear infinite;
    margin-bottom: 12px;
  }
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.online-table-container {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border-radius: 8px;
  overflow: hidden;
}

.online-table {
  width: 100%;
  border-collapse: collapse;
  
  th {
    background: rgba(255, 255, 255, 0.1);
    padding: 12px 16px;
    text-align: left;
    font-weight: 600;
    color: #fff;
    font-size: 14px;
  }
  
  td {
    padding: 12px 16px;
    border-top: 1px solid rgba(255, 255, 255, 0.05);
    color: #ccc;
    font-size: 14px;
  }
  
  tr:hover {
    background: rgba(255, 255, 255, 0.03);
  }
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.user-icon {
  color: #00c3f5;
  font-size: 20px;
}

.user-role {
  font-size: 12px;
  color: #666;
  background: rgba(255, 255, 255, 0.05);
  padding: 2px 8px;
  border-radius: 4px;
  margin-left: 8px;
}
</style>