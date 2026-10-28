// server/socket/utils.ts
/**
 * 🛡️ Утилиты для Socket.IO с интеграцией ACL (системы прав)
 *
 * Архитектура:
 * - После подключения сокет уже содержит user (через socketAuthMiddleware)
 * - Здесь: извлечение user + проверка прав перед выполнением действий
 * - Использует hasUserPermission из server/utils/permissions
 *
 * Модель прав (без canView):
 * - Раздел виден в меню если есть хотя бы одно действие (create/edit/delete/special)
 * - View-only страницы (dashboard, online, test) видимы по факту наличия в правах
 *
 * Использование в обработчиках:
 *   const user = getUserFromSocket(socket)
 *   await requirePermission(socket, user, 'objects', 'edit')
 *   // ... бизнес-логика, если проверка прошла
 *
 * Примеры ACL-проверок:
 * - canUserJoinBoard() — проверка права на подписку к доске (через объект)
 * - requirePermission() — универсальная проверка page+action
 * - requireView() — проверка права просмотра страницы
 *
 * ⚠️ Функции управления подключениями (forceDisconnectRole, notifyUserPermissionsChanged,
 * forceDisconnectUserWithReason) находятся в server/socket/index.ts и
 * server/socket/handlers/user.ts — НЕ дублируем здесь.
 */

import type { Socket } from 'socket.io'
import { db } from '../db'
import { boards } from '../db/schema'
import { eq } from 'drizzle-orm'

import {
  hasUserPermission,
  type DbUser
} from '../utils/permissions'

import type { PageSlug, PageAction } from 'shared/constants/permissions'
import { socketLog } from './logger'

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

// ============================================
// БАЗОВЫЕ ACL-ПРОВЕРКИ
// ============================================

/**
 * Проверить право пользователя на действие для страницы.
 * Бросает SocketPermissionError при отсутствии права.
 *
 * Модель прав (без canView):
 * - view — страница должна быть видима (есть хотя бы одно действие)
 * - create/edit/delete/special — страница видима + соответствующий флаг
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
 * Проверить право просмотра страницы.
 *
 * view = только canView (чтение данных). canSpecial/CRUD-флаги
 * НЕ дают автоматического доступа к чтению страницы.
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
 * - Если доска имеет тип 'object' — требуется право просмотра 'objects'
 * - Если доска имеет тип 'general' — требуется право просмотра 'dashboard'
 *
 * Это защищает от подписки на доски объектов, к которым у пользователя нет доступа.
 */
export async function canUserJoinBoard(
  socket: Socket,
  user: SocketUser,
  boardId: number
): Promise<void> {
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

  const requiredPage: PageSlug = board.type === 'object' ? 'objects' : 'dashboard'
  await requirePermission(socket, user, requiredPage, 'view')
}

// ============================================
// ОБРАБОТКА ОШИБОК В ОБРАБОТЧИКАХ
// ============================================

/**
 * Обернуть обработчик сокет-события с автоматической обработкой ACL-ошибок.
 */
export function withAcl<TArgs extends any[], TResult>(
  socket: Socket,
  handler: (...args: TArgs) => Promise<TResult>
): (...args: TArgs) => Promise<TResult | undefined> {
  return async (...args: TArgs) => {
    try {
      return await handler(...args)
    } catch (error) {
      if (error instanceof SocketPermissionError) {
        console.warn(
          `[SocketACL] ❌ ${error.message}`,
          error.details
        )
        return undefined
      }

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
 */
export function getRoleRoomName(role: string): string {
  return `role:${role}`
}

/**
 * Сформировать имя комнаты для конкретного пользователя.
 */
export function getUserRoomName(userId: number): string {
  return `user:${userId}`
}

/**
 * Присоединить сокет к стандартным комнатам при подключении:
 * - user:{userId} — для персональных уведомлений
 * - role:{role} — для широковещательных сообщений по ролям
 */
export async function joinStandardRooms(
  socket: Socket,
  user: SocketUser
): Promise<void> {
  await socket.join(getUserRoomName(user.id))
  await socket.join(getRoleRoomName(user.role))

  socketLog(
    `[SocketACL] 🔗 User ${user.id} присоединён к комнатам: ` +
    `${getUserRoomName(user.id)}, ${getRoleRoomName(user.role)}`
  )
}

/**
 * ✅ P5: комната для сокетов, которым разрешено видеть список онлайна.
 * Аудитория совпадает с ACL эндпоинта GET /api/online (server/middleware/auth.ts:302):
 * страница 'users', действие 'view'.
 */
export const ONLINE_VIEWERS_ROOM = 'online:viewers'

/**
 * ✅ P5: привести членство сокета в ONLINE_VIEWERS_ROOM в соответствие с правами.
 * Вызывается при подключении и при проверке прав (permissions:check).
 *
 * ⚠️ P5: членство в комнате обновляется при connect и при permissions:check.
 * Мгновенная смена прав без реконнекта/перепроверки не отражается — принятое упрощение.
 */
export async function syncOnlineViewersRoom(socket: Socket, user: SocketUser): Promise<void> {
  try {
    const canView = await hasUserPermission(user, 'users', 'view')

    if (canView) {
      await socket.join(ONLINE_VIEWERS_ROOM)
      socketLog(`[SocketACL] 👁️ User ${user.id} подписан на комнату ${ONLINE_VIEWERS_ROOM}`)
    } else {
      await socket.leave(ONLINE_VIEWERS_ROOM)
      socketLog(`[SocketACL] 🙈 User ${user.id} без права users:view — вышел из комнаты ${ONLINE_VIEWERS_ROOM}`)
    }
  } catch (error) {
    console.error('[SocketACL] ❌ Ошибка проверки права на онлайн-список:', error)
  }
}
