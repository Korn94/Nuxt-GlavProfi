// utils/subtasks.ts
/**
 * Утилиты для работы с подзадачами
 * 
 * Содержит вспомогательные функции для:
 * - Расчёта глубины вложенности
 * - Проверки циклических зависимостей
 * - Подсчёта статистики (всего, завершено, прогресс)
 * - Валидации операций с подзадачами
 * - Построения дерева из flat-списка
 */

import type { Subtask, SubtaskTree, SubtaskStats } from '~/types/boards'
import { MAX_SUBTASK_DEPTH } from '~/types/boards'

// ============================================
// КОНСТАНТЫ
// ============================================

/**
 * Максимальная глубина вложенности подзадач
 * 0 = корневой уровень, 4 = максимальный уровень (всего 5 уровней)
 * Экспортируется из типов для удобства импорта
 */
export { MAX_SUBTASK_DEPTH }

// ============================================
// ФУНКЦИИ ДЛЯ РАСЧЁТА ГЛУБИНЫ
// ============================================

/**
 * Рассчитать глубину подзадачи в дереве
 * @param subtaskId - ID подзадачи
 * @param allSubtasks - Flat-массив всех подзадач
 * @returns Глубина (0 для корневых, 1-4 для вложенных)
 */
export function calculateSubtaskDepth(
  subtaskId: number,
  allSubtasks: Subtask[]
): number {
  let depth = 0
  let currentParentId: number | null = null
  
  // Находим подзадачу
  const subtask = allSubtasks.find(s => s.id === subtaskId)
  if (!subtask) return 0
  
  currentParentId = subtask.parentId ?? null
  
  // Поднимаемся по цепочке родителей
  while (currentParentId !== null) {
    const parent = allSubtasks.find(s => s.id === currentParentId)
    if (!parent) break
    
    depth++
    currentParentId = parent.parentId ?? null
  }
  
  return depth
}

/**
 * Проверить, можно ли добавить дочернюю подзадачу
 * @param parentId - ID родительской подзадачи (null для корневых)
 * @param allSubtasks - Flat-массив всех подзадач
 * @returns true если можно добавить
 */
export function canAddChildSubtask(
  parentId: number | null,
  allSubtasks: Subtask[]
): boolean {
  if (parentId === null) return true
  
  const depth = calculateSubtaskDepth(parentId, allSubtasks)
  return depth < MAX_SUBTASK_DEPTH
}

/**
 * Получить максимальную доступную глубину для новой подзадачи
 * @param parentId - ID родительской подзадачи
 * @param allSubtasks - Flat-массив всех подзадач
 * @returns Доступная глубина (0-4)
 */
export function getAvailableDepth(
  parentId: number | null,
  allSubtasks: Subtask[]
): number {
  if (parentId === null) return 0
  
  const currentDepth = calculateSubtaskDepth(parentId, allSubtasks)
  return Math.min(currentDepth + 1, MAX_SUBTASK_DEPTH)
}

// ============================================
// ФУНКЦИИ ДЛЯ ПРОВЕРКИ ЦИКЛИЧЕСКИХ ЗАВИСИМОСТЕЙ
// ============================================

/**
 * Проверить наличие циклической зависимости
 * @param subtaskId - ID подзадачи которую перемещаем
 * @param potentialParentId - ID потенциального родителя
 * @param allSubtasks - Flat-массив всех подзадач
 * @returns true если обнаружена циклическая зависимость
 */
export function hasCircularDependency(
  subtaskId: number,
  potentialParentId: number,
  allSubtasks: Subtask[]
): boolean {
  // Нельзя сделать подзадачу родителем самой себя
  if (subtaskId === potentialParentId) {
    return true
  }
  
  // Рекурсивно проверяем, не является ли potentialParentId потомком subtaskId
  const checkDescendants = (currentId: number): boolean => {
    const children = allSubtasks.filter(s => s.parentId === currentId)
    
    for (const child of children) {
      if (child.id === potentialParentId) {
        return true // Цикл обнаружен
      }
      
      if (checkDescendants(child.id)) {
        return true
      }
    }
    
    return false
  }
  
  return checkDescendants(subtaskId)
}

