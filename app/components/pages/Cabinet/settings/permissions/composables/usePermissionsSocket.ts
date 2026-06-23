// app/components/pages/cabinet/settings/permissions/composables/usePermissionsSocket.ts
/**
 * 🔌 Composable для подписки на real-time события системы прав
 *
 * Назначение:
 * - Подписка на сокет-события при монтировании компонента
 * - Автоматическая отписка при размонтировании
 * - Обработка событий: изменение прав, создание/обновление/удаление страниц
 *
 * Используется в:
 * - app/components/pages/cabinet/settings/permissions/index.vue (глобальные события)
 * - app/components/pages/cabinet/settings/permissions/Roles/index.vue
 * - app/components/pages/cabinet/settings/permissions/Users/index.vue
 * - app/components/pages/cabinet/settings/permissions/Pages/index.vue
 *
 * Архитектура:
 * - Работает ТОЛЬКО на клиенте (процесс.client)
 * - Динамически импортирует socketService для SSR-совместимости
 * - Поддерживает все типы событий системы прав
 *
 * ⚠️ Модель прав (без canView):
 * - permissions:changed — права роли/пользователя изменились
 * - permissions:page:created — новая страница добавлена
 * - permissions:page:updated — страница обновлена (имя, возможности)
 * - permissions:page:deleted — страница удалена/скрыта
 * - force:disconnect — принудительный разлогин (обрабатывается глобально в authStore)
 */
import { onMounted, onUnmounted } from 'vue'
import { useAuthStore } from 'stores/auth'

// ============================================
// ТИПЫ СОБЫТИЙ
// ============================================

/**
 * Данные события permissions:changed
 */
export interface PermissionsChangedData {
  /** Причина изменения (для логирования/UI) */
  reason?: string
  /** Список изменённых страниц (slug'и) */
  changedPages?: string[]
  /** Требуется ли перелогин (критические изменения) */
  requireRelogin?: boolean
  /** Timestamp изменения */
  timestamp?: string
}

/**
 * Данные события создания страницы
 */
export interface PageCreatedData {
  page: {
    slug: string
    name: string
    icon?: string | null
  }
  createdBy: {
    id: number
    name: string
  }
  timestamp: string
}

/**
 * Данные события обновления страницы
 */
export interface PageUpdatedData {
  page: {
    slug: string
    name: string
    icon?: string | null
    isActive: boolean
  }
  changedFields: string[]
  updatedBy: {
    id: number
    name: string
  }
  timestamp: string
}

/**
 * Данные события удаления страницы
 */
export interface PageDeletedData {
  slug: string
  name: string
  /** Режим удаления: 'soft' (скрыта) или 'hard' (полностью удалена) */
  mode: 'soft' | 'hard'
  affectedRoles: number
  affectedUsers: number
  deletedBy: {
    id: number
    name: string
  }
  timestamp: string
}

/**
 * Конфигурация composable'а
 * Все коллбэки опциональны — подписываемся только на нужные события
 */
export interface UsePermissionsSocketOptions {
  /**
   * Права изменились (роль/override).
   * Обычно вызывает перезагрузку данных в текущей вкладке.
   */
  onPermissionsChanged?: (data: PermissionsChangedData) => void | Promise<void>

  /**
   * Создана новая страница в справочнике
   */
  onPageCreated?: (data: PageCreatedData) => void | Promise<void>

  /**
   * Обновлена страница (имя, иконка, возможности, активность)
   */
  onPageUpdated?: (data: PageUpdatedData) => void | Promise<void>

  /**
   * Страница удалена или скрыта
   */
  onPageDeleted?: (data: PageDeletedData) => void | Promise<void>
}

// ============================================
// COMPOSABLE
// ============================================

