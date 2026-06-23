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
 *
 * Упрощённая система прав (без canView):
 * - Раздел виден в меню, если есть хотя бы одно действие (create/edit/delete/special)
 * - View-only страницы (dashboard, online, test) всегда видимы если есть в правах
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
   * Логика (упрощённая, без canView):
   * - view — страница есть в правах (видима автоматически)
   * - create/edit/delete/special — соответствующий флаг в правах
   *
   * ⚠️ canView упразднён — видимость определяется наличием в authStore.pages
   */
  function can(page: PageSlug, action: PageAction): boolean {
    const pagePerms = authStore.pages?.[page]
    
    // Если страницы нет в правах — она невидима, доступ запрещён
    if (!pagePerms) return false

    // Для просмотра — страница уже видима (есть в authStore.pages)
    if (action === 'view') {
      return true
    }

    // Для действий — проверяем соответствующий флаг
    switch (action) {
      case 'create': return pagePerms.canCreate
      case 'edit': return pagePerms.canEdit
      case 'delete': return pagePerms.canDelete
      case 'special': return pagePerms.canSpecial
      default: return false
    }
  }

  /**
   * Shortcut для проверки спец-операций (accept/pay/reorder/toggle-check)
   */
  function canSpecial(page: PageSlug): boolean {
    return can(page, 'special')
  }

  /**
   * Проверить, видима ли страница в меню навигации
   *
   * Логика: страница видима если она есть в authStore.pages
   * (getAllUserPermissions на сервере уже отфильтровал невидимые)
   */
  function isPageVisible(page: PageSlug): boolean {
    return page in (authStore.pages || {})
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
    isPageVisible,
    hasRoleLevel,
    hasRole,
    isReady
  }
}
