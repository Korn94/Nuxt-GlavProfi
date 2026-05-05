// app/types/permissions.ts
/**
 * Типы для системы прав доступа (ACL)
 * 
 * ⚠️ Этот файл импортируется и на клиенте, и на сервере.
 * При добавлении нового права — обновляйте ROLE_PERMISSIONS в server/utils/permissions.ts
 */

// ============================================
// РОЛИ
// ============================================
export type Role = 'worker' | 'master' | 'foreman' | 'manager' | 'admin'

// ============================================
// ПРАВА ДОСТУПА
// ============================================
export interface Permissions {
  // 📊 Дашборд
  canViewDashboard: boolean
  
  // 🏗️ Объекты
  canViewObjects: boolean
  canCreateObjects: boolean
  canEditObjects: boolean
  canDeleteObjects: boolean
  canViewAllObjects: boolean    // Видит все объекты, а не только свои
  
  // 💰 Финансы
  canViewFinance: boolean
  canEditFinance: boolean
  canViewSalary: boolean
  canEditSalary: boolean
  
  // 👥 Пользователи / рабочие
  canViewWorkers: boolean
  canEditWorkers: boolean
  canAssignWorkers: boolean    // Назначение рабочих на объекты
  canManageUsers: boolean      // Управление учётными записями
  
  // 📋 Работы и отчёты
  canViewReports: boolean
  canExportReports: boolean
  canApproveWorks: boolean     // Подтверждение выполненных работ
  
  // 🗑️ Удаление записей
  canDeleteRecords: boolean
}

// ============================================
// УРОВНИ РОЛЕЙ (для иерархических проверок)
// ============================================
/**
 * Чем выше число, тем больше прав.
 * Используется для проверок типа "роль не ниже менеджера".
 */
export const ROLE_LEVELS: Record<Role, number> = {
  worker: 1,
  master: 2,
  foreman: 3,
  manager: 4,
  admin: 5
} as const

// ============================================
// ВСПОМОГАТЕЛЬНЫЕ ТИПЫ
// ============================================
/**
 * Тип для ответа эндпоинта /api/permissions
 * Возвращает права текущей роли + уровень
 */
export interface UserPermissionsResponse {
  role: Role
  permissions: Permissions
  level: number
}
