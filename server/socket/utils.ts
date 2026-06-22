// server/socket/utils.ts
/**
 * 🛡️ Утилиты для Socket.IO с интеграцией ACL (системы прав)
 *
 * Архитектура:
 * - После подключения сокет уже содержит user (через socketAuthMiddleware)
 * - Здесь: извлечение user + проверка прав перед выполнением действий
 * - Использует hasUserPermission из server/utils/permissions
 *
 * Использование в обработчиках:
 *   const user = getUserFromSocket(socket)
 *   await requirePermission(socket, user, 'objects', 'edit')
 *   // ... бизнес-логика, если проверка прошла
 *
 * Примеры ACL-проверок:
 * - canUserJoinBoard() — проверка права на подписку к доске (через объект)
 * - requirePermission() — универсальная проверка page+action
 * - requireSpecial() — проверка special-права (для accept/pay/reorder)
 */

import type { Socket, Server } from 'socket.io'
import { db } from '../db'
import { boards, users } from '../db/schema'
import { eq } from 'drizzle-orm'
import { createError } from 'h3'

import {
  hasUserPermission,
  type DbUser
} from '../utils/permissions'

import type { PageSlug, PageAction } from 'shared/constants/permissions'

// ============================================
// ТИПЫ
// ============================================

/**
 * Пользователь, извлечённый из сокета.
 * Совместим с DbUser (для передачи в hasUserPermission).
 */
export interface SocketUser extends DbUser {}

/**
 * Ошибка отсутствия прав на сокет-операцию.
 * Бросается в require*() функциях, ловится в обработчиках событий.
 */
export class SocketPermissionError extends Error {
  public readonly code = 'SOCKET_PERMISSION_DENIED'
  public readonly statusCode = 403

  constructor(
    message: string,
    public readonly details: {
      page?: PageSlug
      action?: PageAction
      resource?: string
    } = {}
  ) {
    super(message)
    this.name = 'SocketPermissionError'
  }
}

// ============================================
// ИЗВЛЕЧЕНИЕ ПОЛЬЗОВАТЕЛЯ ИЗ СОКЕТА
// ============================================

/**
 * Получить пользователя из сокета.
 *
 * Пользователь уже аутентифицирован в socketAuthMiddleware
 * и сохранён в socket.user и socket.data.userId.
 *
 * @throws SocketPermissionError если user отсутствует (не должен происходить)
 *
 * @example
 * socket.on('task:create', async (data) => {
 *   const user = getUserFromSocket(socket)
 *   // user.id, user.role, user.name доступны
 * })
 */
export function getUserFromSocket(socket: Socket): SocketUser {
  const user = (socket as any).user as SocketUser | undefined

  if (!user || !user.id) {
    throw new SocketPermissionError('Пользователь не аутентифицирован в сокете', {
      resource: 'socket'
    })
  }

  return user
}

/**
 * Безопасное извлечение userId из сокета.
 * Возвращает null если user не аутентифицирован (без бросания ошибки).
 *
 * Используется в случаях, когда нужно просто проверить наличие без ошибки.
 */
export function getUserIdFromSocket(socket: Socket): number | null {
  const userId = socket.data?.userId
  return typeof userId === 'number' ? userId : null
}

// ============================================
// БАЗОВЫЕ ACL-ПРОВЕРКИ
// ============================================

/**
 * Проверить право пользователя на действие для страницы.
 * Бросает SocketPermissionError при отсутствии права.
 *
 * @example
 * socket.on('object:create', async (data) => {
 *   const user = getUserFromSocket(socket)
 *   await requirePermission(socket, user, 'objects', 'create')
 *   // ... создание объекта
 * })
 */
export async function requirePermission(
  socket: Socket,
  user: SocketUser,
  page: PageSlug,
  action: PageAction
): Promise<void> {
  const hasAccess = await hasUserPermission(user, page, action)

  if (!hasAccess) {
    console.warn(
      `[SocketACL] ❌ Отказано: user=${user.id}, page=${page}, action=${action}`
    )

    // Отправляем ошибку клиенту
    socket.emit('error', {
      code: 'PERMISSION_DENIED',
      message: `Недостаточно прав: ${page}.${action}`,
      page,
      action
    })

    throw new SocketPermissionError(
      `Недостаточно прав: ${page}.${action}`,
      { page, action }
    )
  }
}

/**
 * Shortcut для проверки special-права.
 * Используется для бизнес-операций: accept, pay, reorder, recalculate.
 *
 * @example
 * socket.on('work:accept', async ({ workId }) => {
 *   const user = getUserFromSocket(socket)
 *   await requireSpecial(socket, user, 'works')
 *   // ... приёмка работы
 * })
 */
export async function requireSpecial(
  socket: Socket,
  user: SocketUser,
  page: PageSlug
): Promise<void> {
  await requirePermission(socket, user, page, 'special')
}

/**
 * Проверить право просмотра страницы (самое слабое требование).
 *
 * @example
 * socket.on('works:list', async () => {
 *   const user = getUserFromSocket(socket)
 *   await requireView(socket, user, 'works')
 *   // ... отправка списка работ
 * })
 */
export async function requireView(
  socket: Socket,
  user: SocketUser,
  page: PageSlug
): Promise<void> {
  await requirePermission(socket, user, page, 'view')
}

// ============================================
// СПЕЦИФИЧНЫЕ ПРОВЕРКИ ДЛЯ ДОСОК
// ============================================

