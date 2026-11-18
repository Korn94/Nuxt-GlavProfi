// shared/constants/logs.ts
/**
 * 🪵 Реестр файловых логов сервера — единый источник для сервера и UI.
 *
 * Используется:
 * - Сервер: server/utils/fileLogger.ts (куда писать), server/utils/logReader.ts
 *   (что читать), server/api/admin/logs/** (какие источники разрешены);
 * - Клиент: app/components/pages/Cabinet/Diagnostics/composables/useDiagnosticsServerLogs.ts
 *   (табы «Логи сервера»).
 *
 * ⚠️ Файлы разделены по назначению, а не по модулям:
 * - error  — только критичное: 5xx, необработанные исключения, падения БД;
 * - events — рутина: кэш, отправка форм, сокеты, гигиена сессий;
 * - auth   — аудит входов: успешные/неуспешные логины, имперсонация.
 *
 * ⚠️ Имя error-файла НЕ меняем на logs/error.log: этот путь занят PM2
 * (ecosystem.config.cjs → error_file).
 *
 * ⚠️ Лимиты здесь же: сервер отдаёт только хвост файла (tailBytes) и не
 * больше LOG_ENTRY_LIMIT записей. Буфера логов в памяти нет.
 */

/** Ключи источников (порядок = порядок табов в UI) */
export const LOG_SOURCE_KEYS = ['error', 'events', 'auth'] as const

/** Ключ источника лога */
export type LogSourceKey = typeof LOG_SOURCE_KEYS[number]

/** Уровни записи (в файле пишутся как [LEVEL]) */
export const LOG_LEVELS = ['DEBUG', 'INFO', 'WARN', 'ERROR'] as const

/** Уровень записи лога */
export type LogLevel = typeof LOG_LEVELS[number]

export interface LogSourceMeta {
  /** Имя файла внутри каталога логов */
  file: string
  /** Короткое название таба */
  label: string
  /** Подсказка (title) — что попадает в файл */
  hint: string
  /** Порог ротации: файл больше — переименовывается в <file>.1 */
  maxBytes: number
  /** Сколько байт хвоста читаем при запросе */
  tailBytes: number
}

export const LOG_SOURCES: Record<LogSourceKey, LogSourceMeta> = {
  error: {
    file: 'error-portfolio.log',
    label: 'Ошибки',
    hint: '5xx, необработанные исключения, ошибки БД',
    maxBytes: 2 * 1024 * 1024,
    tailBytes: 512 * 1024,
  },
  events: {
    file: 'events.log',
    label: 'События',
    hint: 'кэш, отправка форм, сокеты, гигиена сессий',
    maxBytes: 2 * 1024 * 1024,
    tailBytes: 256 * 1024,
  },
  auth: {
    file: 'auth.log',
    label: 'Входы',
    hint: 'логины, неудачные попытки, имперсонация',
    maxBytes: 1 * 1024 * 1024,
    tailBytes: 128 * 1024,
  },
}

/** Сколько записей отдаём по умолчанию */
export const LOG_ENTRY_LIMIT = 100

/** Потолок для параметра limit (защита от «дай мне весь файл») */
export const LOG_ENTRY_LIMIT_MAX = 200

/** Является ли значение ключом источника (валидация query-параметра) */
export function isLogSourceKey(value: unknown): value is LogSourceKey {
  return typeof value === 'string' && (LOG_SOURCE_KEYS as readonly string[]).includes(value)
}
