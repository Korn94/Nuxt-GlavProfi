// server/utils/fileLogger.ts
import { appendFile, mkdir } from 'node:fs/promises'
import { join, dirname } from 'node:path'

/**
 * Утилита для записи ошибок создания/редактирования кейсов в отдельный файл.
 *
 * Файл: logs/error-portfolio.log
 * Путь: process.cwd()/logs/error-portfolio.log (в проде PM2 запускается из
 *   /var/www/glavprofi_ru_usr40/data/www/glavprofi.ru).
 * Можно переопределить переменной окружения PORTFOLIO_LOG_PATH.
 */

let _logPath: string | null = null

export function getPortfolioLogPath(): string {
  if (!_logPath) {
    const base = process.env.PORTFOLIO_LOG_PATH || join(process.cwd(), 'logs')
    _logPath = join(base, 'error-portfolio.log')
  }
  return _logPath
}

function safeJson(v: unknown): string {
  try {
    return JSON.stringify(v)
  } catch {
    return String(v)
  }
}

/**
 * Пишет строку в error-portfolio.log.
 * Никогда не бросает исключений (логирование не должно ронять запрос).
 */
export async function logPortfolio(
  level: 'INFO' | 'ERROR' | 'WARN',
  message: string,
  extra?: unknown
): Promise<void> {
  try {
    const line = `[${new Date().toISOString()}] [${level}] ${message}${extra !== undefined ? ' | ' + safeJson(extra) : ''}\n`
    const dir = dirname(getPortfolioLogPath())
    await mkdir(dir, { recursive: true })
    await appendFile(getPortfolioLogPath(), line, 'utf8')
  } catch {
    // Логирование не должно ломать основной поток
  }
}
