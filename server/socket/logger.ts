// server/socket/logger.ts
/**
 * Логирование Socket.IO.
 *
 * Подробные информационные логи сокет-событий (подключение, подписка на доску,
 * heartbeat, регистрация вкладок и т.п.) в production по умолчанию выключены —
 * их слишком много на каждое событие клиента.
 *
 * Включаются переменной окружения: SOCKET_DEBUG=1
 *
 * Ошибки логируются всегда через console.error и через этот модуль не проходят.
 */
export const SOCKET_DEBUG = process.env.SOCKET_DEBUG === '1'

/**
 * Информационный лог сокет-модуля. Пишет только при SOCKET_DEBUG=1.
 */
export function socketLog(...args: unknown[]): void {
  if (SOCKET_DEBUG) {
    console.log(...args)
  }
}
