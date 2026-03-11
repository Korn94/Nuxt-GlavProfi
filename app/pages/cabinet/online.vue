<!-- app/pages/cabinet/online.vue -->
<template>
  <div class="online-page">
    <h1>👥 Онлайн пользователи</h1>
    
    <!-- Статистика -->
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
      <div class="stat-card">
        <h3>Всего вкладок</h3>
        <p class="stat-number">{{ onlineStore.getTotalTabsCount }}</p>
      </div>
    </div>
    
    <!-- Загрузка -->
    <!-- ✅ ИСПРАВЛЕНО: loading → isLoading -->
    <div v-if="onlineStore.isLoading" class="loading-state">
      <Icon name="mdi:loading" size="48" class="spin" />
      <span>Загрузка данных...</span>
    </div>
    
    <!-- Ошибка -->
    <div v-else-if="onlineStore.error" class="error-state">
      <Icon name="mdi:alert-circle" size="48" />
      <p>{{ onlineStore.error }}</p>
      <button class="btn btn-secondary" @click="refreshData">
        Повторить
      </button>
    </div>
    
    <!-- Пустое состояние -->
    <!-- ✅ ИСПРАВЛЕНО: onlineUsers → getOnlineUsers -->
    <div v-else-if="onlineUsers.length === 0" class="empty-state">
      <Icon name="mdi:account-off" size="64" />
      <p>Нет онлайн-пользователей</p>
      <span class="empty-hint">Пользователи появятся здесь, когда кто-то войдёт в систему</span>
    </div>
    
    <!-- Таблица пользователей -->
    <div v-else class="online-table-container">
      <div class="table-header">
        <span class="table-title">Пользователи ({{ onlineUsers.length }})</span>
        <button class="btn btn-sm btn-secondary" @click="refreshData" :disabled="onlineStore.isLoading">
          <Icon name="mdi:refresh" size="16" :class="{ spin: onlineStore.isLoading }" />
          Обновить
        </button>
      </div>
      
      <table class="online-table">
        <thead>
          <tr>
            <th>Пользователь</th>
            <th>Вкладки</th>
            <th>Статус</th>
            <th>В сети</th>
            <th>Активность</th>
            <th>Страница</th>
            <th>IP</th>
          </tr>
        </thead>
        <tbody>
          <tr 
            v-for="user in onlineUsers" 
            :key="user.userId"
            class="user-row"
            :class="{ 'is-current-user': user.userId === authStore.user?.id }"
          >
            <td>
              <div class="user-cell">
                <div class="user-avatar" :style="{ background: getUserAvatarColor(user.userId) }">
                  {{ getUserInitials(user.user?.name) }}
                </div>
                <div class="user-details">
                  <span class="user-name">
                    {{ user.user?.name || 'Неизвестный' }}
                    <span v-if="user.userId === authStore.user?.id" class="current-user-badge">(Вы)</span>
                  </span>
                  <span v-if="user.user?.role" class="user-role" :class="`role-${user.user.role}`">
                    {{ roleLabels[user.user.role] || user.user.role }}
                  </span>
                </div>
              </div>
            </td>
            <td>
              <div class="tabs-badge">
                <Icon name="mdi:window-restore" size="14" />
                <span>{{ user.tabsCount }}</span>
              </div>
            </td>
            <td>
              <UiStatusOnlineStatus :status="user.status" :show-text="false" :show-tooltip="true" />
            </td>
            <td>
              <span class="duration" :title="formatFullDate(user.startedAt)">
                {{ getDuration(user.startedAt) }}
              </span>
            </td>
            <td>
              <span class="activity-time" :class="{ stale: isActivityStale(user.lastActivity) }" :title="formatFullDate(user.lastActivity)">
                {{ formatTimeAgo(user.lastActivity) }}
              </span>
            </td>
            <td>
              <div class="page-cell" :title="user.activePath">
                <Icon :name="getPageIcon(user.activePath)" size="14" class="page-icon" />
                <span>{{ formatPath(user.activePath) }}</span>
              </div>
            </td>
            <td>
              <span class="ip-address" :title="user.ipAddress">
                {{ formatIp(user.ipAddress) }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useOnlineStore } from '../../../stores/online'
import { useAuthStore } from '../../../stores/auth'
import { socketService } from 'services/socket.service'
import type { OnlineUser } from '~/types'
import { definePageMeta } from 'node_modules/nuxt/dist/pages/runtime'