/**
 * Проверить валидность смены родителя
 * @param subtaskId - ID подзадачи
 * @param newParentId - Новый ID родителя (null для корневых)
 * @param allSubtasks - Flat-массив всех подзадач
 * @returns Объект с результатом проверки
 */
export function validateParentChange(
  subtaskId: number,
  newParentId: number | null,
  allSubtasks: Subtask[]
): {
  valid: boolean
  error?: string
  depth?: number
} {
  // Проверка на самого себя
  if (newParentId !== null && subtaskId === newParentId) {
    return {
      valid: false,
      error: 'Нельзя сделать подзадачу родителем самой себя'
    }
  }
  
  // Проверка на циклическую зависимость
  if (newParentId !== null && hasCircularDependency(subtaskId, newParentId, allSubtasks)) {
    return {
      valid: false,
      error: 'Обнаружена циклическая зависимость: нельзя сделать подзадачу дочерней своего потомка'
    }
  }
  
  // Проверка максимальной глубины
  if (newParentId !== null) {
    const depth = calculateSubtaskDepth(newParentId, allSubtasks)
    if (depth >= MAX_SUBTASK_DEPTH) {
      return {
        valid: false,
        error: `Максимальная глубина вложенности (${MAX_SUBTASK_DEPTH + 1} уровней) достигнута`,
        depth
      }
    }
    
    return {
      valid: true,
      depth: depth + 1
    }
  }
  
  return {
    valid: true,
    depth: 0
  }
}

// ============================================
// ФУНКЦИИ ДЛЯ ПОДСЧЁТА СТАТИСТИКИ
// ============================================

/**
 * Подсчитать общее количество подзадач (рекурсивно)
 * @param subtasks - Массив подзадач (может быть деревом)
 * @returns Общее количество
 */
export function countAllSubtasks(subtasks: SubtaskTree[] | Subtask[]): number {
  let count = 0
  
  for (const subtask of subtasks) {
    count++
    
    // ✅ Тип-гард: проверяем наличие children и что это массив
    if (hasChildren(subtask)) {
      count += countAllSubtasks(subtask.children)
    }
    // ✅ Альтернатива: проверяем subtasks (для flat-списка с вложенностью)
    else if (hasSubtasksArray(subtask)) {
      count += countAllSubtasks(subtask.subtasks)
    }
  }
  
  return count
}

/**
 * Подсчитать количество завершённых подзадач (рекурсивно)
 * @param subtasks - Массив подзадач (может быть деревом)
 * @returns Количество завершённых
 */
export function countCompletedSubtasks(subtasks: SubtaskTree[] | Subtask[]): number {
  let count = 0
  
  for (const subtask of subtasks) {
    if (subtask.isCompleted) {
      count++
    }
    
    // ✅ Тип-гард для children
    if (hasChildren(subtask)) {
      count += countCompletedSubtasks(subtask.children)
    }
    // ✅ Тип-гард для subtasks
    else if (hasSubtasksArray(subtask)) {
      count += countCompletedSubtasks(subtask.subtasks)
    }
  }
  
  return count
}

/**
 * Получить статистику подзадач задачи
 * @param subtasks - Массив подзадач (может быть деревом)
 * @param countAllLevels - Считать ли все уровни вложенности (по умолчанию true)
 * @returns Объект со статистикой
 */
export function getSubtaskStats(
  subtasks: SubtaskTree[] | Subtask[],
  countAllLevels: boolean = true
): SubtaskStats {
  const total = countAllLevels ? countAllSubtasks(subtasks) : subtasks.length
  const completed = countAllLevels ? countCompletedSubtasks(subtasks) : subtasks.filter(s => s.isCompleted).length
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0
  
  return {
    total,
    completed,
    progress
  }
}

/**
 * Получить статистику только по первому уровню
 * @param subtasks - Массив подзадач первого уровня
 * @returns Объект со статистикой
 */
export function getFirstLevelStats(subtasks: Subtask[]): SubtaskStats {
  const total = subtasks.length
  const completed = subtasks.filter(s => s.isCompleted).length
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0
  
  return {
    total,
    completed,
    progress
  }
}

// ============================================
// ✅ ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ-ГАРДЫ ДЛЯ ТИПИЗАЦИИ
// ============================================

/**
 * Проверить, является ли подзадача деревом с children
 */
