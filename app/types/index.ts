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
  activePath: string | null  // Путь активной/последней активной вкладки (может быть null)
  activeObjectId?: number | null     // ID объекта, если открыта карточка объекта
  activeObjectName?: string | null   // Название объекта (резолвится на сервере)
  status: 'online' | 'afk' | 'offline'   // Статус пользователя
  lastActivity: string       // Время последней активности
  endedAt: string | null
  startedAt: string          // Время начала сессии
  ipAddress: string          // IP-адрес
  deviceType: 'desktop' | 'mobile' | 'unknown'  // Тип устройства
}

/**
 * Интерфейс посетителя публичного сайта (анонимного, без авторизации)
 * Данные приходят из in-memory реестра сервера (без записи в БД)
 */
export interface Visitor {
  id: string                // Устойчивый ID посетителя
  activePath: string        // Текущая страница (без query)
  landingPath: string       // Страница входа
  referrer: string | null   // Откуда пришёл (host реферера, без собственного сайта)
  referrerType: 'direct' | 'search' | 'social' | 'referral'
  channel: string           // Канал трафика (yandex_direct, organic_google, direct...)
  channelLabel: string      // Название канала для UI
  utmSource: string | null
  utmMedium: string | null
  utmCampaign: string | null
  status: 'online' | 'idle' // online — есть видимая вкладка с активностью < 60 c назад
  lastActivity: string      // Время последнего пинга (ISO)
  startedAt: string         // Начало визита (ISO)
  ipAddress: string         // IP-адрес
  userAgent: string         // Сырой User-Agent
  deviceType: 'desktop' | 'mobile' | 'tablet' | 'unknown'  // Тип устройства
  browser: string
  os: string
  city: string | null
  visitNumber: number       // Порядковый номер визита посетителя
  isReturning: boolean      // Вернувшийся посетитель
  pagesCount: number        // Просмотрено страниц в визите
  eventsCount: number       // Событий (клики, формы) в визите
  activeSeconds: number     // Активное время в визите
  converted: boolean        // Было обращение (телефон, мессенджер, форма)
}

/**
 * Ответ GET /api/visitors
 */
export interface VisitorsResponse {
  visitors: Visitor[]
  total: number
}

/** Источник трафика (строка таблицы GET /api/visitors/stats) */
export interface VisitorChannelStat {
  channel: string
  channelLabel: string
  visits: number
  visitors: number
  conversions: number
  conversionRate: number    // % визитов с обращением
  bounceRate: number        // % отказов
  avgSeconds: number        // среднее активное время визита
  avgPages: number
}

/** Страница сайта (строка таблицы GET /api/visitors/stats) */
export interface VisitorPageStat {
  path: string
  views: number
  avgSeconds: number
  avgScroll: number         // средняя максимальная глубина скролла, %
  exits: number
  exitRate: number          // % визитов, закончившихся на этой странице
}

/** Обращение (клик по телефону, мессенджеру, форма) с путём посетителя */
export interface VisitorConversion {
  id: number
  type: string
  path: string | null
  createdAt: string
  visitorId: string
  channel: string
  channelLabel: string
  utmCampaign: string | null
  referrerHost: string | null
  visitNumber: number
  pagesCount: number
  landingPath: string | null
  city: string | null
}

/** Визит из истории */
export interface VisitorVisit {
  id: string
  visitorId: string
  visitNumber: number
  startedAt: string
  channel: string
  channelLabel: string
  utmCampaign: string | null
  referrerHost: string | null
  landingPath: string | null
  exitPath: string | null
  pagesCount: number
  activeSeconds: number
  isBounce: boolean
  converted: boolean
  deviceType: string
  browser: string | null
  city: string | null
}

/** Ответ GET /api/visitors/stats */
export interface VisitorStatsResponse {
  days: number
  channels: VisitorChannelStat[]
  pages: VisitorPageStat[]
  eventTypes: Array<{ type: string; total: number }>
  conversions: VisitorConversion[]
  visits: VisitorVisit[]
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