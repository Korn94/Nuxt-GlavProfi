// server/ws/clients.ts
import { getContext } from './context'
import type { WSUser } from './types'
type WSPeer = any

/**
 * Расширенный интерфейс метаданных клиента
 * Включает дополнительные поля, необходимые для новой версии online.vue
 */
export type ClientMeta = {
  status: 'online' | 'idle'
  lastActivityAt: number
  deviceType?: string
  tabCount?: number
  currentPage?: string
  onlineSince?: number
  ip?: string
}

const clients = new Map<WSPeer, ClientMeta>()

export function addClient(peer: WSPeer) {
  clients.set(peer, {
    status: 'online',
    lastActivityAt: Date.now(),
    onlineSince: Date.now(),
    deviceType: 'desktop',
    tabCount: 1,
    currentPage: '/cabinet'
  })
}

export function removeClient(peer: WSPeer) {
  clients.delete(peer)
}

export function updateActivity(peer: WSPeer) {
  const meta = clients.get(peer)
  if (!meta) return
  meta.lastActivityAt = Date.now()
  meta.status = 'online'
}

export function setStatus(peer: WSPeer, status: ClientMeta['status']) {
  const meta = clients.get(peer)
  if (!meta) return
  meta.status = status
}

/**
 * Обновляет дополнительные метаданные клиента
 * Используется для обработки сообщений с информацией о устройстве, странице и т.д.
 */
export function updateClientMeta(peer: WSPeer, metaUpdate: Partial<ClientMeta>) {
  const meta = clients.get(peer)
  if (!meta) return
  Object.assign(meta, metaUpdate)
}

/**
 * Возвращает все метаданные клиентов
 * Используется для получения полной информации о клиентах
 */
export function getClientMeta(): Map<WSPeer, ClientMeta> {
  return clients
}

/**
 * Получает расширенные данные о пользователях, включая дополнительные поля
 * Используется в presence.ts для отправки данных на фронтенд
 */
export function getExtendedPresenceUsers(): any[] {
  const users = []
  for (const [peer, meta] of clients.entries()) {
    const ctx = getContext(peer)
    if (!ctx?.user) continue
    
    users.push({
      id: ctx.user.id,
      login: ctx.user.login,
      name: ctx.user.name || ctx.user.login,
      roles: ctx.user.roles,
      status: meta.status,
      lastActivityAt: meta.lastActivityAt,
      deviceType: meta.deviceType,
      tabCount: meta.tabCount,
      currentPage: meta.currentPage,
      onlineSince: meta.onlineSince,
      ip: process.env.DEBUG_MODE === 'true' ? meta.ip : undefined
    })
  }
  return users
}

/**
 * Старая версия для обратной совместимости
 * Можно удалить после полного перехода на новую версию
 */
export function getPresenceUsers() {
  return getExtendedPresenceUsers().map(user => ({
    id: user.id,
    login: user.login,
    roles: user.roles,
    status: user.status,
    lastActivityAt: user.lastActivityAt
  }))
}
