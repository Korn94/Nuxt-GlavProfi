// app/types/dnd.ts
export const ItemTypes = {
  TASK: 'task'
} as const

export interface TaskDragItem {
  type: typeof ItemTypes.TASK
  taskId: number
  boardId: number
  status: string
}
