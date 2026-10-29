// server/utils/rateLimit.ts
/**
 * Лёгкий in-memory rate limit (фиксированное окно) для публичных эндпоинтов.
 *
 * Нужен для /api/visitors/ping и /api/visitors/event: у посетителя нет JWT,
 * поэтому без лимита скрипт мог бы забить реестр случайными visitorId.
 * PM2 у проекта в одном процессе, поэтому общий Map достаточен.
 */

interface Bucket {
  count: number
  resetAt: number
}

const buckets = new Map<string, Bucket>()
const MAX_BUCKETS = 20000
let lastSweep = 0

function sweep(now: number): void {
  if (now - lastSweep < 60_000 && buckets.size < MAX_BUCKETS) return
  lastSweep = now
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key)
  }
  // Крайний предохранитель: при флуде уникальными ключами не растём бесконечно
  if (buckets.size >= MAX_BUCKETS) buckets.clear()
}

/**
 * Учесть обращение и вернуть true, если лимит ещё не превышен.
 *
 * @param key      уникальный ключ (например `ping:1.2.3.4`)
 * @param limit    максимум обращений за окно
 * @param windowMs длительность окна, мс
 */
export function allowRequest(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now()
  sweep(now)

  const bucket = buckets.get(key)
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    return true
  }

  bucket.count++
  return bucket.count <= limit
}
