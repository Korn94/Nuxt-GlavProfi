// types/index.ts
import type { users } from '../../server/db/schema'

type DbUser = typeof users.$inferSelect

declare module 'h3' {
  interface H3EventContext {
    user?: DbUser
  }
}

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
 * Включает информацию о статусе, текущей странице и типе устройства
 */
export interface OnlineUser {
  userId: number
  user: {
    id: number
    name: string
    role: string
    login: string
  }
  activePath: string         // Путь активной/последней активной вкладки
  status: 'online' | 'afk' | 'offline'   // Статус пользователя
  lastActivity: string       // Время последней активности
  endedAt: string | null
  startedAt: string          // Время начала сессии
  ipAddress: string          // IP-адрес
  deviceType: 'desktop' | 'mobile' | 'unknown'  // Тип устройства
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
 * Типы для данных аутентификации
 */
export interface AuthResponse {
  token: string
  user: User
}

export interface LoginResponse {
  token: string
  user: User
}

export interface RegisterResponse {
  token: string
  user: User
}

/**
 * Типы для API ответов
 */
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

/**
 * Типы для уведомлений
 */
export interface Notification {
  id: number
  userId: number
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  isRead: boolean
  createdAt: string
  readAt?: string
}

/**
 * Типы для файлов
 */
export interface UploadedFile {
  id: number
  filename: string
  originalName: string
  mimeType: string
  size: number
  url: string
  createdAt: string
}

/**
 * Типы для настроек
 */
export interface AppSettings {
  id: number
  key: string
  value: any
  description?: string
  updatedAt: string
}

/**
 * Типы для аудита
 */
export interface AuditLog {
  id: number
  userId: number
  action: string
  entity: string
  entityId: number
  changes: Record<string, any>
  ipAddress: string
  createdAt: string
}