function hasChildren(subtask: SubtaskTree | Subtask): subtask is SubtaskTree {
  return 'children' in subtask && 
         Array.isArray((subtask as SubtaskTree).children) && 
         (subtask as SubtaskTree).children!.length > 0
}

/**
 * Проверить, имеет ли подзадача массив subtasks (для flat-списка)
 */
function hasSubtasksArray(subtask: SubtaskTree | Subtask): subtask is Subtask & { subtasks: Subtask[] } {
  return 'subtasks' in subtask && 
         Array.isArray((subtask as any).subtasks) && 
         (subtask as any).subtasks!.length > 0
}

// ============================================
// ФУНКЦИИ ДЛЯ ПОСТРОЕНИЯ ДЕРЕВА
// ============================================

/**
 * Построить дерево подзадач из flat-списка
 * @param allSubtasks - Flat-массив всех подзадач задачи
 * @returns Древовидная структура
 */
export function buildSubtaskTree(allSubtasks: Subtask[]): SubtaskTree[] {
  // Корневые подзадачи (без родителя)
  const roots = allSubtasks.filter(s => s.parentId === null)
  
  /**
   * Рекурсивное построение детей
   */
  const buildChildren = (parentId: number, depth: number = 0): SubtaskTree[] => {
    // Проверка максимальной глубины
    if (depth > MAX_SUBTASK_DEPTH) {
      console.warn(
        `[buildSubtaskTree] Максимальная глубина (${MAX_SUBTASK_DEPTH}) достигнута для родителя ${parentId}`
      )
      return []
    }
    
    const children = allSubtasks
      .filter(s => s.parentId === parentId)
      .sort((a, b) => a.order - b.order)
    
    return children.map(child => ({
      ...child,
      depth: depth + 1,
      children: buildChildren(child.id, depth + 1)
    }))
  }
  
  // Строим дерево с корневых элементов
  return roots
    .sort((a, b) => a.order - b.order)
    .map(root => ({
      ...root,
      depth: 0,
      children: buildChildren(root.id, 0)
    }))
}

/**
 * Получить все дочерние подзадачи (рекурсивно)
 * @param parentId - ID родительской подзадачи
 * @param allSubtasks - Flat-массив всех подзадач
 * @param includeParent - Включать ли самого родителя (по умолчанию false)
 * @returns Массив всех дочерних подзадач (flat)
 */
export function getAllChildSubtasks(
  parentId: number,
  allSubtasks: Subtask[],
  includeParent: boolean = false
): Subtask[] {
  const result: Subtask[] = includeParent ? 
    [...allSubtasks.filter(s => s.id === parentId)] : []
  
  const collectChildren = (currentParentId: number) => {
    const children = allSubtasks.filter(s => s.parentId === currentParentId)
    
    for (const child of children) {
      result.push(child)
      collectChildren(child.id)
    }
  }
  
  collectChildren(parentId)
  
  return result
}

/**
 * Получить все ID дочерних подзадач (рекурсивно)
 * @param parentId - ID родительской подзадачи
 * @param allSubtasks - Flat-массив всех подзадач
 * @param includeParent - Включать ли ID самого родителя (по умолчанию false)
 * @returns Массив всех ID дочерних подзадач
 */
export function getAllChildSubtaskIds(
  parentId: number,
  allSubtasks: Subtask[],
  includeParent: boolean = false
): number[] {
  const result: number[] = includeParent ? [parentId] : []
  
  const collectIds = (currentParentId: number) => {
    const children = allSubtasks.filter(s => s.parentId === currentParentId)
    
    for (const child of children) {
      result.push(child.id)
      collectIds(child.id)
    }
  }
  
  collectIds(parentId)
  
  return result
}

// ============================================
// ФУНКЦИИ ДЛЯ ВАЛИДАЦИИ ДАННЫХ
// ============================================

/**
 * Валидировать данные для создания подзадачи
 * @param data - Данные для создания
 * @param allSubtasks - Flat-массив всех подзадач (для проверки глубины)
 * @returns Объект с результатом валидации
 */