/**
 * Проверить право пользователя на подписку к доске.
 *
 * Логика:
 * - Если доска имеет тип 'object' — требуется canView('objects')
 * - Если доска имеет тип 'general' — требуется canView('dashboard')
 *
 * Это защищает от подписки на доски объектов, к которым у пользователя нет доступа.
 *
 * @example
 * socket.on('join', async (roomName) => {
 *   const boardId = parseBoardIdFromRoom(roomName)
 *   const user = getUserFromSocket(socket)
 *   await canUserJoinBoard(socket, user, boardId)
 *   await socket.join(roomName)
 * })
 */
export async function canUserJoinBoard(
  socket: Socket,
  user: SocketUser,
  boardId: number
): Promise<void> {
  // 1. Получаем доску из БД
  const [board] = await db
    .select({
      id: boards.id,
      type: boards.type,
      objectId: boards.objectId
    })
    .from(boards)
    .where(eq(boards.id, boardId))
    .limit(1)

  if (!board) {
    socket.emit('error', {
      code: 'BOARD_NOT_FOUND',
      message: `Доска ${boardId} не найдена`
    })
    throw new SocketPermissionError('Доска не найдена', {
      resource: `board:${boardId}`
    })
  }

  // 2. Определяем требуемое право на основе типа доски
  const requiredPage: PageSlug = board.type === 'object' ? 'objects' : 'dashboard'

  // 3. Проверяем право просмотра
  await requirePermission(socket, user, requiredPage, 'view')

  // 4. Дополнительно: если доска привязана к объекту, проверяем доступ к объекту
  // (на будущее: если будет разграничение по конкретным объектам)
  // if (board.objectId) {
  //   await canUserAccessObject(socket, user, board.objectId)
  // }
}

// ============================================
// ОБРАБОТКА ОШИБОК В ОБРАБОТЧИКАХ
// ============================================

/**
 * Обернуть обработчик сокет-события с автоматической обработкой ACL-ошибок.
 *
 * Вместо того чтобы писать try/catch в каждом обработчике —
 * используем эту обёртку.
 *
 * @example
 * socket.on('task:create', withAcl(socket, async (data) => {
 *   const user = getUserFromSocket(socket)
 *   await requirePermission(socket, user, 'objects', 'edit')
 *   // ... создание задачи
 *   return { success: true, taskId: 123 }
 * }))
 */
export function withAcl<TArgs extends any[], TResult>(
  socket: Socket,
  handler: (...args: TArgs) => Promise<TResult>
): (...args: TArgs) => Promise<TResult | undefined> {
  return async (...args: TArgs) => {
    try {
      return await handler(...args)
    } catch (error) {
      // ACL-ошибки уже отправлены клиенту внутри require*() — просто логируем
      if (error instanceof SocketPermissionError) {
        console.warn(
          `[SocketACL] ❌ ${error.message}`,
          error.details
        )
        return undefined
      }

      // Другие ошибки — логируем и отправляем общую ошибку
      console.error('[Socket] ❌ Необработанная ошибка в обработчике:', error)
      socket.emit('error', {
        code: 'INTERNAL_ERROR',
        message: 'Внутренняя ошибка сервера'
      })
      return undefined
    }
  }
}

// ============================================
// УТИЛИТЫ ДЛЯ РАБОТЫ С КОМНАТАМИ
// ============================================

/**
 * Извлечь boardId из названия комнаты (формат: "board:123").
 *
 * @returns boardId или null если формат некорректный
 */
export function parseBoardRoomName(roomName: string): number | null {
  if (!roomName.startsWith('board:')) return null
  const id = parseInt(roomName.replace('board:', ''), 10)
  return Number.isFinite(id) && id > 0 ? id : null
}

/**
 * Сформировать имя комнаты для доски.
 */
export function getBoardRoomName(boardId: number): string {
  return `board:${boardId}`
}

/**
 * Сформировать имя комнаты для роли (для широковещательных событий).
 *
 * @example
 * // Отправить всем админам:
 * io.to(getRoleRoomName('admin')).emit('system:alert', data)
 */
export function getRoleRoomName(role: string): string {
  return `role:${role}`
}

/**
 * Сформировать имя комнаты для конкретного пользователя.
 *
 * @example
 * // Отправить конкретному пользователю:
 * io.to(getUserRoomName(123)).emit('notification', data)
 */
export function getUserRoomName(userId: number): string {
  return `user:${userId}`
}

// ============================================
// ПРИСОЕДИНЕНИЕ К СТАНДАРТНЫМ КОМНАТАМ
// ============================================

/**
 * Присоединить сокет к стандартным комнатам при подключении:
 * - user:{userId} — для персональных уведомлений
 * - role:{role} — для широковещательных сообщений по ролям
 *
 * Вызывается в setupUserHandlers после успешной аутентификации.
 *
 * @example
 * // После setupUserHandlers:
 * await joinStandardRooms(socket, user)
 *
 * // Теперь можно:
 * io.to('role:manager').emit('report:ready', data)
 * io.to(`user:${targetId}`).emit('notification', { message: 'Привет!' })
 */
export async function joinStandardRooms(
  socket: Socket,
  user: SocketUser
): Promise<void> {
  await socket.join(getUserRoomName(user.id))
  await socket.join(getRoleRoomName(user.role))

  console.log(
    `[SocketACL] 🔗 User ${user.id} присоединён к комнатам: ` +
    `${getUserRoomName(user.id)}, ${getRoleRoomName(user.role)}`
  )
}

/**
 * Покинуть стандартные комнаты при отключении.
 * (обычно не требуется — Socket.IO сам чистит при disconnect)
 */
export async function leaveStandardRooms(
  socket: Socket,
  user: SocketUser
): Promise<void> {
  await socket.leave(getUserRoomName(user.id))
  await socket.leave(getRoleRoomName(user.role))
}
