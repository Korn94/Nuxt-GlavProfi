// app/composables/usePermissions.ts
/**
 * Composable для проверки прав доступа на клиенте
 *
 * 🆕 Новая система (без legacy):
 * - Права определяются на уровне страниц (pages) из authStore.pages
 * - Каждое действие: canView, canCreate, canEdit, canDelete, canSpecial
 * - Типобезопасные проверки через PageSlug и PageAction
 *
 * @example
 * // В компоненте:
 * const { can, canSpecial, canView, hasRole, isReady } = usePermissions()
 *
 * <template>
 *   <!-- Показываем лоадер, пока идёт проверка авторизации -->
 *   <div v-if="!isReady" class="skeleton">Проверка доступа...</div>
 *
 *   <!-- Рендерим контент только когда всё готово -->
 *   <template v-else>
 *     <nav v-if="canView('dashboard')">
 *       <NuxtLink to="/cabinet">Дашборд</NuxtLink>
 *     </nav>
 *
 *     <button v-if="can('objects', 'create')">Создать объект</button>
 *     <button v-if="can('objects', 'edit')">Редактировать</button>
 *     <button v-if="can('objects', 'delete')">Удалить</button>
 *
 *     <button v-if="canSpecial('works')">Принять работу</button>
 *     <button v-if="canSpecial('materials')">Переключить чек</button>
 *
 *     <div v-if="hasRole('admin')">Админ-панель</div>
 *     <div v-if="hasRoleLevel('manager')">Для менеджеров и выше</div>
 *   </template>
 * </template>
 */
import { computed } from 'vue'
import { useAuthStore } from 'stores/auth'
import type { Role, PageSlug, PageAction, PagePermissions } from '~/types/permissions'
import { ROLE_LEVELS } from '~/types/permissions'

export function usePermissions() {
  const authStore = useAuthStore()

  // ============================================
  // РЕАКТИВНЫЕ СОСТОЯНИЯ
  // ============================================

  /**
   * ✅ Флаг: проверка авторизации завершена (пользователь вошёл или это гость)
   * Используйте для предотвращения мигания контента при SSR/гидратации
   */
  const isReady = computed(() => !authStore.isChecking)

  /**
   * ✅ Флаг: пользователь успешно аутентифицирован
   */
  const isAuthenticated = computed(() => authStore.isAuthenticated)

  /**
   * ✅ Текущая роль пользователя
   */
  const role = computed<Role | null>(() => authStore.user?.role as Role | null)

  /**
   * ✅ Все права пользователя на уровне страниц
   * Структура: Record<PageSlug, PagePermissions>
   */
  const pages = computed(() => authStore.pages || {} as Record<PageSlug, PagePermissions>)

  // ============================================
  // ОСНОВНЫЕ ФУНКЦИИ ПРОВЕРКИ ПРАВ
  // ============================================

  /**
   * Проверить право пользователя на действие для страницы
   *
   * @param page — slug страницы ('objects', 'works', 'finance', etc.)
   * @param action — действие ('view', 'create', 'edit', 'delete', 'special')
   * @returns boolean — есть ли право
   *
   * @example
   * can('objects', 'edit')      // canView && canEdit
   * can('works', 'view')        // canView
   * can('materials', 'special') // canView && canSpecial (toggle-check)
   */
  function can(page: PageSlug, action: PageAction): boolean {
    const pagePerms = pages.value[page]
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
   * Проверить право на специфичную операцию (shortcut для canSpecial)
   *
   * Специфичные операции под hasSpecial:
   * - works: accept, reject, pay-work, create-and-pay
   * - materials: toggle-check
   * - contractors: recalculate-balance
   * - price: reorder
   *
   * @example
   * canSpecial('works')       // Принять/оплатить работу
   * canSpecial('materials')   // Переключить чек
   * canSpecial('price')       // Пересортировка
   * canSpecial('contractors') // Пересчёт баланса
   */
  function canSpecial(page: PageSlug): boolean {
    return can(page, 'special')
  }

  /**
   * Проверить что пользователь имеет право просмотра страницы
   * (используется для показа/скрытия разделов в меню навигации)
   *
   * @example
   * canView('dashboard')  // Показывать ли раздел "Дашборд"
   * canView('settings')   // Показывать ли раздел "Настройки"
   */
  function canView(page: PageSlug): boolean {
    return can(page, 'view')
  }

  /**
   * Проверить что пользователь имеет доступ ко ВСЕМ указанным действиям
   *
   * @example
   * canAll([
   *   { page: 'objects', action: 'edit' },
   *   { page: 'comings', action: 'view' }
   * ])
   */
  function canAll(checks: Array<{ page: PageSlug; action: PageAction }>): boolean {
    return checks.every(({ page, action }) => can(page, action))
  }

  /**
   * Проверить что пользователь имеет доступ к ХОТЯ БЫ ОДНОМУ из указанных действий
   *
   * @example
   * canAny([
   *   { page: 'objects', action: 'edit' },
   *   { page: 'objects', action: 'delete' }
   * ])
   */
  function canAny(checks: Array<{ page: PageSlug; action: PageAction }>): boolean {
    return checks.some(({ page, action }) => can(page, action))
  }

  // ============================================
  // ПРОВЕРКИ РОЛЕЙ
  // ============================================

  /**
   * Проверить что у пользователя роль не ниже требуемой
   *
   * @example
   * hasRoleLevel('manager') // true для manager и admin
   * hasRoleLevel('admin')   // true только для admin
   */
  function hasRoleLevel(requiredLevel: Role): boolean {
    const currentRole = role.value
    if (!currentRole || authStore.roleLevel === null) return false
    const requiredLevelValue = ROLE_LEVELS[requiredLevel]
    return authStore.roleLevel >= requiredLevelValue
  }

  /**
   * Проверить что у пользователя конкретная роль
   *
   * @example
   * hasRole('admin')    // true только для admin
   * hasRole('foreman')  // true только для foreman
   */
  function hasRole(checkRole: Role): boolean {
    return role.value === checkRole
  }

  /**
   * Computed: является ли пользователь администратором
   */
  const isAdmin = computed(() => hasRole('admin'))

  // ============================================
  // ХЕЛПЕРЫ ДЛЯ ТИПИЧНЫХ ОПЕРАЦИЙ
  // ============================================

  /**
   * Получить права для конкретной страницы
   * (используется когда нужно проверить несколько действий сразу)
   *
   * @example
   * const objectsPerms = getPagePermissions('objects')
   * if (objectsPerms?.canEdit && objectsPerms?.canDelete) { ... }
   */
  function getPagePermissions(page: PageSlug): PagePermissions | null {
    return pages.value[page] || null
  }

  /**
   * Получить список страниц, доступных для просмотра
   * (используется для построения меню навигации)
   *
   * @example
   * const visiblePages = getVisiblePages()
   * // ['dashboard', 'objects', 'works', ...]
   */
  function getVisiblePages(): PageSlug[] {
    return (Object.keys(pages.value) as PageSlug[]).filter(
      page => pages.value[page]?.canView
    )
  }

  // ============================================
  // ВОЗВРАТ COMPOSABLE
  // ============================================

  return {
    // Основные функции проверки прав
    can,
    canSpecial,
    canView,
    canAll,
    canAny,

    // Проверки ролей
    hasRoleLevel,
    hasRole,
    isAdmin,

    // Хелперы
    getPagePermissions,
    getVisiblePages,

    // Реактивные данные
    role,
    pages,
    isChecking: authStore.isChecking,
    isReady,
    isAuthenticated
  }
}
