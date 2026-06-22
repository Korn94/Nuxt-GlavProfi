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
  comings: 'Поступления средств на объекты',
  expenses: 'Списания и платежи',
  materials: 'Учёт материалов на объектах',
  works: 'Учёт выполненных работ',
  contractors: 'Мастера, рабочие, прорабы, офис',
  portfolio: 'Кейсы и проекты',
  price: 'Цены на работы и услуги',
  users: 'Управление пользователями системы',
  settings: 'Настройки системы и прав доступа',
  online: 'Онлайн-статус пользователей'
}

// ============================================
// ПОРЯДОК СТРАНИЦ В МЕНЮ
// ============================================

const PAGE_ORDER: Record<PageSlug, number> = {
  dashboard: 1,
  objects: 2,
  comings: 3,
  expenses: 4,
  materials: 5,
  works: 6,
  contractors: 7,
  portfolio: 8,
  price: 9,
  users: 10,
  settings: 11,
  online: 12
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
 * - canView: базовое право просмотра (обязательно для остальных действий)
 * - canCreate/Edit/Delete: CRUD операции
 * - canSpecial: специфичные бизнес-операции
 * 
 * Иерархия (сверху вниз):
 * admin → manager → foreman → master → worker
 */
export const ROLE_PERMISSIONS_SEED: RolePermissionsSeed = {
  admin: {
    dashboard: { canView: true },
    objects: { canView: true, canCreate: true, canEdit: true, canDelete: true },
    comings: { canView: true, canCreate: true, canEdit: true, canDelete: true },
    expenses: { canView: true, canCreate: true, canEdit: true, canDelete: true },
    materials: { canView: true, canCreate: true, canEdit: true, canDelete: true, canSpecial: true },
    works: { canView: true, canCreate: true, canEdit: true, canDelete: true, canSpecial: true },
    contractors: { canView: true, canCreate: true, canEdit: true, canDelete: true, canSpecial: true },
    portfolio: { canView: true, canCreate: true, canEdit: true, canDelete: true },
    price: { canView: true, canCreate: true, canEdit: true, canDelete: true, canSpecial: true },
    users: { canView: true, canCreate: true, canEdit: true, canDelete: true },
    settings: { canView: true, canEdit: true },
    online: { canView: true }
  },

  manager: {
    dashboard: { canView: true },
    objects: { canView: true, canCreate: true, canEdit: true, canDelete: true },
    comings: { canView: true, canCreate: true, canEdit: true, canDelete: true },
    expenses: { canView: true, canCreate: true, canEdit: true, canDelete: true },
    materials: { canView: true, canCreate: true, canEdit: true, canDelete: true, canSpecial: true },
    works: { canView: true, canCreate: true, canEdit: true, canDelete: true, canSpecial: true },
    contractors: { canView: true, canCreate: true, canEdit: true, canDelete: true, canSpecial: true },
    portfolio: { canView: true, canCreate: true, canEdit: true, canDelete: true },
    price: { canView: true, canCreate: true, canEdit: true, canDelete: true, canSpecial: true },
    users: { canView: true, canCreate: true, canEdit: true, canDelete: true },
    settings: { canView: false },
    online: { canView: true }
  },

  foreman: {
    dashboard: { canView: true },
    objects: { canView: true, canCreate: true, canEdit: true },
    comings: { canView: true },
    expenses: { canView: true },
    materials: { canView: true, canCreate: true, canEdit: true, canSpecial: true },
    works: { canView: true, canCreate: true, canEdit: true, canSpecial: true },
    contractors: { canView: true, canEdit: true },
    portfolio: { canView: false },
    price: { canView: false },
    users: { canView: false },
    settings: { canView: false },
    online: { canView: false }
  },

  master: {
    dashboard: { canView: true },
    objects: { canView: true, canEdit: true },
    comings: { canView: false },
    expenses: { canView: false },
    materials: { canView: true, canCreate: true, canEdit: true },
    works: { canView: true, canCreate: true, canEdit: true },
    contractors: { canView: true },
    portfolio: { canView: false },
    price: { canView: false },
    users: { canView: false },
    settings: { canView: false },
    online: { canView: false }
  },

  worker: {
    dashboard: { canView: true },
    objects: { canView: true },
    comings: { canView: false },
    expenses: { canView: false },
    materials: { canView: false },
    works: { canView: true },
    contractors: { canView: false },
    portfolio: { canView: false },
    price: { canView: false },
    users: { canView: false },
    settings: { canView: false },
    online: { canView: false }
  }
}
