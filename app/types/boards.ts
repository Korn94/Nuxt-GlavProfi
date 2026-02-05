// app/types/boards.ts
// Тип объекта (для привязки к доске)
export interface BoardObject {
  id: number
  name: string
  status: 'active' | 'waiting' | 'completed' | 'canceled'
  address?: string | null
}

// Тип доски
export interface Board {
  id: number
  name: string
  description?: string | null
  type: 'object' | 'general'
  objectId?: number | null
  createdBy: number
  createdAt: string
  updatedAt: string
  object?: BoardObject | null
}

// Тип для создания доски
export interface CreateBoardData {
  name: string
  description?: string
  type?: 'object' | 'general'
  objectId?: number
}

// Тип для обновления доски
export interface UpdateBoardData {
  name?: string
  description?: string
  type?: 'object' | 'general'
  objectId?: number | null
}

// Тип тега
export interface Tag {
  id: number
  name: string
  color: string
  createdAt?: string
}

// Тип подзадачи (рекурсивный)
export interface Subtask {
  id: number
  taskId: number
  parentId?: number | null
  title: string
  description?: string | null
  isCompleted: boolean
  completedAt?: string | null
  order: number
  createdAt: string
  updatedAt: string
  subtasks?: Subtask[]
}

// Тип комментария (рекурсивный)
export interface Comment {
  id: number
  taskId: number
  userId: number
  comment: string
  parentId?: number | null
  createdAt: string
  updatedAt: string
  user?: {
    id: number
    name: string
    login: string
  } | null
  replies?: Comment[]
}

// Тип вложения
export interface Attachment {
  id: number
  taskId: number
  fileUrl: string
  fileType: 'image' | 'document' | 'video' | 'other'
  fileName: string
  fileSize: number
  uploadedBy: number
  createdAt: string
  uploadedByUser?: {
    id: number
    name: string
    login: string
  } | null
}

// Тип задачи
export interface Task {
  id: number
  boardId: number
  title: string
  description?: string | null
  status: 'todo' | 'in_progress' | 'review' | 'done' | 'blocked' | 'cancelled'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  assignedTo?: number | null
  dueDate?: string | null
  completedDate?: string | null
  order: number
  createdBy: number
  createdAt: string
  updatedAt: string
  subtasks?: Subtask[]
  tags?: Tag[]
  attachments?: Attachment[]
  comments?: Comment[]
}

// Тип для создания задачи
export interface CreateTaskData {
  title: string
  description?: string
  status?: 'todo' | 'in_progress' | 'review' | 'done' | 'blocked' | 'cancelled'
  priority?: 'low' | 'medium' | 'high' | 'urgent'
  assignedTo?: number | null
  dueDate?: string | null
  order?: number
  tags?: number[]
}

// Тип для обновления задачи
export interface UpdateTaskData {
  title?: string
  description?: string
  status?: 'todo' | 'in_progress' | 'review' | 'done' | 'blocked' | 'cancelled'
  priority?: 'low' | 'medium' | 'high' | 'urgent'
  assignedTo?: number | null
  dueDate?: string | null
  order?: number
  tags?: number[]
}
