<template>
  <div class="presence-page">
    <!-- Заголовок страницы -->
    <div class="page-header">
      <h1>Онлайн пользователи</h1>
      <div class="controls">
        <!-- Фильтры -->
        <div class="filters">
          <button :class="{ active: filter === 'all' }" @click="filter = 'all'">
            Все ({{ store.users.length }})
          </button>
          <button :class="{ active: filter === 'online' }" @click="filter = 'online'">
            Онлайн ({{ onlineCount }})
          </button>
          <button :class="{ active: filter === 'idle' }" @click="filter = 'idle'">
            Неактивные ({{ idleCount }})
          </button>
        </div>
        <!-- Переключатель вида -->
        <div class="view-toggle">
          <button :class="{ active: viewMode === 'grid' }" @click="viewMode = 'grid'" title="Сетка">
            <Icon name="fluent:grid-24-regular" />
          </button>
          <button :class="{ active: viewMode === 'list' }" @click="viewMode = 'list'" title="Список">
            <Icon name="fluent:list-24-regular" />
          </button>
        </div>
        <!-- Режим отладки -->
        <div class="debug-toggle">
          <input type="checkbox" v-model="debug" />
          <label>Режим отладки</label>
        </div>
      </div>
    </div>

    <!-- Индикатор состояния подключения -->
    <div v-if="connectionStatus === 'disconnected'" class="connection-status disconnected">
      <Icon name="fluent:connection-24-regular" />
      Нет подключения к серверу
    </div>
    <div v-else-if="connectionStatus === 'reconnecting'" class="connection-status reconnecting">
      <Icon name="fluent:sync-24-regular" class="spin" />
      Переподключение...
    </div>

    <!-- Загрузка данных -->
    <div v-if="loading" class="loading-container">
      <div class="loading-spinner">
        <Icon name="fluent:spinner-24-regular" />
      </div>
      <p>Загрузка данных о пользователях...</p>
    </div>

    <!-- Информация о состоянии -->
    <div v-else-if="store.users.length === 0" class="no-users-container">
      <Icon name="fluent:person-24-regular" size="48" />
      <p>Нет активных пользователей в системе</p>
      <p class="subtext">Пользователи появятся здесь, когда зайдут в кабинет</p>
    </div>

    <!-- Сетка пользователей -->
    <div v-else :class="['presence-container', viewMode]">
      <TransitionGroup name="user-list" tag="div">
        <div
          v-for="user in filteredUsers"
          :key="user.id"
          class="user-card"
          :class="user.status"
        >
          <!-- Заголовок карточки -->
          <div class="card-header">
            <div class="user-info">
              <div class="avatar">
                <Icon name="fluent:person-24-regular" size="24" />
              </div>
              <div class="user-details">
                <strong class="user-name">{{ user.name || user.login }}</strong>
                <div class="user-meta">
                  <span class="role">{{ user.roles.join(', ') }}</span>
                  <span class="status-badge" :class="user.status">
                    {{ user.status === 'online' ? 'Онлайн' : 'Неактивен' }}
                  </span>
                </div>
              </div>
            </div>
            <div class="connection-info">
              <div class="device">
                <Icon
                  :name="getDeviceIcon(user.deviceType)"
                  :title="getDeviceName(user.deviceType)"
                  size="18"
                />
                <span>{{ getDeviceName(user.deviceType) }}</span>
              </div>
              <div class="tabs" v-if="user.tabCount && user.tabCount > 1">
                <Icon name="fluent:tab-24-regular" size="18" />
                <span>{{ user.tabCount }}</span>
              </div>
            </div>
          </div>

          <!-- Основная информация -->
          <div class="card-content">
            <div class="info-row">
              <span class="label">Страница:</span>
              <span class="value">{{ user.currentPage || 'Кабинет' }}</span>
            </div>
            <div class="info-row">
              <span class="label">Активность:</span>
              <span class="value">{{ formatTimeSince(user.lastActivityAt) }}</span>
            </div>
            <div class="info-row">
              <span class="label">В сети:</span>
              <span class="value">{{ formatDuration(user.onlineSince) }}</span>
            </div>
          </div>

          <!-- Отладочная информация -->
          <div v-if="debug" class="debug-section">
            <div class="debug-row">
              <span class="debug-label">ID:</span>
              <span class="debug-value">{{ user.id }}</span>
            </div>
            <div class="debug-row">
              <span class="debug-label">Login:</span>
              <span class="debug-value">{{ user.login }}</span>
            </div>
            <div class="debug-row">
              <span class="debug-label">IP:</span>
              <span class="debug-value">{{ user.ip || 'N/A' }}</span>
            </div>
          </div>
        </div>
      </TransitionGroup>
    </div>
  </div>
