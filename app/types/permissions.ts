// app/types/permissions.ts
/**
 * Типы для системы прав доступа (ACL)
 * 
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
} // 👈 ✅ Обязательно закройте интерфейс здесь!

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
// 📋 КАРТА ПРАВ ПО РОЛЯМ
// ============================================
export const ROLE_PERMISSIONS: Record<Role, Permissions> = {
  worker: {
    canViewDashboard: true,
    canViewObjects: true,
    canCreateObjects: false,
    canEditObjects: false,
    canDeleteObjects: false,
    canViewFinance: false,
    canEditFinance: false,
    canViewWorkers: false,
    canEditWorkers: false,
    canViewReports: false,
    canExportReports: false,
    canManageUsers: false,
    canDeleteRecords: false,
    canViewAllObjects: false,
    canAssignWorkers: false,
    canApproveWorks: false,
    canViewSalary: false,
    canEditSalary: false
  },
  master: {
    canViewDashboard: true,
    canViewObjects: true,
    canCreateObjects: false,
    canEditObjects: true,
    canDeleteObjects: false,
    canViewFinance: false,
    canEditFinance: false,
    canViewWorkers: true,
    canEditWorkers: false,
    canViewReports: true,
    canExportReports: false,
    canManageUsers: false,
    canDeleteRecords: false,
    canViewAllObjects: false,
    canAssignWorkers: false,
    canApproveWorks: true,
    canViewSalary: true,
    canEditSalary: false
  },
  foreman: {
    canViewDashboard: true,
    canViewObjects: true,
    canCreateObjects: true,
    canEditObjects: true,
    canDeleteObjects: false,
    canViewFinance: true,
    canEditFinance: false,
    canViewWorkers: true,
    canEditWorkers: true,
    canViewReports: true,
    canExportReports: true,
    canManageUsers: false,
    canDeleteRecords: false,
    canViewAllObjects: false,
    canAssignWorkers: true,
    canApproveWorks: true,
    canViewSalary: true,
    canEditSalary: false
  },
  manager: {
    canViewDashboard: true,
    canViewObjects: true,
    canCreateObjects: true,
    canEditObjects: true,
    canDeleteObjects: true,
    canViewFinance: true,
    canEditFinance: true,
    canViewWorkers: true,
    canEditWorkers: true,
    canViewReports: true,
    canExportReports: true,
    canManageUsers: false,
    canDeleteRecords: true,
    canViewAllObjects: true,
    canAssignWorkers: true,
    canApproveWorks: true,
    canViewSalary: true,
    canEditSalary: true
  },
  admin: {
    canViewDashboard: true,
    canViewObjects: true,
    canCreateObjects: true,
    canEditObjects: true,
    canDeleteObjects: true,
    canViewFinance: true,
    canEditFinance: true,
    canViewWorkers: true,
    canEditWorkers: true,
    canViewReports: true,
    canExportReports: true,
    canManageUsers: true,
    canDeleteRecords: true,
    canViewAllObjects: true,
    canAssignWorkers: true,
    canApproveWorks: true,
    canViewSalary: true,
    canEditSalary: true
  }
}

// ============================================
// ВСПОМОГАТЕЛЬНЫЕ ТИПЫ
// ============================================
export interface UserPermissionsResponse {
  role: Role
  permissions: Permissions
  level: number
}
