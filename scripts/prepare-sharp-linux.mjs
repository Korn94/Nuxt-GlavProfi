#!/usr/bin/env node
/**
 * Подготовка Linux-бинарников sharp для прод-сборки.
 *
 * Сборка выполняется на Windows (`npm run build` → `postbuild`), а прод-сервер —
 * Linux (Ubuntu, glibc). Nitro кладёт в `.output/server/node_modules` тот вариант
 * sharp, который установлен локально, т.е. `@img/sharp-win32-x64` — на сервере
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
 *   5. проверяет, что `.node` — настоящий ELF (иначе сборка падает);
 *   6. чистит временный каталог.
 *
 * На Linux-машине шаг пропускается: там зависимости уже нативные.
 */
import { execFileSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { cp, mkdir, mkdtemp, readFile, readdir, rm, stat } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'

const ROOT = resolve(import.meta.dirname, '..')
const OUTPUT_SERVER = join(ROOT, '.output', 'server')
const TARGET_IMG = join(OUTPUT_SERVER, 'node_modules', '@img')
const LINUX_PACKAGES = ['sharp-linux-x64', 'sharp-libvips-linux-x64']
const SHARP_BINDING = ['sharp-linux-x64', 'lib', 'sharp-linux-x64.node']

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

  const srcBinding = join(srcImg, ...SHARP_BINDING)
  if (!existsSync(srcBinding)) {
    throw new Error(`в @img/sharp-linux-x64 нет ${SHARP_BINDING.slice(1).join('/')}`)
  }
  const libvipsLibs = (await readdir(join(srcImg, 'sharp-libvips-linux-x64', 'lib'))).filter((f) => f.includes('libvips'))
  if (libvipsLibs.length === 0) {
    throw new Error('в @img/sharp-libvips-linux-x64/lib нет библиотек libvips')
  }

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

  const destBinding = join(TARGET_IMG, ...SHARP_BINDING)
  if (!existsSync(destBinding)) {
    throw new Error(`после копирования нет ${join('.output/server/node_modules/@img', ...SHARP_BINDING)}`)
  }
  if (!(await isElf(destBinding))) {
    throw new Error('sharp-linux-x64.node не является ELF-бинарником — на сервере он не загрузится')
  }

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
