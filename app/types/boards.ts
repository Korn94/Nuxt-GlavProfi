// app/types/boards.ts
// ============================================
// ТИПЫ ДЛЯ ПАПОК ДОСОК
// ============================================

// Тип папки досок
export interface BoardFolder {
  id: number
  name: string
  description?: string | null
  category: 'objects' | 'general'
  order: number
  createdBy: number
  createdAt: string
  updatedAt: string
}

// Тип для создания папки
export interface CreateBoardFolderData {
  name: string
  description?: string
  category: 'objects' | 'general'
  order?: number
}

// Тип для обновления папки
export interface UpdateBoardFolderData {
  name?: string
  description?: string
  category?: 'objects' | 'general'
  order?: number
}

// ============================================
// ТИПЫ ДЛЯ ДОСОК
// ============================================

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
  type?: 'object' | 'general'
  objectId?: number | null
  folderId?: number | null
  order?: number
  createdBy?: number
  createdAt?: string
  updatedAt?: string
  object?: {
    id: number
    name: string
    status: string
    address?: string
  } | null
}

// Тип для создания доски
export interface CreateBoardData {
  name: string
  description?: string
  type?: 'object' | 'general'
  objectId?: number
  folderId: number
  order?: number
}

// Тип для обновления доски
export interface UpdateBoardData {
  name?: string
  description?: string
  type?: 'object' | 'general'
  objectId?: number | null
  folderId?: number | null
  order?: number
}

// ============================================
// ТИПЫ ДЛЯ ТЕГОВ
// ============================================

// Тип тега
export interface Tag {
  id: number
  name: string
  color: string
  createdAt?: string
}

// ============================================
// ТИПЫ ДЛЯ ПОДЗАДАЧ
// ============================================

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

// ============================================
// ТИПЫ ДЛЯ КОММЕНТАРИЕВ
// ============================================

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

// ============================================
// ТИПЫ ДЛЯ ВЛОЖЕНИЙ
// ============================================

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

// ============================================
// ТИПЫ ДЛЯ ЗАДАЧ
// ============================================

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

// ============================================
// ТИПЫ ДЛЯ DND (Drag & Drop)
// ============================================

export const ItemTypes = {
  TASK: 'task',
  SUBTASK: 'subtask',
  FOLDER: 'folder'
} as const

export interface TaskDragItem {
  type: typeof ItemTypes.TASK
  taskId: number
  boardId: number
  status: string
}

export interface FolderDragItem {
  type: typeof ItemTypes.FOLDER
  folderId: number
  order: number
}