</template>

<script setup lang="ts">
import { definePageMeta, useRoute } from '#imports'
import { usePresenceStore } from '~~/stores/presence'
import { useWebSocketStore } from '~~/stores/websocket'
import { ref, onMounted, computed, watch, onBeforeUnmount } from 'vue'

definePageMeta({
  layout: 'cabinet',
  middleware: ['require-auth', 'role'],
  allowedRoles: ['admin', 'manager']
})

// Инициализация хранилищ
const store = usePresenceStore()
const websocketStore = useWebSocketStore()
const route = useRoute()

// Состояния
const loading = ref(true)
const filter = ref<'all' | 'online' | 'idle'>('all')
const viewMode = ref<'grid' | 'list'>('grid')
const debug = ref(false)
const connectionStatus = ref<'connected' | 'disconnected' | 'reconnecting'>('disconnected')

// Счетчики
const onlineCount = computed(() => store.users.filter((u: { status: string }) => u.status === 'online').length)
const idleCount = computed(() => store.users.filter((u: { status: string }) => u.status === 'idle').length)

// Фильтрация пользователей
const filteredUsers = computed(() => {
  if (filter.value === 'all') return store.users
  if (filter.value === 'online') return store.users.filter((u: { status: string }) => u.status === 'online')
  if (filter.value === 'idle') return store.users.filter((u: { status: string }) => u.status === 'idle')
  return store.users
})

// Улучшенные функции форматирования времени
const formatTimeSince = (timestamp: number | undefined): string => {
  if (!timestamp) return 'Только что'
  const now = Date.now()
  const diff = now - timestamp
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  
  if (days > 0) return `${days} д. назад`
  if (hours > 0) return `${hours} ч. назад`
  if (minutes > 0) return `${minutes} мин. назад`
  if (seconds > 0) return `${seconds} сек. назад`
  return 'Только что'
}

const formatDuration = (timestamp: number | undefined): string => {
  if (!timestamp) return '0 мин.'
  const now = Date.now()
  const diff = now - timestamp
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  
  if (hours > 0) return `${hours} ч. ${minutes % 60} мин.`
  if (minutes > 0) return `${minutes} мин.`
  return `${seconds} сек.`
}

// Определение устройства
const getDeviceIcon = (deviceType?: string): string => {
  const type = deviceType || 'desktop'
  switch (type.toLowerCase()) {
    case 'mobile': return 'fluent:phone-24-regular'
    case 'tablet': return 'fluent:tablet-24-regular'
    case 'desktop': return 'fluent:desktop-24-regular'
    case 'smarttv': return 'fluent:tv-24-regular'
    case 'wearable': return 'fluent:watch-24-regular'
    default: return 'fluent:desktop-24-regular'
  }
}

const getDeviceName = (deviceType?: string): string => {
  const type = deviceType || 'desktop'
  switch (type.toLowerCase()) {
    case 'mobile': return 'Мобильный'
    case 'tablet': return 'Планшет'
    case 'desktop': return 'Десктоп'
    case 'smarttv': return 'TV'
    case 'wearable': return 'Носимый'
    default: return 'Десктоп'
  }
}

// Функция для определения типа устройства
const getDeviceType = (): string => {
  const userAgent = navigator.userAgent.toLowerCase()
  if (/mobile/.test(userAgent)) return 'mobile'
  if (/tablet/.test(userAgent)) return 'tablet'
  if (/smarttv|tv/.test(userAgent)) return 'smarttv'
  if (/wearable|watch/.test(userAgent)) return 'wearable'
  return 'desktop'
}

