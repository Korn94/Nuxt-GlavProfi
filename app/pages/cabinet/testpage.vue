<!-- app/pages/cabinet/testpage.vue -->
<template>
  <div class="test-page">
    <h1>🔧 Тестовая страница диагностики Socket.IO</h1>

    <!-- Быстрый статус -->
    <div class="quick-status">
      <div class="status-item">
        <div class="status-label">Socket</div>
        <div 
          :class="['status-value', `status-value--${isConnected ? 'success' : 'error'}`]"
        >
          {{ isConnected ? '✅ Подключен' : '❌ Отключен' }}
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
      <button @click="reconnectSocket" :disabled="isConnecting">
        {{ isConnecting ? 'Подключение...' : '🔄 Переподключить' }}
      </button>
      <button @click="disconnectSocket" :disabled="!isConnected">
        🔌 Отключить
      </button>
      <button @click="initSession" :disabled="!isConnected">
        📝 Инициализировать сессию
      </button>
      <button @click="sendTestMessage" :disabled="!isConnected">
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
          <span class="info-label">Socket ID:</span>
          <span class="info-value">{{ socketId || '—' }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Транспорт:</span>
          <span class="info-value">{{ transport || '—' }}</span>
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
          <span class="info-value">{{ reconnectAttempts }}</span>
        </div>
      </div>
    </div>

    <!-- Тестовые события -->
    <div class="section">
      <h2>🧪 Тестовые события</h2>
      <div class="test-events">
        <div class="test-event">
          <button @click="testActivity('online')" :disabled="!isConnected">
            🟢 Activity: online
          </button>
          <button @click="testActivity('afk')" :disabled="!isConnected">
            🟡 Activity: afk
          </button>
          <button @click="testActivity('offline')" :disabled="!isConnected">
            ⚫ Activity: offline
          </button>
        </div>
        <div class="test-event">
          <button @click="testResume" :disabled="!isConnected">
            🔄 Activity: resume
          </button>
          <button @click="testUserUpdate" :disabled="!isConnected">
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
          <button @click="sendCustomEvent" :disabled="!isConnected">
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
        <h3>Socket Store (state only)</h3>
        <pre>{{ socketStoreState }}</pre>
      </div>

      <div class="store-state">
        <h3>Online Store</h3>
        <pre>{{ onlineStoreState }}</pre>
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
        <div class="cookie-item">
          <span class="cookie-label">tab_id:</span>
          <span class="cookie-value">{{ tabIdCookie }}</span>
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
          Нет событий — нажмите кнопку для теста
        </div>
      </div>
    </div>

    <!-- Подписки на события -->
    <div class="section">
      <h2>🔔 Активные подписки</h2>
      <div class="subscriptions">
        <div 
          v-for="(sub, index) in activeSubscriptions" 
          :key="index"
          class="subscription-item"
        >
          <span class="subscription-event">🎯 {{ sub }}</span>
        </div>
        <div v-if="activeSubscriptions.length === 0" class="log-empty">
          Нет активных подписок
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
      <h2>❌ Ошибки ({{ errors.length }})</h2>
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
import { socketService } from 'services/socket.service'
import { useCookie } from 'nuxt/app'
import { definePageMeta } from 'node_modules/nuxt/dist/pages/runtime'

definePageMeta({
  layout: 'cabinet',
  middleware: ['require-auth']
})

// ============================================
// STORES
// ============================================
const authStore = useAuthStore()
const socketStore = useSocketStore() // Только для чтения состояния!
const onlineStore = useOnlineStore()

// ============================================
// COOKIES
// ============================================
const authCookie = useCookie('auth_token')
const sessionIdCookie = useCookie('session_id')
const tabIdCookie = useCookie('tab_id')

// ============================================
// STATE
// ============================================
const logs = ref<Array<{ type: string, message: string, time: string }>>([])
const errors = ref<Array<{ message: string, time: string }>>([])
const activeSubscriptions = ref<string[]>([])
const customEventName = ref('')
const customEventData = ref('')

// Информация о соединении
const socketId = ref<string | null>(null)
const transport = ref<string>('unknown')
const reconnectAttempts = ref(0)
const ipAddress = ref('')

// ============================================
// COMPUTED - Состояние из socketStore (только чтение)
// ============================================
const isConnected = computed(() => socketStore.isConnected)
const isConnecting = computed(() => socketStore.isConnecting)
const socketError = computed(() => socketStore.error)
const hasToken = computed(() => !!authCookie.value)
const sessionId = computed(() => sessionIdCookie.value)

const socketStatus = computed(() => {
  if (isConnected.value) return 'Подключен'
  if (isConnecting.value) return 'Подключение...'
  if (socketError.value) return `Ошибка: ${socketError.value}`
  return 'Отключен'
})

// ============================================
// COMPUTED - Состояния хранилищ
// ============================================
const authStoreState = computed(() => ({
  token: authStore.token ? '***' : null,
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
  reconnectAttempts: socketStore.reconnectAttempts
  // ⛔ Не показываем socket instance — это приватное свойство SocketService
}))

const onlineStoreState = computed(() => ({
  users: onlineStore.users?.length || 0,
  isLoading: onlineStore.isLoading,
  error: onlineStore.error
}))

// ============================================
// ЛОГИРОВАНИЕ
// ============================================
const log = (type: string, message: string) => {
  const time = new Date().toLocaleTimeString('ru-RU', { 
    hour: '2-digit', 
    minute: '2-digit', 
    second: '2-digit' 
  })
  logs.value.unshift({ type, message, time })
  console.log(`[TESTPAGE/${type.toUpperCase()}] ${message}`)
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
  log('info', 'Логи очищены')
}

// ============================================
// УПРАВЛЕНИЕ СОКЕТОМ (через socketService)
// ============================================

const reconnectSocket = async () => {
  log('info', 'Попытка переподключения...')
  try {
    // ✅ Используем socketService вместо socketStore
    socketService.disconnect()
    await new Promise(resolve => setTimeout(resolve, 500))
    socketService.connect()
    log('success', 'Переподключение инициировано')
  } catch (error: any) {
    errorLog(`Ошибка переподключения: ${error?.message || error}`)
  }
}

const disconnectSocket = () => {
  log('info', 'Отключение сокета...')
  socketService.disconnect()
  log('info', 'Сокет отключен')
}

const initSession = async () => {
  if (!isConnected.value || !sessionId.value) {
    errorLog('Нельзя инициализировать сессию: сокет не подключен или нет session_id')
    return
  }

  try {
    // ✅ Отправляем событие через socketService.emit()
    await socketService.emit('session:init', {
      ipAddress: ipAddress.value,
      userAgent: navigator.userAgent
    })
    log('success', 'Сессия инициализирована')
  } catch (error: any) {
    errorLog(`Ошибка инициализации сессии: ${error?.message || error}`)
  }
}

const sendTestMessage = async () => {
  if (!isConnected.value) {
    errorLog('Сокет не подключен')
    return
  }

  const testMessage = {
    test: true,
    timestamp: Date.now(),
    userId: authStore.user?.id,
    message: 'Тестовое сообщение с testpage.vue'
  }

  try {
    await socketService.emit('test', testMessage)
    log('info', `Отправлено тестовое сообщение: ${JSON.stringify(testMessage)}`)
  } catch (error: any) {
    errorLog(`Ошибка отправки: ${error?.message || error}`)
  }
}

const sendCustomEvent = async () => {
  if (!isConnected.value) {
    errorLog('Сокет не подключен')
    return
  }

  try {
    const data = JSON.parse(customEventData.value || '{}')
    await socketService.emit(customEventName.value, data)
    log('custom', `Отправлено событие "${customEventName.value}": ${JSON.stringify(data)}`)
  } catch (error: any) {
    errorLog(`Ошибка отправки события: ${error?.message || error}`)
  }
}

// ============================================
// ТЕСТОВЫЕ СОБЫТИЯ
// ============================================

const testActivity = async (status: 'online' | 'afk' | 'offline') => {
  if (!sessionId.value) {
    errorLog('Нет session_id для отправки события активности')
    return
  }

  try {
    await socketService.emit('activity', {
      sessionId: sessionId.value,
      status,
      ipAddress: ipAddress.value
    })
    log('activity', `Отправлено событие активности: ${status}`)
  } catch (error: any) {
    errorLog(`Ошибка отправки activity: ${error?.message || error}`)
  }
}

const testResume = async () => {
  if (!sessionId.value) {
    errorLog('Нет session_id для отправки события')
    return
  }

  try {
    await socketService.emit('activity:resume', {
      sessionId: sessionId.value,
      ipAddress: ipAddress.value
    })
    log('activity', 'Отправлено событие resume')
  } catch (error: any) {
    errorLog(`Ошибка отправки resume: ${error?.message || error}`)
  }
}

const testUserUpdate = async () => {
  try {
    await socketService.emit('user:update', {
      name: authStore.user?.name,
      role: authStore.user?.role
    })
    log('user', 'Отправлено событие обновления пользователя')
  } catch (error: any) {
    errorLog(`Ошибка отправки user:update: ${error?.message || error}`)
  }
}

// ============================================
// API ТЕСТЫ
// ============================================

const testApiMe = async () => {
  try {
    const data = await $fetch('/api/me')
    log('api', `GET /api/me: ${JSON.stringify(data)}`)
  } catch (error: any) {
    errorLog(`GET /api/me failed: ${error?.data?.message || error?.message || error}`)
  }
}

const testApiOnline = async () => {
  try {
    const data = await $fetch('/api/online')
    log('api', `GET /api/online: ${JSON.stringify(data)}`)
  } catch (error: any) {
    errorLog(`GET /api/online failed: ${error?.data?.message || error?.message || error}`)
  }
}

const testApiCheck = async () => {
  try {
    const data = await $fetch('/api/auth/check')
    log('api', `GET /api/auth/check: ${JSON.stringify(data)}`)
  } catch (error: any) {
    errorLog(`GET /api/auth/check failed: ${error?.data?.message || error?.message || error}`)
  }
}

// ============================================
// ПРИНУДИТЕЛЬНАЯ ПЕРЕАВТОРИЗАЦИЯ
// ============================================

const forceReauth = async () => {
  log('info', 'Принудительная переавторизация...')
  try {
    await authStore.init()
    log('success', 'Переавторизация завершена')
  } catch (error: any) {
    errorLog(`Ошибка переавторизации: ${error?.message || error}`)
  }
}

// ============================================
// ПОДПИСКИ НА СОБЫТИЯ СОКЕТА
// ============================================

const setupSocketListeners = () => {
  
  socketService.on('connect', () => {
    log('socket', '✅ Подключен к серверу')
    socketId.value = socketService.getSocketId() || null
    transport.value = socketService.getTransport()
    activeSubscriptions.value.push('connect')
  })

  socketService.on('disconnect', (reason: string) => {
    log('socket', `🔌 Отключен: ${reason}`)
    activeSubscriptions.value = activeSubscriptions.value.filter(s => s !== 'connect')
  })

  socketService.on('connect_error', (error: any) => {
    errorLog(`Ошибка подключения: ${error?.message || error}`)
  })

  socketService.on('reconnect_attempt', (attempt: number) => {
    log('socket', `🔄 Попытка переподключения #${attempt}`)
    reconnectAttempts.value = attempt
  })

  socketService.on('reconnect', (attempt: number) => {
    log('socket', `✅ Переподключено после ${attempt} попыток`)
    reconnectAttempts.value = 0
  })

  // socketService.on('online-users:update', (users: any[]) => {
  //   log('socket', `Получено обновление онлайн-пользователей: ${users?.length || 0} пользователей`)
  // })

  socketService.on('user:status', (data: any) => {
    log('socket', `Статус пользователя: ${JSON.stringify(data)}`)
  })

  socketService.on('user:update', (user: any) => {
    log('socket', `Обновление пользователя: ${JSON.stringify(user)}`)
  })

  socketService.on('test', (data: any) => {
    log('socket', `Тестовое событие получено: ${JSON.stringify(data)}`)
  })

  socketService.on('session:initialized', (data: any) => {
    log('socket', `Сессия инициализирована: ${JSON.stringify(data)}`)
  })

  log('info', `Зарегистрировано ${activeSubscriptions.value.length} подписок на события`)
}

// ============================================
// ИНИЦИАЛИЗАЦИЯ
// ============================================

onMounted(() => {
  log('info', '🚀 Страница тестирования загружена')

  // Получаем локальный IP/хост
  ipAddress.value = typeof window !== 'undefined' ? window.location.hostname : 'unknown'

  // Подписываемся на события сокета
  setupSocketListeners()

  // Логируем начальное состояние
  log('info', `Auth: ${authStore.isAuthenticated ? 'authenticated' : 'not authenticated'}`)
  log('info', `Socket: ${isConnected.value ? 'connected' : 'disconnected'}`)
  log('info', `Token: ${hasToken.value ? 'yes' : 'no'}`)
  log('info', `Session ID: ${sessionId.value || 'none'}`)
  log('info', `Socket URL: ${typeof window !== 'undefined' ? window.location.origin : 'server'}`)

  // Если есть токен, но сокет не подключен — пробуем подключиться
  if (hasToken.value && !isConnected.value && !isConnecting.value) {
    log('warning', 'Токен есть, но сокет не подключен. Пробуем подключиться...')
    socketService.connect()
  }
})

onUnmounted(() => {
  log('info', '👋 Страница тестирования закрыта')
  
  // ✅ Очищаем подписки при уничтожении компонента
  activeSubscriptions.value.forEach(event => {
    socketService.off(event)
  })
  activeSubscriptions.value = []
})

// ============================================
// WATCHERS
// ============================================

watch(
  () => isConnected.value,
  (newVal, oldVal) => {
    if (newVal !== oldVal) {
      log('watch', `Socket connected: ${oldVal} → ${newVal}`)
      if (newVal) {
        socketId.value = socketService.getSocketId() || null
        transport.value = socketService.getTransport()
      }
    }
  }
)

watch(
  () => authStore.isAuthenticated,
  (newVal, oldVal) => {
    if (newVal !== oldVal) {
      log('watch', `Auth status: ${oldVal} → ${newVal}`)
    }
  }
)

watch(
  () => socketError.value,
  (newVal) => {
    if (newVal) {
      errorLog(`Socket error: ${newVal}`)
    }
  }
)
</script>

<style lang="scss" scoped>
@use '@/assets/styles/variables.scss' as *;

.test-page {
  padding: 20px;
  color: $text-light;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;

  h1 {
    margin-bottom: 20px;
    font-size: 28px;
    color: $text-light;
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
    color: $green;
  }

  &--error {
    color: $red;
  }

  &--warning {
    color: $yellow;
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
    background: $blue;
    color: $text-light;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-weight: 600;
    transition: all 0.2s;
    white-space: nowrap;

    &:hover:not(:disabled) {
      background: color.adjust($blue, $lightness: 5%);
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
    color: $text-light;
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
  color: $text-light;
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
    color: $text-light;
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
  color: $text-light;
  font-size: 13px;
  flex: 1;
  min-width: 200px;

  &::placeholder {
    color: #666;
  }

  &:focus {
    outline: none;
    border-color: $blue;
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
    color: $blue;
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
    background: rgba($blue, 0.1);
    color: $blue;
  }

  &--success {
    background: rgba($green, 0.1);
    color: $green;
  }

  &--error {
    background: rgba($red, 0.1);
    color: $red;
  }

  &--socket {
    background: rgba(#9c27b0, 0.1);
    color: #9c27b0;
  }

  &--api {
    background: rgba($yellow, 0.1);
    color: $yellow;
  }

  &--activity {
    background: rgba(#2196f3, 0.1);
    color: #2196f3;
  }

  &--user {
    background: rgba($green, 0.1);
    color: $green;
  }

  &--watch {
    background: rgba(#9e9e9e, 0.1);
    color: #9e9e9e;
  }

  &--custom {
    background: rgba(#e91e63, 0.1);
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
  color: $blue;
  font-weight: 500;
}

.api-tests {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;

  button {
    padding: 8px 16px;
    background: rgba($yellow, 0.2);
    color: $yellow;
    border: 1px solid rgba($yellow, 0.3);
    border-radius: 6px;
    cursor: pointer;
    font-size: 13px;
    transition: all 0.2s;

    &:hover {
      background: rgba($yellow, 0.3);
    }
  }
}

.errors-section {
  background: rgba($red, 0.1);
  border: 1px solid rgba($red, 0.3);
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
  background: rgba($red, 0.1);
  border-radius: 4px;
  margin-bottom: 8px;
  display: flex;
  gap: 10px;
  align-items: flex-start;
}

.error-time {
  color: $red;
  font-weight: 600;
  min-width: 80px;
}

.error-message {
  color: $text-light;
  flex: 1;
  word-break: break-word;
}

// Адаптивность
@media (max-width: 768px) {
  .test-page {
    padding: 10px;
  }
  
  .quick-status {
    grid-template-columns: 1fr 1fr;
  }
  
  .controls {
    flex-direction: column;
    
    button {
      width: 100%;
    }
  }
  
  .info-grid {
    grid-template-columns: 1fr;
  }
  
  .test-event {
    flex-direction: column;
    
    button {
      width: 100%;
    }
  }
  
  .event-input {
    width: 100%;
  }
}
</style>