<template>
  <div class="online-page">
    <h1>Тест WebSocket и Pinia</h1>
    
    <!-- Статус соединения -->
    <div class="connection-status">
      <h2>Состояние соединения</h2>
      <div :class="['status-badge', websocketStore.status]">
        {{ connectionStatusText }}
      </div>
      <div v-if="websocketStore.isConnected" class="connection-details">
        <p><strong>Подключено к:</strong> {{ websocketStore.connectionUrl }}</p>
        <p><strong>Попыток переподключения:</strong> {{ websocketStore.reconnectAttempts }}</p>
        <p><strong>Подписки:</strong> {{ Array.from(websocketStore.subscriptions).join(', ') || 'Нет подписок' }}</p>
      </div>
      <div v-else-if="websocketStore.isConnecting" class="connection-details">
        <p>Попытка подключения...</p>
      </div>
      <div v-else class="connection-details">
        <p>Не подключено</p>
      </div>
      
      <div class="controls">
        <button @click="connect" :disabled="websocketStore.isConnected || websocketStore.isConnecting">
          Подключиться
        </button>
        <button @click="disconnect" :disabled="!websocketStore.isConnected">
          Отключиться
        </button>
        <button @click="reset" :disabled="websocketStore.status === 'disconnected'">
          Сбросить
        </button>
      </div>
    </div>

    <!-- Тест присутствия (Presence) -->
    <div class="presence-test">
      <h2>Тест присутствия пользователей</h2>
      <div class="presence-controls">
        <button @click="sendActivity">Отправить активность</button>
        <button @click="sendIdle">Отправить статус "idle"</button>
        <button @click="sendPageUpdate">Обновить страницу</button>
        <button @click="sendDeviceInfo">Обновить данные устройства</button>
      </div>
      
      <div class="presence-stats">
        <p><strong>Всего пользователей:</strong> {{ presenceStore.users.length }}</p>
        <p><strong>Онлайн:</strong> {{ presenceStore.onlineCount }} | <strong>Idle:</strong> {{ presenceStore.idleCount }}</p>
      </div>
      
      <div class="users-list">
        <h3>Пользователи онлайн:</h3>
        <ul v-if="presenceStore.online.length > 0">
          <li v-for="user in presenceStore.online" :key="user.id">
            <span class="user-name">{{ user.name || user.login }}</span>
            <span class="user-status">[{{ user.status }}]</span>
            <span class="user-info">
              {{ user.deviceType }} • {{ user.tabCount }} вкладок • {{ formatTime(user.lastActivityAt) }}
            </span>
          </li>
        </ul>
        <p v-else>Нет пользователей онлайн</p>
      </div>
    </div>

    <!-- Тест уведомлений -->
    <div class="notifications-test">
      <h2>Тест уведомлений</h2>
      <div class="notification-controls">
        <button @click="addTestNotification">Добавить тестовое уведомление</button>
        <button @click="markAllAsRead">Отметить все как прочитанные</button>
        <button @click="clearNotifications">Очистить все уведомления</button>
      </div>
      
      <div class="notification-stats">
        <p><strong>Непрочитанных:</strong> {{ notificationsStore.unreadCount }}</p>
      </div>
      
      <div class="notifications-list">
        <h3>Уведомления:</h3>
        <ul v-if="notificationsStore.notifications.length > 0">
          <li 
            v-for="notification in notificationsStore.notifications" 
            :key="notification.id"
            :class="{ unread: !notification.read }"
          >
            <div class="notification-header">
              <span :class="['notification-type', notification.type]">{{ notification.type }}</span>
              <span class="notification-title">{{ notification.title }}</span>
            </div>
            <div class="notification-message">{{ notification.message }}</div>
            <div class="notification-meta">
              <span>{{ formatDate(notification.createdAt) }}</span>
              <button 
                v-if="!notification.read" 
                @click="notificationsStore.markAsRead(notification.id)"
              >
                Отметить как прочитанное
              </button>
            </div>
          </li>
        </ul>
        <p v-else>Нет уведомлений</p>
      </div>
    </div>

    <!-- Тест задач -->
    <div class="tasks-test">
      <h2>Тест задач</h2>
      <div class="tasks-controls">
        <button @click="loadTestTasks">Загрузить тестовые задачи</button>
        <button @click="updateTask">Обновить тестовую задачу</button>
      </div>
      
      <div class="tasks-stats">
        <p><strong>Задач:</strong> {{ taskStore.tasks.length }}</p>
      </div>
      
      <div class="tasks-list">
        <h3>Задачи:</h3>
        <ul v-if="taskStore.tasks.length > 0">
          <li 
            v-for="task in taskStore.tasks" 
            :key="task.id"
            :class="{ completed: task.completed }"
          >
            <span class="task-title">{{ task.title }}</span>
            <span class="task-priority">Приоритет: {{ task.priority }}</span>
            <span v-if="task.completed" class="task-status">✓ Выполнено</span>
            <span v-else class="task-status">○ В процессе</span>
          </li>
        </ul>
        <p v-else>Нет задач</p>
      </div>
    </div>

    <!-- Лог событий -->
    <div class="events-log">
      <h2>Лог событий</h2>
      <div class="log-container">
        <div 
          v-for="(event, index) in eventLog" 
          :key="index" 
          :class="['log-entry', event.type]"
        >
          <span class="timestamp">{{ formatTime(event.timestamp) }}</span>
          <span class="event-text">{{ event.text }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useWebSocketStore } from '~~/stores/websocket'
