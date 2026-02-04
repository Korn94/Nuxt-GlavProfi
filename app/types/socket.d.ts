// types/socket.d.ts
import type { Server, Socket } from 'socket.io'
import type { User, OnlineUser } from './index'

/**
 * События, которые СЕРВЕР отправляет КЛИЕНТУ
 */
export interface ServerToClientEvents {
  // Обновление списка онлайн-пользователей
  'online-users:update': (users: OnlineUser[]) => void
  
  // Обновление данных пользователя
  'user:update': (user: User) => void
  
  // Уведомление об ошибке
  'error': (error: { message: string; code?: string }) => void
}

/**
 * События, которые КЛИЕНТ отправляет СЕРВЕРУ
 */
export interface ClientToServerEvents {
  // Инициализация сессии при подключении
  'session:init': (data: { ipAddress: string; userAgent: string }) => void
  
  // Событие активности пользователя
  'activity': (data: { 
    sessionId: string
    status: 'online' | 'afk' | 'offline'
    ipAddress?: string 
  }) => void
  
  // Возврат из AFK
  'activity:resume': (data: { sessionId: string; ipAddress?: string }) => void
  
  // Переход в AFK
  'activity:afk': (data: { sessionId: string; ipAddress?: string }) => void
  
  // Обновление данных пользователя
  'user:update': (data: Partial<User>) => void
}

/**
 * Данные, которые хранятся в каждом сокет-соединении
 */
export interface SocketData {
  user: User
  sessionId?: string
}

/**
 * Типизированный Socket (используется на сервере)
 */
export type TypedSocket = Socket
  ClientToServerEvents,
  ServerToClientEvents,
  Record<string, never>,
  SocketData

/**
 * Типизированный Server (используется в плагине)
 */
export type TypedServer = Server
  ClientToServerEvents,
  ServerToClientEvents,
  Record<string, never>,
  SocketData
