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
