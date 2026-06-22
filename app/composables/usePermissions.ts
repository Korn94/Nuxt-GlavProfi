// app/composables/usePermissions.ts
/**
 * 🛡️ Composable для проверки прав доступа на клиенте
 *
 * Отвечает ТОЛЬКО за проверку прав (SRP).
 * Данные пользователя и список страниц — в useAuthStore.
 *
 * Импорты:
 *   import { usePermissions } from '~/composables/usePermissions'
 *   import { useAuthStore } from '~/stores/auth'
 */

import { computed } from 'vue'
import { useAuthStore } from 'stores/auth'

import {
  ROLE_LEVELS,
  type Role
} from 'shared/constants/roles'

import type {
  PageSlug,
  PageAction
} from 'shared/constants/permissions'

export function usePermissions() {
  const authStore = useAuthStore()

  // ============================================
  // ГОТОВНОСТЬ (флаг для v-if)
  // ============================================

  /**
   * Флаг: авторизация проверена, права загружены
   * Используется для предотвращения мигания контента при SSR/гидратации
   */
  const isReady = computed(() => !authStore.isChecking)

  // ============================================
  // ПРОВЕРКА ПРАВ НА СТРАНИЦЕ
  // ============================================

  /**
   * Проверить право пользователя на действие для страницы
   *
   * Логика:
   * - view — достаточно canView
   * - create/edit/delete/special — canView + соответствующий флаг
   */
  function can(page: PageSlug, action: PageAction): boolean {
    const pagePerms = authStore.pages?.[page]
    if (!pagePerms) return false

    switch (action) {
      case 'view':
        return pagePerms.canView
      case 'create':
        return pagePerms.canView && pagePerms.canCreate
      case 'edit':
        return pagePerms.canView && pagePerms.canEdit
      case 'delete':
        return pagePerms.canView && pagePerms.canDelete
      case 'special':
        return pagePerms.canView && pagePerms.canSpecial
      default:
        return false
    }
  }

  /**
   * Shortcut для проверки спец-операций (accept/pay/reorder/toggle-check)
   */
  function canSpecial(page: PageSlug): boolean {
    return can(page, 'special')
  }

  // ============================================
  // ПРОВЕРКА РОЛЕЙ
  // ============================================

  /**
   * Проверить что у пользователя роль не ниже требуемой
   *
   * hasRoleLevel('manager') — true для manager и admin
   */
  function hasRoleLevel(requiredRole: Role): boolean {
    const currentRole = authStore.user?.role as Role | undefined
    if (!currentRole || authStore.roleLevel === null) return false

    const requiredLevel = ROLE_LEVELS[requiredRole] ?? 0
    return authStore.roleLevel >= requiredLevel
  }

  /**
   * Проверить что у пользователя конкретная роль (точное совпадение)
   */
  function hasRole(checkRole: Role): boolean {
    return authStore.user?.role === checkRole
  }

  // ============================================
  // RETURN
  // ============================================

  return {
    can,
    canSpecial,
    hasRoleLevel,
    hasRole,
    isReady
  }
}
