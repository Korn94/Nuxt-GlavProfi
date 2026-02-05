// server/socket/events/status.ts
/**
 * Типы событий статусов пользователей
 */

export type UserStatusType = 'online' | 'offline' | 'afk'

export interface UserStatusEvent {
  type: UserStatusType
  userId: number
  userName: string
  timestamp: string
  fromAFK?: boolean
  sessionId?: string
}

export interface StatusUpdateEvent {
  userId: number
  sessionId: string
  oldStatus: UserStatusType
  newStatus: UserStatusType
  timestamp: string
}

// Экспортируем для использования в обработчиках
export const STATUS_EVENTS = {
  USER_STATUS: 'user:status' as const,
  STATUS_UPDATE: 'status:update' as const
}