import { usePresenceStore } from '~~/stores/presence'
import { useNotificationsStore } from '~~/stores/notifications'
import { useTaskStore } from '~~/stores/tasks'
import { onMounted, onBeforeUnmount, ref } from 'vue'

definePageMeta({
  layout: 'cabinet',
  middleware: ['require-auth', 'role'],
  allowedRoles: ['admin', 'manager']
})

const websocketStore = useWebSocketStore()
const presenceStore = usePresenceStore()
const notificationsStore = useNotificationsStore()
const taskStore = useTaskStore()

// Лог событий
const eventLog = ref<{ timestamp: number; text: string; type: string }[]>([])

// Добавление события в лог
const addEvent = (text: string, type = 'info') => {
  eventLog.value.unshift({
    timestamp: Date.now(),
    text,
    type
  })
}

// Форматирование времени
const formatTime = (timestamp: number) => {
  const date = new Date(timestamp)
  return date.toLocaleTimeString()
}

// Форматирование даты
const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleString()
}

// Статус соединения
const connectionStatusText = computed(() => {
  switch (websocketStore.status) {
    case 'connected': return 'Подключено'
    case 'connecting': return 'Подключение...'
    case 'reconnecting': return 'Переподключение...'
    case 'disconnected': return 'Отключено'
    case 'error': return 'Ошибка соединения'
    default: return 'Неизвестный статус'
  }
})

// Методы управления соединением
const connect = () => {
  websocketStore.connect()
  addEvent('Инициировано подключение к WebSocket')
}

const disconnect = () => {
  websocketStore.disconnect()
  addEvent('Отключение от WebSocket')
}

const reset = () => {
  websocketStore.reset()
  addEvent('Сброс состояния WebSocket')
}

// Методы для тестирования присутствия
const sendActivity = () => {
  presenceStore.sendActivity()
  addEvent('Отправлено сообщение активности')
}

const sendIdle = () => {
  presenceStore.sendIdleStatus()
  addEvent('Отправлено сообщение статуса "idle"')
}

const sendPageUpdate = () => {
  presenceStore.sendPageUpdate('/cabinet/online')
  addEvent('Отправлено обновление страницы: /cabinet/online')
}

const sendDeviceInfo = () => {
  presenceStore.sendDeviceInfo({
    deviceType: 'desktop',
    tabCount: 1
  })
  addEvent('Отправлены данные устройства: desktop, 1 вкладка')
}

// Методы для тестирования уведомлений
const addTestNotification = () => {
  const testNotification = {
    id: Date.now(),
    title: 'Тестовое уведомление',
    message: 'Это тестовое уведомление для проверки работы WebSocket и Pinia',
    type: 'info' as const,
    read: false,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString() // через 1 час
  }
  
  notificationsStore.addNotification(testNotification)
  addEvent('Добавлено тестовое уведомление')
}

const markAllAsRead = () => {
  notificationsStore.markAllAsRead()
  addEvent('Все уведомления отмечены как прочитанные')
}

const clearNotifications = () => {
  notificationsStore.clearAll()
  addEvent('Все уведомления очищены')
}

// Методы для тестирования задач
const loadTestTasks = async () => {
  try {
    await taskStore.loadTasks(1) // Загружаем задачи для объекта с ID 1
    addEvent('Загружены тестовые задачи для объекта 1')
  } catch (error) {
    addEvent(`Ошибка при загрузке задач: ${error}`, 'error')
  }
}

