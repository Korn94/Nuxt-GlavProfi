// types/index.ts
import type { users } from '../../server/db/schema'

type DbUser = typeof users.$inferSelect

declare module 'h3' {
  interface H3EventContext {
    user?: DbUser
    /** Реальный пользователь (админ) при имперсонации */
    realUser?: DbUser | null
    /** Флаг активного режима «просмотр от имени пользователя» */
    impersonating?: boolean
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

/**
 * Ответ DELETE /api/visitors/history/[id]
 * Удаление одного визита из истории (только администратор)
 */
export interface DeleteVisitResponse {
  success: boolean
  message: string
  visitorId: string            // Посетитель, которому принадлежал визит
  visitorDeleted: boolean      // true — удалён и агрегат посетителя (визитов больше нет)
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
  linkedUserId: number | null    // ID сотрудника, если обращение «своё» (после логина)
  linkedUserName: string | null   // Имя сотрудника для пометки
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
  linkedUserId: number | null    // ID сотрудника, если визит «свой» (после логина)
  linkedUserName: string | null   // Имя сотрудника для пометки
}

/** Динамика по дням (точка временной серии для графика) */
export interface VisitorDailyStat {
  day: string          // 'YYYY-MM-DD'
  visits: number
  visitors: number
  conversions: number
}

/** Событие посетителя (строка таблицы «События») */
export interface VisitorEventRow {
  id: number
  sessionId: string
  visitorId: string
  type: string
  path: string | null
  meta: Record<string, string | number | boolean | null> | null
  createdAt: string
  channel: string
  channelLabel: string
  utmCampaign: string | null
  referrerHost: string | null
  visitNumber: number
  pagesCount: number
  landingPath: string | null
  city: string | null
  linkedUserId: number | null
  linkedUserName: string | null
  /** Событие считается обращением (конверсией) */
  isConversion: boolean
}

/** Счётчик событий по типу (чипы-фильтры) */
export interface VisitorEventTypeStat {
  type: string
  total: number
  isConversion: boolean
}

/** Воронка формы по странице: открытия → отправки (уникальные визиты) */
export interface VisitorFormFunnelRow {
  path: string | null
  opens: number
  submits: number
  /** % визитов с открытой формой, где форма была отправлена */
  submitRate: number
}

export interface VisitorFormFunnelTotals {
  opens: number
  submits: number
  submitRate: number
  /** Всего отправок формы (событий, не визитов) */
  submitEvents: number
}

/** Сводные показатели за выбранный период */
export interface VisitorTotals {
  visits: number
  visitors: number
  conversions: number
  conversionRate: number   // % визитов с обращением
  bounceRate: number       // % отказов
  avgSeconds: number
  avgPages: number
  /** Заявки (form_submit) за период, штук */
  leadEvents: number
  /** Визиты, в которых открывали/начинали форму */
  formOpens: number
  /** Визиты, в которых отправляли форму */
  formSubmits: number
  /** % визитов с открытой формой, где была отправка */
  formSubmitRate: number
}

/** Ответ GET /api/visitors/stats */
export interface VisitorStatsResponse {
  days: number
  totals: VisitorTotals
  daily: VisitorDailyStat[]
  channels: VisitorChannelStat[]
  pages: VisitorPageStat[]
  /** @deprecated используйте eventStats (там же нулевые типы) */
  eventTypes: Array<{ type: string; total: number }>
  /** Счётчики по всем типам событий за период */
  eventStats: VisitorEventTypeStat[]
  /** Последние события всех типов (полный список — eventsTotal) */
  events: VisitorEventRow[]
  eventsTotal: number
  /** Воронка форм по страницам (уникальные визиты) */
  formFunnel: VisitorFormFunnelRow[]
  formFunnelTotals: VisitorFormFunnelTotals
  /** @deprecated для таблицы событий используйте events */
  conversions: VisitorConversion[]
  visits: VisitorVisit[]
}

/** Заход на страницу внутри сессии (строка детализации страницы) */
export interface VisitorPageSessionRow {
  sessionId: string
  visitorId: string
  visitNumber: number
  startedAt: string
  lastActivityAt: string
  endedAt: string | null
  enteredAt: string         // время входа на страницу
  durationSec: number       // активное время на странице
  maxScrollPct: number      // максимальная глубина скролла, %
  channel: string
  channelLabel: string
  utmCampaign: string | null
  referrerHost: string | null
  city: string | null
  deviceType: string
  browser: string | null
  os: string | null
  pagesCount: number
  eventsCount: number
  activeSeconds: number
  isBounce: boolean
  converted: boolean
  linkedUserId: number | null
  linkedUserName: string | null
}

/** Разрез детализации страницы (источник / устройство) */
export interface VisitorPageChannelRow {
  channel: string
  channelLabel: string
  views: number
  visitors: number
  avgSeconds: number
}

export interface VisitorPageDeviceRow {
  deviceType: string
  views: number
  visitors: number
}

/** Бакет распределения глубины скролла (0-25 / 25-50 / 50-75 / 75-100) */
export interface VisitorPageScrollBucket {
  bucket: string
  views: number
  share: number
}

/** Сводные показатели детализации страницы */
export interface VisitorPageDetailsSummary {
  views: number
  visitors: number
  sessions: number
  entries: number           // сессии, начавшиеся на этой странице
  exits: number             // сессии, закончившиеся на этой странице
  exitRate: number          // % от просмотров (как в tables stats)
  avgSeconds: number
  avgScroll: number
  conversions: number
  conversionRate: number    // % сессий, просмотревших страницу, с обращением
  bounceRate: number        // % сессий с отказом среди просмотревших
  firstVisits: number       // сессии с visitNumber = 1
  firstVisitsShare: number
  firstViewAt: string | null
  lastViewAt: string | null
}

/** Ответ GET /api/visitors/page?path=...&days=... */
export interface VisitorPageDetailsResponse {
  path: string
  days: number
  summary: VisitorPageDetailsSummary
  daily: Array<{ day: string; views: number; visitors: number }>
  channels: VisitorPageChannelRow[]
  devices: VisitorPageDeviceRow[]
  scroll: VisitorPageScrollBucket[]
  eventTypes: Array<{ type: string; total: number }>
  conversions: VisitorConversion[]
  conversionsTotal: number
  sessions: VisitorPageSessionRow[]
  sessionsTotal: number
}

/** Визит из полной истории посетителя */
export interface VisitorProfileSession {
  id: string
  visitNumber: number
  startedAt: string
  lastActivityAt: string
  endedAt: string | null
  activeSeconds: number
  pagesCount: number
  eventsCount: number
  isBounce: boolean
  converted: boolean
  channel: string
  channelLabel: string
  utmSource: string | null
  utmCampaign: string | null
  referrerHost: string | null
  landingPath: string | null
  exitPath: string | null
  city: string | null
  deviceType: string
  browser: string | null
  os: string | null
  linkedUserId: number | null
  linkedUserName: string | null
}

/** Ответ GET /api/visitors/profiles/[id] */
export interface VisitorProfileResponse {
  visitor: {
    id: string
    firstSeenAt: string | null
    lastSeenAt: string | null
    visitsCount: number
    firstChannel: string | null
    firstChannelLabel: string
    firstReferrerHost: string | null
    firstUtmSource: string | null
    firstUtmMedium: string | null
    firstUtmCampaign: string | null
    firstLandingPath: string | null
    hasConverted: boolean
    linkedUserId: number | null
    linkedUserName: string | null
  }
  totals: {
    sessions: number
    pages: number
    events: number
    activeSeconds: number
    conversions: number
    bounces: number
  }
  latest: {
    city: string | null
    deviceType: string
    browser: string | null
    os: string | null
    utmCampaign: string | null
    referrerHost: string | null
  } | null
  sessions: VisitorProfileSession[]
  sessionsTotal: number
}

/** Просмотр страницы внутри визита */
export interface VisitorSessionPageview {
  path: string
  enteredAt: string
  durationSec: number
  maxScrollPct: number
}

/** Событие внутри визита */
export interface VisitorSessionEvent {
  id: number
  type: string
  path: string | null
  createdAt: string
  meta: Record<string, string | number | boolean | null> | null
}

/** Ответ GET /api/visitors/sessions/[id] */
export interface VisitorSessionDetailsResponse {
  session: VisitorProfileSession & {
    utmMedium?: string | null
    referrerType?: string | null
    country?: string | null
    region?: string | null
    language?: string | null
  }
  visitor: {
    id: string
    visitsCount: number
    firstSeenAt: string
    hasConverted: boolean
    linkedUserId: number | null
    linkedUserName: string | null
  }
  pageviews: VisitorSessionPageview[]
  events: VisitorSessionEvent[]
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