// ============================================
// PAGE META
// ============================================
definePageMeta({
  layout: 'cabinet',
  middleware: ['require-auth']
})

// ============================================
// STORES
// ============================================
const onlineStore = useOnlineStore()
const authStore = useAuthStore()

// ============================================
// STATE
// ============================================
const currentTime = ref(Date.now())
let timeInterval: NodeJS.Timeout | null = null

// ============================================
// CONFIG
// ============================================
const roleLabels: Record<string, string> = {
  admin: 'Админ',
  manager: 'Менеджер',
  foreman: 'Прораб',
  master: 'Мастер',
  worker: 'Рабочий'
}

const avatarColors = [
  '#00c3f5', '#00A12A', '#7c3aed', '#FAB702',
  '#e83e8c', '#17a2b8', '#28a745', '#dc3545'
]

// ============================================
// COMPUTED
// ============================================
// ✅ ИСПРАВЛЕНО: Используем геттер getOnlineUsers
const onlineUsers = computed<OnlineUser[]>(() => {
  return onlineStore.getOnlineUsers
    .sort((a: OnlineUser, b: OnlineUser) => {
      // Сначала текущий пользователь
      if (a.userId === authStore.user?.id) return -1
      if (b.userId === authStore.user?.id) return 1
      
      // Затем по статусу (online > afk > offline)
      const statusOrder: Record<string, number> = { online: 0, afk: 1, offline: 2 }
      const statusDiff = (statusOrder[a.status] ?? 2) - (statusOrder[b.status] ?? 2)
      if (statusDiff !== 0) return statusDiff
      
      // Затем по последней активности
      return new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime()
    })
})

// ============================================
// METHODS - Форматирование
// ============================================
const formatTimeAgo = (dateString: string): string => {
  if (!dateString) return '—'
  
  const date = new Date(dateString)
  const now = currentTime.value
  const diff = now - date.getTime()
  
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  
  if (seconds < 60) return 'только что'
  if (minutes < 60) return `${minutes} мин назад`
  if (hours < 24) return `${hours} ч назад`
  if (days < 7) return `${days} дн назад`
  
  return date.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short'
  })
}

const formatFullDate = (dateString: string): string => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const formatPath = (path: string | null | undefined): string => {
  if (!path || path === '/' || path === 'null') return '—'
  
  const cleanPath = path.replace(/^\/+/, '')
  
  const pathLabels: Record<string, string> = {
    'cabinet': 'Кабинет',
    'cabinet/online': 'Онлайн',
    'cabinet/tasks': 'Задачи',
    'cabinet/boards': 'Доски',
    'cabinet/objects': 'Объекты',
    'cabinet/users': 'Пользователи',
    'cabinet/profile': 'Профиль',
    'login': 'Вход'
  }
  
  if (pathLabels[cleanPath]) return pathLabels[cleanPath]
  
  if (cleanPath.startsWith('cabinet/')) {
    const parts = cleanPath.split('/')
    const page = parts[1] // ✅ Безопасное получение
    if (!page) return cleanPath // ✅ Проверка на undefined
    return page.charAt(0).toUpperCase() + page.slice(1)
  }
  
  return cleanPath.length > 25 ? cleanPath.substring(0, 22) + '...' : cleanPath
}

const getPageIcon = (path: string | null | undefined): string => {
  if (!path) return 'mdi:web'
  
  const icons: Record<string, string> = {
    'cabinet/online': 'mdi:account-group',
    'cabinet/tasks': 'mdi:clipboard-list',
    'cabinet/boards': 'mdi:view-dashboard',
    'cabinet/objects': 'mdi:home-outline',
    'cabinet/users': 'mdi:account-multiple',
    'cabinet/profile': 'mdi:account',
    'login': 'mdi:login'
  }
  
  const cleanPath = path.replace(/^\/+/, '')
  return icons[cleanPath] || 'mdi:web'
}

const getDuration = (startedAt: string): string => {
  if (!startedAt) return '—'
  
  const startDate = new Date(startedAt)
  const diff = currentTime.value - startDate.getTime()
  
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  
  if (hours > 0) return `${hours}ч ${minutes}м`
  return `${minutes}м`
}

