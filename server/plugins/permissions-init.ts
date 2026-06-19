// server/plugins/permissions-init.ts
import { defineNitroPlugin } from 'nitropack/runtime'
import { db } from '../db'
import { permissionsPages, permissionsRoleAccess } from '../db/schema'
import { sql } from 'drizzle-orm'
import { initializePermissionsSystem } from '../utils/permissions/helpers'

/**
 * 🔧 Автоматическая инициализация системы прав доступа
 * При запуске сервера проверяет наличие данных и выполняет seed если нужно
 */
export default defineNitroPlugin(async () => {
  try {
    console.log('[Permissions Plugin] 🔍 Проверка состояния таблиц прав...')

    const [pagesCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(permissionsPages)

    const pagesTotal = Number(pagesCount?.count || 0)

    if (pagesTotal === 0) {
      console.log('[Permissions Plugin] ⚠️  Таблица permissions_pages пуста — инициализация...')
      await initializePermissionsSystem()
      console.log('[Permissions Plugin] ✅ Система прав инициализирована')
    } else {
      const [rolesCount] = await db
        .select({ count: sql<number>`count(*)` })
        .from(permissionsRoleAccess)

      const rolesTotal = Number(rolesCount?.count || 0)

      if (rolesTotal === 0) {
        console.log('[Permissions Plugin] ⚠️  Таблица permissions_role_access пуста — инициализация...')
        await initializePermissionsSystem()
        console.log('[Permissions Plugin] ✅ Права ролей инициализированы')
      } else {
        console.log(`[Permissions Plugin] ✅ OK: ${pagesTotal} страниц, ${rolesTotal} записей прав`)
      }
    }
  } catch (error) {
    console.error('[Permissions Plugin] ❌ Ошибка инициализации:', error)
  }
})
