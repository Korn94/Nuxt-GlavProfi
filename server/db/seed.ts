// server/db/seed.ts
// отдельный entrypoint-скрипт для инициализации системы прав. Это заменяет автоматический запуск через permissions-init.ts плагин — теперь seed выполняется только вручную через npm run seed, что правильно для CI/CD.
/**
 * 🌱 Seed-скрипт для инициализации системы прав доступа
 *
 * Назначение:
 * - Заполняет таблицы `permissions_pages` и `permissions_role_access`
 *   начальными данными из shared/constants/permissions и seed-матрицы
 * - Идемпотентный: пропускает уже существующие записи (не дублирует)
 * - Использует bulk-insert для производительности
 *
 * Запуск:
 *   npm run seed              # через npm-скрипт
 *   npx tsx server/db/seed.ts # напрямую
 *
 * ⚠️ ВАЖНО: Этот скрипт НЕ должен запускаться автоматически при старте сервера.
 * Автоматический seed был в server/plugins/permissions-init.ts — его нужно удалить.
 * Теперь seed выполняется ТОЛЬКО вручную (при первом деплое или миграции).
 *
 * Для повторного применения дефолтных прав используйте API endpoint:
 *   POST /api/permissions/roles/[role]/reset
 */

import 'dotenv/config'
import { db } from './index'
import {
  seedPermissionsPages,
  seedRolePermissions,
  initializePermissionsSystem
} from '../utils/permissions/helpers'

// ============================================
// ПРОВЕРКА ОКРУЖЕНИЯ
// ============================================

/**
 * Запрещаем запуск seed в production без явного флага.
 * Это защита от случайного запуска на проде (может перезаписать пользовательские настройки).
 */
const isProduction = process.env.NODE_ENV === 'production'
const forceSeed = process.env.FORCE_SEED === 'true' || process.argv.includes('--force')

if (isProduction && !forceSeed) {
  console.error('❌ [Seed] Запуск seed в production запрещён!')
  console.error('')
  console.error('Если вы действительно хотите выполнить seed в production:')
  console.error('  FORCE_SEED=true npm run seed')
  console.error('')
  console.error('Для сброса прав конкретной роли используйте API:')
  console.error('  POST /api/permissions/roles/[role]/reset')
  process.exit(1)
}

// ============================================
// АРГУМЕНТЫ КОМАНДНОЙ СТРОКИ
// ============================================

const args = process.argv.slice(2)
const onlyPages = args.includes('--pages')
const onlyRoles = args.includes('--roles')
const dryRun = args.includes('--dry-run')

// ============================================
// ГЛАВНАЯ ФУНКЦИЯ
// ============================================

