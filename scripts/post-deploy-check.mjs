/**
 * Smoke-проверка рантайм-зависимостей на прод-сервере.
 *
 * Запускается из deploy.sh после `pm2 reload`:
 *   ssh ... "cd ${REMOTE_DIR} && node --input-type=module -" < scripts/post-deploy-check.mjs
 *
 * Проверяет, что из `.output/server/node_modules` реально грузятся модули, которые
 * нужны в рантайме (sharp — загрузка фото в портфолио, busboy — парсинг multipart,
 * drizzle-orm/mysql2 — БД, minisearch — поиск). Раньше такие поломки были видны
 * только по 500-кам в проде.
 *
 * Важно: импорт делается из временного модуля внутри `.output/server`, т.к. Nitro
 * кладёт туда только те файлы, которые реально нужны (например, у drizzle-orm нет
 * CJS-сборки), и bare-specifier должен резолвиться именно оттуда — как в рантайме.
 */
import { existsSync, readFileSync } from 'node:fs'
import { rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'

const OUTPUT_SERVER = join(process.cwd(), '.output', 'server')
const OUTPUT_MODULES = join(OUTPUT_SERVER, 'node_modules')
const PROJECT_MODULES = join(process.cwd(), 'node_modules')
const failures = []

async function check(name, fn) {
  try {
    const info = await fn()
    console.log(`  ✅ ${name}${info ? ` — ${info}` : ''}`)
  } catch (error) {
    const message = error?.message ?? String(error)
    failures.push(`${name}: ${message}`)
    console.log(`  ❌ ${name} — ${message}`)
  }
}

/** Импорт bare-specifier так же, как его делает собранный сервер: из .output/server. */
async function importFromOutput(spec) {
  const file = join(OUTPUT_SERVER, `.runtime-check-${process.pid}-${Date.now()}.mjs`)
  await writeFile(file, `export default await import(${JSON.stringify(spec)})\n`, 'utf8')
  try {
    const module = await import(pathToFileURL(file).href)
    return module.default
  } finally {
    await rm(file, { force: true })
  }
}

function pkgVersion(name) {
  for (const base of [OUTPUT_MODULES, PROJECT_MODULES]) {
    const manifest = join(base, name, 'package.json')
    if (existsSync(manifest)) {
      try {
        return JSON.parse(readFileSync(manifest, 'utf8')).version
      } catch {
        return '?'
      }
    }
  }
  return null
}

if (!existsSync(OUTPUT_SERVER)) {
  console.error(`[runtime-check] не найден ${OUTPUT_SERVER}`)
  process.exit(1)
}

console.log(`[runtime-check] node ${process.version}, ${process.platform}-${process.arch}, cwd=${process.cwd()}`)

await check('sharp (native jpeg)', async () => {
  const { default: sharp } = await importFromOutput('sharp')
  const buffer = await sharp({
    create: { width: 8, height: 8, channels: 3, background: { r: 0, g: 0, b: 0 } },
  }).jpeg().toBuffer()
  if (!buffer?.length) throw new Error('пустой буфер')
  return `vips ${sharp.versions.vips}, ${buffer.length} B`
})

await check('busboy (multipart-загрузка)', async () => {
  await importFromOutput('busboy')
})

await check('drizzle-orm/mysql2 (БД)', async () => {
  await importFromOutput('drizzle-orm/mysql2')
})

await check('minisearch (поиск)', async () => {
  await importFromOutput('minisearch')
})

await check('ключевые рантайм-пакеты', async () => {
  const names = [
    'sharp',
    'busboy',
    'minisearch',
    'uqr',
    'drizzle-orm',
    'mysql2',
    'socket.io',
    'nodemailer',
    'jsonwebtoken',
    'bcryptjs',
    'node-telegram-bot-api',
    'vue',
    'unhead',
    'zod',
  ]
  const missing = names.filter((name) => pkgVersion(name) === null)
  if (missing.length > 0) throw new Error(`отсутствуют: ${missing.join(', ')}`)
  return names.map((name) => `${name}@${pkgVersion(name)}`).join(', ')
})

if (failures.length > 0) {
  console.error(`\n❌ [runtime-check] провалено проверок: ${failures.length}`)
  for (const failure of failures) console.error(`   - ${failure}`)
  process.exit(1)
}

console.log('[runtime-check] все зависимости загружаются')

