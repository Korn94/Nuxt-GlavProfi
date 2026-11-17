#!/usr/bin/env node
/**
 * Подготовка Linux-бинарников sharp для прод-сборки.
 *
 * Сборка выполняется на Windows (`npm run build` → `postbuild`), а прод-сервер —
 * Linux (Debian 12, glibc ≥ 2.28). Nitro кладёт в `.output/server/node_modules` тот
 * вариант sharp, который установлен локально, т.е. `@img/sharp-win32-x64` — на сервере
 * такой бинарник не загружается (ошибка "Could not load the sharp module using
 * the linux-x64 runtime"), поэтому sharp раньше «работал» только благодаря
 * ручному `npm install` в корне проекта на сервере.
 *
 * Скрипт:
 *   1. читает версию sharp из локального `node_modules/sharp`;
 *   2. докачивает linux-сборку через npm с override платформы
 *      (`--os=linux --cpu=x64 --libc=glibc`) во временный каталог;
 *   3. копирует `@img/sharp-linux-x64` и `@img/sharp-libvips-linux-x64`
 *      в `.output/server/node_modules/@img`;
 *   4. удаляет из `.output` не-linux пакеты sharp (`sharp-win32-x64` и т.п.);
 *   5. проверяет, что нативный биндинг и библиотека libvips — настоящие ELF
 *      (иначе сборка падает, а не прод);
 *   6. чистит временный каталог.
 *
 * ⚠️ Путь к нативному биндингу не хардкодится: он зависит от версии sharp.
 *   - 0.34.x — `@img/sharp-linux-x64/lib/sharp-linux-x64.node`;
 *   - 0.35.x — `@img/sharp-linux-x64/index.cjs` (его отдаёт
 *     `exports["./sharp.node"]`) + версионированный
 *     `lib/sharp-linux-x64-<version>.node`.
 * Поэтому биндинг ищется через `exports["./sharp.node"]` из package.json пакета.
 *
 * На Linux-машине шаг пропускается: там зависимости уже нативные.
 */
import { execFileSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { cp, mkdir, mkdtemp, readFile, readdir, rm, stat } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, relative, resolve } from 'node:path'

const ROOT = resolve(import.meta.dirname, '..')
const OUTPUT_SERVER = join(ROOT, '.output', 'server')
const TARGET_IMG = join(OUTPUT_SERVER, 'node_modules', '@img')
const LINUX_PACKAGES = ['sharp-linux-x64', 'sharp-libvips-linux-x64']
const SHARP_PACKAGE = 'sharp-linux-x64'
const LIBVIPS_PACKAGE = 'sharp-libvips-linux-x64'

const log = (msg) => console.log(`[sharp-linux] ${msg}`)

function fail(msg) {
  console.error(`\n❌ [sharp-linux] ${msg}\n`)
  process.exit(1)
}

/** ELF-магия: 0x7F 'E' 'L' 'F' — признак linux-бинарника. */
async function isElf(path) {
  const buf = await readFile(path)
  return buf.length > 4 && buf[0] === 0x7f && buf[1] === 0x45 && buf[2] === 0x4c && buf[3] === 0x46
}

/** Суммарный размер каталога в байтах (для отчёта в логе). */
async function dirSize(dir) {
  let total = 0
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) total += await dirSize(full)
    else if (entry.isFile()) total += (await stat(full)).size
  }
  return total
}

const toMb = (bytes) => (bytes / (1024 * 1024)).toFixed(1)

/**
 * Путь к нативному биндингу `.node` внутри `@img/sharp-linux-x64`.
 *
 * Имя файла биндинга зависит от версии sharp, поэтому берём точку входа из
 * `exports["./sharp.node"]`:
 *   - 0.34.x — сразу `lib/sharp-linux-x64.node`;
 *   - 0.35.x — `index.cjs`, который делает `require('./lib/sharp-linux-x64-<version>.node')`
 *     (имя файла версионировано).
 * Если точка входа не `.node`, ищем единственный `lib/sharp-*.node`.
 */
async function resolveSharpBinding(pkgDir) {
  const manifestPath = join(pkgDir, 'package.json')
  if (!existsSync(manifestPath)) {
    throw new Error(`нет ${manifestPath}`)
  }
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'))
  const entry = manifest?.exports?.['./sharp.node']
  const rel = typeof entry === 'string' ? entry : entry?.require ?? entry?.default
  if (typeof rel !== 'string') {
    throw new Error(`в @img/${SHARP_PACKAGE}/package.json нет exports["./sharp.node"]`)
  }

  const entryPath = join(pkgDir, rel)
  if (rel.endsWith('.node')) {
    if (!existsSync(entryPath)) {
      throw new Error(`нет ${rel} в @img/${SHARP_PACKAGE}`)
    }
    return entryPath
  }

  if (!existsSync(entryPath)) {
    throw new Error(`exports["./sharp.node"] в @img/${SHARP_PACKAGE} указывает на отсутствующий ${rel}`)
  }
  const libDir = join(pkgDir, 'lib')
  const nativeFiles = existsSync(libDir)
    ? (await readdir(libDir)).filter((f) => f.startsWith('sharp-') && f.endsWith('.node'))
    : []
  if (nativeFiles.length !== 1) {
    throw new Error(
      `в @img/${SHARP_PACKAGE}/lib ожидался один файл sharp-*.node, найдено: ${nativeFiles.join(', ') || 'ничего'}`
    )
  }
  return join(libDir, nativeFiles[0])
}

