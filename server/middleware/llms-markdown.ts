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
 * Матчер путей — `server/utils/llmsMarkdown.ts` (списки `.md`-страниц
 * собираются из данных, а не ведутся руками).
 */
import { defineEventHandler, getQuery, getRequestURL, setResponseHeader, setResponseStatus } from 'h3'
import { COMPANY } from 'shared/constants/company'
import { buildLlmsMarkdown, fromLlmsMarkdownPath, getLlmsMarkdown } from '../utils/llmsMarkdown'

export default defineEventHandler(async (event) => {
  const { pathname } = getRequestURL(event)

  if (!pathname.endsWith('.md')) return

  // /llms.txt и /llms-full.txt обслуживаются своими роутами — не мешаем
  if (pathname === '/llms.txt' || pathname === '/llms-full.txt') return

  const htmlPath = fromLlmsMarkdownPath(pathname)

  if (!htmlPath) {
    // Не наш `.md` — отдаём обычный 404 Nitro (HTML), чтобы не маскировать ошибки
    return
  }

  if (event.method !== 'GET' && event.method !== 'HEAD') {
    setResponseStatus(event, 405)
    setResponseHeader(event, 'Allow', 'GET, HEAD')
    return 'Method Not Allowed'
  }

  const document = getQuery(event).refresh === '1'
    ? await buildLlmsMarkdown(htmlPath)
    : await getLlmsMarkdown(htmlPath)

  if (!document) {
    setResponseStatus(event, 404)
    setResponseHeader(event, 'Content-Type', 'text/plain; charset=utf-8')
    return `Markdown-версия не найдена: ${htmlPath}`
  }

  const config = useRuntimeConfig()
  const siteUrl = String(config.public.siteUrl || COMPANY.siteUrl).replace(/\/+$/, '')

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
