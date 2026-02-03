// types/index.ts
/**
 * Типы для пользователя
 */
export interface User {
  id: number
  email: string
  name: string
  role: 'admin' | 'manager' | 'foreman' | 'master' | 'worker'
  avatar?: string | null
  createdAt: string
  updatedAt: string
  telegramId?: number | null
  isVerified: boolean
  lastLogin?: string | null
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
 * Типы для онлайн-пользователей
 */
export interface OnlineUser {
  id: number
  userId: number
  sessionId: string
  status: 'online' | 'afk' | 'offline'
  lastActivity: string
  startedAt: string
  ipAddress?: string
  user?: {
    name: string
    role: 'admin' | 'manager' | 'foreman' | 'master' | 'worker'
  }
}

export interface OnlineStats {
  total: number
  online: number
  afk: number
  offline: number
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