/** Путь к библиотеке libvips (`.so`) внутри `@img/sharp-libvips-linux-x64`. */
async function resolveLibvipsLibrary(pkgDir) {
  const libDir = join(pkgDir, 'lib')
  const libs = existsSync(libDir)
    ? (await readdir(libDir)).filter((f) => f.includes('libvips') && f.includes('.so'))
    : []
  if (libs.length === 0) {
    throw new Error(`в @img/${LIBVIPS_PACKAGE}/lib нет библиотек libvips`)
  }
  return join(libDir, libs[0])
}

if (process.platform === 'linux') {
  log('платформа linux — бинарники уже нативные, шаг пропущен')
  process.exit(0)
}

if (!existsSync(OUTPUT_SERVER)) {
  fail('не найден .output/server — сначала выполните `nuxt build`')
}

const sharpPkgPath = join(ROOT, 'node_modules', 'sharp', 'package.json')
if (!existsSync(sharpPkgPath)) {
  fail('не найден node_modules/sharp — выполните `npm install`')
}

const sharpVersion = JSON.parse(await readFile(sharpPkgPath, 'utf8')).version
log(`версия sharp в проекте: ${sharpVersion}`)

const tmp = await mkdtemp(join(tmpdir(), 'glavprofi-sharp-linux-'))
let failure = null

try {
  log('скачиваем linux-сборку sharp (npm --os=linux --cpu=x64 --libc=glibc)...')
  const npmArgs = [
    'install',
    `sharp@${sharpVersion}`,
    '--no-save',
    '--no-package-lock',
    '--ignore-scripts',
    '--no-audit',
    '--no-fund',
    '--os=linux',
    '--cpu=x64',
    '--libc=glibc',
  ]
  if (process.platform === 'win32') {
    // npm.cmd нельзя запустить без shell, поэтому зовём через cmd.exe (без DEP0190).
    const comspec = process.env.ComSpec || 'cmd.exe'
    execFileSync(comspec, ['/d', '/s', '/c', `npm ${npmArgs.join(' ')}`], { cwd: tmp, stdio: 'inherit' })
  } else {
    execFileSync('npm', npmArgs, { cwd: tmp, stdio: 'inherit' })
  }

  const srcImg = join(tmp, 'node_modules', '@img')
  for (const pkg of LINUX_PACKAGES) {
    if (!existsSync(join(srcImg, pkg))) {
      throw new Error(`npm не поставил @img/${pkg} — проверьте поддержку --os/--cpu/--libc текущим npm`)
    }
  }

  const srcSharpDir = join(srcImg, SHARP_PACKAGE)
  const srcLibvipsDir = join(srcImg, LIBVIPS_PACKAGE)
  const srcBinding = await resolveSharpBinding(srcSharpDir)
  if (!(await isElf(srcBinding))) {
    throw new Error(`${relative(srcImg, srcBinding)} не является ELF-бинарником — на сервере он не загрузится`)
  }
  const srcLibvips = await resolveLibvipsLibrary(srcLibvipsDir)
  if (!(await isElf(srcLibvips))) {
    throw new Error(`${relative(srcImg, srcLibvips)} не является ELF-библиотекой`)
  }
  log(`скачано: @img/${SHARP_PACKAGE}/${relative(srcSharpDir, srcBinding)}, @img/${LIBVIPS_PACKAGE}/${relative(srcLibvipsDir, srcLibvips)}`)

  await mkdir(TARGET_IMG, { recursive: true })

  // Убираем платформенные пакеты, не нужные на linux (напр. sharp-win32-x64 — 19 МБ DLL).
  for (const entry of await readdir(TARGET_IMG)) {
    if (entry.startsWith('sharp-') && !LINUX_PACKAGES.includes(entry)) {
      await rm(join(TARGET_IMG, entry), { recursive: true, force: true })
      log(`удалён @img/${entry} (не для linux)`)
    }
  }

  for (const pkg of LINUX_PACKAGES) {
    const dest = join(TARGET_IMG, pkg)
    await rm(dest, { recursive: true, force: true })
    await cp(join(srcImg, pkg), dest, { recursive: true })
    log(`скопирован @img/${pkg} → .output/server/node_modules/@img/${pkg} (${toMb(await dirSize(dest))} МБ)`)
  }

  const destSharpDir = join(TARGET_IMG, SHARP_PACKAGE)
  const destLibvipsDir = join(TARGET_IMG, LIBVIPS_PACKAGE)
  const destBinding = await resolveSharpBinding(destSharpDir)
  if (!(await isElf(destBinding))) {
    throw new Error(`${relative(TARGET_IMG, destBinding)} не является ELF-бинарником — на сервере он не загрузится`)
  }
  const destLibvips = await resolveLibvipsLibrary(destLibvipsDir)
  if (!(await isElf(destLibvips))) {
    throw new Error(`${relative(TARGET_IMG, destLibvips)} не является ELF-библиотекой`)
  }
  log(`проверено: @img/${SHARP_PACKAGE}/${relative(destSharpDir, destBinding)}, @img/${LIBVIPS_PACKAGE}/${relative(destLibvipsDir, destLibvips)}`)

  if (!existsSync(join(OUTPUT_SERVER, 'node_modules', 'sharp'))) {
    log('ВНИМАНИЕ: .output/server/node_modules/sharp отсутствует — на сервере модуль будет взят из корневого node_modules')
  }

  const imgDirs = (await readdir(TARGET_IMG)).join(', ')
  log(`готово. .output/server/node_modules/@img: ${imgDirs}`)
} catch (error) {
  failure = error
} finally {
  await rm(tmp, { recursive: true, force: true })
}

if (failure) {
  fail(`сбой подготовки linux-бинарников sharp: ${failure?.message || failure}`)
}
