// server/socket/handlers/tasks.ts
import { Server, Socket } from 'socket.io'
import { eq } from 'drizzle-orm'
import { db } from '../../db'
import { boards, boardsTasks } from '../../db/schema'
import type { Task } from '~/types/boards'

/**
* Подписка на события доски
*/
export function handleBoardSubscription(socket: Socket, io: Server) {
  // Подписка на доску
  socket.on('subscribe:board', async (data: { boardId: number }) => {
    try {
      const { boardId } = data
      
      // ✅ Проверяем доступ к доске
      const board = await db.query.boards.findFirst({
        where: eq(boards.id, boardId)
      })
      
      if (!board) {
        socket.emit('error', { message: 'Доска не найдена' })
        return
      }
      
      // ✅ Добавляем сокет в комнату доски
      await socket.join(`board:${boardId}`)
      
      console.log(`[Socket] User ${socket.data?.userId || 'unknown'} subscribed to board ${boardId}`)
      console.log(`[Socket] Room members: ${io.sockets.adapter.rooms.get(`board:${boardId}`)?.size || 0}`)
      
      socket.emit('board:subscribed', { boardId, success: true })
      
    } catch (error) {
      console.error('[Socket] Error subscribing to board:', error)
      socket.emit('error', { message: 'Ошибка подписки на доску' })
    }
  })
  
  // Отписка от доски
  socket.on('unsubscribe:board', async (data: { boardId: number }) => {
    try {
      const { boardId } = data
      await socket.leave(`board:${boardId}`)
      console.log(`[Socket] User ${socket.data?.userId || 'unknown'} unsubscribed from board ${boardId}`)
      socket.emit('board:unsubscribed', { boardId, success: true })
    } catch (error) {
      console.error('[Socket] Error unsubscribing from board:', error)
    }
  })
}

/**
* Обработчик создания задачи
*/
export function handleTaskCreate(io: Server, taskId: number, task: Task, boardId: number) {
  const roomName = `board:${boardId}`
  const room = io.sockets.adapter.rooms.get(roomName)
  
  console.log(`[Socket] 📡 Broadcasting to room "${roomName}"`)
  console.log(`[Socket] 📡 Room members: ${room?.size || 0}`)
  
  io.to(roomName).emit(`board:${boardId}:task:created`, { task })
  
  console.log(`[Socket] ✅ Task ${taskId} created on board ${boardId}`)
}

/**
* Обработчик обновления задачи
*/
export function handleTaskUpdate(io: Server, taskId: number, task: Task, boardId: number) {
  const roomName = `board:${boardId}`
  const room = io.sockets.adapter.rooms.get(roomName)
  
  console.log(`[Socket] 📡 Broadcasting to room "${roomName}"`)
  console.log(`[Socket] 📡 Room members: ${room?.size || 0}`)
  
  io.to(roomName).emit(`board:${boardId}:task:updated`, { taskId, task })
  
  console.log(`[Socket] ✅ Task ${taskId} updated on board ${boardId}`)
}

/**
* Обработчик удаления задачи
*/
export function handleTaskDelete(io: Server, taskId: number, boardId: number) {
  const roomName = `board:${boardId}`
  const room = io.sockets.adapter.rooms.get(roomName)
  
  console.log(`[Socket] 📡 Broadcasting to room "${roomName}"`)
  console.log(`[Socket] 📡 Room members: ${room?.size || 0}`)
  
  io.to(roomName).emit(`board:${boardId}:task:deleted`, { taskId })
  
  console.log(`[Socket] ✅ Task ${taskId} deleted on board ${boardId}`)
}

/**
* Регистрация всех обработчиков задач
*/
export function registerTaskHandlers(io: Server) {
  io.on('connection', (socket: Socket) => {
    // ✅ Добавляем свойство для удобства
    socket.data = socket.data || {}
    handleBoardSubscription(socket, io)
  })
  
  console.log('[Socket] ✅ Task handlers registered')
}
