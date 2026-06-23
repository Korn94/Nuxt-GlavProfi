// server/utils/permissions/helpers.ts
/**
 * Вспомогательные функции для системы прав
 * Используются для первичной инициализации БД из seed данных
 *
 * Функции:
 * - seedPermissionsPages() — заполнение справочника страниц
 * - seedRolePermissions() — заполнение базовых прав ролей
 * - initializePermissionsSystem() — полная инициализация (вызывает оба)
 *
 * Оптимизации:
 * - Bulk-insert вместо построчных запросов (1 INSERT вместо N)
 * - Batch-проверка существующих записей (1 SELECT вместо N)
 * - Единый источник типов из shared/
 *
 * ⚠️ canView упразднён: при вставке всегда false (для совместимости с БД),
 * видимость определяется наличием любого действия (create/edit/delete/special)
 */
import { db } from '../../db'
import {
  permissionsPages,
  permissionsRoleAccess
} from '../../db/schema'
import { eq, and, inArray } from 'drizzle-orm'
import { type Role } from 'shared/constants/roles'
import type { PageSeedData, RolePermissionsSeed } from 'shared/types/permissions'

// ============================================
// ЛОГГЕР (консоль с префиксами)
// ============================================
const LOG_PREFIX = '[Permissions]'
const logger = {
  info: (...args: any[]) => console.log(`${LOG_PREFIX}`, ...args),
  success: (...args: any[]) => console.log(`${LOG_PREFIX} ✅`, ...args),
  warn: (...args: any[]) => console.warn(`${LOG_PREFIX} ⚠️`, ...args),
  error: (...args: any[]) => console.error(`${LOG_PREFIX} ❌`, ...args),
  debug: (...args: any[]) => console.log(`${LOG_PREFIX} 🔍`, ...args)
}

// ============================================
// ИНИЦИАЛИЗАЦИЯ СТРАНИЦ
// ============================================
/**
 * Инициализировать страницы системы из seed данных
 * Запускается при миграции или первом запуске
 *
 * Логика:
 * 1. Получает все существующие slug'и из БД одним запросом
 * 2. Фильтрует seed-данные — только новые страницы
 * 3. Делает bulk-insert всех новых страниц одним запросом
 *
 * @param pages — массив seed данных страниц
 */
export async function seedPermissionsPages(pages: PageSeedData[]): Promise<{
  created: number
  skipped: number
}> {
  logger.info('Инициализация страниц системы...', { count: pages.length })

  if (pages.length === 0) {
    return { created: 0, skipped: 0 }
  }

  // 1. Получаем все существующие slug'и одним запросом
  const existingRows = await db
    .select({ slug: permissionsPages.slug })
    .from(permissionsPages)

  const existingSlugs = new Set(existingRows.map(row => row.slug))

  // 2. Фильтруем — только новые страницы
  const newPages = pages.filter(page => !existingSlugs.has(page.slug))

  if (newPages.length === 0) {
    logger.info(`⏭️  Все ${pages.length} страниц уже существуют`)
    return { created: 0, skipped: pages.length }
  }

  // 3. Bulk-insert всех новых страниц
  await db.insert(permissionsPages).values(
    newPages.map(page => ({
      slug: page.slug,
      name: page.name,
      description: page.description ?? null,
      icon: page.icon ?? null,
      parentId: null,
      order: page.order ?? 0,
      hasCreate: page.hasCreate ?? false,
      hasEdit: page.hasEdit ?? false,
      hasDelete: page.hasDelete ?? false,
      hasSpecial: page.hasSpecial ?? false,
      isActive: true
    }))
  )

  logger.success(`Добавлено страниц: ${newPages.length}`)
  for (const page of newPages) {
    logger.debug(`  + ${page.name} (${page.slug})`)
  }

  const skipped = pages.length - newPages.length
  if (skipped > 0) {
    logger.info(`⏭️  Пропущено существующих: ${skipped}`)
  }

  return { created: newPages.length, skipped }
}

// ============================================
// ИНИЦИАЛИЗАЦИЯ ПРАВ РОЛЕЙ
// ============================================
/**
 * Инициализировать права ролей из seed данных
 *
 * Логика:
 * 1. Получает все существующие (role, pageSlug) одним запросом
 * 2. Строит Set из composite key для быстрой проверки
 * 3. Фильтрует seed — только новые записи
 * 4. Делает bulk-insert одним запросом
 *
 * ⚠️ canView всегда false при вставке — поле оставлено для совместимости с БД,
 * но видимость определяется наличием любого действия (create/edit/delete/special)
 *
 * @param permissions — объект { role: { pageSlug: Partial<PagePermissions> } }
 */
