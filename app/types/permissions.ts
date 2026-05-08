// app/types/permissions.ts
/**
 * Типы для системы прав доступа (ACL)
 * ⚠️ Этот файл импортируется и на клиенте, и на сервере.
 * При добавлении нового права — обновляйте только здесь.
 */

// ============================================
// РОЛИ
// ============================================
export type Role = 'worker' | 'master' | 'foreman' | 'manager' | 'admin'

// ============================================
// ПРАВА ДОСТУПА (интерфейс)
// ============================================
export interface Permissions {
  // 📊 Дашборд
  canViewDashboard: boolean
  // 🏗️ Объекты
  canViewObjects: boolean
  canCreateObjects: boolean
  canEditObjects: boolean
  canDeleteObjects: boolean
  canViewAllObjects: boolean
  // 💰 Финансы
  canViewFinance: boolean
  canEditFinance: boolean
  canViewSalary: boolean
  canEditSalary: boolean
  // 👥 Пользователи / рабочие
  canViewWorkers: boolean
  canEditWorkers: boolean
  canAssignWorkers: boolean
  canManageUsers: boolean
  // 📋 Работы и отчёты
  canViewReports: boolean
  canExportReports: boolean
  canApproveWorks: boolean
  // 🗑️ Удаление записей
  canDeleteRecords: boolean
}

// ============================================
// УРОВНИ РОЛЕЙ
// ============================================
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
export interface UserPermissionsResponse {
  role: Role
  permissions: Permissions
  level: number
}
// 👆 ROLE_PERMISSIONS больше не экспортируется отсюда!
