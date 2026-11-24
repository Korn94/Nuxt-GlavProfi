// app/utils/llmsMarkdown.ts
/**
 * 📄 Клиентский матчер markdown-версий (`rel="alternate"` в `app.vue`).
 *
 * Списки slug'ов собираются из ТЕХ ЖЕ данных, что рендерят страницы, — руками
 * их вести больше не нужно (раньше это делал `shared/constants/llmsMarkdown.ts`,
 * и забытый slug оставлял страницу без `<link>`):
 * - типы помещений — `PREMISES_CATALOG` с `isReady: true`
 *   (`pischevye` лежит в каталоге, но страницы у него нет);
 * - виды работ — ключи `WORK_TYPES` (тот же реестр, что рендерит ссылки в UI).
 *
 * Движок (нормализация пути, статические пути, регэкспы прайсов/кейсов) —
 * общий с сервером: `shared/constants/llmsMarkdown.ts`. Серверный матчер
 * собирается так же в `server/utils/llmsMarkdown.ts`.
 */
import { createLlmsMarkdownMatcher } from 'shared/constants/llmsMarkdown'
import { PREMISES_CATALOG } from '~/components/pages/public/remontPomescheniy/pageTypes/data/premisesCatalog'
import { WORK_TYPES } from '~/components/pages/public/remontPomescheniy/pageTypes/data/workTypesByCategory'

/** HTML-путь → путь `.md`. `null` — у страницы markdown-версии нет. */
export const toLlmsMarkdownPath = createLlmsMarkdownMatcher({
  premisesSlugs: PREMISES_CATALOG.filter(item => item.isReady).map(item => item.slug),
  workTypeSlugs: Object.keys(WORK_TYPES)
}).toLlmsMarkdownPath