export async function seedRolePermissions(permissions: RolePermissionsSeed): Promise<{
  created: number
  skipped: number
}> {
  logger.info('Инициализация прав ролей...')

  // 1. Получаем все существующие записи прав ролей
  const existingRows = await db
    .select({
      role: permissionsRoleAccess.role,
      pageSlug: permissionsRoleAccess.pageSlug
    })
    .from(permissionsRoleAccess)

  // Составной ключ "role|pageSlug" для быстрой проверки
  const existingKeys = new Set(
    existingRows.map(row => `${row.role}|${row.pageSlug}`)
  )

  // 2. Собираем все новые записи
  const newRecords: Array<typeof permissionsRoleAccess.$inferInsert> = []

  for (const [role, pages] of Object.entries(permissions)) {
    const roleType = role as Role

    for (const [pageSlug, perms] of Object.entries(pages)) {
      const key = `${roleType}|${pageSlug}`

      if (existingKeys.has(key)) {
        continue
      }

      newRecords.push({
        role: roleType,
        pageSlug,
        // canView упразднён — всегда false, видимость через наличие действий
        canView: false,
        canCreate: perms.canCreate ?? false,
        canEdit: perms.canEdit ?? false,
        canDelete: perms.canDelete ?? false,
        canSpecial: perms.canSpecial ?? false,
        comment: 'Дефолтные права при инициализации',
        updatedBy: null,
        isActive: true
      })
    }
  }

  if (newRecords.length === 0) {
    const totalExisting = existingRows.length
    logger.info(`⏭️  Все ${totalExisting} записей прав ролей уже существуют`)
    return { created: 0, skipped: totalExisting }
  }

  // 3. Bulk-insert одним запросом
  await db.insert(permissionsRoleAccess).values(newRecords)
  logger.success(`Добавлено записей прав ролей: ${newRecords.length}`)

  const skipped = existingRows.length
  return { created: newRecords.length, skipped }
}

// ============================================
// ПОЛНАЯ ИНИЦИАЛИЗАЦИЯ
// ============================================
/**
 * Полная инициализация системы прав
 * Вызывает seedPermissionsPages() и seedRolePermissions() последовательно
 *
 * Используется в:
 * - POST /api/permissions/init (endpoint для ручной инициализации)
 * - Миграции при первом запуске
 * - Seed-скрипте (npm run seed)
 */
export async function initializePermissionsSystem(): Promise<{
  pages: { created: number; skipped: number }
  roles: { created: number; skipped: number }
}> {
  try {
    // Динамический импорт seed — чтобы не грузить его в production bundle,
    // если инициализация не вызывается
    const { PERMISSIONS_PAGES_SEED, ROLE_PERMISSIONS_SEED } = await import('./seed')

    const pagesResult = await seedPermissionsPages(PERMISSIONS_PAGES_SEED)
    const rolesResult = await seedRolePermissions(ROLE_PERMISSIONS_SEED)

    logger.success('Система прав инициализирована', {
      pages: pagesResult,
      roles: rolesResult
    })

    return {
      pages: pagesResult,
      roles: rolesResult
    }
  } catch (error) {
    logger.error('Ошибка инициализации системы прав:', error)
    throw error
  }
}

// ============================================
// СБРОС ПРАВ РОЛИ К ДЕФОЛТНЫМ
// ============================================
/**
 * Сбросить права роли к дефолтным значениям из seed
 *
 * Логика:
 * 1. Находит дефолтные права роли в ROLE_PERMISSIONS_SEED
 * 2. Получает текущие записи из БД для этой роли
 * 3. Удаляет лишние записи (которых нет в seed)
 * 4. Обновляет существующие до дефолтных значений
 * 5. Создаёт недостающие записи
 *
 * ⚠️ canView всегда false при сбросе — видимость определяется действиями
 *
 * Используется в:
 * - POST /api/permissions/roles/[role]/reset
 */
export async function resetRolePermissionsToDefaults(role: Role): Promise<{
  role: Role
  deleted: number
  updated: number
  created: number
}> {
  const { ROLE_PERMISSIONS_SEED } = await import('./seed')
  const defaultPerms = ROLE_PERMISSIONS_SEED[role]

  if (!defaultPerms) {
    throw new Error(`Роль ${role} не найдена в seed данных`)
  }

  // Получаем текущие записи прав для этой роли
  const currentRows = await db
    .select()
    .from(permissionsRoleAccess)
    .where(
      and(
        eq(permissionsRoleAccess.role, role),
        eq(permissionsRoleAccess.isActive, true)
      )
    )

  const currentMap = new Map(currentRows.map(r => [r.pageSlug, r]))
  const defaultSlugs = new Set(Object.keys(defaultPerms))

  // 1. Удаляем лишние записи (которых нет в дефолтных)
  const toDelete = currentRows.filter(r => !defaultSlugs.has(r.pageSlug))

  if (toDelete.length > 0) {
    await db.delete(permissionsRoleAccess).where(
      inArray(permissionsRoleAccess.id, toDelete.map(r => r.id))
    )
  }

  let updatedCount = 0
  let createdCount = 0

  // 2. Обновляем существующие / создаём недостающие
  for (const [pageSlug, perms] of Object.entries(defaultPerms)) {
    const existing = currentMap.get(pageSlug)

    if (existing) {
      // Обновляем до дефолтных значений
      await db
        .update(permissionsRoleAccess)
        .set({
          // canView упразднён — всегда false
          canView: false,
          canCreate: perms.canCreate ?? false,
          canEdit: perms.canEdit ?? false,
          canDelete: perms.canDelete ?? false,
          canSpecial: perms.canSpecial ?? false,
          comment: 'Сброшено к дефолтным значениям'
        })
        .where(eq(permissionsRoleAccess.id, existing.id))
      updatedCount++
    } else {
      // Создаём новую запись
      await db.insert(permissionsRoleAccess).values({
        role,
        pageSlug,
        canView: false,
        canCreate: perms.canCreate ?? false,
        canEdit: perms.canEdit ?? false,
        canDelete: perms.canDelete ?? false,
        canSpecial: perms.canSpecial ?? false,
        comment: 'Восстановлено из дефолтных значений',
        updatedBy: null,
        isActive: true
      })
      createdCount++
    }
  }

  logger.info(`🔄 Права роли ${role} сброшены`, {
    deleted: toDelete.length,
    updated: updatedCount,
    created: createdCount
  })

  return {
    role,
    deleted: toDelete.length,
    updated: updatedCount,
    created: createdCount
  }
}
