// app/utils/id.ts
/**
 * Генерирует уникальный ID с заданным префиксом.
 * ✅ Полностью SSR-безопасен (совместим с Node.js 20+ и современными браузерами).
 * ✅ Приоритет: crypto.randomUUID() → фоллбэк на timestamp + случайную строку.
 */
export function generateId(prefix = 'id'): string {
  // 1. Современный стандарт (доступен нативно в Node.js и браузере)
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return `${prefix}_${crypto.randomUUID()}`
  }

  // 2. Надежный фоллбэк для старых окружений или полифиллов
  const ts = Date.now().toString(36)
  const rand = Math.random().toString(36).slice(2, 10)
  return `${prefix}_${ts}_${rand}`
}
