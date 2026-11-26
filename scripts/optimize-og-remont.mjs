// scripts/optimize-og-remont.mjs
/**
 * 🖼️ Пережимает OG-картинку `public/og-remont-kommercheskih.jpg` (1200×630).
 *
 * Зачем: файл весит ~330 КБ и отдаётся со страниц главной, /remont-pomescheniy
 * и /projects. Цель — 100–150 КБ при том же кадре.
 *
 * Запуск: `node scripts/optimize-og-remont.mjs` (или `npm run images:og-remont`)
 *
 * ⚠️ `og-image.jpg` НЕ трогаем: из него по координатам вырезается `logo.png`
 * (см. scripts/generate-brand-images.mjs). Здесь только производный OG-шаблон.
 * Повторный запуск безопасен: файл в пределах лимита не пережимается.
 */
import fs from 'node:fs'
import path from 'node:path'
import sharp from 'sharp'

const ROOT = process.cwd()
const TARGET = path.join(ROOT, 'public', 'og-remont-kommercheskih.jpg')

/** 1200×630 — стандарт Open Graph; кроп по центру, без искажений. */
const WIDTH = 1200
const HEIGHT = 630
/** Выше лимита — пережимаем; 100–150 КБ — целевой диапазон. */
const MAX_BYTES = 160 * 1024
const TARGET_MAX_BYTES = 150 * 1024
/** Пробуем от лучшего качества к худшему, пока не уложимся в целевой размер. */
const QUALITIES = [80, 78, 76, 74, 72, 70]

if (!fs.existsSync(TARGET)) {
  console.error(`❌ нет файла: ${path.relative(ROOT, TARGET)}`)
  process.exit(1)
}

const before = fs.statSync(TARGET).size
if (before <= MAX_BYTES) {
  console.log(`✓ ${path.relative(ROOT, TARGET)} — ${Math.round(before / 1024)} КБ, пережимать не нужно`)
  process.exit(0)
}

const source = await fs.promises.readFile(TARGET)

let best = null
for (const quality of QUALITIES) {
  const buffer = await sharp(source)
    .resize(WIDTH, HEIGHT, { fit: 'cover', position: 'centre' })
    .jpeg({ quality, mozjpeg: true, progressive: true })
    .toBuffer()

  best = { buffer, quality }
  if (buffer.length <= TARGET_MAX_BYTES) break
}

if (!best || best.buffer.length >= before) {
  console.log(`✓ ${path.relative(ROOT, TARGET)} — пережатие не дало выигрыша, файл не изменён`)
  process.exit(0)
}

await fs.promises.writeFile(TARGET, best.buffer)

const after = best.buffer.length
console.log(
  `✓ ${path.relative(ROOT, TARGET)}: ${Math.round(before / 1024)} КБ → ${Math.round(after / 1024)} КБ (q${best.quality})`,
)
if (after > TARGET_MAX_BYTES) {
  console.warn(`⚠️ не удалось уложиться в ${Math.round(TARGET_MAX_BYTES / 1024)} КБ — проверьте исходник`)
}
