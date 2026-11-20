// app/components/pages/Cabinet/Online/composables/useAnalyticsRoute.ts
/**
 * Стек навигации по деталям аналитики (/cabinet/online).
 *
 * Состояние живёт только в памяти компонента: URL не меняется, поэтому
 * открытие модалки не пересоздаёт страницу и не запускает page-transition
 * (в app/layouts/cabinet.vue ключ перехода — $route.fullPath).
 *
 * Уровни вложены по цепочке page → visitor → session.
 */

export type AnalyticsTargetKind = 'page' | 'visitor' | 'session'

export interface AnalyticsStep {
  kind: AnalyticsTargetKind
  id: string
  title?: string
}

/** Короткая подпись посетителя для крошек/таблиц */
export function shortVisitorId(id: string | null | undefined): string {
  if (!id) return '—'
  const clean = id.replace(/^v_/, '')
  return `гость ${clean.slice(0, 8)}`
}

/** Короткая подпись визита */
export function shortSessionId(id: string | null | undefined): string {
  if (!id) return '—'
  return id.slice(0, 8)
}
