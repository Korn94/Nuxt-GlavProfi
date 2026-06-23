// shared/constants/permissions.ts
/**
 * 📄 Константы и валидаторы системы прав доступа (ACL)
 *
 * Единый источник истины для:
 * - Slug'ов страниц системы (dashboard, objects, works...)
 * - Действий на страницах (view, create, edit, delete, special)
 *
 * Используется:
 * - Клиент: composable usePermissions, UI (дропдауны, формы)
 * - Сервер: middleware auth.ts, API endpoints, валидация zod
 *
 * ⚠️ При добавлении новой страницы/action обновлять нужно ТОЛЬКО ЗДЕСЬ.
 * Zod-схемы, типы и UI подстроятся автоматически.
 *
 * Импорт:
 *   import { PageSlugSchema, VALID_PAGE_SLUGS, PAGE_LABELS } from '~/shared/constants/permissions'
 */
import { z } from 'zod'

// ============================================
// 🎯 ZOD-СХЕМЫ (для валидации и type inference)
// ============================================

/**
 * Slug'и страниц системы (используется как enum + type)
 *
 * Zod enum автоматически даёт:
 * - Валидацию на сервере: PageSlugSchema.parse(input)
 * - Тип TypeScript: z.infer<typeof PageSlugSchema>
 * - Массив значений: PageSlugSchema.options
 */
export const PageSlugSchema = z.enum([
  'dashboard',     // 📊 Главная
  'objects',       // 🏗️ Объекты
  'operations',    // 💰 Операции (приходы + расходы)
  'materials',     // 📦 Чеки
  'works',         // 🔨 Работы
  'daily-work',    // 📅 Подневка
  'contractors',   // 👥 Сотрудники
  'portfolio',     // 📁 Кейсы
  'price',         // 💲 Прайс-лист
  'users',         // 👤 Пользователи (админка)
  'online',        // 🟢 Онлайн-статус (мониторинг)
  'settings',      // ⚙️ Настройки
  'test'           // 🧪 Тест (только admin)
])

/**
 * Действия, которые можно выполнять на странице
 */
export const PageActionSchema = z.enum([
  'view',     // 👁️ Просмотр
  'create',   // ➕ Создание
  'edit',     // ✏️ Редактирование
  'delete',   // 🗑️ Удаление
  'special'   // ⚡ Специфичные бизнес-операции
])

// ============================================
// 📝 ТИПЫ (автоматически из zod)
// ============================================

/**
 * Тип slug'а страницы
 * @example 'objects', 'works', 'dashboard'
 */
export type PageSlug = z.infer<typeof PageSlugSchema>

/**
 * Тип действия на странице
 * @example 'view', 'edit', 'special'
 */
export type PageAction = z.infer<typeof PageActionSchema>

// ============================================
// 📦 КОНСТАНТЫ (для UI и итераций)
// ============================================

/**
 * Массив всех slug'ов (удобно для dropdown, циклов)
 * Автоматически из zod-схемы — не рассинхронизируется с типом
 */
export const VALID_PAGE_SLUGS = PageSlugSchema.options

/**
 * Массив всех действий
 */
export const VALID_PAGE_ACTIONS = PageActionSchema.options

// ============================================
// 🎨 UI-МЕТАДАННЫЕ (названия, иконки, описания)
// ============================================

/**
 * Русские названия страниц (для меню, заголовков, админки)
 */
export const PAGE_LABELS: Record<PageSlug, string> = {
  dashboard: 'Главная',
  objects: 'Объекты',
  operations: 'Операции',
  materials: 'Чеки',
  works: 'Работы',
  'daily-work': 'Подневка',
  contractors: 'Сотрудники',
  portfolio: 'Кейсы',
  price: 'Прайс-лист',
  users: 'Пользователи',
  online: 'Онлайн',
  settings: 'Настройки',
  test: 'Тест'
} as const

/**
 * Иконки страниц (Material Design Icons)
 * Используются в меню навигации и админке прав
 */
