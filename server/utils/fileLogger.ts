// server/utils/fileLogger.ts
import { appendFile, mkdir, rename, rm, stat } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import {
  LOG_SOURCES,
  type LogLevel,
  type LogSourceKey
} from 'shared/constants/logs'

/**
 * Файловый логгер сервера.
 *
 * Логи физически разделены по назначению (реестр — shared/constants/logs.ts):
 * - error  → logs/error-portfolio.log — критичное: 5xx, необработанные
 *            исключения, падения БД (туда же пишет server/plugins/error-handler.ts);
 * - events → logs/events.log          — рутина: кэш, формы, сокеты, гигиена;
 * - auth   → logs/auth.log            — аудит входов и имперсонации.
 *
 * Формат строки (одна запись = одна физическая строка):
 *   [2026-11-17T08:24:02.642Z] [ERROR] server-error | {"status":500,...}
 *
 * ⚠️ JSON экранирует переводы строк, поэтому стек не «рвёт» запись на части —
 * парсер (server/utils/logReader.ts) опирается на это.
 *
 * ⚠️ Буфера логов в памяти нет: каждая запись сразу уходит в файл
 * (appendFile), читается только хвост по запросу из UI.
 *
 * ⚠️ Логирование никогда не бросает исключений — логгер не должен ронять запрос.
 *
 * Каталог: LOG_DIR → PORTFOLIO_LOG_PATH (устаревший алиас) → process.cwd()/logs.
 * В проде PM2 запускает приложение из корня проекта, поэтому это
 * /var/www/.../glavprofi.ru/logs (каталог уже используется PM2).
 */

let _logDir: string | null = null

/** Каталог файловых логов. */
export function getLogDir(): string {
  if (!_logDir) {
    _logDir = process.env.LOG_DIR || process.env.PORTFOLIO_LOG_PATH || join(process.cwd(), 'logs')
  }
  return _logDir
}

/** Полный путь к файлу источника. */
export function getLogPath(source: LogSourceKey): string {
  return join(getLogDir(), LOG_SOURCES[source].file)
}

/** Путь файла ошибок (обратная совместимость со старым API). */
export function getPortfolioLogPath(): string {
  return getLogPath('error')
}

// ─── Ротация ───────────────────────────────────────────────────────────
// Простейший вариант без зависимостей: при записи (не чаще раза в минуту)
// смотрим размер файла и при превышении порога переименовываем в <file>.1
// (старый .1 удаляем). Итого максимум 2 файла на источник.
// В памяти живут только метки времени последней проверки — это не буфер логов.

const ROTATE_CHECK_MS = 60_000
const lastRotateCheck: Partial<Record<LogSourceKey, number>> = {}

async function rotateIfNeeded(source: LogSourceKey): Promise<void> {
  const now = Date.now()
  if (now - (lastRotateCheck[source] ?? 0) < ROTATE_CHECK_MS) return
  lastRotateCheck[source] = now

  const path = getLogPath(source)
  try {
    const info = await stat(path)
    if (info.size <= LOG_SOURCES[source].maxBytes) return

    const backup = `${path}.1`
    // rm + rename вместо перезаписи: rename на Windows не заменяет существующий файл
    await rm(backup, { force: true })
    await rename(path, backup)
  } catch {
    // Файла ещё нет / нет прав — ротация не нужна
  }
}

// ─── Запись ────────────────────────────────────────────────────────────

function safeJson(value: unknown): string {
  try {
    return JSON.stringify(value)
  } catch {
    return String(value)
  }
}

/**
 * Записать строку в файл источника.
 *
 * @param source  error | events | auth
 * @param level   уровень записи
 * @param message короткое имя события (без переводов строк)
 * @param extra   доп. данные (сериализуются в JSON)
 */
export async function writeLog(
  source: LogSourceKey,
  level: LogLevel,
  message: string,
  extra?: unknown
): Promise<void> {
  try {
    const path = getLogPath(source)
    await mkdir(dirname(path), { recursive: true })
    await rotateIfNeeded(source)

    const line = `[${new Date().toISOString()}] [${level}] ${message}${extra !== undefined ? ' | ' + safeJson(extra) : ''}\n`
    await appendFile(path, line, 'utf8')
  } catch {
    // Логирование не должно ломать основной поток
  }
}

/** Критичная запись → logs/error-portfolio.log */
export function logError(message: string, extra?: unknown, level: LogLevel = 'ERROR'): Promise<void> {
  return writeLog('error', level, message, extra)
}

/** Рутниное событие → logs/events.log */
export function logEvent(message: string, extra?: unknown, level: LogLevel = 'INFO'): Promise<void> {
  return writeLog('events', level, message, extra)
}

/** Аудит входов → logs/auth.log */
export function logAuth(message: string, extra?: unknown, level: LogLevel = 'INFO'): Promise<void> {
  return writeLog('auth', level, message, extra)
}

/**
 * Обратная совместимость: старый API портфолио/ошибок.
 * ERROR уходит в файл ошибок, INFO/WARN — в файл событий.
 */
export async function logPortfolio(
  level: 'INFO' | 'ERROR' | 'WARN',
  message: string,
  extra?: unknown
): Promise<void> {
  return writeLog(level === 'ERROR' ? 'error' : 'events', level, message, extra)
}
