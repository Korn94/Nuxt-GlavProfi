<!-- app/pages/cabinet/testpage.vue -->
<template>
  <div class="test-page">
    <h1>🔧 Тестовая страница диагностики</h1>

    <!-- Быстрый статус -->
    <div class="quick-status">
      <div class="status-item">
        <div class="status-label">Socket</div>
        <div 
          :class="['status-value', `status-value--${socketStore.isConnected ? 'success' : 'error'}`]"
        >
          {{ socketStore.isConnected ? '✅ Подключен' : '❌ Отключен' }}
        </div>
      </div>
      <div class="status-item">
        <div class="status-label">Auth</div>
        <div 
          :class="['status-value', `status-value--${authStore.isAuthenticated ? 'success' : 'error'}`]"
        >
          {{ authStore.isAuthenticated ? '✅ Авторизован' : '❌ Не авторизован' }}
        </div>
      </div>
      <div class="status-item">
        <div class="status-label">Token</div>
        <div 
          :class="['status-value', `status-value--${hasToken ? 'success' : 'error'}`]"
        >
          {{ hasToken ? '✅ Есть' : '❌ Нет' }}
        </div>
      </div>
      <div class="status-item">
        <div class="status-label">Session</div>
        <div 
          :class="['status-value', `status-value--${sessionId ? 'success' : 'warning'}`]"
        >
          {{ sessionId ? '✅ Есть' : '⚠️ Нет' }}
        </div>
      </div>
    </div>

    <!-- Кнопки управления -->
    <div class="controls">
      <button @click="reconnectSocket" :disabled="socketStore.isConnecting">
        {{ socketStore.isConnecting ? 'Подключение...' : '🔄 Переподключить' }}
      </button>
      <button @click="disconnectSocket" :disabled="!socketStore.isConnected">
        🔌 Отключить
      </button>
      <button @click="initSession" :disabled="!socketStore.isConnected">
        📝 Инициализировать сессию
      </button>
      <button @click="sendTestMessage" :disabled="!socketStore.isConnected">
        📤 Отправить тестовое сообщение
      </button>
      <button @click="clearLogs">
        🗑️ Очистить логи
      </button>
      <button @click="forceReauth">
        🔐 Принудительная переавторизация
      </button>
    </div>

    <!-- Информация о подключении -->
    <div class="section">
      <h2>📡 Информация о соединении</h2>
      <div class="info-grid">
        <div class="info-item">
          <span class="info-label">Статус:</span>
          <span class="info-value">{{ socketStatus }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">URL:</span>
          <span class="info-value">{{ socketUrl }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">User ID:</span>
          <span class="info-value">{{ authStore.user?.id || '—' }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">User Name:</span>
          <span class="info-value">{{ authStore.user?.name || '—' }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">User Role:</span>
          <span class="info-value">{{ authStore.user?.role || '—' }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Session ID:</span>
          <span class="info-value">{{ sessionId || '—' }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Попытки переподключения:</span>
          <span class="info-value">{{ socketStore.reconnectAttempts }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">IP адрес:</span>
          <span class="info-value">{{ ipAddress }}</span>
        </div>
      </div>
    </div>

    <!-- Тестовые события -->
    <div class="section">
      <h2>🧪 Тестовые события</h2>
      <div class="test-events">
        <div class="test-event">
          <button @click="testActivity('online')" :disabled="!socketStore.isConnected">
            🟢 Activity: online
          </button>
          <button @click="testActivity('afk')" :disabled="!socketStore.isConnected">
            🟡 Activity: afk
          </button>
          <button @click="testActivity('offline')" :disabled="!socketStore.isConnected">
            ⚫ Activity: offline
          </button>
        </div>
        <div class="test-event">
          <button @click="testResume" :disabled="!socketStore.isConnected">
            🔄 Activity: resume
          </button>
          <button @click="testUserUpdate" :disabled="!socketStore.isConnected">
            👤 User: update
          </button>
        </div>
        <div class="test-event">
          <input 
            v-model="customEventName" 
            placeholder="Имя события"
            class="event-input"
          />
          <input 
            v-model="customEventData" 
            placeholder='{"key": "value"}'
            class="event-input"
          />
          <button @click="sendCustomEvent" :disabled="!socketStore.isConnected">
            📮 Отправить
          </button>
        </div>
      </div>
    </div>

    <!-- Состояние хранилищ -->
    <div class="section">
      <h2>🗄️ Состояние хранилищ Pinia</h2>
      
      <div class="store-state">
        <h3>Auth Store</h3>
        <pre>{{ authStoreState }}</pre>
      </div>

      <div class="store-state">
        <h3>Socket Store</h3>
        <pre>{{ socketStoreState }}</pre>
      </div>

      <div class="store-state">
        <h3>Online Store</h3>
        <pre>{{ onlineStoreState }}</pre>
      </div>

      <div class="store-state">
        <h3>Notifications Store</h3>
        <pre>{{ notificationsStoreState }}</pre>
      </div>
    </div>

    <!-- Куки -->
    <div class="section">
      <h2>🍪 Куки</h2>
      <div class="cookies">
        <div class="cookie-item">
          <span class="cookie-label">auth_token:</span>
          <span class="cookie-value">{{ authCookie }}</span>
        </div>
        <div class="cookie-item">
          <span class="cookie-label">session_id:</span>
          <span class="cookie-value">{{ sessionIdCookie }}</span>
        </div>
      </div>
    </div>

    <!-- Логи событий -->
    <div class="section">
      <h2>📝 Логи событий</h2>
      <div class="logs">
        <div 
          v-for="(log, index) in logs" 
          :key="index" 
          :class="['log-item', `log-item--${log.type}`]"
        >
          <span class="log-time">{{ log.time }}</span>
          <span class="log-type">[{{ log.type.toUpperCase() }}]</span>
          <span class="log-message">{{ log.message }}</span>
        </div>
        <div v-if="logs.length === 0" class="log-empty">
          Нет событий
        </div>
      </div>
    </div>

    <!-- Подписки на события -->
    <div class="section">
      <h2>🔔 Подписки на события</h2>
      <div class="subscriptions">
        <div 
          v-for="(sub, index) in subscriptions" 
          :key="index"
          class="subscription-item"
        >
          <span class="subscription-event">🎯 {{ sub.event }}</span>
          <span class="subscription-status">{{ sub.active ? '✅ Активна' : '❌ Неактивна' }}</span>
        </div>
      </div>
    </div>

    <!-- API тесты -->
    <div class="section">
      <h2>📡 API тесты</h2>
      <div class="api-tests">
        <button @click="testApiMe">GET /api/me</button>
        <button @click="testApiOnline">GET /api/online</button>
        <button @click="testApiCheck">GET /api/auth/check</button>
      </div>
    </div>

    <!-- Ошибки -->
    <div v-if="errors.length > 0" class="section errors-section">
      <h2>❌ Ошибки</h2>
      <div class="errors">
        <div 
          v-for="(error, index) in errors" 
          :key="index" 
          class="error-item"
        >
          <span class="error-time">{{ error.time }}</span>
          <span class="error-message">{{ error.message }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useAuthStore } from '../../../stores/auth'
import { useSocketStore } from '../../../stores/socket'
import { useOnlineStore } from '../../../stores/online'
import { useNotificationStore } from '../../../stores/notifications'
import { useCookie } from 'nuxt/app'

definePageMeta({
  layout: 'cabinet',
  middleware: ['require-auth']
})

// Хранилища
const authStore = useAuthStore()
const socketStore = useSocketStore()
const onlineStore = useOnlineStore()
const notificationStore = useNotificationStore()

// Куки
const authCookie = useCookie('auth_token')
const sessionIdCookie = useCookie('session_id')

// Состояние
const logs = ref<Array<{ type: string, message: string, time: string }>>([])
const errors = ref<Array<{ message: string, time: string }>>([])
const subscriptions = ref<Array<{ event: string, active: boolean }>>([
  { event: 'connect', active: true },
  { event: 'disconnect', active: true },
  { event: 'connect_error', active: true },
  { event: 'online-users:update', active: true },
  { event: 'user:update', active: false },
  { event: 'activity', active: false }
])
const customEventName = ref('')
const customEventData = ref('')

// Информация
const ipAddress = ref('')
const hasToken = computed(() => !!authCookie.value)
const sessionId = computed(() => sessionIdCookie.value)
const socketStatus = computed(() => {
  if (socketStore.isConnected) return 'Подключен'
  if (socketStore.isConnecting) return 'Подключение...'
  if (socketStore.error) return `Ошибка: ${socketStore.error}`
  return 'Отключен'
})
const socketUrl = computed(() => {
  return typeof window !== 'undefined' ? window.location.origin : '—'
})

// Состояния хранилищ
const authStoreState = computed(() => ({
  token: authStore.token,
  isAuthenticated: authStore.isAuthenticated,
  isChecking: authStore.isChecking,
  userId: authStore.user?.id,
  userRole: authStore.user?.role,
  error: authStore.error
}))

const socketStoreState = computed(() => ({
  isConnected: socketStore.isConnected,
  isConnecting: socketStore.isConnecting,
  userId: socketStore.userId,
  error: socketStore.error,
  reconnectAttempts: socketStore.reconnectAttempts,
  socket: socketStore.socket ? 'Socket instance exists' : null
}))

const onlineStoreState = computed(() => ({
  users: onlineStore.users,
  isLoading: onlineStore.isLoading,
  error: onlineStore.error,
  count: onlineStore.getOnlineCount
}))

const notificationsStoreState = computed(() => ({
  notifications: notificationStore.notifications,
  count: notificationStore.notifications.length,
  maxVisible: notificationStore.maxVisible
}))

// Логирование
const log = (type: string, message: string) => {
  const time = new Date().toLocaleTimeString('ru-RU', { 
    hour: '2-digit', 
    minute: '2-digit', 
    second: '2-digit' 
  })
  logs.value.unshift({ type, message, time })
  console.log(`[${type.toUpperCase()}] ${message}`)
}

const errorLog = (message: string) => {
  const time = new Date().toLocaleTimeString('ru-RU', { 
    hour: '2-digit', 
    minute: '2-digit', 
    second: '2-digit' 
  })
  errors.value.unshift({ message, time })
  log('error', message)
}

const clearLogs = () => {
  logs.value = []
  errors.value = []
}

// Управление сокетом
const reconnectSocket = async () => {
  log('info', 'Попытка переподключения...')
  try {
    await socketStore.disconnect()
    await socketStore.connect()
    log('success', 'Переподключение успешно')
  } catch (error) {
    errorLog(`Ошибка переподключения: ${error}`)
  }
}

const disconnectSocket = async () => {
  log('info', 'Отключение сокета...')
  try {
    await socketStore.disconnect()
    log('info', 'Сокет отключен')
  } catch (error) {
    errorLog(`Ошибка отключения: ${error}`)
  }
}

const initSession = async () => {
  if (!socketStore.isConnected || !sessionId.value) {
    errorLog('Нельзя инициализировать сессию: сокет не подключен или нет session_id')
    return
  }

  try {
    socketStore.sendMessage('session:init', {
      ipAddress: ipAddress.value,
      userAgent: navigator.userAgent
    })
    log('success', 'Сессия инициализирована')
  } catch (error) {
    errorLog(`Ошибка инициализации сессии: ${error}`)
  }
}

const sendTestMessage = () => {
  if (!socketStore.isConnected) {
    errorLog('Сокет не подключен')
    return
  }

  const testMessage = {
    test: true,
    timestamp: Date.now(),
    userId: authStore.user?.id,
    message: 'Тестовое сообщение'
  }

  socketStore.sendMessage('test', testMessage)
  log('info', `Отправлено тестовое сообщение: ${JSON.stringify(testMessage)}`)
}

const sendCustomEvent = () => {
  if (!socketStore.isConnected) {
    errorLog('Сокет не подключен')
    return
  }

  try {
    const data = JSON.parse(customEventData.value)
    socketStore.sendMessage(customEventName.value, data)
    log('custom', `Отправлено событие "${customEventName.value}": ${JSON.stringify(data)}`)
  } catch (error) {
    errorLog(`Ошибка отправки события: ${error}`)
  }
}

// Тестовые события
const testActivity = (status: 'online' | 'afk' | 'offline') => {
  if (!sessionId.value) {
    errorLog('Нет session_id для отправки события активности')
    return
  }

  socketStore.sendMessage('activity', {
    sessionId: sessionId.value,
    status,
    ipAddress: ipAddress.value
  })
  log('activity', `Отправлено событие активности: ${status}`)
}

const testResume = () => {
  if (!sessionId.value) {
    errorLog('Нет session_id для отправки события')
    return
  }

  socketStore.sendMessage('activity:resume', {
    sessionId: sessionId.value,
    ipAddress: ipAddress.value
  })
  log('activity', 'Отправлено событие resume')
}

const testUserUpdate = () => {
  socketStore.sendMessage('user:update', {
    name: authStore.user?.name
  })
  log('user', 'Отправлено событие обновления пользователя')
}

// API тесты
const testApiMe = async () => {
  try {
    const data = await $fetch('/api/me')
    log('api', `GET /api/me: ${JSON.stringify(data)}`)
  } catch (error) {
    errorLog(`GET /api/me failed: ${error}`)
  }
}

const testApiOnline = async () => {
  try {
    const data = await $fetch('/api/online')
    log('api', `GET /api/online: ${JSON.stringify(data)}`)
  } catch (error) {
    errorLog(`GET /api/online failed: ${error}`)
  }
}

const testApiCheck = async () => {
  try {
    const data = await $fetch('/api/auth/check')
    log('api', `GET /api/auth/check: ${JSON.stringify(data)}`)
  } catch (error) {
    errorLog(`GET /api/auth/check failed: ${error}`)
  }
}

// Принудительная переавторизация
const forceReauth = async () => {
  log('info', 'Принудительная переавторизация...')
  try {
    await authStore.init()
    log('success', 'Переавторизация завершена')
  } catch (error) {
    errorLog(`Ошибка переавторизации: ${error}`)
  }
}

// Подписки на события сокета
const setupSocketListeners = () => {
  socketStore.on('connect', () => {
    log('socket', '✅ Подключен к серверу')
  })

  socketStore.on('disconnect', (reason: string) => {
    log('socket', `🔌 Отключен: ${reason}`)
  })

  socketStore.on('connect_error', (error: any) => {
    errorLog(`Ошибка подключения: ${error.message}`)
  })

  socketStore.on('online-users:update', (users: any) => {
    log('socket', `Получено обновление онлайн-пользователей: ${users.length}`)
  })

  socketStore.on('user:update', (user: any) => {
    log('socket', `Обновление пользователя: ${JSON.stringify(user)}`)
  })

  socketStore.on('test', (data: any) => {
    log('socket', `Тестовое событие: ${JSON.stringify(data)}`)
  })
}

// Инициализация
onMounted(() => {
  log('info', 'Страница тестирования загружена')

  // Получаем локальный IP
  ipAddress.value = window.location.hostname

  // Подписываемся на события сокета
  setupSocketListeners()

  // Логируем начальное состояние
  log('info', `Auth status: ${authStore.isAuthenticated ? 'authenticated' : 'not authenticated'}`)
  log('info', `Socket status: ${socketStore.isConnected ? 'connected' : 'disconnected'}`)
  log('info', `Token exists: ${hasToken.value ? 'yes' : 'no'}`)
  log('info', `Session ID: ${sessionId.value || 'none'}`)

  // Проверяем, если сокет не подключен, но есть токен
  if (!socketStore.isConnected && hasToken.value) {
    log('warning', 'Сокет не подключен, но токен существует. Попытка подключения...')
    socketStore.connect()
  }
})

onUnmounted(() => {
  log('info', 'Страница тестирования закрыта')
})

// Отслеживание изменений состояния
watch(
  () => socketStore.isConnected,
  (newVal, oldVal) => {
    if (newVal !== oldVal) {
      log('watch', `Socket connected changed: ${oldVal} -> ${newVal}`)
    }
  }
)

watch(
  () => authStore.isAuthenticated,
  (newVal, oldVal) => {
    if (newVal !== oldVal) {
      log('watch', `Auth status changed: ${oldVal} -> ${newVal}`)
    }
  }
)

watch(
  () => socketStore.error,
  (newVal) => {
    if (newVal) {
      errorLog(`Socket error: ${newVal}`)
    }
  }
)
</script>

<style lang="scss" scoped>
.test-page {
  padding: 20px;
  color: #fff;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;

  h1 {
    margin-bottom: 20px;
    font-size: 28px;
    color: #fff;
    border-bottom: 2px solid rgba(255, 255, 255, 0.1);
    padding-bottom: 10px;
  }
}

.quick-status {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 12px;
  margin-bottom: 20px;
}

.status-item {
  background: rgba(255, 255, 255, 0.05);
  padding: 12px;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.status-label {
  font-size: 12px;
  color: #999;
  text-transform: uppercase;
  font-weight: 500;
}

.status-value {
  font-size: 16px;
  font-weight: 600;

  &--success {
    color: #4caf50;
  }

  &--error {
    color: #f44336;
  }

  &--warning {
    color: #ff9800;
  }
}

.controls {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 20px;
  padding: 15px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;

  button {
    padding: 10px 16px;
    background: #00c3f5;
    color: #000;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-weight: 600;
    transition: all 0.2s;
    white-space: nowrap;

    &:hover:not(:disabled) {
      background: #00d4ff;
      transform: translateY(-1px);
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }
}

.section {
  margin-bottom: 30px;
  background: rgba(255, 255, 255, 0.03);
  padding: 20px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.05);

  h2 {
    margin-bottom: 15px;
    font-size: 20px;
    color: #ccc;
    display: flex;
    align-items: center;
    gap: 8px;
  }
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
}

.info-item {
  background: rgba(255, 255, 255, 0.05);
  padding: 12px;
  border-radius: 6px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-label {
  font-size: 12px;
  color: #999;
}

.info-value {
  font-size: 14px;
  font-weight: 500;
  color: #fff;
  word-break: break-all;
}

.test-events {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.test-event {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;

  button {
    padding: 8px 12px;
    background: rgba(255, 255, 255, 0.1);
    color: #fff;
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 6px;
    cursor: pointer;
    font-size: 13px;
    transition: all 0.2s;

    &:hover:not(:disabled) {
      background: rgba(255, 255, 255, 0.2);
    }

    &:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }
  }
}

.event-input {
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 6px;
  color: #fff;
  font-size: 13px;
  flex: 1;
  min-width: 200px;

  &::placeholder {
    color: #666;
  }

  &:focus {
    outline: none;
    border-color: #00c3f5;
  }
}

.store-state {
  margin-bottom: 20px;
  background: rgba(0, 0, 0, 0.3);
  padding: 15px;
  border-radius: 6px;

  h3 {
    margin-bottom: 10px;
    font-size: 16px;
    color: #00c3f5;
  }

  pre {
    background: rgba(0, 0, 0, 0.5);
    padding: 10px;
    border-radius: 4px;
    font-size: 12px;
    color: #ccc;
    overflow-x: auto;
    max-height: 200px;
    overflow-y: auto;
  }
}

.cookies {
  background: rgba(255, 255, 255, 0.05);
  padding: 15px;
  border-radius: 6px;
}

.cookie-item {
  display: flex;
  gap: 10px;
  padding: 8px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);

  &:last-child {
    border-bottom: none;
  }
}

.cookie-label {
  font-weight: 600;
  color: #999;
  min-width: 120px;
}

.cookie-value {
  color: #ccc;
  word-break: break-all;
}

.logs {
  background: rgba(0, 0, 0, 0.3);
  padding: 15px;
  border-radius: 6px;
  max-height: 400px;
  overflow-y: auto;
}

.log-item {
  padding: 8px 10px;
  border-radius: 4px;
  margin-bottom: 6px;
  font-size: 12px;
  display: flex;
  gap: 8px;
  align-items: center;

  &--info {
    background: rgba(0, 195, 245, 0.1);
    color: #00c3f5;
  }

  &--success {
    background: rgba(76, 175, 80, 0.1);
    color: #4caf50;
  }

  &--error {
    background: rgba(244, 67, 54, 0.1);
    color: #f44336;
  }

  &--socket {
    background: rgba(156, 39, 176, 0.1);
    color: #9c27b0;
  }

  &--api {
    background: rgba(255, 152, 0, 0.1);
    color: #ff9800;
  }

  &--activity {
    background: rgba(33, 150, 243, 0.1);
    color: #2196f3;
  }

  &--user {
    background: rgba(76, 175, 80, 0.1);
    color: #4caf50;
  }

  &--watch {
    background: rgba(158, 158, 158, 0.1);
    color: #9e9e9e;
  }

  &--custom {
    background: rgba(233, 30, 99, 0.1);
    color: #e91e63;
  }
}

.log-time {
  font-weight: 600;
  min-width: 80px;
}

.log-type {
  font-weight: 600;
  min-width: 100px;
}

.log-message {
  flex: 1;
  word-break: break-word;
}

.log-empty {
  text-align: center;
  color: #666;
  padding: 20px;
}

.subscriptions {
  background: rgba(255, 255, 255, 0.05);
  padding: 15px;
  border-radius: 6px;
}

.subscription-item {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);

  &:last-child {
    border-bottom: none;
  }
}

.subscription-event {
  color: #00c3f5;
  font-weight: 500;
}

.subscription-status {
  color: #999;
  font-weight: 500;
}

.api-tests {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;

  button {
    padding: 8px 16px;
    background: rgba(255, 152, 0, 0.2);
    color: #ff9800;
    border: 1px solid rgba(255, 152, 0, 0.3);
    border-radius: 6px;
    cursor: pointer;
    font-size: 13px;
    transition: all 0.2s;

    &:hover {
      background: rgba(255, 152, 0, 0.3);
    }
  }
}

.errors-section {
  background: rgba(244, 67, 54, 0.1);
  border: 1px solid rgba(244, 67, 54, 0.3);
}

.errors {
  background: rgba(0, 0, 0, 0.3);
  padding: 15px;
  border-radius: 6px;
  max-height: 300px;
  overflow-y: auto;
}

.error-item {
  padding: 10px;
  background: rgba(244, 67, 54, 0.1);
  border-radius: 4px;
  margin-bottom: 8px;
  display: flex;
  gap: 10px;
  align-items: flex-start;
}

.error-time {
  color: #f44336;
  font-weight: 600;
  min-width: 80px;
}

.error-message {
  color: #fff;
  flex: 1;
  word-break: break-word;
}
</style>