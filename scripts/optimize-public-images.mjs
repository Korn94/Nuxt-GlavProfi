// scripts/optimize-public-images.mjs
/**
 * 🖼️ Респонсив-варианты статических картинок (webp) + манифест для <UiImg>.
 *
 * Зачем: `public/main/**` и `public/brands/**` — исходные JPEG/PNG по 0.3–4.4 МБ,
 * которые уезжают в браузер как есть (главная: ~11 МБ медиа на первую загрузку).
 * Скрипт готовит webp-варианты в 480/960/1600 px и записывает манифест
 * `shared/constants/responsiveImages.json`, по которому `app/utils/responsiveImage.ts`
 * строит `srcset` для `<UiImg>`.
 *
 * Запуск:
 *   node scripts/optimize-public-images.mjs            # только отсутствующие варианты
 *   node scripts/optimize-public-images.mjs --force    # перегенерировать всё
 *
 * Оригиналы НЕ удаляются и НЕ изменяются — они остаются фолбэком в `<img>`.
 */

import fs from 'node:fs'
import path from 'node:path'
import sharp from 'sharp'

const ROOT = process.cwd()
const PUBLIC_DIR = path.join(ROOT, 'public')
const SOURCE_DIRS = ['main', 'brands']
const MANIFEST = path.join(ROOT, 'shared', 'constants', 'responsiveImages.json')

/** Целевые ширины (в px). Вариант шире исходника не создаётся — апскейл запрещён. */
const WIDTHS = [480, 960, 1600]
const WEBP_QUALITY = 72
const EXT_RE = /\.(?:jpe?g|png|webp|avif)$/i
/**
 * Уже сгенерированный вариант (`name-480.webp`, `name-1600.webp`).
 * Такие файлы НЕ должны попадать в список исходников — иначе скрипт
 * создаёт варианты вариантов (`name-960-480.webp`).
 */
const VARIANT_RE = /-(?:480|960|1600)(?:-\d+)*\.webp$/i
const FORCE = process.argv.includes('--force')

/** `/main/video/main-poster.webp` → `/main/video/main-poster-480.webp` */
function variantPath(urlPath, width) {
  return urlPath.replace(EXT_RE, `-${width}.webp`)
}

function toUrlPath(absolutePath) {
  return '/' + path.relative(PUBLIC_DIR, absolutePath).split(path.sep).join('/')
}

function walk(dir, acc = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) walk(full, acc)
    else if (EXT_RE.test(entry.name) && !VARIANT_RE.test(entry.name)) acc.push(full)
  }
  return acc
}

async function buildVariant(source, target, width) {
  await sharp(source, { failOn: 'none' })
    .rotate()
    .resize({ width, withoutEnlargement: true })
    .webp({ quality: WEBP_QUALITY, effort: 4 })
    .toFile(target)
}

const sources = SOURCE_DIRS.flatMap((dir) => {
  const abs = path.join(PUBLIC_DIR, dir)
  return fs.existsSync(abs) ? walk(abs) : []
}).sort()

const manifest = {}
let created = 0
let skipped = 0
let failed = 0

for (const source of sources) {
  const urlPath = toUrlPath(source)
  let meta
  try {
    meta = await sharp(source, { failOn: 'none' }).metadata()
  } catch (error) {
    console.warn(`⚠️ ${urlPath}: не читается (${error.message})`)
    failed++
    continue
  }

  const sourceWidth = meta.width ?? 0
  if (!sourceWidth) {
    skipped++
    continue
  }

  const sourceHeight = meta.height ?? 0
  const widths = []
  for (const width of WIDTHS) {
    if (width > sourceWidth) continue

    const target = path.join(PUBLIC_DIR, variantPath(urlPath, width).replace(/^\//, ''))
    widths.push(width)

    if (!FORCE && fs.existsSync(target)) {
      skipped++
      continue
    }

    try {
      await buildVariant(source, target, width)
      created++
    } catch (error) {
      console.warn(`⚠️ ${urlPath} @${width}px: ${error.message}`)
      failed++
    }
  }

  // Если исходник меньше минимальной ширины — вариант не нужен, <UiImg> отдаст оригинал.
  // Формат записи: [ширина, высота, [доступные ширины вариантов]] — компактнее объекта
  // (манифест уезжает в клиентский бандл и должен весить минимум).
  if (widths.length > 0) {
    manifest[urlPath] = [sourceWidth, sourceHeight, widths]
  }
}

fs.mkdirSync(path.dirname(MANIFEST), { recursive: true })
fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + '\n', 'utf8')

console.log(
  `\n✅ вариантов создано: ${created}, пропущено (уже есть): ${skipped}, ошибок: ${failed}` +
    `\n📄 манифест: ${path.relative(ROOT, MANIFEST)} (${Object.keys(manifest).length} картинок)`
)
