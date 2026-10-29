// server/utils/visitorGuard.ts
/**
 * Защита публичных эндпоинтов трекинга посетителей (ping / event).
 *
 * - валидация visitor_id (формат, который генерирует клиент);
 * - исключение внутренних страниц (/cabinet, /login) и своих IP (VISITOR_EXCLUDE_IPS);
 * - список «своих» хостов: реферер с нашего же сайта не считается источником;
 * - rate limit по IP.
 */

import type { H3Event } from 'h3'
import { allowRequest } from './rateLimit'
import { normalizePath } from './trafficSource'
import { VISITOR_ID_REGEX } from './visitorTypes'

/** Страницы, которые не попадают в аналитику посетителей (внутренняя часть сайта) */
const EXCLUDED_PATH_PREFIXES = ['/cabinet', '/login', '/access-denied', '/api']

/** Вернуть валидный visitor_id или null */
export function resolveVisitorId(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const id = value.trim()
  return VISITOR_ID_REGEX.test(id) ? id : null
}

/** Внутренние страницы (кабинет, логин) — не считаем посетителями */
export function isExcludedPath(path: unknown): boolean {
  if (typeof path !== 'string' || !path) return false
  const clean = normalizePath(path)
  return EXCLUDED_PATH_PREFIXES.some(prefix => clean === prefix || clean.startsWith(`${prefix}/`))
}

/** Свои IP (офис, сотрудники): VISITOR_EXCLUDE_IPS="1.2.3.4, 5.6.7.8" */
export function isExcludedIp(ip: string): boolean {
  const raw = process.env.VISITOR_EXCLUDE_IPS
  if (!raw) return false
  return raw.split(',').map(s => s.trim()).filter(Boolean).includes(ip)
}

/** Хосты нашего сайта (для отсечения внутренних рефереров) */
export function getOwnHosts(event: H3Event): string[] {
  const hosts = new Set<string>()
  const add = (value: string | null | undefined) => {
    if (!value) return
    const host = value.split(',')[0]!.trim().replace(/^https?:\/\//, '').replace(/\/.*$/, '').replace(/:\d+$/, '')
    if (host) hosts.add(host.toLowerCase())
  }

  add(event.headers.get('x-forwarded-host'))
  add(event.headers.get('host'))
  try {
    add(useRuntimeConfig().public.siteUrl as string)
  } catch {
    // runtimeConfig недоступен — обходимся заголовками
  }
  return [...hosts]
}

/**
 * Лимит запросов с одного IP. Пинги идут раз в 30 с на вкладку + смена маршрутов,
 * поэтому 120/мин — с большим запасом для офисов за одним NAT.
 */
export function isRateLimited(kind: 'ping' | 'event', ip: string): boolean {
  const limit = kind === 'ping' ? 120 : 60
  return !allowRequest(`${kind}:${ip}`, limit, 60_000)
}

/** Лимит на создание новых visitor_id с одного IP (защита от забивания реестра) */
export function isNewVisitorFlood(ip: string): boolean {
  return !allowRequest(`new-visitor:${ip}`, 30, 10 * 60_000)
}
