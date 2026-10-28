// server/socket/handlers/tasks.ts

import { Server } from 'socket.io'
import { eq } from 'drizzle-orm'
import { db } from '../../db'
import { boardsTasks } from '../../db/schema'
import type { Task } from '~/types/boards'
import { socketLog } from '../logger'

/**
 * Интерфейс для данных перестановки задач
 */
export interface TaskReorderData {
  boardId: number
  status: string
  tasks: Array<{ id: number; order: number }>
}

// ============================================
// BROADCAST ФУНКЦИИ (для API endpoints)
// Используют io.to() — отправляют ВСЕМ в комнате
// ============================================

/**
 * Broadcast события создания задачи (из API)
 * @param io Экземпляр Socket.IO сервера
 * @param task Созданная задача
 * @param boardId ID доски
 */
export function broadcastTaskCreated(io: Server, task: Task, boardId: number) {
  const roomName = `board:${boardId}`
  
  // ✅ Используем io.to() — отправляем ВСЕМ в комнате (включая отправителя API)
  io.to(roomName).emit('board:task:created', { task, boardId })
  
  socketLog(`[Socket] 🆕 Task ${task.id} created, broadcasted to room "${roomName}"`)
}

/**
 * Broadcast события обновления задачи (из API)
 * @param io Экземпляр Socket.IO сервера
 * @param task Обновлённая задача
 * @param boardId ID доски
 */
export function broadcastTaskUpdated(io: Server, task: Task, boardId: number) {
  const roomName = `board:${boardId}`
  
  // ✅ Используем io.to() — отправляем ВСЕМ в комнате
  io.to(roomName).emit('board:task:updated', { task, boardId })
  
  socketLog(`[Socket] 🔄 Task ${task.id} updated, broadcasted to room "${roomName}"`)
}

/**
 * Broadcast события удаления задачи (из API)
 * @param io Экземпляр Socket.IO сервера
 * @param taskId ID удалённой задачи
 * @param boardId ID доски
 */
export function broadcastTaskDeleted(io: Server, taskId: number, boardId: number) {
  const roomName = `board:${boardId}`
  
  // ✅ ИСПРАВЛЕНО: передаём taskId, а не task
  io.to(roomName).emit('board:task:deleted', { taskId, boardId })
  
  socketLog(`[Socket] 🗑️ Task ${taskId} deleted, broadcasted to room "${roomName}"`)
}

/**
 * Broadcast изменения порядка задач (из API)
 * @param io Экземпляр Socket.IO сервера
 * @param data Данные о новом порядке
 */
export async function broadcastTasksReordered(
  io: Server,
  data: TaskReorderData
) {
  const { boardId, status, tasks } = data
  const roomName = `board:${boardId}`
  
  try {
    // ✅ Сохраняем порядок в БД
    if (tasks.length > 0) {
      for (const { id, order } of tasks) {
        await db
          .update(boardsTasks)
          .set({ order })
          .where(eq(boardsTasks.id, id))
      }
      socketLog(`[Socket] ✅ Saved order for ${tasks.length} tasks`)
    }
    
    // ✅ Отправляем всем в комнате
    io.to(roomName).emit('board:tasks:reordered', { status, tasks })
    socketLog(`[Socket] 📡 Broadcasted reorder to room "${roomName}"`)
    
  } catch (error) {
    console.error('[Socket] ❌ Failed to broadcast reorder:', error)
  }
}

// ============================================
// ✅ P8: ПРЯМЫЕ SOCKET-ОБРАБОТЧИКИ ЗАДАЧ УДАЛЕНЫ
// ============================================
// Здесь были socket.on(board:task:created|updated|deleted) и
// socket.on(board:tasks:reorder), которые полностью доверяли payload клиента:
//   - рассылали события в любую комнату board:{id} без проверки членства в комнате
//     и без ACL (socket.to(room) доставляет события членам комнаты, даже если
//     отправитель в ней не состоит);
//   - board:tasks:reorder писал новый порядок прямо в БД (UPDATE boards_tasks)
//     по клиентским id/order: без прав, без проверки принадлежности задачи доске,
//     без транзакции.
// Ни один клиент эти события не отправлял (ручные emit клиента удалены, рассылку
// делает REST: server/api/boards/** -> broadcastTask*() ниже), поэтому обработчики
// были только вектором атаки и удалены.
//
// Остались только серверные broadcast-функции для вызова из API-эндпоинтов.
// ============================================
