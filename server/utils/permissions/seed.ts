// server/utils/permissions/seed.ts
/**
* Данные для инициализации системы прав
* Используется при первом запуске или миграции
*
* Упрощённая система действий:
* - create, edit, delete — стандартные CRUD операции
* - special — специфичные бизнес-операции (accept/reject/pay/reorder/toggle-check и т.д.)
*/
import type { PageSeedData, RolePermissionsSeed } from './types'

// ============================================
// СТРАНИЦЫ СИСТЕМЫ (ДЕТАЛИЗИРОВАННЫЕ)
// ============================================
export const PERMISSIONS_PAGES_SEED: PageSeedData[] = [
  {
    slug: 'dashboard',
    name: 'Дашборд',
    description: 'Главная страница с обзором',
    icon: 'mdi:view-dashboard',
    order: 1,
    hasCreate: false,
    hasEdit: false,
    hasDelete: false,
    hasSpecial: false
  },
  {
    slug: 'objects',
    name: 'Объекты',
    description: 'Управление объектами строительства',
    icon: 'mdi:office-building',
    order: 2,
    hasCreate: true,
    hasEdit: true,
    hasDelete: true,
    hasSpecial: false
  },
  {
    slug: 'comings',
    name: 'Приходы',
    description: 'Поступления средств на объекты',
    icon: 'mdi:cash-plus',
    order: 3,
    hasCreate: true,
    hasEdit: true,
    hasDelete: true,
    hasSpecial: false
  },
  {
    slug: 'expenses',
    name: 'Расходы',
    description: 'Списания и платежи',
    icon: 'mdi:cash-minus',
    order: 4,
    hasCreate: true,
    hasEdit: true,
    hasDelete: true,
    hasSpecial: false
  },
  {
    slug: 'materials',
    name: 'Материалы',
    description: 'Учёт материалов на объектах',
    icon: 'mdi:package-variant',
    order: 5,
    hasCreate: true,
    hasEdit: true,
    hasDelete: true,
    hasSpecial: true // toggle-check (переключение флага наличия чека)
  },
  {
    slug: 'works',
    name: 'Работы',
    description: 'Учёт выполненных работ',
    icon: 'mdi:hammer-wrench',
    order: 6,
    hasCreate: true,
    hasEdit: true,
    hasDelete: true,
    hasSpecial: true // accept, reject, pay-work, create-and-pay
  },
  {
    slug: 'contractors',
    name: 'Контрагенты',
    description: 'Мастера, рабочие, прорабы, офис',
    icon: 'mdi:account-hard-hat',
    order: 7,
    hasCreate: true,
    hasEdit: true,
    hasDelete: true,
    hasSpecial: true // recalculate-balance
  },
  {
    slug: 'portfolio',
    name: 'Портфолио',
    description: 'Кейсы и проекты',
    icon: 'mdi:briefcase-outline',
    order: 8,
    hasCreate: true,
    hasEdit: true,
    hasDelete: true,
    hasSpecial: false
  },
  {
    slug: 'price',
    name: 'Прайс-лист',
    description: 'Цены на работы и услуги',
    icon: 'mdi:format-list-numbered',
    order: 9,
    hasCreate: true,
    hasEdit: true,
    hasDelete: true,
    hasSpecial: true // reorder (пересортировка позиций)
  },
  {
    slug: 'users',
    name: 'Пользователи',
    description: 'Управление пользователями системы',
    icon: 'mdi:account-group',
    order: 10,
    hasCreate: true,
    hasEdit: true,
    hasDelete: true,
    hasSpecial: false
  },
  {
    slug: 'settings',
    name: 'Настройки',
    description: 'Настройки системы и прав доступа',
    icon: 'mdi:cog',
    order: 11,
    hasCreate: false,
    hasEdit: true,
    hasDelete: false,
    hasSpecial: false
  }
]

// ============================================
// ПРАВА ПО РОЛЯМ (ДЕФОЛТНЫЕ)
// ============================================
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
    settings: { canView: true, canEdit: true }
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
    settings: { canView: false }
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
    settings: { canView: false }
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
    settings: { canView: false }
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
    settings: { canView: false }
  }
}
