// server/socket/handlers/tasks.ts

import { Server, Socket } from 'socket.io'
import { eq } from 'drizzle-orm'
import { db } from '../../db'
import { boards, boardsTasks } from '../../db/schema'
import type { Task } from '~/types/boards'

/**
 * Интерфейс для данных перестановки задач
 */
export interface TaskReorderData {
  boardId: number
  status: string
  tasks: Array<{ id: number; order: number }>
}

// ============================================
// ПОДПИСКА НА ДОСКУ
// ============================================

export function handleBoardSubscription(socket: Socket, io: Server) {
  socket.on('board:subscribe', async (data: { boardId: number }) => {
    try {
      const { boardId } = data
      
      const board = await db.query.boards.findFirst({
        where: eq(boards.id, boardId)
      })
      
      if (!board) {
        socket.emit('error', { message: 'Доска не найдена' })
        return
      }
      
      await socket.join(`board:${boardId}`)
      
      console.log(`[Socket] 👤 User ${socket.data?.userId || 'unknown'} subscribed to board ${boardId}`)
      socket.emit('board:subscribed', { boardId, success: true })
      
    } catch (error) {
      console.error('[Socket] ❌ Error subscribing to board:', error)
      socket.emit('error', { message: 'Ошибка подписки на доску' })
    }
  })
  
  socket.on('board:unsubscribe', async (data: { boardId: number }) => {
    try {
      const { boardId } = data
      await socket.leave(`board:${boardId}`)
      console.log(`[Socket] 👤 User unsubscribed from board ${boardId}`)
      socket.emit('board:unsubscribed', { boardId, success: true })
    } catch (error) {
      console.error('[Socket] ❌ Error unsubscribing from board:', error)
    }
  })
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
  io.to(roomName).emit('board:task:created', { task })
  
  console.log(`[Socket] 🆕 Task ${task.id} created, broadcasted to room "${roomName}"`)
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
  io.to(roomName).emit('board:task:updated', { task })
  
  console.log(`[Socket] 🔄 Task ${task.id} updated, broadcasted to room "${roomName}"`)
}

/**
 * Broadcast события удаления задачи (из API)
 * @param io Экземпляр Socket.IO сервера
 * @param taskId ID удалённой задачи
 * @param boardId ID доски
 */
export function broadcastTaskDeleted(io: Server, taskId: number, boardId: number) {
  const roomName = `board:${boardId}`
  
  // ✅ Используем io.to() — отправляем ВСЕМ в комнате
  io.to(roomName).emit('board:task:deleted', { taskId })
  
  console.log(`[Socket] 🗑️ Task ${taskId} deleted, broadcasted to room "${roomName}"`)
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
      console.log(`[Socket] ✅ Saved order for ${tasks.length} tasks`)
    }
    
    // ✅ Отправляем всем в комнате
    io.to(roomName).emit('board:tasks:reordered', { status, tasks })
    console.log(`[Socket] 📡 Broadcasted reorder to room "${roomName}"`)
    
  } catch (error) {
    console.error('[Socket] ❌ Failed to broadcast reorder:', error)
  }
}

// ============================================
// ОБРАБОТЧИКИ ДЛЯ ПРЯМЫХ SOCKET-СОБЫТИЙ
// Используют socket.to() — исключают отправителя
// ============================================

/**
 * Обработчик создания задачи из socket-события
 * @param socket Сокет отправителя
 * @param io Экземпляр Socket.IO сервера
 * @param task Созданная задача
 * @param boardId ID доски
 */
export function handleSocketTaskCreated(
  socket: Socket,
  io: Server,
  task: Task,
  boardId: number
) {
  const roomName = `board:${boardId}`
  
  // ✅ Используем socket.to() — исключаем отправителя (он уже обновил UI)
  socket.to(roomName).emit('board:task:created', { task })
  
  console.log(`[Socket] 🆕 Task ${task.id} created via socket, broadcasted excluding sender`)
}

/**
 * Обработчик обновления задачи из socket-события
 */
export function handleSocketTaskUpdated(
  socket: Socket,
  io: Server,
  task: Task,
  boardId: number
) {
  const roomName = `board:${boardId}`
  socket.to(roomName).emit('board:task:updated', { task })
  console.log(`[Socket] 🔄 Task ${task.id} updated via socket`)
}

/**
 * Обработчик удаления задачи из socket-события
 */
export function handleSocketTaskDeleted(
  socket: Socket,
  io: Server,
  taskId: number,
  boardId: number
) {
  const roomName = `board:${boardId}`
  socket.to(roomName).emit('board:task:deleted', { taskId })
  console.log(`[Socket] 🗑️ Task ${taskId} deleted via socket`)
}

/**
 * Обработчик изменения порядка из socket-события
 */
export async function handleSocketTasksReorder(
  socket: Socket,
  io: Server,
  data: TaskReorderData
) {
  const { boardId, status, tasks } = data
  const roomName = `board:${boardId}`
  
  try {
    if (tasks.length > 0) {
      for (const { id, order } of tasks) {
        await db.update(boardsTasks).set({ order }).where(eq(boardsTasks.id, id))
      }
    }
    
    // ✅ Исключаем отправителя
    socket.to(roomName).emit('board:tasks:reordered', { status, tasks })
    console.log(`[Socket] 📋 Reorder via socket, broadcasted excluding sender`)
    
  } catch (error) {
    console.error('[Socket] ❌ Failed to handle socket reorder:', error)
  }
}

// ============================================
// РЕГИСТРАЦИЯ ОБРАБОТЧИКОВ
// ============================================

export function registerTaskHandlers(io: Server) {
  io.on('connection', (socket: Socket) => {
    socket.data = socket.data || {}
    
    handleBoardSubscription(socket, io)
    
    // ✅ Обработчики для прямых socket-событий (с исключением отправителя)
    socket.on('board:task:created', async ({ task, boardId }: { task: Task; boardId: number }) => {
      handleSocketTaskCreated(socket, io, task, boardId)
    })
    
    socket.on('board:task:updated', async ({ task, boardId }: { task: Task; boardId: number }) => {
      handleSocketTaskUpdated(socket, io, task, boardId)
    })
    
    socket.on('board:task:deleted', async ({ taskId, boardId }: { taskId: number; boardId: number }) => {
      handleSocketTaskDeleted(socket, io, taskId, boardId)
    })
    
    socket.on('board:tasks:reorder', async ( data: TaskReorderData) => {
      await handleSocketTasksReorder(socket, io, data)
    })
  })
  
  console.log('[Socket] ✅ Task handlers registered')
}