// Отправка информации о текущей странице и устройстве
const sendPresenceUpdate = () => {
  if (websocketStore.isConnected && route.path) {
    // Отправляем информацию о текущей странице
    store.sendPageUpdate(route.path)
    // Отправляем информацию о устройстве
    store.sendDeviceInfo({
      deviceType: getDeviceType(),
      tabCount: 1
    })
  }
}

// Загрузка данных при монтировании
onMounted(() => {
  // Подписываемся на канал presence
  websocketStore.subscribe('presence:all')
  
  // Подписываемся на обновление данных
  const dataUpdateUnwatch = watch(
    () => store.users,
    (newUsers: string|any[]) => {
      if (newUsers.length > 0 && loading.value) {
        loading.value = false
      }
    }
  )
  
  // Добавляем обработчики событий для активности
  window.addEventListener('focus', sendPresenceUpdate)
  window.addEventListener('blur', () => {
    if (websocketStore.isConnected) {
      store.sendIdleStatus()
    }
  })
  window.addEventListener('mousemove', handleUserActivity)
  window.addEventListener('keypress', handleUserActivity)
  window.addEventListener('scroll', handleUserActivity)
  
  // Добавляем обработчик для изменения маршрута
  const routeUnwatch = watch(route, (newRoute: { path: any }) => {
    if (newRoute.path) {
      sendPresenceUpdate()
    }
  })
  
  // Очистка при размонтировании
  onBeforeUnmount(() => {
    dataUpdateUnwatch()
    routeUnwatch()
    window.removeEventListener('focus', sendPresenceUpdate)
    window.removeEventListener('blur', () => {
      if (websocketStore.isConnected) {
        store.sendIdleStatus()
      }
    })
    window.removeEventListener('mousemove', handleUserActivity)
    window.removeEventListener('keypress', handleUserActivity)
    window.removeEventListener('scroll', handleUserActivity)
    
    // Отписываемся от канала presence
    websocketStore.unsubscribe('presence:all')
  })
})

// Следим за состоянием отладки
watch(debug, (newVal: boolean) => {
  store.debug = newVal
})

// Обработка состояния подключения
watch(
  () => websocketStore.status,
  (newStatus: string) => {
    if (newStatus === 'connected') {
      connectionStatus.value = 'connected'
      // После подключения запрашиваем обновление
      websocketStore.send({ type: 'presence:request-update' })
    } else if (newStatus === 'reconnecting') {
      connectionStatus.value = 'reconnecting'
    } else {
      connectionStatus.value = 'disconnected'
    }
  }
)

// Обработка активности пользователя
const handleUserActivity = () => {
  if (websocketStore.isConnected) {
    store.sendActivity()
  }
}
</script>

