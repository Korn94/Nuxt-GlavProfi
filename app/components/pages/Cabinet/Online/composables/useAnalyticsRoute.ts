// app/components/pages/Cabinet/Online/composables/useAnalyticsRoute.ts
/**
 * Навигация по деталям аналитики + синхронизация с URL-query.
 *
 * Состояние модалки кодируется в query текущего маршрута:
 *   ?page=/offers/dvizheniya-pervyh&visitor=v_xxx&session=YYY
 * — так ссылкой можно поделиться, а экран восстановится при открытии.
 *
 * Правила:
 * - уровни вложены по цепочке page → visitor → session;
 * - невалидные значения (битый id, пустой путь) отбрасываются и вычищаются из URL;
 * - запись идёт через router.replace: оверлей не плодит записи в истории.
 */

import { watch, type Ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

export type AnalyticsTargetKind = 'page' | 'visitor' | 'session'

export interface AnalyticsStep {
  kind: AnalyticsTargetKind
  id: string
  title?: string
}

/** Формат visitor_id, который генерирует клиент (см. server/utils/visitorTypes.ts) */
const VISITOR_ID_RE = /^v_[A-Za-z0-9_-]{8,60}$/
/** Формат ID визита: nanoid(20) (см. server/utils/visitorRegistry.ts) */
const SESSION_ID_RE = /^[A-Za-z0-9_-]{20}$/

/** Путь страницы без query/hash, с ведущим слэшем (как на сервере) */
export function normalizePagePath(value: string): string {
  const base = value.split('#')[0]!.split('?')[0]!.trim()
  if (!base) return '/'
  const withSlash = base.startsWith('/') ? base : `/${base}`
  const trimmed = withSlash.length > 1 ? withSlash.replace(/\/+$/, '') : withSlash
  return trimmed.slice(0, 300) || '/'
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

function readQueryValue(query: Record<string, unknown>, key: string): string {
  const raw = query[key]
  const value = Array.isArray(raw) ? raw[0] : raw
  return typeof value === 'string' ? value.trim() : ''
}

/** Восстановить стек детализации из query маршрута */
export function parseAnalyticsQuery(query: Record<string, unknown>): AnalyticsStep[] {
  const stack: AnalyticsStep[] = []

  const page = readQueryValue(query, 'page')
  if (page) {
    const path = normalizePagePath(page)
    if (path) stack.push({ kind: 'page', id: path, title: path })
  }

  const visitor = readQueryValue(query, 'visitor')
  if (visitor && VISITOR_ID_RE.test(visitor)) {
    stack.push({ kind: 'visitor', id: visitor, title: shortVisitorId(visitor) })
  }

  const session = readQueryValue(query, 'session')
  if (session && SESSION_ID_RE.test(session)) {
    stack.push({ kind: 'session', id: session, title: `Визит ${shortSessionId(session)}` })
  }

  return stack
}

/** Query-параметры аналитики по стеку */
export function analyticsQueryFromStack(stack: AnalyticsStep[]): Record<string, string> {
  const query: Record<string, string> = {}
  for (const step of stack) {
    if (step.kind === 'page') query.page = step.id
    else if (step.kind === 'visitor') query.visitor = step.id
    else query.session = step.id
  }
  return query
}

function sameStack(a: AnalyticsStep[], b: AnalyticsStep[]): boolean {
  if (a.length !== b.length) return false
  return a.every((step, i) => step.kind === b[i]!.kind && step.id === b[i]!.id)
}

/** Убирает параметры аналитики из query, сохраняя остальные (например, days) */
function withoutAnalyticsQuery(base: Record<string, unknown>): Record<string, string | number | (string | number)[]> {
  const next: Record<string, string | number | (string | number)[]> = {}
  for (const [key, value] of Object.entries(base)) {
    if (key === 'page' || key === 'visitor' || key === 'session') continue
    if (value === undefined || value === null) continue

    if (Array.isArray(value)) {
      const items = value.filter(
        (item): item is string | number => typeof item === 'string' || typeof item === 'number'
      )
      if (items.length) next[key] = items
      continue
    }

    if (typeof value === 'string' || typeof value === 'number') next[key] = value
  }
  return next
}

function sameQuery(a: Record<string, unknown>, b: Record<string, unknown>): boolean {
  const aKeys = Object.keys(a).sort()
  const bKeys = Object.keys(b).sort()
  if (aKeys.length !== bKeys.length) return false
  return aKeys.every((key, i) => key === bKeys[i] && String(a[key]) === String(b[key]))
}

/**
 * Двусторонняя синхронизация: стек детализации ⇄ URL-query.
 * Изменение query (вставка ссылки, навигация браузера) обновляет стек,
 * изменение стека — query.
 */
export function useAnalyticsRouteSync(stack: Ref<AnalyticsStep[]>): void {
  const route = useRoute()
  const router = useRouter()

  // URL → стек
  watch(
    () => route.query,
    (query) => {
      const next = parseAnalyticsQuery(query as Record<string, unknown>)
      if (!sameStack(next, stack.value)) stack.value = next
    },
    { immediate: true }
  )

  // Стек → URL
  watch(stack, (steps) => {
    if (!import.meta.client) return

    const current = withoutAnalyticsQuery(route.query as Record<string, unknown>)
    const currentAnalytics: Record<string, string> = {}
    for (const key of ['page', 'visitor', 'session']) {
      const value = readQueryValue(route.query as Record<string, unknown>, key)
      if (value) currentAnalytics[key] = value
    }

    const targetAnalytics = analyticsQueryFromStack(steps)
    if (sameQuery({ ...current, ...currentAnalytics }, { ...current, ...targetAnalytics })) return

    router.replace({ query: { ...current, ...targetAnalytics } })
  }, { deep: true })
}
