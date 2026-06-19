// server/utils/permissions/helpers.ts
/**
 * Вспомогательные функции для системы прав
 * Используются для первичной инициализации БД из seed данных
 *
 * Функции:
 * - seedPermissionsPages() — заполнение справочника страниц
 * - seedRolePermissions() — заполнение базовых прав ролей
 * - initializePermissionsSystem() — полная инициализация (вызывает оба)
 */
import { db } from '../../db'
import { permissionsPages, permissionsRoleAccess } from '../../db/schema'
import { eq, and } from 'drizzle-orm'
import type { PageSeedData, RolePermissionsSeed } from './types'

// Тип роли из схемы БД
type RoleType = 'admin' | 'manager' | 'foreman' | 'master' | 'worker'

// ============================================
// ИНИЦИАЛИЗАЦИЯ СТРАНИЦ
// ============================================

/**
 * Инициализировать страницы системы из seed данных
 * Запускается при миграции или первом запуске
 *
 * Логика:
 * - Проверяет существование страницы по slug
 * - Если нет — создаёт новую
 * - Если есть — пропускает (не перезаписывает)
 *
 * @param pages — массив seed данных страниц
 */
export async function seedPermissionsPages(pages: PageSeedData[]): Promise<void> {
  console.log('[Permissions] Инициализация страниц системы...')

  for (const page of pages) {
    // Проверяем существует ли страница
    const [existing] = await db
      .select()
      .from(permissionsPages)
      .where(eq(permissionsPages.slug, page.slug))
      .limit(1)

    if (!existing) {
      await db.insert(permissionsPages).values({
        slug: page.slug,
        name: page.name,
        description: page.description || null,
        icon: page.icon || null,
        parentId: null, // Пока без родителей
        order: page.order || 0,
        hasCreate: page.hasCreate || false,
        hasEdit: page.hasEdit || false,
        hasDelete: page.hasDelete || false,
        hasSpecial: page.hasSpecial || false,
        isActive: true
      })
      console.log(`  ✅ Добавлена страница: ${page.name} (${page.slug})`)
    } else {
      console.log(`  ⏭️  Страница уже существует: ${page.name} (${page.slug})`)
    }
  }
}

// ============================================
// ИНИЦИАЛИЗАЦИЯ ПРАВ РОЛЕЙ
// ============================================

/**
 * Инициализировать права ролей из seed данных
 *
 * Логика:
 * - Для каждой роли и каждой страницы проверяет существование записи
 * - Если нет — создаёт новую с дефолтными правами
 * - Если есть — пропускает (не перезаписывает)
 *
 * @param permissions — объект { role: { pageSlug: Partial<PagePermissions> } }
 */
export async function seedRolePermissions(permissions: RolePermissionsSeed): Promise<void> {
  console.log('[Permissions] Инициализация прав ролей...')

  for (const [role, pages] of Object.entries(permissions)) {
    // Приводим строку к типу RoleType
    const roleType = role as RoleType

    for (const [pageSlug, perms] of Object.entries(pages)) {
      // Проверяем существует ли запись
      const [existing] = await db
        .select()
        .from(permissionsRoleAccess)
        .where(
          and(
            eq(permissionsRoleAccess.role, roleType),
            eq(permissionsRoleAccess.pageSlug, pageSlug)
          )
        )
        .limit(1)

      if (!existing) {
        await db.insert(permissionsRoleAccess).values({
          role: roleType,
          pageSlug,
          canView: perms.canView || false,
          canCreate: perms.canCreate || false,
          canEdit: perms.canEdit || false,
          canDelete: perms.canDelete || false,
          canSpecial: perms.canSpecial || false,
          comment: 'Дефолтные права при инициализации',
          updatedBy: null,
          isActive: true
        })
        console.log(`  ✅ Добавлены права для роли ${roleType} на страницу ${pageSlug}`)
      } else {
        console.log(`  ⏭️  Права уже существуют: ${roleType} → ${pageSlug}`)
      }
    }
  }
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
 */
export async function initializePermissionsSystem(): Promise<void> {
  try {
    const { PERMISSIONS_PAGES_SEED, ROLE_PERMISSIONS_SEED } = await import('./seed')

    await seedPermissionsPages(PERMISSIONS_PAGES_SEED)
    await seedRolePermissions(ROLE_PERMISSIONS_SEED)

    console.log('[Permissions] ✅ Система прав инициализирована')
  } catch (error) {
    console.error('[Permissions] ❌ Ошибка инициализации:', error)
    throw error
  }
}
