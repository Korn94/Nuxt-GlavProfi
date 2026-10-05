// server/plugins/error-handler.ts
import { defineNitroPlugin } from 'nitropack/runtime/plugin'
import { logPortfolio } from '../utils/fileLogger'

/**
 * Логгер серверных ошибок.
 *
 * Nitro вызывает хук "error" (через captureError) для ВСЕХ ошибок запросов,
 * включая ошибки SSR-рендера страниц. Это как раз те случаи, когда Nuxt
 * отдаёт HTTP 500 и Яндекс индексирует "Ошибка 500 | ГлавПрофи".
 *
 * Плагин пишет в консоль (в проде — logs/error.log у PM2) короткую
 * структурированную строку + стек, чтобы было видно реальную первопричину
 * (таймаут БД, "too many connections" и т.п.), а не ловить её вслепую.
 */
export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('error', (error, context) => {
    // context — объект, переданный в captureError; содержит event и tags
    const event = (context && typeof context === 'object') ? context.event : undefined

    let path = ''
    let fullUrl = ''
    try {
      path = event?.path || '/'
      const reqUrl = event?.node?.req?.url || event?.node?.req?.originalUrl
      fullUrl = reqUrl ? String(reqUrl) : ''
    } catch {
      /* ignore */
    }

    const err = error as any
    const statusCode = err?.statusCode ?? err?.status_code
    const statusMessage = err?.statusMessage ?? err?.status_message
    const message = error instanceof Error ? error.message : String(error)
    const stack = error instanceof Error ? error.stack?.toString() || '' : ''

    // Логируем только реальные сбои сервера (5xx) и необработанные исключения,
    // чтобы не засорять логи 404/400.
    const isServerError = statusCode === undefined || Number(statusCode) >= 500

    if (!isServerError) return

    console.error(
      `[ErrorHandler] SERVER_ERROR | status=${statusCode ?? 'UNHANDLED'} | path=${path}${fullUrl && fullUrl !== path ? ' | url=' + fullUrl : ''} | statusMessage=${statusMessage ?? ''} | message=${message}`
    )
    if (stack) {
      console.error(`[ErrorHandler] stack:\n${stack}`)
    }

    // Дублируем серверные ошибки в отдельный файл error-portfolio.log
    logPortfolio('ERROR', 'server-error', {
      status: statusCode ?? 'UNHANDLED',
      path,
      url: fullUrl || path,
      statusMessage: statusMessage ?? '',
      message,
      stack
    })
  })
})