/**
 * Подписка на сокет-события системы прав.
 *
 * @example
 * usePermissionsSocket({
 *   onPermissionsChanged: async (data) => {
 *     console.log('Права изменены:', data.reason)
 *     await reloadList()
 *   },
 *   onPageCreated: (data) => {
 *     showToast(`Создана страница: ${data.page.name}`)
 *   }
 * })
 *
 * @example
 * // Подписка только на конкретное событие
 * usePermissionsSocket({
 *   onPermissionsChanged: silentReload
 * })
 */
export function usePermissionsSocket(options: UsePermissionsSocketOptions = {}) {
  const authStore = useAuthStore()

  // Храним ссылки на обработчики для корректной отписки
  let socketService: any = null
  const handlers: Array<{ event: string; handler: (data: any) => void }> = []

  // ============================================
  // РЕГИСТРАЦИЯ ОБРАБОТЧИКОВ
  // ============================================

  /**
   * Зарегистрировать обработчик события
   */
  function registerHandler(event: string, handler: (data: any) => void) {
    if (!socketService) return
    socketService.on(event, handler)
    handlers.push({ event, handler })
  }

  // ============================================
  // ЖИЗНЕННЫЙ ЦИКЛ
  // ============================================

  onMounted(async () => {
    // Работает только на клиенте
    if (!process.client) return

    // Не подписываемся если пользователь не авторизован
    if (!authStore.isAuthenticated) return

    try {
      // Динамический импорт socketService (для SSR-совместимости)
      const { socketService: service } = await import('services/socket.service')
      socketService = service

      // Проверяем что сокет подключён
      if (!socketService.socket) {
        console.warn('[PermissionsSocket] ⚠️ Сокет не инициализирован, подписки не будут работать')
        return
      }

      // ============================================
      // РЕГИСТРАЦИЯ ОБРАБОТЧИКОВ
      // ============================================

      // 1. Изменение прав (роли или override)
      if (options.onPermissionsChanged) {
        const handler = async (data: PermissionsChangedData) => {
          try {
            await options.onPermissionsChanged!(data)
          } catch (error) {
            console.error('[PermissionsSocket] Ошибка в onPermissionsChanged:', error)
          }
        }
        registerHandler('permissions:changed', handler)
      }

      // 2. Создание новой страницы
      if (options.onPageCreated) {
        const handler = async (data: PageCreatedData) => {
          try {
            await options.onPageCreated!(data)
          } catch (error) {
            console.error('[PermissionsSocket] Ошибка в onPageCreated:', error)
          }
        }
        registerHandler('permissions:page:created', handler)
      }

      // 3. Обновление страницы
      if (options.onPageUpdated) {
        const handler = async (data: PageUpdatedData) => {
          try {
            await options.onPageUpdated!(data)
          } catch (error) {
            console.error('[PermissionsSocket] Ошибка в onPageUpdated:', error)
          }
        }
        registerHandler('permissions:page:updated', handler)
      }

      // 4. Удаление страницы
      if (options.onPageDeleted) {
        const handler = async (data: PageDeletedData) => {
          try {
            await options.onPageDeleted!(data)
          } catch (error) {
            console.error('[PermissionsSocket] Ошибка в onPageDeleted:', error)
          }
        }
        registerHandler('permissions:page:deleted', handler)
      }

      console.log(
        `[PermissionsSocket] ✅ Подписано на ${handlers.length} событий`
      )
    } catch (error) {
      console.error('[PermissionsSocket] ❌ Ошибка инициализации:', error)
    }
  })

  // ============================================
  // ОТПИСКА ПРИ РАЗМОНТИРОВАНИИ
  // ============================================

  onUnmounted(() => {
    if (!socketService || handlers.length === 0) return

    for (const { event, handler } of handlers) {
      try {
        socketService.off(event, handler)
      } catch (error) {
        console.error(`[PermissionsSocket] Ошибка отписки от ${event}:`, error)
      }
    }

    handlers.length = 0
    console.log('[PermissionsSocket] 🔄 Отписано от всех событий')
  })
}
