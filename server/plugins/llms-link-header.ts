// server/plugins/llms-link-header.ts
/**
 * 🔗 HTTP-заголовок `Link` на HTML-страницах — «вторая дверь» к llms-документации.
 *
 * llmstxt.org (v2) разрешает указывать связь двумя способами:
 *  - HTML-элементом `<link>` (см. `app/app.vue`);
 *  - HTTP-заголовком `Link:` — так делает и сам Яндекс в своей справке.
 * Второй способ работает и для не-HTML ресурсов, поэтому свои `Link` дополнительно
 * отдают llms-документы (`server/utils/llmsHttp.ts`) и markdown-версии
 * (`server/middleware/llms-markdown.ts`).
 *
 * Что добавляем:
 *  - `rel="describedby"` → `/llms.txt` — индекс документации для ИИ;
 *  - `rel="alternate"; type="text/markdown"` → `.md`-версия ЭТОЙ страницы,
 *    но только если она реально существует (реестр —
 *    `shared/constants/llmsMarkdown.ts`). Иначе ссылка вела бы в 404.
 *
 * Хук `render:response` — единственное место, где заголовки SSR уже собраны, но
 * ответ ещё не отправлен: изменения в response.headers применяет рендерер Nitro.
 * Хук срабатывает только при рендере страниц, поэтому ответы API не затрагиваются.
 */
import { defineNitroPlugin } from 'nitropack/runtime/plugin'
import { COMPANY } from 'shared/constants/company'
import { toLlmsMarkdownPath } from 'shared/constants/llmsMarkdown'

/** Документы, у которых `Link` выставляет сам обработчик. */
const LLMS_DOCUMENTS = new Set(['/llms.txt', '/llms-full.txt'])

export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('render:response', (response, { event }) => {
    // event.path содержит query — сравниваем только путь.
    const path = (event.path || '/').split('?')[0] || '/'

    if (LLMS_DOCUMENTS.has(path)) return
    // Markdown-версии отдаёт middleware со своим `Link` (canonical + describedby)
    if (path.endsWith('.md')) return

    const config = useRuntimeConfig()
    const siteUrl = String(config.public.siteUrl || COMPANY.siteUrl).replace(/\/+$/, '')

    const links: string[] = []
    const markdownPath = toLlmsMarkdownPath(path)

    if (markdownPath) {
      links.push(`<${siteUrl}${markdownPath}>; rel="alternate"; type="text/markdown"`)
    }
    links.push(`<${siteUrl}/llms.txt>; rel="describedby"`)

    const headers: Record<string, string> = response.headers ?? {}
    response.headers = headers

    // Сохраняем возможные чужие значения (early hints и т.п.) через запятую.
    const current = headers.link ?? headers.Link
    headers.link = current ? `${current}, ${links.join(', ')}` : links.join(', ')
  })
})
