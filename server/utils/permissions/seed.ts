// server/utils/permissions/seed.ts
/**
 * Данные для инициализации системы прав
 * Используется при первом запуске или миграции
 *
 * Архитектура:
 * - Метаданные страниц (labels, icons, supported actions) — в shared/constants/permissions
 * - Матрица прав ролей — только здесь (бизнес-логика по умолчанию)
 *
 * Упрощённая система действий:
 * - create, edit, delete — стандартные CRUD операции
 * - special — специфичные бизнес-операции (accept/reject/pay/reorder/toggle-check)
 *
 * ⚠️ canView упразднён — видимость определяется наличием любого действия
 */
import {
  VALID_PAGE_SLUGS,
  PAGE_LABELS,
  PAGE_ICONS,
  PAGE_SUPPORTED_ACTIONS,
  type PageSlug
} from 'shared/constants/permissions'
import type { PageSeedData, RolePermissionsSeed } from 'shared/types/permissions'

// ============================================
// ОПИСАНИЯ СТРАНИЦ (специфичные для seed)
// В shared/constants держим только labels/icons/actions,
// а описания — здесь, так как они нужны только при инициализации БД
// ============================================
const PAGE_DESCRIPTIONS: Record<PageSlug, string> = {
  dashboard: 'Главная страница с обзором',
  objects: 'Управление объектами строительства',
  operations: 'Приходы и расходы по объектам',
  materials: 'Учёт чеков и материалов на объектах',
  works: 'Учёт выполненных работ',
  'daily-work': 'Подневка — ежедневный учёт работ',
  contractors: 'Мастера, рабочие, прорабы, офис',
  portfolio: 'Кейсы и проекты компании',
  price: 'Цены на работы и услуги (публично + управление)',
  users: 'Управление пользователями системы (админка)',
  settings: 'Настройки системы и прав доступа',
  online: 'Онлайн-мониторинг статуса пользователей',
  test: 'Тестовая страница для разработки'
}

// ============================================
// ПОРЯДОК СТРАНИЦ В МЕНЮ
// ============================================
const PAGE_ORDER: Record<PageSlug, number> = {
  dashboard: 1,
  objects: 2,
  operations: 3,
  materials: 4,
  works: 5,
  'daily-work': 6,
  contractors: 7,
  portfolio: 8,
  price: 9,
  users: 10,
  online: 11,
  settings: 12,
  test: 13
}

// ============================================
// СТРАНИЦЫ СИСТЕМЫ (собирается из shared)
// ============================================
/**
 * Массив страниц для seed.
 * Автоматически собирается из shared/constants/permissions —
 * при добавлении новой страницы в PageSlugSchema она появится здесь.
 */
export const PERMISSIONS_PAGES_SEED: PageSeedData[] = VALID_PAGE_SLUGS.map(slug => ({
  slug,
  name: PAGE_LABELS[slug],
  description: PAGE_DESCRIPTIONS[slug],
  icon: PAGE_ICONS[slug],
  order: PAGE_ORDER[slug] ?? 99,
  hasCreate: PAGE_SUPPORTED_ACTIONS[slug].includes('create'),
  hasEdit: PAGE_SUPPORTED_ACTIONS[slug].includes('edit'),
  hasDelete: PAGE_SUPPORTED_ACTIONS[slug].includes('delete'),
  hasSpecial: PAGE_SUPPORTED_ACTIONS[slug].includes('special')
}))

// ============================================
// ПРАВА ПО РОЛЯМ (ДЕФОЛТНЫЕ)
// ============================================
/**
 * Матрица прав ролей по умолчанию.
 *
 * Правила:
 * - canCreate/Edit/Delete/Special — CRUD операции и спец. действия
 * - canView упразднён — раздел виден, если есть хотя бы одно действие
 *
 * Иерархия (сверху вниз):
 * admin → manager → foreman → master → worker
 *
 * Маппинг страниц к реальным разделам меню:
 * - dashboard → Главная
 * - contractors → Сотрудники
 * - daily-work → Подневка
 * - objects → Объекты
 * - materials → Чеки
 * - operations → Операции (приходы + расходы)
 * - online → Онлайн (мониторинг)
 * - test → Тест (только admin)
 * - portfolio → Кейсы
 * - price → Прайс-лист (управление, без меню)
 * - users → Пользователи (админка)
 * - settings → Настройки
 */
export const ROLE_PERMISSIONS_SEED: RolePermissionsSeed = {
  admin: {
    dashboard: {},
    objects: { canCreate: true, canEdit: true, canDelete: true },
    operations: { canCreate: true, canEdit: true, canDelete: true },
    materials: { canCreate: true, canEdit: true, canDelete: true, canSpecial: true },
    works: { canCreate: true, canEdit: true, canDelete: true, canSpecial: true },
    'daily-work': { canCreate: true, canEdit: true, canDelete: true, canSpecial: true },
    contractors: { canCreate: true, canEdit: true, canDelete: true, canSpecial: true },
    portfolio: { canCreate: true, canEdit: true, canDelete: true },
    price: { canCreate: true, canEdit: true, canDelete: true, canSpecial: true },
    users: { canCreate: true, canEdit: true, canDelete: true },
    online: {},
    settings: { canEdit: true },
    test: {}
  },
  manager: {
    dashboard: {},
    objects: { canCreate: true, canEdit: true, canDelete: true },
    operations: { canCreate: true, canEdit: true, canDelete: true },
    materials: { canCreate: true, canEdit: true, canDelete: true, canSpecial: true },
    works: { canCreate: true, canEdit: true, canDelete: true, canSpecial: true },
    'daily-work': { canCreate: true, canEdit: true, canSpecial: true },
    contractors: { canCreate: true, canEdit: true, canDelete: true, canSpecial: true },
    portfolio: { canCreate: true, canEdit: true, canDelete: true },
    price: { canCreate: true, canEdit: true, canDelete: true, canSpecial: true },
    users: { canCreate: true, canEdit: true, canDelete: true },
    online: {}
    // settings — нет прав, значит не виден
    // test — нет прав, значит не виден
  },
  foreman: {
    dashboard: {},
    objects: { canCreate: true, canEdit: true },
    operations: {}, // только просмотр
    materials: { canCreate: true, canEdit: true, canSpecial: true },
    works: { canCreate: true, canEdit: true, canSpecial: true },
    'daily-work': { canCreate: true, canEdit: true, canSpecial: true },
    contractors: { canEdit: true },
    online: {}
    // portfolio, price, users, settings, test — нет прав
  },
  master: {
    dashboard: {},
    objects: { canEdit: true },
    materials: { canCreate: true, canEdit: true },
    works: { canCreate: true, canEdit: true },
    contractors: {} // только просмотр (видит себя)
    // всё остальное — нет прав
  },
  worker: {
    dashboard: {},
    objects: {}, // только просмотр
    works: {} // только просмотр
    // всё остальное — нет прав
  }
}