const isActivityStale = (lastActivity: string): boolean => {
  if (!lastActivity) return true
  const diff = currentTime.value - new Date(lastActivity).getTime()
  return diff > 5 * 60 * 1000 // Более 5 минут
}

const formatIp = (ip: string | null | undefined): string => {
  if (!ip) return '—'
  // Скрываем последнюю часть IP для приватности
  const parts = ip.split('.')
  if (parts.length === 4) {
    return `${parts[0]}.${parts[1]}.*.*`
  }
  return ip
}

const getUserInitials = (name?: string | null): string => {
  if (!name || name.trim() === '') return 'U'
  const parts = name.trim().split(' ').filter(p => p.length > 0)
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }
  return parts[0].substring(0, 2).toUpperCase()
}

const getUserAvatarColor = (userId: number): string => {
  const index = userId % avatarColors.length
  return avatarColors[index]
}

// ============================================
// METHODS - Управление данными
// ============================================
const refreshData = async () => {
  try {
    await onlineStore.fetchOnlineUsers()
  } catch (error) {
    console.error('Failed to refresh online users:', error)
  }
}

// ✅ ПОДПИСКА НА СОКЕТ-СОБЫТИЯ ЧЕРЕЗ SOCKET SERVICE
const setupSocketSubscriptions = () => {
  console.log('[OnlinePage] Setting up socket subscriptions...')
  
  // ✅ Используем socketService.on вместо socketStore.on
  socketService.on('online-users:update', (users: OnlineUser[]) => {
    console.log('[OnlinePage] Received online-users:update:', users.length, 'users')
    // ✅ ИСПРАВЛЕНО: Прямое обновление состояния store
    onlineStore.users = users
  })
  
  socketService.on('user:status', (data: any) => {
    console.log('[OnlinePage] Received user:status:', data)
    // ✅ ИСПРАВЛЕНО: Прямое обновление состояния store
    // При получении события статуса — перезагружаем список
    onlineStore.fetchOnlineUsers().catch(err => {
      console.error('Failed to refetch users on status update:', err)
    })
  })
}

// ✅ ОТПИСКА ОТ СОКЕТ-СОБЫТИЙ
const cleanupSocketSubscriptions = () => {
  console.log('[OnlinePage] Cleaning up socket subscriptions...')
  
  // ✅ Используем socketService.off вместо socketStore.off
  socketService.off('online-users:update')
  socketService.off('user:status')
}

// ============================================
// LIFECYCLE
// ============================================
onMounted(() => {
  console.log('[OnlinePage] 📦 Mounted')
  
  // Загружаем данные
  refreshData()
  
  // Настраиваем сокет-подписки
  setupSocketSubscriptions()
  
  // Запускаем интервал обновления времени
  timeInterval = setInterval(() => {
    currentTime.value = Date.now()
  }, 1000)
})

onUnmounted(() => {
  console.log('[OnlinePage] 🗑️ Unmounted')
  
  // Очищаем сокет-подписки
  cleanupSocketSubscriptions()
  
  // Очищаем интервал
  if (timeInterval) {
    clearInterval(timeInterval)
    timeInterval = null
  }
})
</script>

<style lang="scss" scoped>
@use '@/assets/styles/variables.scss' as *;

.online-page {
  padding: 24px;
  
  h1 {
    margin: 0 0 24px 0;
    color: $text-light;
    font-size: 28px;
    font-weight: 700;
    display: flex;
    align-items: center;
    gap: 12px;
  }
}

// Статистика
.online-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 16px;
  margin-bottom: 32px;
}

.stat-card {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  padding: 20px;
  text-align: center;
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.2s ease;
  
  &:hover {
    border-color: rgba($blue, 0.3);
    transform: translateY(-2px);
  }
  
  h3 {
    margin: 0 0 8px 0;
    color: #94a3b8;
    font-size: 14px;
    font-weight: 500;
  }
  
  .stat-number {
    margin: 0;
    font-size: 36px;
    font-weight: 700;
    color: $text-light;
    line-height: 1;
  }
}

// Состояния
.loading-state,
.error-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
  color: $text-light;
  
  .icon {
    margin-bottom: 16px;
    opacity: 0.5;
  }
  
  p {
    margin: 0 0 16px 0;
    font-size: 16px;
    color: $text-light;
  }
  
  .empty-hint {
    font-size: 14px;
    color: #64748b;
  }
}

