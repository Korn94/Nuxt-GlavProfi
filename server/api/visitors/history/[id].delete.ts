// server/api/visitors/history/[id].delete.ts
/**
 * 📍 Файл: `server/api/visitors/history/[id].delete.ts`
 * 📍 Эндпоинт: `DELETE /api/visitors/history/[id]`
 *
 * Назначение: удаление одного визита из истории посетителей сайта
 * (таблица «История визитов» на /cabinet/online). Нужно, чтобы вручную
 * вычищать записи роботов и случайных посетителей.
 *
 * Что удаляется:
 * - сам визит (`site_visitor_sessions`);
 * - его просмотры страниц (`site_visitor_pageviews`) и события (`site_visitor_events`);
 * - агрегат посетителя (`site_visitors`), если у него больше нет визитов
 *   в БД и незавершённых данных в памяти.
 *
 * ⚠️ Доступ: только администратор — проверяется мидлваром (PROTECTED_PATHS)
 * и повторно здесь.
 *
 * @returns { success: boolean, message: string, visitorId: string, visitorDeleted: boolean }
 */

import { createError, getRouterParam } from 'h3'
import { eq, sql } from 'drizzle-orm'
import { defineApi } from '../../../utils/defineApi'
import { db } from '../../../db'
import {
  siteVisitorEvents,
  siteVisitorPageviews,
  siteVisitorSessions,
  siteVisitors
} from '../../../db/schema'
import type { DbUser } from '../../../utils/permissions'
import { dropVisitorSession, hasVisitorState } from '../../../utils/visitorRegistry'
import { scheduleVisitorsBroadcast } from '../../../utils/visitor-broadcast'

/** Формат ID визита: nanoid(20) в createRecord (visitorRegistry.ts) */
const SESSION_ID_REGEX = /^[A-Za-z0-9_-]{20}$/

export default defineApi(async (event) => {
  // ✅ Авторизация и базовые права уже проверены мидлваром
  const currentUser = event.context.user as DbUser | undefined
  if (!currentUser) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Не удалось получить данные текущего пользователя'
    })
  }

  // Дополнительная бизнес-проверка: историю визитов чистит только админ
  if (currentUser.role !== 'admin') {
    throw createError({
      statusCode: 403,
      statusMessage: 'Удалять историю визитов может только администратор'
    })
  }

  // ============================================
  // 1. ПРОВЕРКА ID ВИЗИТА
  // ============================================
  const idParam = getRouterParam(event, 'id')
  if (!idParam || !SESSION_ID_REGEX.test(idParam)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Некорректный ID визита'
    })
  }
  const sessionId = idParam

  // ============================================
  // 2. ПОИСК ВИЗИТА
  // ============================================
  const [session] = await db
    .select({ id: siteVisitorSessions.id, visitorId: siteVisitorSessions.visitorId })
    .from(siteVisitorSessions)
    .where(eq(siteVisitorSessions.id, sessionId))
    .limit(1)

  if (!session) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Визит не найден'
    })
  }

  // Вычищаем визит из памяти ДО работы с БД, чтобы фоновый flush
  // (server/plugins/visitor-flush.ts) не записал удалённые данные обратно.
  const dropped = dropVisitorSession(sessionId)

  try {
    // ============================================
    // 3. УДАЛЕНИЕ ВИЗИТА И ЕГО ДАННЫХ
    // ============================================
    await db.transaction(async (tx) => {
      await tx
        .delete(siteVisitorPageviews)
        .where(eq(siteVisitorPageviews.sessionId, sessionId))
      await tx
        .delete(siteVisitorEvents)
        .where(eq(siteVisitorEvents.sessionId, sessionId))
      await tx
        .delete(siteVisitorSessions)
        .where(eq(siteVisitorSessions.id, sessionId))
    })

    // ============================================
    // 4. АГРЕГАТ ПОСЕТИТЕЛЯ
    // ============================================
    // Удаляем только если у посетителя не осталось визитов в БД и данных в памяти
    // (иначе будущий flush создаст запись заново и «вернувшийся гость» сохранится).
    let visitorDeleted = false
    const visitorStillInMemory = dropped?.visitorStillInMemory ?? hasVisitorState(session.visitorId)

    if (!visitorStillInMemory) {
      const [rest] = await db
        .select({ total: sql<number>`COUNT(*)` })
        .from(siteVisitorSessions)
        .where(eq(siteVisitorSessions.visitorId, session.visitorId))

      if (Number(rest?.total ?? 0) === 0) {
        await db
          .delete(siteVisitors)
          .where(eq(siteVisitors.id, session.visitorId))
        visitorDeleted = true
      }
    }

    // Живой список посетителей у зрителей онлайна обновится сразу
    scheduleVisitorsBroadcast()

    console.log(
      `[Visitors] 🗑️ Пользователь ${currentUser.name} (ID: ${currentUser.id}) ` +
      `удалил визит ${sessionId} посетителя ${session.visitorId}` +
      (visitorDeleted ? ' (посетитель удалён полностью)' : '')
    )

    return {
      success: true,
      message: 'Визит удалён из истории',
      visitorId: session.visitorId,
      visitorDeleted
    }
  } catch (error: any) {
    console.error('[Visitors] ❌ Ошибка удаления визита:', error)

    // Пробрасываем HTTP-ошибки как есть
    if (error.statusCode) throw error

    throw createError({
      statusCode: 500,
      statusMessage: 'Ошибка сервера при удалении визита'
    })
  }
})