<style lang="scss" scoped>
.presence-page {
  padding: 24px;
  
  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
    
    h1 {
      margin: 0;
      font-size: 1.8rem;
      color: var(--text-color);
    }
    
    .controls {
      display: flex;
      gap: 16px;
      align-items: center;
      
      .filters {
        display: flex;
        gap: 8px;
        
        button {
          padding: 8px 16px;
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          background: #f8f9fa;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          gap: 4px;
          
          &.active {
            background: var(--primary-color);
            color: white;
            border-color: var(--primary-dark);
          }
          
          &:hover:not(.active) {
            background: #f0f0f0;
          }
        }
      }
      
      .view-toggle {
        display: flex;
        gap: 4px;
        
        button {
          width: 36px;
          height: 36px;
          border-radius: 8px;
          border: 1px solid #e0e0e0;
          background: #f8f9fa;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
          
          &:hover {
            background: #f0f0f0;
          }
          
          &.active {
            background: var(--primary-color);
            color: white;
            border-color: var(--primary-dark);
          }
        }
      }
      
      .debug-toggle {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 6px 12px;
        border-radius: 8px;
        background: #f8f9fa;
        
        input {
          margin: 0;
          width: 16px;
          height: 16px;
        }
        
        label {
          font-size: 14px;
          cursor: pointer;
        }
      }
    }
  }
  
  .connection-status {
    position: fixed;
    bottom: 20px;
    right: 20px;
    padding: 12px 20px;
    border-radius: 8px;
    font-weight: 500;
    z-index: 100;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    display: flex;
    align-items: center;
    gap: 8px;
    color: white;
    
    .iconify {
      font-size: 18px;
    }
    
    &.disconnected {
      background: #ff4d4f;
    }
    
    &.reconnecting {
      background: #faad14;
    }
  }
  
  .loading-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 40px 0;
    text-align: center;
    
    .loading-spinner {
      font-size: 32px;
      color: var(--primary-color);
      animation: spin 1.5s linear infinite;
      margin-bottom: 16px;
    }
    
    p {
      font-size: 16px;
      color: #666;
    }
  }
  
  .no-users-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 40px 0;
    text-align: center;
    background: #f8f9fa;
    border-radius: 12px;
    margin: 20px 0;
    
    .iconify {
      color: #888;
      margin-bottom: 16px;
    }
    
    p {
      font-size: 16px;
      color: #666;
      max-width: 500px;
      
      &.subtext {
        font-size: 14px;
        color: #999;
        margin-top: 8px;
      }
    }
  }
  
  .presence-container {
    &.grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 20px;
    }
    
    &.list {
      display: flex;
      flex-direction: column;
      gap: 16px;
      
      .user-card {
        border-radius: 12px;
        overflow: hidden;
        
        .card-header {
          border-bottom: 1px solid #eee;
        }
      }
    }
  }
  
  .user-card {
    background: #fff;
    border-radius: 16px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
    border-left: 4px solid #ccc;
    transition: all 0.3s ease;
    overflow: hidden;
    
    &:hover {
      transform: translateY(-5px);
      box-shadow: 0 6px 20px rgba(0, 0, 0, 0.08);
    }
    
    &.online {
      border-color: var(--success-color);
      
      .status-badge {
        background: var(--success-color);
        color: white;
      }
    }
    
    &.idle {
      border-color: var(--warning-color);
      
      .status-badge {
        background: var(--warning-color);
        color: white;
      }
    }
    
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px;
      
      .user-info {
        display: flex;
        align-items: center;
        gap: 12px;
        
        .avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: #f0f0f0;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #666;
        }
        
        .user-details {
          .user-name {
            font-size: 16px;
            display: block;
            margin-bottom: 4px;
          }
          
          .user-meta {
            display: flex;
            gap: 12px;
            font-size: 14px;
            
            .role {
              color: #666;
            }
            
            .status-badge {
              padding: 2px 8px;
              border-radius: 4px;
              font-size: 12px;
              font-weight: 500;
              
              &.online {
                background: var(--success-color);
                color: white;
              }
              
              &.idle {
                background: var(--warning-color);
                color: white;
              }
            }
          }
        }
      }
      
      .connection-info {
        display: flex;
        gap: 12px;
        align-items: center;
        
        .device, .tabs {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 14px;
          color: #666;
          
          .iconify {
            color: var(--primary-color);
          }
        }
        
        .tabs {
          background: #f0f0f0;
          border-radius: 12px;
          padding: 2px 8px;
        }
      }
    }
    
    .card-content {
      padding: 16px;
      border-top: 1px solid #eee;
      
      .info-row {
        display: flex;
        justify-content: space-between;
        margin-bottom: 8px;
        
        .label {
          font-weight: 500;
          color: #666;
          min-width: 80px;
        }
        
        .value {
          color: #333;
          font-weight: 500;
        }
      }
    }
    
    .debug-section {
      padding: 12px 16px;
      background: #f8f9fa;
      border-top: 1px solid #eee;
      font-size: 12px;
      
      .debug-row {
        display: flex;
        justify-content: space-between;
        margin-bottom: 4px;
        
        .debug-label {
          color: #666;
          font-weight: 500;
        }
        
        .debug-value {
          font-family: monospace;
          color: #444;
        }
      }
    }
  }
}

// Анимации
.user-list-enter-active,
.user-list-leave-active {
  transition: all 0.3s ease;
}

.user-list-enter-from,
.user-list-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

.user-list-move {
  transition: transform 0.5s ease;
}

// Анимация спиннера
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.spin {
  animation: spin 1s linear infinite;
}

// Адаптивность
@media (max-width: 768px) {
  .presence-page {
    .page-header {
      flex-direction: column;
      align-items: flex-start;
      gap: 16px;
      
      .controls {
        width: 100%;
        flex-wrap: wrap;
      }
    }
    
    .presence-container.grid {
      grid-template-columns: 1fr;
    }
  }
}
</style>