.error-state {
  color: $red;
  
  p {
    color: $text-light;
  }
}

// Кнопки
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px 16px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

.btn-sm {
  padding: 6px 12px;
  font-size: 13px;
}

.btn-secondary {
  background: #475569;
  color: $text-light;
  
  &:hover:not(:disabled) {
    background: #64748b;
  }
}

// Таблица
.online-table-container {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  overflow: hidden;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  
  .table-title {
    font-size: 16px;
    font-weight: 600;
    color: $text-light;
  }
}

.online-table {
  width: 100%;
  border-collapse: collapse;
  
  th {
    background: rgba(255, 255, 255, 0.05);
    padding: 14px 20px;
    text-align: left;
    font-weight: 600;
    color: #94a3b8;
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  
  td {
    padding: 16px 20px;
    border-top: 1px solid rgba(255, 255, 255, 0.05);
    color: #cbd5e1;
    font-size: 14px;
  }
  
  .user-row {
    transition: background 0.2s ease;
    
    &:hover {
      background: rgba(255, 255, 255, 0.03);
    }
    
    &.is-current-user {
      background: rgba($blue, 0.08);
      border-left: 3px solid $blue;
    }
  }
}

// Ячейки таблицы
.user-cell {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  color: $text-light;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 14px;
  flex-shrink: 0;
  text-transform: uppercase;
}

.user-details {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.user-name {
  font-weight: 500;
  color: $text-light;
  display: flex;
  align-items: center;
  gap: 6px;
}

.current-user-badge {
  font-size: 11px;
  color: $blue;
  background: rgba($blue, 0.15);
  padding: 2px 8px;
  border-radius: 4px;
  font-weight: 500;
}

.user-role {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 4px;
  font-weight: 500;
  text-transform: uppercase;
  
  &.role-admin { background: rgba($red, 0.15); color: $red; }
  &.role-manager { background: rgba($blue, 0.15); color: $blue; }
  &.role-foreman { background: rgba($yellow, 0.15); color: $yellow; }
  &.role-master { background: rgba($green, 0.15); color: $green; }
  &.role-worker { background: rgba(#64748b, 0.15); color: #94a3b8; }
}

.tabs-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: rgba(255, 255, 255, 0.05);
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 600;
  color: $text-light;
  
  .icon {
    color: $blue;
  }
}

.duration {
  font-weight: 500;
  color: $text-light;
}

.activity-time {
  color: #94a3b8;
  
  &.stale {
    color: #64748b;
    font-style: italic;
  }
}

.page-cell {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: rgba(255, 255, 255, 0.05);
  padding: 4px 12px;
  border-radius: 6px;
  font-size: 13px;
  color: #cbd5e1;
  max-width: 180px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  
  .page-icon {
    color: $yellow;
    flex-shrink: 0;
  }
}

.ip-address {
  color: #64748b;
  font-family: monospace;
  font-size: 13px;
}

// Анимации
.spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

// Адаптивность
@media (max-width: 1200px) {
  .online-stats {
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  }
  
  .page-cell {
    max-width: 140px;
  }
}

@media (max-width: 900px) {
  .online-table {
    font-size: 13px;
    
    th, td {
      padding: 12px 16px;
    }
  }
  
  // Скрываем IP на средних экранах
  .online-table {
    thead tr th:nth-child(7),
    tbody tr td:nth-child(7) {
      display: none;
    }
  }
}

@media (max-width: 768px) {
  .online-page {
    padding: 16px;
  }
  
  .online-stats {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .table-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  // Скрываем менее важные колонки
  .online-table {
    thead tr th:nth-child(2),
    thead tr th:nth-child(5),
    thead tr th:nth-child(7),
    tbody tr td:nth-child(2),
    tbody tr td:nth-child(5),
    tbody tr td:nth-child(7) {
      display: none;
    }
  }
}

@media (max-width: 480px) {
  .online-stats {
    grid-template-columns: 1fr;
  }
  
  // Оставляем только основные колонки
  .online-table {
    thead tr th:nth-child(4),
    tbody tr td:nth-child(4) {
      display: none;
    }
  }
  
  .user-cell {
    flex-wrap: wrap;
  }
  
  .user-role {
    order: 3;
    width: 100%;
    margin-top: 4px;
  }
}
</style>