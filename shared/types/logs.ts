// shared/types/logs.ts
/**
 * Типы обмена с GET/DELETE /api/admin/logs (блок «Логи сервера»).
 * Файл на сервере — одна запись на строку:
 *   [2026-11-17T08:24:02.642Z] [ERROR] server-error | {"status":500,...}
 * Сервер разбирает строку и отдаёт уже структурированные записи.
 */
import type { LogLevel, LogSourceKey } from '../constants/logs'

export interface ServerLogEntry {
  /** Время записи (ISO 8601, как в файле) */
  ts: string
  /** Уровень записи */
  level: LogLevel
  /** Текст сообщения (до разделителя ' | ') */
  message: string
  /** Доп. данные записи — JSON без поля stack (обрезан) */
  details?: string
  /** Стек исключения (обрезан) */
  stack?: string
  /** Хотя бы одно поле было обрезано при чтении */
  truncated?: boolean
}

export interface ServerLogResponse {
  /** Источник, который просили */
  source: LogSourceKey
  /** Имя файла (для UI: «файл не создан») */
  file: string
  /** Существует ли файл; false — сервер ещё ничего не писал */
  exists: boolean
  /** Текущий размер файла, байт */
  sizeBytes: number
  /** Записи: новые сверху, не больше limit */
  entries: ServerLogEntry[]
  /** Применённый лимит */
  limit: number
  /** Момент чтения (ISO) */
  readAt: string
}

export interface ClearServerLogResponse {
  source: LogSourceKey
  file: string
  /** Файл существовал и был очищен */
  cleared: boolean
  /** Файл существовал до очистки */
  exists: boolean
  /** Момент очистки (ISO) */
  clearedAt: string
}