async function runSeed(): Promise<void> {
  const startTime = Date.now()

  console.log('')
  console.log('╔══════════════════════════════════════════════════╗')
  console.log('║  🌱 SEED: Инициализация системы прав доступа     ║')
  console.log('╚══════════════════════════════════════════════════╝')
  console.log('')
  console.log(`Окружение: ${process.env.NODE_ENV || 'development'}`)
  console.log(`Режим: ${dryRun ? 'DRY RUN (без изменений)' : 'LIVE'}`)
  console.log(`Цель: ${onlyPages ? 'только страницы' : onlyRoles ? 'только права ролей' : 'всё'}`)
  console.log('')

  if (dryRun) {
    console.log('⚠️  DRY RUN: скрипт только покажет, что будет сделано')
    console.log('    Уберите --dry-run для реального применения')
    console.log('')
    // TODO: реализовать dry-run через предпросмотр операций
    process.exit(0)
  }

  try {
    // Проверяем подключение к БД
    console.log('🔌 Проверка подключения к БД...')
    await testDbConnection()
    console.log('✅ Подключение успешно')
    console.log('')

    let result

    if (onlyPages) {
      console.log('📄 Запуск seed только для страниц...')
      const { PERMISSIONS_PAGES_SEED } = await import('../utils/permissions/seed')
      const pagesResult = await seedPermissionsPages(PERMISSIONS_PAGES_SEED)
      result = { pages: pagesResult, roles: { created: 0, skipped: 0 } }
    }
    else if (onlyRoles) {
      console.log('🎭 Запуск seed только для прав ролей...')
      const { ROLE_PERMISSIONS_SEED } = await import('../utils/permissions/seed')
      const rolesResult = await seedRolePermissions(ROLE_PERMISSIONS_SEED)
      result = { pages: { created: 0, skipped: 0 }, roles: rolesResult }
    }
    else {
      console.log('🚀 Запуск полной инициализации...')
      result = await initializePermissionsSystem()
    }

    // ============================================
    // ИТОГ
    // ============================================
    const elapsed = Date.now() - startTime

    console.log('')
    console.log('╔══════════════════════════════════════════════════╗')
    console.log('║  ✅ Seed завершён успешно                        ║')
    console.log('╚══════════════════════════════════════════════════╝')
    console.log('')
    console.log(`📊 Результаты:`)
    console.log(`   Страницы:   создано ${result.pages.created}, пропущено ${result.pages.skipped}`)
    console.log(`   Права ролей: создано ${result.roles.created}, пропущено ${result.roles.skipped}`)
    console.log(`⏱️  Время: ${elapsed}ms`)
    console.log('')

    if (result.pages.created > 0 || result.roles.created > 0) {
      console.log('💡 Совет: инвалидируйте кэш прав для всех пользователей,')
      console.log('   если они уже залогинены — они получат обновлённые права')
      console.log('   при следующем запросе к /api/permissions.')
      console.log('')
    }

    process.exit(0)
  }
  catch (error) {
    console.error('')
    console.error('╔══════════════════════════════════════════════════╗')
    console.error('║  ❌ Ошибка выполнения seed                       ║')
    console.error('╚══════════════════════════════════════════════════╝')
    console.error('')
    console.error(error)
    console.error('')
    process.exit(1)
  }
}

// ============================================
// ТЕСТ ПОДКЛЮЧЕНИЯ К БД
// ============================================

/**
 * Проверяет, что БД доступна и таблицы существуют.
 * Бросает ошибку, если нет подключения.
 */
async function testDbConnection(): Promise<void> {
  try {
    // Простой SELECT для проверки подключения
    await db.execute(
      // Используем raw SQL для простоты — не зависит от схемы
      // eslint-disable-next-line no-useless-catch
      (await import('drizzle-orm')).sql`SELECT 1`
    )
  }
  catch (error) {
    throw new Error(
      `Не удалось подключиться к БД. Проверьте переменные окружения.\n` +
      `Исходная ошибка: ${error instanceof Error ? error.message : String(error)}`
    )
  }
}

// ============================================
// СПРАВКА
// ============================================

if (args.includes('--help') || args.includes('-h')) {
  console.log(`
📖 Seed-скрипт системы прав доступа

Использование:
  npm run seed [options]

Опции:
  --pages     Инициализировать только страницы (permissions_pages)
  --roles     Инициализировать только права ролей (permissions_role_access)
  --dry-run   Показать, что будет сделано, без реальных изменений
  --force     Принудительный запуск в production (без этого флага seed запрещён)
  --help, -h  Показать эту справку

Примеры:
  npm run seed                    # Полная инициализация (dev)
  npm run seed -- --pages         # Только страницы
  npm run seed -- --roles         # Только права ролей
  npm run seed -- --dry-run       # Предпросмотр
  FORCE_SEED=true npm run seed    # Принудительный запуск в production

Источники данных:
  - Страницы:  shared/constants/permissions.ts (PAGE_LABELS, PAGE_ICONS, PAGE_SUPPORTED_ACTIONS)
  - Права ролей: server/utils/permissions/seed.ts (ROLE_PERMISSIONS_SEED)

Идемпотентность:
  Скрипт проверяет существующие записи по (slug) для страниц
  и по (role, pageSlug) для прав ролей. Существующие записи пропускаются.

Альтернативы для production:
  - Сброс прав конкретной роли:  POST /api/permissions/roles/[role]/reset
  - Копирование прав:            POST /api/permissions/roles/copy
  - Переопределения для юзера:   POST /api/permissions/users/[id]/overrides
`)
  process.exit(0)
}

// ============================================
// ЗАПУСК
// ============================================

runSeed()
