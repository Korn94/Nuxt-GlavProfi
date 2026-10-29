// server/utils/visitorRegistry.ts
/**
 * 👥 Реестр посетителей публичного сайта (только в памяти, без БД).
 *
 * Зачем отдельный реестр:
 * - Анонимные посетители не проходят socket-авторизацию (нет JWT) и не создают
 *   запись в user_sessions (таблица ссылается на users.id) — в существующий
 *   пайплайн онлайна они попасть не могут.
 * - Держим лёгкий Map в памяти процесса: он нужен для realtime-отображения
 *   «кто сейчас на сайте» на /cabinet/online.
 *
 * ⚠️ Данные живут только до рестарта процесса. PM2 у проекта в single-fork
 * (ecosystem.config.cjs без instances/cluster), поэтому рассинхрона между
 * процессами нет.
 *
 * 🗄️ Готовность к аналитике: запись уже содержит всё, что понадобится таблице
 * визитов (visitorId, ip, userAgent, referrer, activePath, startedAt,
 * lastActivity) — позже сюда достаточно добавить flush в БД, клиент и UI
 * менять не потребуется.
 */

import { nanoid } from 'nanoid'
import { getDeviceType, type DeviceType } from './userAgent'

// ============================================
// КОНСТАНТЫ
// ============================================

/** Посетитель считается «онлайн», если активность была не позже этого окна */
export const VISITOR_ONLINE_MS = 60 * 1000 // 60 секунд

/** Через сколько без пингов запись удаляется из реестра */
export const VISITOR_TTL_MS = 5 * 60 * 1000 // 5 минут

/** Предохранитель от разрастания памяти при флуде (боты/скрипты) */
export const MAX_VISITORS = 500

/** Интервал фоновой чистки «протухших» записей */
const CLEANUP_INTERVAL_MS = 60 * 1000 // 1 минута

// ============================================
// ТИПЫ
// ============================================

/** Статус посетителя, вычисляемый на сервере (UI показывает как есть) */
export type VisitorStatus = 'online' | 'idle'

/** Запись о посетителе публичного сайта */
export interface VisitorRecord {
  /** Устойчивый ID посетителя (генерируется на клиенте, иначе на сервере) */
  id: string
  ipAddress: string
  userAgent: string
  deviceType: DeviceType
  /** Текущий (последний известный) путь страницы, например /prices */
  activePath: string
  /** Откуда пришёл (Referer), для будущей аналитики */
  referrer: string | null
  /** Время первого пинга (ISO) */
  startedAt: string
  /** Время последнего пинга (ISO) */
  lastActivity: string
}

/** Запись с вычисленным статусом — то, что уходит в UI */
export interface ActiveVisitor extends VisitorRecord {
  status: VisitorStatus
}

// ============================================
// СОСТОЯНИЕ (singleton на процесс)
// ============================================

const visitors = new Map<string, VisitorRecord>()

/** Флаг установки интервала очистки (регистрируем ровно один раз) */
let cleanupTimerStarted = false

/**
 * Ограничить длину строки (защита от мусорных payload'ов от клиента)
 */
function clampString(value: unknown, maxLength: number): string {
  if (typeof value !== 'string') return ''
  return value.length > maxLength ? value.slice(0, maxLength) : value
}

/**
 * Удалить записи, по которым давно не было пингов.
 * @returns количество удалённых записей
 */
export function pruneStaleVisitors(now: number = Date.now()): number {
  let removed = 0
  for (const [id, record] of visitors) {
    const last = new Date(record.lastActivity).getTime()
    if (!Number.isFinite(last) || now - last > VISITOR_TTL_MS) {
      visitors.delete(id)
      removed++
    }
  }
  return removed
}

/**
 * Фоновая чистка. setInterval(...).unref(), чтобы таймер не удерживал процесс
 * (важно для тестов и корректного завершения Nitro).
 */
function ensureCleanupTimer(): void {
  if (cleanupTimerStarted) return
  cleanupTimerStarted = true

  const timer = setInterval(() => {
    const removed = pruneStaleVisitors()
    if (removed > 0) {
      console.log(`[VisitorRegistry] 🧹 Удалено устаревших посетителей: ${removed}`)
    }
  }, CLEANUP_INTERVAL_MS)

  // Не удерживать event loop при завершении процесса
  if (typeof (timer as any).unref === 'function') {
    (timer as any).unref()
  }
}

// ============================================
// ПУБЛИЧНОЕ API
// ============================================

/**
 * Зафиксировать активность посетителя (создать или обновить запись).
 *
 * @param input.visitorId — ID, сгенерированный клиентом (если есть)
 * @param input.ipAddress — IP клиента (см. getRequestIp)
 * @param input.userAgent — сырой User-Agent
 * @param input.path      — текущий путь страницы
 * @param input.referrer  — Referer (внешний источник)
 * @returns сохранённая запись либо null, если реестр переполнен
 */
export function touchVisitor(input: {
  visitorId?: unknown
  ipAddress?: string
  userAgent?: string
  path?: unknown
  referrer?: unknown
}): VisitorRecord | null {
  ensureCleanupTimer()
  pruneStaleVisitors()

  const nowIso = new Date().toISOString()

  const providedId = clampString(input.visitorId, 64).trim()
  const id = providedId || `v_${nanoid(16)}`

  const userAgent = clampString(input.userAgent, 512)
  const activePath = clampString(input.path, 500) || '/'
  const referrerRaw = clampString(input.referrer, 500)

  const existing = visitors.get(id)

  if (existing) {
    existing.ipAddress = input.ipAddress || existing.ipAddress
    existing.userAgent = userAgent || existing.userAgent
    existing.deviceType = getDeviceType(userAgent || existing.userAgent)
    existing.activePath = activePath
    existing.lastActivity = nowIso
    if (referrerRaw) existing.referrer = referrerRaw
    return existing
  }

  // ✅ Предохранитель: при переполнении реестра не плодим новые записи
  if (visitors.size >= MAX_VISITORS) {
    console.warn(`[VisitorRegistry] ⚠️ Достигнут лимит посетителей (${MAX_VISITORS}) — новая запись не создана`)
    return null
  }

  const record: VisitorRecord = {
    id,
    ipAddress: input.ipAddress || 'unknown',
    userAgent,
    deviceType: getDeviceType(userAgent),
    activePath,
    referrer: referrerRaw || null,
    startedAt: nowIso,
    lastActivity: nowIso
  }

  visitors.set(id, record)
  return record
}

/**
 * Удалить посетителя (например, при закрытии вкладки — beacon с leave: true).
 * @returns был ли посетитель в реестре
 */
export function removeVisitor(visitorId: unknown): boolean {
  const id = clampString(visitorId, 64).trim()
  if (!id) return false
  return visitors.delete(id)
}

/**
 * Получить актуальный список посетителей (со статусом online/idle).
 * «Протухшие» записи удаляются перед выдачей.
 */
export function getActiveVisitors(now: number = Date.now()): ActiveVisitor[] {
  pruneStaleVisitors(now)

  const result: ActiveVisitor[] = []
  for (const record of visitors.values()) {
    const last = new Date(record.lastActivity).getTime()
    const status: VisitorStatus = (Number.isFinite(last) && now - last <= VISITOR_ONLINE_MS)
      ? 'online'
      : 'idle'
    result.push({ ...record, status })
  }

  // Свежие — выше: по времени последней активности
  return result.sort((a, b) => new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime())
}

/**
 * Текущее количество посетителей в реестре.
 */
export function getVisitorsCount(): number {
  return visitors.size
}
