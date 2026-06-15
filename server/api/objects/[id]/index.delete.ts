/**
 * 📍 Файл: `server/api/objects/[id]/index.delete.ts`
 * 📍 Эндпоинт: `DELETE /api/objects/[id]`
 *
 * Назначение: Удаление объекта строительства (гибридный подход)
 * ⚠️ Требует право `canDeleteRecords` (проверяется в мидлваре)
 *
 * Логика:
 * - Если у объекта ЕСТЬ финансовые операции → soft delete (статус "canceled")
 *   + документы и операции сохраняются (для аудита и отчётности)
 *   + объект остаётся в БД со статусом "canceled"
 *
 * - Если у объекта НЕТ финансовых операций → hard delete (физическое удаление)
 *   + удаляются все связанные записи (документы, доски)
 *   + удаляется сам объект
 *
 * 💡 Чтобы физически удалить объект с операциями:
 *    сначала удалите все операции вручную, потом удалите объект
 *
 * @param {string} id — ID объекта (из пути)
 * @returns { message: string, id: number, mode: 'soft' | 'hard', operations?: {...} }
 */

import { defineEventHandler, getRouterParam, createError } from 'h3'
import { db } from '../../../db'
import {
  objects, comings, works, expenses, materials,
  boards
} from '../../../db/schema'
import { eq, sql } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  // ✅ Авторизация и права уже проверены мидлваром
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'ID объекта обязателен' })
  
  const objectId = parseInt(id)
  if (isNaN(objectId)) {
    throw createError({ statusCode: 400, message: 'Некорректный ID объекта' })
  }

  // Получаем объект ПЕРЕД транзакцией (read-only)
  const [object] = await db.select().from(objects).where(eq(objects.id, objectId))
  if (!object) throw createError({ statusCode: 404, message: 'Объект не найден' })

  // ───────── ПРОВЕРКА: ЕСТЬ ЛИ ФИНАНСОВЫЕ ОПЕРАЦИИ? (read-only, можно вне транзакции) ─────────
  const [comingsCount] = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(comings)
    .where(eq(comings.objectId, objectId))

  const [worksCount] = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(works)
    .where(eq(works.objectId, objectId))

  const [expensesCount] = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(expenses)
    .where(eq(expenses.objectId, objectId))

  const [materialsCount] = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(materials)
    .where(eq(materials.objectId, objectId))

  const operationsCount = {
    comings: comingsCount?.count || 0,
    works: worksCount?.count || 0,
    expenses: expensesCount?.count || 0,
    materials: materialsCount?.count || 0
  }

  const hasOperations = 
    operationsCount.comings > 0 ||
    operationsCount.works > 0 ||
    operationsCount.expenses > 0 ||
    operationsCount.materials > 0

  // ───────── ПОДСЧЁТ ДОКУМЕНТОВ ПЕРЕД УДАЛЕНИЕМ (только для hard delete) ─────────
  // MySQL DELETE не поддерживает $returningId(), поэтому считаем заранее
  const [boardsCountResult] = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(boards)
    .where(eq(boards.objectId, objectId))

  const deletedBoardsCount = boardsCountResult?.count || 0

  // ✅ Всё в одной транзакции
  return await db.transaction(async (tx) => {
    // ───────── ВЕТВЛЕНИЕ: SOFT DELETE vs HARD DELETE ─────────
    if (hasOperations) {
      // ═══════════ SOFT DELETE ═══════════
      // Объект остаётся в БД со статусом "canceled"
      // Финансовые операции И документы сохраняются (для аудита и отчётности)
      
      await tx.update(objects)
        .set({
          status: 'canceled',
          statusDate: new Date().toISOString().slice(0, 19).replace('T', ' '),
          updatedAt: new Date()
        })
        .where(eq(objects.id, objectId))

      console.log(`[Objects/Delete] 🟡 SOFT DELETE: "${object.name}" (ID ${objectId})`)
      console.log(`[Objects/Delete]   Причина: есть ${operationsCount.comings} приходов, ${operationsCount.works} работ, ${operationsCount.expenses} расходов, ${operationsCount.materials} материалов`)
      console.log(`[Objects/Delete]   Все операции и документы сохранены для аудита`)

      return {
        message: `Объект архивирован (статус "canceled"), так как содержит финансовые операции. Все операции и документы сохранены для аудита. Для полного удаления сначала удалите все операции вручную.`,
        id: objectId,
        mode: 'soft' as const,
        operations: operationsCount
      }

    } else {
      // ═══════════ HARD DELETE ═══════════
      // Объект удаляется физически
      // Удаляем доски (на всякий случай, хотя есть ON DELETE CASCADE)
      
      await tx.delete(boards).where(eq(boards.objectId, objectId))

      // Удаляем сам объект
      await tx.delete(objects).where(eq(objects.id, objectId))

      console.log(`[Objects/Delete] 🔴 HARD DELETE: "${object.name}" (ID ${objectId})`)
      console.log(`[Objects/Delete]   Причина: нет финансовых операций`)
      console.log(`[Objects/Delete]   Удалено досок: ${deletedBoardsCount}`)

      return {
        message: `Объект полностью удалён (не содержал финансовых операций).`,
        id: objectId,
        mode: 'hard' as const,
        deletedBoards: deletedBoardsCount
      }
    }
  })
})