export function validateCreateSubtaskData(
  data: {
    title: string
    description?: string | null
    parentId?: number | null
    order?: number
  },
  allSubtasks: Subtask[]
): {
  valid: boolean
  errors: string[]
} {
  const errors: string[] = []
  
  // Проверка названия
  if (!data.title || data.title.trim().length === 0) {
    errors.push('Название подзадачи обязательно')
  } else if (data.title.trim().length > 255) {
    errors.push('Название подзадачи не может превышать 255 символов')
  }
  
  // Проверка описания
  if (data.description !== undefined && data.description !== null) {
    if (data.description.length > 65535) {
      errors.push('Описание подзадачи слишком длинное')
    }
  }
  
  // Проверка родителя
  if (data.parentId !== undefined && data.parentId !== null) {
    const parentValidation = validateParentChange(
      Date.now(), // Временный ID для новой подзадачи
      data.parentId,
      allSubtasks
    )
    
    if (!parentValidation.valid && parentValidation.error) {
      errors.push(parentValidation.error)
    }
  }
  
  // Проверка порядка
  if (data.order !== undefined && data.order !== null) {
    if (data.order < 0) {
      errors.push('Порядок не может быть отрицательным')
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  }
}

/**
 * Валидировать данные для обновления подзадачи
 * @param data - Данные для обновления
 * @param currentSubtask - Текущая подзадача
 * @param allSubtasks - Flat-массив всех подзадач
 * @returns Объект с результатом валидации
 */
export function validateUpdateSubtaskData(
  data: Partial<Subtask>,
  currentSubtask: Subtask,
  allSubtasks: Subtask[]
): {
  valid: boolean
  errors: string[]
} {
  const errors: string[] = []
  
  // Проверка названия
  if (data.title !== undefined) {
    if (data.title.trim().length === 0) {
      errors.push('Название подзадачи не может быть пустым')
    } else if (data.title.trim().length > 255) {
      errors.push('Название подзадачи не может превышать 255 символов')
    }
  }
  
  // Проверка описания
  if (data.description !== undefined && data.description !== null) {
    if (data.description.length > 65535) {
      errors.push('Описание подзадачи слишком длинное')
    }
  }
  
  // Проверка смены родителя
  if (data.parentId !== undefined) {
    const parentValidation = validateParentChange(
      currentSubtask.id,
      data.parentId ?? null,
      allSubtasks
    )
    
    if (!parentValidation.valid && parentValidation.error) {
      errors.push(parentValidation.error)
    }
  }
  
  // Проверка порядка
  if (data.order !== undefined && data.order !== null) {
    if (data.order < 0) {
      errors.push('Порядок не может быть отрицательным')
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  }
}

// ============================================
// ФУНКЦИИ ДЛЯ СОРТИРОВКИ
// ============================================

/**
 * Отсортировать подзадачи по порядку
 * @param subtasks - Массив подзадач
 * @returns Отсортированный массив
 */
export function sortSubtasksByOrder<T extends { order?: number | null }>(
  subtasks: T[]
): T[] {
  return [...subtasks].sort((a, b) => {
    const aOrder = a.order ?? 0
    const bOrder = b.order ?? 0
    return aOrder - bOrder
  })
}

/**
 * Отсортировать подзадачи по статусу и порядку
 * @param subtasks - Массив подзадач
 * @returns Отсортированный массив (сначала незавершённые, потом завершённые)
 */
export function sortSubtasksByStatusAndOrder<T extends { 
  isCompleted?: boolean
  order?: number | null 
}>(
  subtasks: T[]
): T[] {
  return [...subtasks].sort((a, b) => {
    // Сначала незавершённые
    if (a.isCompleted !== b.isCompleted) {
      return a.isCompleted ? 1 : -1
    }
    
    // Затем по порядку
    const aOrder = a.order ?? 0
    const bOrder = b.order ?? 0
    return aOrder - bOrder
  })
}

// ============================================
// ФУНКЦИИ ДЛЯ ПОИСКА
// ============================================

/**
 * Найти подзадачу по ID в flat-массиве
 * @param subtaskId - ID подзадачи
 * @param allSubtasks - Flat-массив всех подзадач
 * @returns Подзадача или null
 */
export function findSubtaskById(
  subtaskId: number,
  allSubtasks: Subtask[]
): Subtask | null {
  return allSubtasks.find(s => s.id === subtaskId) || null
}

/**
 * Найти подзадачу по ID в дереве
 * @param subtaskId - ID подзадачи
 * @param subtaskTree - Древовидная структура
 * @returns Подзадача или null
 */
export function findSubtaskInTree(
  subtaskId: number,
  subtaskTree: SubtaskTree[]
): SubtaskTree | null {
  for (const subtask of subtaskTree) {
    if (subtask.id === subtaskId) {
      return subtask
    }
    
    if (subtask.children && subtask.children.length > 0) {
      const found = findSubtaskInTree(subtaskId, subtask.children)
      if (found) return found
    }
  }
  
  return null
}

/**
 * Найти все подзадачи задачи
 * @param taskId - ID задачи
 * @param allSubtasks - Flat-массив всех подзадач
 * @returns Массив подзадач задачи
 */
export function findSubtasksByTaskId(
  taskId: number,
  allSubtasks: Subtask[]
): Subtask[] {
  return allSubtasks.filter(s => s.taskId === taskId)
}

// ============================================
// ФУНКЦИИ ДЛЯ ПРЕОБРАЗОВАНИЯ ДАННЫХ
// ============================================

/**
 * Конвертировать Subtask в SubtaskTree (для одиночной подзадачи)
 * @param subtask - Подзадача из flat-списка
 * @param allSubtasks - Flat-массив всех подзадач (для построения детей)
 * @param depth - Текущая глубина
 * @returns Подзадача в формате дерева
 */
export function convertToSubtaskTree(
  subtask: Subtask,
  allSubtasks: Subtask[],
  depth: number = 0
): SubtaskTree {
  return {
    ...subtask,
    depth,
    children: allSubtasks
      .filter(s => s.parentId === subtask.id)
      .sort((a, b) => a.order - b.order)
      .map(child => convertToSubtaskTree(child, allSubtasks, depth + 1))
  }
}

/**
 * Конвертировать SubtaskTree обратно в flat-массив
 * @param subtaskTree - Древовидная структура
 * @param parentId - ID родителя (для вложенных)
 * @returns Flat-массив подзадач
 */
export function flattenSubtaskTree(
  subtaskTree: SubtaskTree[],
  parentId: number | null = null
): Subtask[] {
  const result: Subtask[] = []
  
  for (const subtask of subtaskTree) {
    const { children, ...flatSubtask } = subtask
    result.push({
      ...flatSubtask,
      parentId: parentId ?? flatSubtask.parentId ?? null
    })
    
    if (children && children.length > 0) {
      result.push(...flattenSubtaskTree(children, subtask.id))
    }
  }
  
  return result
}

// ============================================
// ФУНКЦИИ ДЛЯ ОЧИСТКИ ДАННЫХ
// ============================================

/**
 * Очистить данные подзадачи перед отправкой на сервер
 * @param subtask - Подзадача
 * @returns Очищенные данные
 */
export function cleanSubtaskDataForApi(
  subtask: Partial<Subtask>
): Record<string, any> {
  const cleaned: Record<string, any> = {}
  
  // Копируем только определённые поля
  if (subtask.title !== undefined) {
    cleaned.title = subtask.title?.trim() ?? ''
  }
  
  if (subtask.description !== undefined) {
    cleaned.description = subtask.description?.trim() ?? null
  }
  
  if (subtask.parentId !== undefined) {
    cleaned.parentId = subtask.parentId ?? null
  }
  
  if (subtask.order !== undefined) {
    cleaned.order = subtask.order ?? 0
  }
  
  if (subtask.isCompleted !== undefined) {
    cleaned.isCompleted = subtask.isCompleted ?? false
  }
  
  return cleaned
}

/**
 * Очистить массив подзадач от временных полей
 * @param subtasks - Массив подзадач
 * @returns Очищенный массив
 */
export function cleanSubtasksArray(subtasks: Subtask[]): Subtask[] {
  return subtasks.map(subtask => ({
    id: subtask.id,
    taskId: subtask.taskId,
    parentId: subtask.parentId ?? null,
    title: subtask.title,
    description: subtask.description ?? null,
    isCompleted: subtask.isCompleted ?? false,
    completedAt: subtask.completedAt ?? null,
    order: subtask.order ?? 0,
    createdAt: subtask.createdAt,
    updatedAt: subtask.updatedAt
  }))
}
