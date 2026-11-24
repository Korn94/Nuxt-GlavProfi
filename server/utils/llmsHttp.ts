// server/utils/llmsHttp.ts
/**
 * 🚚 Общая отдача llms-документов: проверка метода, кэш/принудительное обновление,
 * заголовки свежести. Используется роутами /llms.txt и /llms-full.txt.
 */
import { getQuery, getRequestURL, setResponseHeader, setResponseStatus, type H3Event } from 'h3'
import { buildLlmsContent, getLlmsContent, type LlmsContent } from './llmsContent'

/**
 * 🧭 Взаимные ссылки между документами (llmstxt.org, v2):
 * - у краткой версии есть полная → rel="alternate";
 * - полная описывает тот же ресурс → rel="describedby" на краткую.
 *
 * Заголовок нужен агентам, которые читают только HTTP-ответ, без HTML-разметки.
 * ⚠️ Ссылки строим АБСОЛЮТНЫМИ (как у Яндекса в справке): относительные URI в
 * `Link` допустимы по RFC 8288, но часть самописных парсеров их не резолвит.
 */
const linkToFull = (siteUrl: string): string =>
  `<${siteUrl}/llms-full.txt>; rel="alternate"; type="text/plain"`
const linkToShort = (siteUrl: string): string => `<${siteUrl}/llms.txt>; rel="describedby"`

/**
 * Отдаёт выбранный документ с корректными заголовками.
 *
 * @param pick какую часть снимка вернуть (llmsTxt или llmsFull)
 */
export async function sendLlmsDocument(
  event: H3Event,
  pick: (content: LlmsContent) => string
): Promise<string> {
  if (event.method !== 'GET' && event.method !== 'HEAD') {
    setResponseStatus(event, 405)
    setResponseHeader(event, 'Allow', 'GET, HEAD')
    return 'Method Not Allowed'
  }

  // ?refresh=1 — обойти кэш (удобно сразу после правки цен в кабинете).
  const content = getQuery(event).refresh === '1'
    ? await buildLlmsContent()
    : await getLlmsContent()

  const config = useRuntimeConfig()
  const siteUrl = String(config.public.siteUrl || 'https://glavprofi.ru').replace(/\/+$/, '')

  setResponseHeader(event, 'Content-Type', 'text/plain; charset=utf-8')
  // Короткий клиентский кэш: агенты видят свежие цены, но сервер не дёргают постоянно.
  setResponseHeader(event, 'Cache-Control', 'public, max-age=60, stale-while-revalidate=600')
  setResponseHeader(event, 'X-LLMS-Generated', content.generatedAt)
  setResponseHeader(event, 'X-LLMS-Build', content.buildTime ?? 'unknown')

  // 🔗 Ссылка на второй документ: агент, начавший с одного файла, не ищет второй вручную.
  const isFullDocument = getRequestURL(event).pathname.endsWith('llms-full.txt')
  setResponseHeader(
    event,
    'Link',
    isFullDocument ? linkToShort(siteUrl) : linkToFull(siteUrl)
  )

  if (content.priceUpdatedAt) {
    setResponseHeader(event, 'X-LLMS-Price-Updated', content.priceUpdatedAt)
  }

  return pick(content)
}
