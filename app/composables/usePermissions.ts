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

import { computed } from 'vue'
import { useAuthStore } from '../../stores/auth'
import type { Role, Permissions } from '~/types/permissions'
import { ROLE_LEVELS } from '~/types/permissions'

// ✅ Импортируем конфигурацию прав с сервера (единый источник истины)
// В будущем можно заменить на динамическую загрузку через API
import { ROLE_PERMISSIONS } from '../../server/utils/permissions'

export function usePermissions() {
  const authStore = useAuthStore()
  const isChecking = computed(() => authStore.isChecking)

  // ============================================
  // ВЫЧИСЛЯЕМЫЕ ДАННЫЕ
  // ============================================

  /**
   * Текущая роль пользователя (реактивная)
   */
  const role = computed(() => authStore.user?.role as Role | null)

  /**
   * Права текущей роли (реактивный объект Permissions)
   * ✅ Теперь используется напрямую вместо динамических геттеров
   */
  const permissions = computed((): Permissions => {
    // 👇 Всегда возвращаем валидный объект, даже если роль ещё не загружена
    const currentRole = role.value
    return currentRole 
      ? (ROLE_PERMISSIONS[currentRole] || ROLE_PERMISSIONS.worker)
      : ROLE_PERMISSIONS.worker // 👈 Дефолт для SSR и начального рендера
  })

  // ============================================
  // МЕТОДЫ ПРОВЕРКИ ПРАВ
  // ============================================

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
    if (!currentRole) return false
    
    const userLevel = ROLE_LEVELS[currentRole] || 0
    return userLevel >= ROLE_LEVELS[requiredLevel]
  }

  function hasRole(checkRole: Role): boolean {
    return role.value === checkRole
  }

  const isAdmin = computed(() => hasRole('admin'))

  // ============================================
  // ПУБЛИЧНЫЙ ИНТЕРФЕЙС
  // ============================================
  return {
    can,
    canAll,
    canAny,
    hasRoleLevel,
    hasRole,
    isAdmin,
    role,
    permissions, // ✅ Реактивный объект прав
    isChecking
  }
}
