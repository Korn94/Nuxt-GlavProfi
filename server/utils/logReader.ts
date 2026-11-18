// server/utils/logReader.ts
import { open, stat } from 'node:fs/promises'
import {
  LOG_LEVELS,
  LOG_SOURCES,
  type LogLevel,
  type LogSourceKey
} from 'shared/constants/logs'
import type { ServerLogEntry } from 'shared/types/logs'
import { getLogPath } from './fileLogger'

/**
 * Чтение хвоста файлового лога для страницы «Диагностика».
 *
 * ⚠️ Читаем ТОЛЬКО хвост (LOG_SOURCES[source].tailBytes) — не весь файл:
 * сервер слабый, а история старше последних записей не нужна.
 * ⚠️ Ничего не кэшируем и не держим в памяти между запросами.
 *
 * Формат строки: `[ISO] [LEVEL] message | {json}` (см. server/utils/fileLogger.ts).
 * Строки без `[ISO]` в начале считаются продолжением предыдущей записи.
 */

/** Ограничения на размер полей в ответе (защита от гигантских стеков) */
const MAX_MESSAGE = 400
const MAX_DETAILS = 600
const MAX_STACK = 1500

const LINE_RE = /^\[([^\]]+)\]\s+\[([A-Z]+)\]\s?([\s\S]*)$/

export interface LogTailResult {
  /** Файл существует */
  exists: boolean
  /** Размер файла на момент чтения, байт */
  sizeBytes: number
  /** Записи: новые сверху */
  entries: ServerLogEntry[]
}

function clip(value: string | undefined, max: number, entry: ServerLogEntry): string | undefined {
  if (!value) return undefined
  if (value.length <= max) return value
  entry.truncated = true
  return value.slice(0, max) + '…'
}

function normalizeLevel(raw: string): LogLevel {
  const value = raw.trim().toUpperCase()
  return (LOG_LEVELS as readonly string[]).includes(value) ? (value as LogLevel) : 'INFO'
}

/** Похоже ли начало строки на JSON (доп. данные после ' | ') */
function looksLikeJson(value: string): boolean {
  const first = value.charAt(0)
  return first === '{' || first === '[' || first === '"'
    || first === '-' || first === 't' || first === 'f' || first === 'n'
    || (first >= '0' && first <= '9')
}

/** Разобрать одну физическую строку файла. null — не запись лога. */
function parseLine(line: string): ServerLogEntry | null {
  const match = LINE_RE.exec(line)
  if (!match) return null

  const [, ts, levelRaw, rest] = match as unknown as [string, string, string, string]
  const entry: ServerLogEntry = { ts, level: normalizeLevel(levelRaw), message: '' }

  let message = rest
  let details: string | undefined

  // Доп. данные отделены ' | '. Берём последнее вхождение и только если
  // правая часть похожа на JSON — иначе ' | ' был частью сообщения.
  const sep = rest.lastIndexOf(' | ')
  if (sep > 0 && looksLikeJson(rest.slice(sep + 3))) {
    message = rest.slice(0, sep)
    details = rest.slice(sep + 3)
  }

  entry.message = clip(message, MAX_MESSAGE, entry) || ''

  if (details) {
    try {
      const parsed = JSON.parse(details)
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        const { stack: rawStack, ...restFields } = parsed as Record<string, unknown>
        if (typeof rawStack === 'string' && rawStack) {
          entry.stack = clip(rawStack, MAX_STACK, entry)
        }
        const compact = JSON.stringify(restFields)
        entry.details = compact && compact !== '{}' ? clip(compact, MAX_DETAILS, entry) : undefined
      } else {
        entry.details = clip(details, MAX_DETAILS, entry)
      }
    } catch {
      // Не JSON (или обрезан) — отдаём как текст
      entry.details = clip(details, MAX_DETAILS, entry)
    }
  }

  return entry
}

/**
 * Прочитать последние записи лога.
 *
 * @param source источник (error | events | auth)
 * @param limit  сколько записей вернуть (новые сверху)
 */
export async function readLogTail(source: LogSourceKey, limit: number): Promise<LogTailResult> {
  const path = getLogPath(source)
  const { tailBytes } = LOG_SOURCES[source]

  let size = 0
  try {
    const info = await stat(path)
    if (!info.isFile()) return { exists: false, sizeBytes: 0, entries: [] }
    size = info.size
  } catch (error: any) {
    if (error?.code === 'ENOENT') return { exists: false, sizeBytes: 0, entries: [] }
    throw error
  }

  if (size === 0) return { exists: true, sizeBytes: 0, entries: [] }

  const readFrom = Math.max(0, size - tailBytes)
  const length = size - readFrom

  let text = ''
  try {
    const handle = await open(path, 'r')
    try {
      const buffer = Buffer.allocUnsafe(length)
      const { bytesRead } = await handle.read(buffer, 0, length, readFrom)
      text = buffer.subarray(0, bytesRead).toString('utf8')
    } finally {
      await handle.close()
    }
  } catch (error: any) {
    // Файл удалили/ротировали между stat и open — считаем, что его нет
    if (error?.code === 'ENOENT') return { exists: false, sizeBytes: 0, entries: [] }
    throw error
  }

  // Первая строка хвоста может быть обрезана посередине — выбрасываем её
  if (readFrom > 0) {
    const firstNewline = text.indexOf('\n')
    text = firstNewline >= 0 ? text.slice(firstNewline + 1) : ''
  }

  // Последняя строка может быть ещё не дописана (нет '\n') — не показываем её
  if (text && !text.endsWith('\n')) {
    const lastNewline = text.lastIndexOf('\n')
    text = lastNewline >= 0 ? text.slice(0, lastNewline + 1) : ''
  }

  const entries: ServerLogEntry[] = []
  for (const raw of text.split('\n')) {
    if (!raw) continue

    const parsed = parseLine(raw)
    if (parsed) {
      entries.push(parsed)
      continue
    }

    // Продолжение предыдущей записи (многострочный вывод) — приклеиваем к details
    const prev = entries[entries.length - 1]
    if (prev) {
      const merged = `${prev.details ? prev.details + '\n' : ''}${raw}`
      prev.details = clip(merged, MAX_DETAILS, prev)
    }
  }

  const tail = Number.isFinite(limit) && limit > 0 ? Math.floor(limit) : 0
  return {
    exists: true,
    sizeBytes: size,
    entries: tail > 0 ? entries.slice(-tail).reverse() : []
  }
}
