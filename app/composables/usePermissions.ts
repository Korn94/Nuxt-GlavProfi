// app/composables/usePermissions.ts
/**
 * Composable для проверки прав доступа на клиенте
 * 
 * ⚠️ Использует типы из ~/types/permissions — не дублируйте их здесь!
 * Права загружаются из стора авторизации, синхронизация с сервером — через /api/permissions (опционально)
 * 
 * @example
 * // В компоненте:
 * const { can, hasRole, isAdmin } = usePermissions()
 * 
 * <button v-if="can('canEditObjects')">Редактировать</button>
 * <div v-if="hasRole('admin')">Только для админов</div>
 */

// app/composables/usePermissions.ts

import { computed } from 'vue'
import { useAuthStore } from '../../stores/auth'
import type { Role, Permissions } from '~/types/permissions'
import { ROLE_LEVELS } from '~/types/permissions'

export function usePermissions() {
  const authStore = useAuthStore()
  const isChecking = computed(() => authStore.isChecking)

  const role = computed(() => authStore.user?.role as Role | null)

  // ✅ Читаем права из реактивного состояния стора
  const permissions = computed((): Permissions => {
    return authStore.permissions || {
      // Дефолтные права для "гостя" / SSR-рендера
      canViewDashboard: false,
      canViewObjects: false,
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
    }
  })

  function can(permission: keyof Permissions): boolean {
    return permissions.value[permission] || false
  }

  function canAll(permissionList: Array<keyof Permissions>): boolean {
    return permissionList.every(p => can(p))
  }

  function canAny(permissionList: Array<keyof Permissions>): boolean {
    return permissionList.some(p => can(p))
  }

  function hasRoleLevel(requiredLevel: Role): boolean {
    const currentRole = role.value
    if (!currentRole || authStore.roleLevel === null) return false
    const requiredLevelValue = ROLE_LEVELS[requiredLevel]
    return authStore.roleLevel >= requiredLevelValue
  }

  function hasRole(checkRole: Role): boolean {
    return role.value === checkRole
  }

  const isAdmin = computed(() => hasRole('admin'))

  return {
    can,
    canAll,
    canAny,
    hasRoleLevel,
    hasRole,
    isAdmin,
    role,
    permissions,
    isChecking
  }
}