const updateTask = () => {
  if (taskStore.tasks.length > 0) {
    const firstTask = taskStore.tasks[0]
    const updatedTask = {
      ...firstTask,
      title: `${firstTask.title} (обновлено ${new Date().toLocaleTimeString()})`,
      completed: !firstTask.completed
    }
    
    // Используем метод handleWebSocketUpdate для имитации получения обновления по WebSocket
    taskStore.handleWebSocketUpdate({
      type: 'task-updated',
      task: updatedTask
    })
    
    addEvent(`Задача "${updatedTask.title}" обновлена`)
  } else {
    addEvent('Нет задач для обновления', 'warning')
  }
}

// Наблюдение за изменениями в хранилищах
watchEffect(() => {
  if (websocketStore.status === 'connected') {
    addEvent('Успешно подключено к WebSocket', 'success')
  } else if (websocketStore.status === 'disconnected') {
    addEvent('Отключено от WebSocket', 'warning')
  } else if (websocketStore.status === 'error') {
    addEvent('Ошибка WebSocket соединения', 'error')
  }
})

watchEffect(() => {
  if (presenceStore.users.length > 0) {
    addEvent(`Обновлен список присутствующих пользователей (${presenceStore.users.length} человек)`, 'info')
  }
})

watchEffect(() => {
  if (notificationsStore.unreadCount > 0) {
    addEvent(`Новые уведомления: ${notificationsStore.unreadCount}`, 'info')
  }
})

// Инициализация при монтировании
onMounted(() => {
  // Подключаемся к WebSocket
  websocketStore.connect()
  addEvent('Инициализация страницы: подключение к WebSocket')
  
  // Подписываемся на каналы
  websocketStore.subscribe('presence:all')
  websocketStore.subscribe('notifications:all')
  websocketStore.subscribe('tasks:all')
  
  addEvent('Подписка на каналы: presence:all, notifications:all, tasks:all')
  
  // Добавляем начальное тестовое уведомление
  setTimeout(() => {
    addTestNotification()
  }, 1000)
})

// Очистка при размонтировании
onBeforeUnmount(() => {
  // Отписываемся от каналов
  websocketStore.unsubscribe('presence:all')
  websocketStore.unsubscribe('notifications:all')
  websocketStore.unsubscribe('tasks:all')
  
  // Отключаемся от WebSocket
  websocketStore.disconnect()
  
  addEvent('Страница размонтирована: отключение от WebSocket и отписка от каналов')
})
</script>