export const PAGE_ICONS: Record<PageSlug, string> = {
  dashboard: 'mdi:view-dashboard',
  objects: 'mdi:office-building',
  operations: 'mdi:instant-transfer',
  materials: 'mdi:receipt-text-outline',
  works: 'mdi:hammer-wrench',
  'daily-work': 'mdi:calendar-today-outline',
  contractors: 'mdi:account-hard-hat',
  portfolio: 'mdi:briefcase-outline',
  price: 'mdi:format-list-numbered',
  users: 'mdi:account-group',
  online: 'mdi:circle-double',
  settings: 'mdi:cog',
  test: 'mdi:flask-outline'
} as const

/**
 * Русские названия действий (для таблиц прав, чекбоксов)
 */
export const ACTION_LABELS: Record<PageAction, string> = {
  view: 'Просмотр',
  create: 'Создание',
  edit: 'Редактирование',
  delete: 'Удаление',
  special: 'Спец. операции'
} as const

/**
 * Описания действий (для tooltip'ов в админке прав)
 */
export const ACTION_DESCRIPTIONS: Record<PageAction, string> = {
  view: 'Возможность просматривать данные страницы',
  create: 'Возможность создавать новые записи',
  edit: 'Возможность редактировать существующие записи',
  delete: 'Возможность удалять записи',
  special: 'Специфичные бизнес-операции (приёмка работ, пересортировка и т.д.)'
} as const

/**
 * Какие действия в принципе поддерживаются страницей
 * (используется при seed и в админке — чтобы можно было отключить то, чего нет)
 */
export const PAGE_SUPPORTED_ACTIONS: Record<PageSlug, PageAction[]> = {
  dashboard: ['view'],
  objects: ['view', 'create', 'edit', 'delete'],
  operations: ['view', 'create', 'edit', 'delete'],
  materials: ['view', 'create', 'edit', 'delete', 'special'], // special: toggle-check
  works: ['view', 'create', 'edit', 'delete', 'special'],     // special: accept/reject/pay
  'daily-work': ['view', 'create', 'edit', 'delete', 'special'], // special: утверждение/оплата
  contractors: ['view', 'create', 'edit', 'delete', 'special'], // special: recalculate-balance
  portfolio: ['view', 'create', 'edit', 'delete'],
  price: ['view', 'create', 'edit', 'delete', 'special'],     // special: reorder
  users: ['view', 'create', 'edit', 'delete'],
  online: ['view'],
  settings: ['view', 'edit'],
  test: ['view']
} as const

// ============================================
// 🛠️ ХЕЛПЕРЫ
// ============================================

/**
 * Проверить, что строка является валидным slug'ом страницы
 * Используется как type guard
 *
 * @example
 * if (isValidPageSlug(input)) {
 *   // input имеет тип PageSlug
 * }
 */
export function isValidPageSlug(value: string): value is PageSlug {
  return PageSlugSchema.safeParse(value).success
}

/**
 * Проверить, что строка является валидным действием
 */
export function isValidPageAction(value: string): value is PageAction {
  return PageActionSchema.safeParse(value).success
}

/**
 * Безопасно распарсить slug (вернёт null если невалидно)
 * Удобно для API endpoints
 *
 * @example
 * const slug = parsePageSlug(req.body.slug)
 * if (!slug) throw createError({ statusCode: 400 })
 */
export function parsePageSlug(value: unknown): PageSlug | null {
  const result = PageSlugSchema.safeParse(value)
  return result.success ? result.data : null
}

/**
 * Безопасно распарсить действие
 */
export function parsePageAction(value: unknown): PageAction | null {
  const result = PageActionSchema.safeParse(value)
  return result.success ? result.data : null
}

/**
 * Получить список действий, которые в принципе поддерживаются страницей
 * (используется в админке, чтобы не показывать чекбоксы для неподдерживаемых действий)
 *
 * @example
 * getSupportedActions('dashboard') // ['view']
 * getSupportedActions('works')     // ['view', 'create', 'edit', 'delete', 'special']
 */
export function getSupportedActions(pageSlug: PageSlug): PageAction[] {
  return PAGE_SUPPORTED_ACTIONS[pageSlug] ?? ['view']
}

/**
 * Поддерживает ли страница указанное действие
 */
export function pageSupportsAction(pageSlug: PageSlug, action: PageAction): boolean {
  return PAGE_SUPPORTED_ACTIONS[pageSlug]?.includes(action) ?? false
}
