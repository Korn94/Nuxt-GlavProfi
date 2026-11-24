// server/middleware/llms-markdown.ts
/**
 * 📝 Отдача markdown-версий страниц: `/remont-pomescheniy/ofisy.md`, `/prices/…md` и т.д.
 *
 * Почему middleware, а не `server/routes/*.ts`: файловые роуты Nitro не умеют
 * матчить «любой путь + `.md`» одной маской (в имени файла точка — часть маршрута),
 * а `[...slug].ts` перехватил бы вообще все несуществующие URL и сломал 404.
 * Middleware же срабатывает раньше рендера и спокойно пропускает всё, что не `.md`.
 *
 * Заголовки ответа:
 * - `Content-Type: text/markdown; charset=utf-8` — чтобы агент понял формат;
 * - `Link: <html-URL>; rel="canonical"` — канонической остаётся HTML-страница
 *   (markdown — её представление, а не отдельный документ);
 * - `X-Robots-Tag: noindex, follow` — markdown не должен попадать в индекс как дубль,
 *   но обход и переходы по ссылкам разрешены;
 * - `Link: </llms.txt>; rel="describedby"` — связь с индексом документации.
 *
 * 404 формируем САМИ, а не через error-handler Nitro: тот в проде всегда отдаёт
 * `application/json`, а в dev ещё и выбирает JSON или HTML `youch` по заголовку
 * `Accept` — для агента, пришедшего за markdown, это непредсказуемо. Подробности —
 * в `sendMarkdownNotFound`.
 *
 * Матчер путей — `server/utils/llmsMarkdown.ts` (списки `.md`-страниц
 * собираются из данных, а не ведутся руками).
 */
import {
  defineEventHandler,
  getQuery,
  getRequestURL,
  setResponseHeader,
  setResponseStatus,
  type H3Event
} from 'h3'
import { COMPANY } from 'shared/constants/company'
import { buildLlmsMarkdown, fromLlmsMarkdownPath, getLlmsMarkdown } from '../utils/llmsMarkdown'

/**
 * Единый 404 для `.md`-запросов: формат ответа не зависит от окружения.
 *
 * Почему не отдаём это error-handler'у Nitro: он в проде **всегда** отвечает
 * `application/json`, а в dev выбирает JSON или HTML `youch` по заголовку
 * `Accept` (`nitropack/dist/runtime/internal/error/{dev,prod}.mjs`). Агент,
 * пришедший за markdown, должен получить предсказуемый `text/plain` с адресом
 * индекса документации — независимо от `Accept` и режима запуска.
 *
 * `Cache-Control: no-store`, а не `public, max-age`: отрицательный ответ
 * кэшировать нельзя — появившийся позже `.md` должен открываться сразу.
 */
function sendMarkdownNotFound(
  event: H3Event,
  siteUrl: string,
  pathname: string,
  reason: string
) {
  setResponseStatus(event, 404)
  setResponseHeader(event, 'Content-Type', 'text/plain; charset=utf-8')
  setResponseHeader(event, 'Cache-Control', 'no-store')
  setResponseHeader(event, 'X-Robots-Tag', 'noindex')
  // Агенту всегда есть куда пойти дальше — даже из отрицательного ответа
  setResponseHeader(event, 'Link', `<${siteUrl}/llms.txt>; rel="describedby"`)
  return `${reason}: ${pathname}\nИндекс документации: ${siteUrl}/llms.txt`
}

export default defineEventHandler(async (event) => {
  const { pathname } = getRequestURL(event)

  if (!pathname.endsWith('.md')) return

  // /llms.txt и /llms-full.txt обслуживаются своими роутами — не мешаем
  if (pathname === '/llms.txt' || pathname === '/llms-full.txt') return

  const config = useRuntimeConfig()
  const siteUrl = String(config.public.siteUrl || COMPANY.siteUrl).replace(/\/+$/, '')

  const htmlPath = fromLlmsMarkdownPath(pathname)

  // Не наш `.md` (например, `/partner.md`) — 404 в том же формате, что и ниже
  if (!htmlPath) return sendMarkdownNotFound(event, siteUrl, pathname, 'Markdown-версия недоступна')

  if (event.method !== 'GET' && event.method !== 'HEAD') {
    setResponseStatus(event, 405)
    setResponseHeader(event, 'Allow', 'GET, HEAD')
    return 'Method Not Allowed'
  }

  const document = getQuery(event).refresh === '1'
    ? await buildLlmsMarkdown(htmlPath)
    : await getLlmsMarkdown(htmlPath)

  if (!document) return sendMarkdownNotFound(event, siteUrl, pathname, 'Markdown-версия не найдена')

  setResponseHeader(event, 'Content-Type', 'text/markdown; charset=utf-8')
  setResponseHeader(event, 'Cache-Control', 'public, max-age=300, stale-while-revalidate=3600')
  setResponseHeader(event, 'X-Robots-Tag', 'noindex, follow')
  setResponseHeader(event, 'X-LLMS-Generated', document.generatedAt)
  setResponseHeader(
    event,
    'Link',
    `<${siteUrl}${htmlPath}>; rel="canonical", <${siteUrl}/llms.txt>; rel="describedby"`
  )

  return document.body
})