<style lang="scss" scoped>
.online-page {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
  
  h1 {
    font-size: 2rem;
    margin-bottom: 1.5rem;
    color: var(--primary-color);
    text-align: center;
  }
  
  .connection-status {
    background: white;
    border-radius: 8px;
    padding: 1.5rem;
    margin-bottom: 2rem;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    
    h2 {
      margin-top: 0;
      margin-bottom: 1rem;
      color: #333;
    }
    
    .status-badge {
      display: inline-block;
      padding: 0.5rem 1rem;
      border-radius: 20px;
      font-weight: bold;
      margin-bottom: 1rem;
      
      &.connected {
        background: #d4edda;
        color: #155724;
        border: 1px solid #c3e6cb;
      }
      
      &.connecting {
        background: #fff3cd;
        color: #856404;
        border: 1px solid #ffeaa7;
      }
      
      &.reconnecting {
        background: #fff3cd;
        color: #856404;
        border: 1px solid #ffeaa7;
      }
      
      &.disconnected {
        background: #f8d7da;
        color: #721c24;
        border: 1px solid #f5c6cb;
      }
      
      &.error {
        background: #f8d7da;
        color: #721c24;
        border: 1px solid #f5c6cb;
      }
    }
    
    .connection-details {
      margin-bottom: 1rem;
      padding: 1rem;
      background: #f8f9fa;
      border-radius: 4px;
      
      p {
        margin: 0.5rem 0;
        line-height: 1.5;
      }
    }
    
    .controls {
      display: flex;
      gap: 1rem;
      flex-wrap: wrap;
      
      button {
        padding: 0.5rem 1rem;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        transition: all 0.2s ease;
        
        &:hover:not(:disabled) {
          opacity: 0.9;
        }
        
        &:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        &.btn-primary {
          background: var(--primary-color);
          color: white;
        }
        
        &.btn-secondary {
          background: #6c757d;
          color: white;
        }
        
        &.btn-danger {
          background: #dc3545;
          color: white;
        }
      }
    }
  }
  
  .presence-test,
  .notifications-test,
  .tasks-test,
  .events-log {
    background: white;
    border-radius: 8px;
    padding: 1.5rem;
    margin-bottom: 2rem;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    
    h2 {
      margin-top: 0;
      margin-bottom: 1rem;
      color: #333;
    }
    
    .presence-controls,
    .notification-controls,
    .tasks-controls {
      display: flex;
      gap: 1rem;
      flex-wrap: wrap;
      margin-bottom: 1rem;
      
      button {
        padding: 0.5rem 1rem;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        transition: all 0.2s ease;
        
        &:hover:not(:disabled) {
          opacity: 0.9;
        }
        
        &:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      }
    }
    
    .presence-stats,
    .notification-stats,
    .tasks-stats {
      margin-bottom: 1rem;
      padding: 1rem;
      background: #f8f9fa;
      border-radius: 4px;
      
      p {
        margin: 0.5rem 0;
        line-height: 1.5;
      }
    }
    
    .users-list,
    .notifications-list,
    .tasks-list {
      ul {
        list-style: none;
        padding: 0;
        margin: 0;
        
        li {
          padding: 1rem;
          border: 1px solid #dee2e6;
          border-radius: 4px;
          margin-bottom: 0.5rem;
          
          &.unread {
            background: #fff3cd;
            border-color: #ffeaa7;
          }
          
          &.completed {
            background: #d4edda;
            border-color: #c3e6cb;
            
            .task-status {
              color: #155724;
            }
          }
          
          .user-name {
            font-weight: bold;
            margin-right: 0.5rem;
          }
          
          .user-status {
            font-size: 0.8rem;
            padding: 0.2rem 0.5rem;
            border-radius: 4px;
            margin-right: 0.5rem;
            
            &.online {
              background: #d4edda;
              color: #155724;
            }
            
            &.idle {
              background: #fff3cd;
              color: #856404;
            }
          }
          
          .user-info {
            font-size: 0.8rem;
            color: #6c757d;
            margin-left: 0.5rem;
          }
          
          .notification-header {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            margin-bottom: 0.5rem;
            
            .notification-type {
              padding: 0.2rem 0.5rem;
              border-radius: 4px;
              font-size: 0.8rem;
              font-weight: bold;
              
              &.info {
                background: #d4edda;
                color: #155724;
              }
              
              &.success {
                background: #d4edda;
                color: #155724;
              }
              
              &.warning {
                background: #fff3cd;
                color: #856404;
              }
              
              &.error {
                background: #f8d7da;
                color: #721c24;
              }
            }
            
            .notification-title {
              font-weight: bold;
            }
          }
          
          .notification-message {
            margin-bottom: 0.5rem;
            line-height: 1.5;
          }
          
          .notification-meta {
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 0.8rem;
            color: #6c757d;
            
            button {
              padding: 0.2rem 0.5rem;
              border: none;
              border-radius: 4px;
              background: #6c757d;
              color: white;
              cursor: pointer;
              
              &:hover {
                opacity: 0.9;
              }
            }
          }
          
          .task-title {
            font-weight: bold;
            margin-right: 1rem;
          }
          
          .task-priority {
            font-size: 0.8rem;
            color: #6c757d;
            margin-right: 1rem;
          }
          
          .task-status {
            font-weight: bold;
            
            &.completed {
              color: #155724;
            }
            
            &.in-progress {
              color: #ffc107;
            }
          }
        }
      }
      
      p {
        color: #6c757d;
        text-align: center;
        padding: 1rem;
      }
    }
  }
  
  .events-log {
    .log-container {
      max-height: 300px;
      overflow-y: auto;
      border: 1px solid #dee2e6;
      border-radius: 4px;
      padding: 1rem;
      
      .log-entry {
        padding: 0.5rem;
        border-bottom: 1px solid #dee2e6;
        display: flex;
        gap: 0.5rem;
        
        &.info {
          background: #f8f9fa;
        }
        
        &.success {
          background: #d4edda;
          color: #155724;
        }
        
        &.warning {
          background: #fff3cd;
          color: #856404;
        }
        
        &.error {
          background: #f8d7da;
          color: #721c24;
        }
        
        .timestamp {
          font-size: 0.8rem;
          color: #6c757d;
          min-width: 80px;
        }
        
        .event-text {
          flex: 1;
        }
      }
    }
  }
}

@media (max-width: 768px) {
  .online-page {
    padding: 1rem;
    
    .connection-status,
    .presence-test,
    .notifications-test,
    .tasks-test,
    .events-log {
      padding: 1rem;
    }
    
    .controls,
    .presence-controls,
    .notification-controls,
    .tasks-controls {
      flex-direction: column;
    }
  }
}
</style>