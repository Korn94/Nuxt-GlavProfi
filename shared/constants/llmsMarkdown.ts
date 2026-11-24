// shared/constants/llmsMarkdown.ts
/**
 * 📄 Движок сопоставления «HTML-путь ↔ markdown-версия» (llmstxt.org v2).
 *
 * Спека: «pages … provide a clean markdown version … with .md appended … use
 * `rel="alternate" type="text/markdown"` to point to the markdown version».
 *
 * Списков slug'ов здесь больше НЕТ: какие `.md` существуют, знают сами данные —
 * `PREMISES_CATALOG` (`isReady: true`), `WORK_TYPES`, прайсы и кейсы в БД.
 * Списки собирают два матчера из одной фабрики:
 * - клиент — `app/utils/llmsMarkdown.ts` (для `rel="alternate"` в `app.vue`);
 * - сервер — `server/utils/llmsMarkdown.ts` (для middleware отдачи `.md`
 *   и плагина HTTP-заголовка `Link`).
 *
 * Правила живут в `shared/`, потому что клиент и сервер должны отвечать
 * на вопрос «есть ли у этой страницы `.md`» одинаково: иначе `<link>` вёл бы
 * на 404 или, наоборот, существующие `.md` остались бы без ссылки.
 */

/**
 * Статические разделы с markdown-версией.
 * `/` отдаётся как `/index.md` (в спеке: для URL без имени файла — `index.md`).
 */
export const LLMS_MD_STATIC_PATHS = [
  '/',
  '/remont-pomescheniy',
  '/projects',
  '/contacts',
  '/requisites-ip'
] as const

/**
 * Регулярки динамических разделов, где `.md` собирается из БД.
 * Лучше ручных списков: новая запись прайса или кейса получает `.md` сразу,
 * без правки кода (рендерер вернёт `null`, только если записи в БД нет).
 */
export const LLMS_MD_DYNAMIC_PATTERNS = [/^\/prices\/[a-z0-9-]+$/, /^\/projects\/[a-z0-9-]+$/]

/** Путь без query и завершающего слэша (кроме корня). */
function normalizePath(pathname: string): string {
  const withoutQuery = String(pathname || '/').split('?')[0]?.split('#')[0] ?? ''
  const trimmed = withoutQuery.replace(/\/+$/, '')
  return trimmed || '/'
}

export interface LlmsMarkdownMatcherOptions {
  /** Slug'и страниц, у которых `.md` реально существует: `/remont-pomescheniy/<slug>` */
  premisesSlugs: readonly string[]
  /** Slug'и страниц видов работ: `/vidy-rabot/<slug>` */
  workTypeSlugs: readonly string[]
}

export interface LlmsMarkdownMatcher {
  /** HTML-путь → путь markdown-версии. `null` — `.md` нет (`rel="alternate"` не выводим). */
  toLlmsMarkdownPath(pathname: string): string | null
  /** `.md`-путь → HTML-путь. `null` — такой `.md` не поддерживается. */
  fromLlmsMarkdownPath(mdPathname: string): string | null
}

/**
 * Матчер путей. Списки slug'ов передаёт вызывающая сторона (она берёт их из
 * данных), поэтому новый тип помещения или вид работ не требует правок здесь.
 */
export function createLlmsMarkdownMatcher(
  options: LlmsMarkdownMatcherOptions
): LlmsMarkdownMatcher {
  const premisesSlugs = new Set(options.premisesSlugs)
  const workTypeSlugs = new Set(options.workTypeSlugs)

  /**
   * HTML-путь → путь markdown-версии.
   * `null` — если у страницы нет `.md` (тогда `rel="alternate"` не выводим).
   */
  const toLlmsMarkdownPath = (pathname: string): string | null => {
    const path = normalizePath(pathname)

    if (path === '/') return '/index.md'

    if ((LLMS_MD_STATIC_PATHS as readonly string[]).includes(path)) {
      return `${path}.md`
    }

    const premisesPrefix = '/remont-pomescheniy/'
    if (path.startsWith(premisesPrefix)) {
      const slug = path.slice(premisesPrefix.length)
      return premisesSlugs.has(slug) ? `${path}.md` : null
    }

    const workTypePrefix = '/vidy-rabot/'
    if (path.startsWith(workTypePrefix)) {
      const slug = path.slice(workTypePrefix.length)
      return workTypeSlugs.has(slug) ? `${path}.md` : null
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
  const fromLlmsMarkdownPath = (mdPathname: string): string | null => {
    const path = normalizePath(mdPathname)

    if (!path.endsWith('.md')) return null

    // URL без имени файла в спеке соответствует `index.md` → HTML-страница «/»
    if (path === '/index.md') return '/'

    const htmlPath = path.slice(0, -'.md'.length) || '/'

    return toLlmsMarkdownPath(htmlPath) === path ? htmlPath : null
  }

  return { toLlmsMarkdownPath, fromLlmsMarkdownPath }
}
