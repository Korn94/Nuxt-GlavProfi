// server/middleware/seo-manager.ts
/**
 * SEO-менеджер для обработки:
 * - Удаления завершающих слэшей (301 редирект)
 * - Удаленных страниц (410 Gone + красивый error.vue)
 * - Ручных редиректов (301)
 * - Блокировки служебных путей (/null и т.п.)
 * 
 * Все ошибки рендерятся через app/error.vue с правильным HTTP-статусом
 */

import { defineEventHandler, sendRedirect, createError } from 'h3'

// ============================================
// 1. СПИСОК РЕДИРЕКТОВ (301 Moved Permanently)
// ============================================
const REDIRECTS: Record<string, string> = {
  // Пример:
  // '/old-page': '/new-page',
}

// ============================================
// 2. СПИСОК УДАЛЕННЫХ СТРАНИЦ (410 Gone)
// ============================================
const REMOVED_PATHS: string[] = [
  '/projects/1',
  '/projects/2',
  '/projects/3',
  '/projects/4',
  '/projects/5',
  '/projects/6',
  '/projects/7',
  '/projects/8',
  '/projects/9',
  '/projects/10',
  '/projects/11',
  '/projects/12',
  '/projects/ddx/edit',
  '/projects/zerno/edit',
]

// ============================================
// 3. СЛУЖЕБНЫЕ ПУТИ ДЛЯ БЛОКИРОВКИ
// ============================================
const BLOCKED_PATHS: string[] = [
  '/null',
  '/undefined',
  '/[slug]',
  '/[id]',
]

// ============================================
// ОСНОВНОЙ ОБРАБОТЧИК
// ============================================
export default defineEventHandler((event) => {
  // ✅ Явно приводим к string и защищаем от undefined
  const rawPath: string = event.path || '/'
  const path: string = rawPath.split('?')[0] ?? ''

  // ✅ Дополнительная защита: если путь пустой — выходим
  if (!path) return

  // ============================================
  // СЦЕНАРИЙ 1: Блокировка служебных/битых путей
  // ============================================
  if (BLOCKED_PATHS.includes(path) || path.startsWith('/null') || path.startsWith('/undefined')) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Not Found',
      message: 'Страница не найдена'
    })
  }

  // ============================================
  // СЦЕНАРИЙ 2: Удаление завершающего слэша
  // ============================================
  if (path !== '/' && path.endsWith('/')) {
    const newPath: string = path.slice(0, -1)
    return sendRedirect(event, newPath, 301)
  }

  // ============================================
  // СЦЕНАРИЙ 3: Удаленные страницы (410 Gone)
  // ============================================
  if (REMOVED_PATHS.includes(path)) {
    throw createError({
      statusCode: 410,
      statusMessage: 'Gone',
      message: 'Эта страница была удалена'
    })
  }

  // ============================================
  // СЦЕНАРИЙ 4: Ручные редиректы (301)
  // ============================================
  // ✅ Используем 'in' для безопасной проверки ключа
  if (path in REDIRECTS) {
    const newPath: string | undefined = REDIRECTS[path]
    // ✅ Проверяем, что значение существует и это строка
    if (newPath && typeof newPath === 'string') {
      return sendRedirect(event, newPath, 301)
    }
  }

  // ============================================
  // СЦЕНАРИЙ 5: Всё остальное — пропускаем в Nuxt
  // ============================================
})