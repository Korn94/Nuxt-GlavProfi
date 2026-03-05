// app/types/boards.ts
// ============================================
// ТИПЫ ДЛЯ ПАПОК ДОСОК
// ============================================
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

export interface CreateBoardFolderData {
  name: string
  description?: string
  category: 'objects' | 'general'
  order?: number
}

export interface UpdateBoardFolderData {
  name?: string
  description?: string
  category?: 'objects' | 'general'
  order?: number
}

// ============================================
// ТИПЫ ДЛЯ ДОСОК
// ============================================
export interface BoardObject {
  id: number
  name: string
  status: 'active' | 'waiting' | 'completed' | 'canceled'
  address?: string | null
}

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

export interface CreateBoardData {
  name: string
  description?: string
  type?: 'object' | 'general'
  objectId?: number
  folderId: number
  order?: number
}

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
export interface Tag {
  id: number
  name: string
  color: string
  createdAt?: string
}

// ============================================
// ТИПЫ ДЛЯ ПОДЗАДАЧ
// ============================================

/**
 * Подзадача для хранения в store (flat-структура)
 * ⛔ Не содержит вложенных subtasks - они строятся на клиенте
 */
export interface Subtask {
  id: number
  taskId: number
  parentId: number | null
  title: string
  description: string | null
  isCompleted: boolean
  completedAt: string | null
  order: number
  createdAt: string
  updatedAt: string
}

/**
 * Подзадача для отображения в UI (древовидная структура)
 * ✅ Содержит children для рекурсивного отображения
 */
export interface SubtaskTree extends Subtask {
  children: SubtaskTree[]
  depth?: number // Уровень вложенности (0-4, макс 5 уровней)
}

/**
 * Данные для создания подзадачи
 */
export interface CreateSubtaskData {
  title: string
  description?: string | null
  parentId?: number | null
  order?: number
}

/**
 * Данные для обновления подзадачи
 */
export interface UpdateSubtaskData {
  title?: string
  description?: string | null
  parentId?: number | null
  order?: number
  isCompleted?: boolean
}

/**
 * Статистика подзадач
 */
export interface SubtaskStats {
  total: number
  completed: number
  progress: number // 0-100
}

// ============================================
// SOCKET СОБЫТИЯ ДЛЯ ПОДЗАДАЧ
// ============================================

/**
 * Событие создания подзадачи
 */
export interface SubtaskCreatedEvent {
  subtask: Subtask
  boardId: number
}

/**
 * Событие обновления подзадачи
 */
export interface SubtaskUpdatedEvent {
  subtask: Subtask
  boardId: number
}

/**
 * Событие удаления подзадачи
 */
export interface SubtaskDeletedEvent {
  subtaskId: number
  taskId: number
  boardId: number
}

/**
 * Все socket события для подзадач
 */
export interface SubtaskSocketEvents {
  'board:subtask:created': SubtaskCreatedEvent
  'board:subtask:updated': SubtaskUpdatedEvent
  'board:subtask:deleted': SubtaskDeletedEvent
}

// ============================================
// ТИПЫ ДЛЯ КОММЕНТАРИЕВ
// ============================================
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
  // ⛔ subtasks больше не хранятся в Task - они в отдельном store
  subtasks?: SubtaskTree[] // Только для UI, не для хранения
  tags?: Tag[]
  attachments?: Attachment[]
  comments?: Comment[]
}

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

export interface SubtaskDragItem {
  type: typeof ItemTypes.SUBTASK
  subtaskId: number
  taskId: number
  parentId: number | null
}

export interface FolderDragItem {
  type: typeof ItemTypes.FOLDER
  folderId: number
  order: number
}

export interface CreateFolderForm {
  name: string
  description: string
  category: 'objects' | 'general'
  firstBoard: {
    name: string
    description: string
    type: 'object' | 'general'
    objectId: number | null
  }
}

// ============================================
// КОНСТАНТЫ ДЛЯ ПОДЗАДАЧ
// ============================================

/**
 * Максимальная глубина вложенности подзадач
 * 0 = корневой уровень, 4 = максимальный уровень (всего 5 уровней)
 */
export const MAX_SUBTASK_DEPTH = 4

/**
 * Статусы задач для фильтрации
 */
export const TASK_STATUSES = [
  'todo',
  'in_progress',
  'review',
  'done',
  'blocked',
  'cancelled'
] as const

/**
 * Приоритеты задач
 */
export const TASK_PRIORITIES = [
  'low',
  'medium',
  'high',
  'urgent'
] as const

/**
 * Типы досок
 */
export const BOARD_TYPES = [
  'object',
  'general'
] as const

/**
 * Категории папок
 */
export const FOLDER_CATEGORIES = [
  'objects',
  'general'
] as const
