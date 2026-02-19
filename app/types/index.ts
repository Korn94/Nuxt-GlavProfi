// types/index.ts
/**
 * Типы для пользователя
 */
export interface User {
  id: number
  email: string
  name: string
  role: string
  createdAt: string
  updatedAt: string
  isVerified: boolean
}

/**
 * Типы для данных аутентификации
 */
export interface AuthCredentials {
  email: string
  password: string
}

export interface TelegramAuthData {
  id: number
  first_name: string
  last_name: string
  username: string | null
  photo_url: string | null
  auth_date: number
  hash: string
}

/**
 * Интерфейс онлайн-пользователя (агрегированные данные)
 * Теперь включает информацию о вкладках и текущей странице
 */
export interface OnlineUser {
  userId: number
  user: {
    id: number
    name: string
    role: string
    login: string
  }
  tabsCount: number          // Общее количество открытых вкладок
  activePath: string         // Путь активной/последней активной вкладки
  status: 'online' | 'afk'   // Статус пользователя
  lastActivity: string       // Время последней активности
  startedAt: string          // Время начала сессии
  ipAddress: string          // IP-адрес
}

/**
 * Интерфейс сессии пользователя
 */
export interface UserSession {
  id: number
  sessionId: string
  userId: number
  status: 'online' | 'afk' | 'offline'
  isActiveTab: boolean       // Флаг активной вкладки
  tabId: string              // Уникальный идентификатор вкладки
  currentPath: string        // Текущий путь страницы
  lastActivity: string
  startedAt: string
  endedAt?: string
  ipAddress?: string
  userAgent?: string
}

/**
 * Статистика онлайн-пользователей
 */
export interface OnlineStats {
  total: number
  online: number
  afk: number
}

/**
 * Ответ от /api/online
 */
export interface OnlineApiResponse {
  users: OnlineUser[]
  total: number
  online: number
  afk: number
}

/**
 * Типы для событий сокетов
 */
export interface SocketEvent {
  type: 'message' | 'notification' | 'update' | 'error'
  payload: any
}

export interface UserUpdateEvent {
  id: number
  name?: string
  email?: string
  role?: string
  avatar?: string | null
  isVerified?: boolean
}

export interface NotificationEvent {
  id: number
  type: 'info' | 'success' | 'warning' | 'error'
  title: string
  message: string
  createdAt: string
  read: boolean
}

/**
 * Типы для админ-панели
 */
export interface DashboardStats {
  totalUsers: number
  activeUsers: number
  newUsersToday: number
  totalMessages: number
}

export interface AdminAction {
  id: number
  userId: number
  action: 'create' | 'update' | 'delete' | 'login'
  target: string
  ip: string
  timestamp: string
  details?: Record<string, any>
}

export interface Message {
  id: number
  senderId: number
  receiverId: number
  content: string
  createdAt: string
  updatedAt: string
  read: boolean
}

export interface Chat {
  id: number
  participants: number[]
  lastMessage: Message
  unreadCount: number
  createdAt: string
  updatedAt: string
}

/**
 * Типы для обработки ошибок
 */
export interface ApiError {
  code: string
  message: string
  details?: Record<string, any>
}

/**
 * Типы для конфигурации
 */
export interface AppConfig {
  siteName: string
  siteUrl: string
  apiBaseUrl: string
  socketUrl: string
  features: {
    telegramIntegration: boolean
    pushNotifications: boolean
    analytics: boolean
  }
}

/**
 * Типы для состояния сокета
 */
export interface SocketConnectionState {
  status: 'connecting' | 'connected' | 'disconnected' | 'error'
  error?: string
  reconnectAttempts: number
  lastReconnectTime: string | null
}

/**
 * Типы для обработки событий
 */
export interface EventCallback {
  (data: any): void
}

export interface SocketEventMap {
  'user:update': (user: User) => void
  'notification:new': (notification: NotificationEvent) => void
  'message:new': (message: Message) => void
  'admin:action': (action: AdminAction) => void
  'error': (error: ApiError) => void
  'connect': () => void
  'disconnect': (reason: string) => void
  'reconnect': () => void
  'reconnect_failed': () => void
}
