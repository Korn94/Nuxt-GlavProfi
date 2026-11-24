// shared/constants/llmsMarkdown.ts
/**
 * 📄 Реестр страниц, у которых есть markdown-версия.
 *
 * llmstxt.org v2: «pages … provide a clean markdown version … with .md appended …
 * use `rel="alternate" type="text/markdown"` to point to the markdown version».
 *
 * Один и тот же список нужен двум сторонам, поэтому он живёт в `shared/`:
 * - клиент (`app/app.vue` + `server/plugins/llms-link-header.ts`) — чтобы добавлять
 *   `rel="alternate"` ТОЛЬКО на страницы, где `.md` реально существует
 *   (иначе ссылка ведёт в 404, и это хуже, чем отсутствие ссылки);
 * - сервер (`server/middleware/llms-markdown.ts`) — чтобы понять, какой `.md`
 *   запрошен и существует ли он вообще.
 *
 * ⚠️ Добавили новый `.md`-рендер в `server/utils/llmsMarkdown.ts` — добавьте slug
 * сюда, иначе страница не получит `rel="alternate"` и HTTP `Link`.
 */

/** Страницы типов помещений: `/remont-pomescheniy/<slug>` */
export const LLMS_MD_PREMISES_SLUGS = [
  'banki',
  'magaziny',
  'ofisy',
  'salony',
  'fitness',
  'sklady',
  'proizvodstvo',
  'angary',
  'kliniki',
  'mopy',
  'fasady',
] as const

/** Страницы видов работ: `/vidy-rabot/<slug>` */
export const LLMS_MD_WORK_TYPE_SLUGS = [
  'peregorodki-gkl',
  'oblitsovka-gkl',
  'shtukaturka-sten',
  'shpaklevka-sten',
  'ukladka-plitki',
] as const

/**
 * Статические разделы с markdown-версией.
 * `/` отдаётся как `/index.md` (в спеке: для URL без имени файла — `index.md`).
 */
export const LLMS_MD_STATIC_PATHS = [
  '/',
  '/remont-pomescheniy',
  '/projects',
  '/contacts',
  '/requisites-ip',
] as const

/** Регулярки динамических разделов, где `.md` собирается из БД. */
const LLMS_MD_DYNAMIC_PATTERNS = [/^\/prices\/[a-z0-9-]+$/, /^\/projects\/[a-z0-9-]+$/]

/** Путь без query и завершающего слэша (кроме корня). */
function normalizePath(pathname: string): string {
  const withoutQuery = String(pathname || '/').split('?')[0]?.split('#')[0] ?? ''
  const trimmed = withoutQuery.replace(/\/+$/, '')
  return trimmed || '/'
}

/**
 * HTML-путь → путь markdown-версии.
 * `null` — если у страницы нет `.md` (тогда `rel="alternate"` не выводим).
 */
export function toLlmsMarkdownPath(pathname: string): string | null {
  const path = normalizePath(pathname)

  if (path === '/') return '/index.md'

  if ((LLMS_MD_STATIC_PATHS as readonly string[]).includes(path)) {
    return `${path}.md`
  }

  const premisesPrefix = '/remont-pomescheniy/'
  if (path.startsWith(premisesPrefix)) {
    const slug = path.slice(premisesPrefix.length)
    return (LLMS_MD_PREMISES_SLUGS as readonly string[]).includes(slug) ? `${path}.md` : null
  }

  const workTypePrefix = '/vidy-rabot/'
  if (path.startsWith(workTypePrefix)) {
    const slug = path.slice(workTypePrefix.length)
    return (LLMS_MD_WORK_TYPE_SLUGS as readonly string[]).includes(slug) ? `${path}.md` : null
  }

  if (LLMS_MD_DYNAMIC_PATTERNS.some(pattern => pattern.test(path))) {
    return `${path}.md`
  }

  return null
}

/**
 * Markdown-путь → HTML-путь. `null` — если такой `.md` не поддерживается
 * (middleware тогда не вмешивается, и Nitro отдаёт свой обычный 404).
 */
export function fromLlmsMarkdownPath(mdPathname: string): string | null {
  const path = normalizePath(mdPathname)

  if (!path.endsWith('.md')) return null

  // URL без имени файла в спеке соответствует `index.md` → HTML-страница «/»
  if (path === '/index.md') return '/'

  const htmlPath = path.slice(0, -'.md'.length) || '/'

  return toLlmsMarkdownPath(htmlPath) === path ? htmlPath : null
}
