// scripts/generate-brand-images.mjs
/**
 * 🖼️ Разовые брендовые ассеты из существующих картинок (без внешних сервисов).
 *
 * Что делает:
 * 1. `public/og-<slug>.jpg` (1200×630) для 11 страниц типов помещений —
 *    из фотографий `public/main/remont-pomescheniy/*.webp`;
 * 2. `public/og-default.jpg` — из `public/og-image.jpg`;
 * 3. `public/logo.png` (512×512) — вырезка логотипа со стелы на `og-image.jpg`
 *    (нужна для `logo` в JSON-LD: Яндекс её не читает, Google — да).
 *
 * Запуск: `node scripts/generate-brand-images.mjs`
 * Повторный запуск безопасен — файлы перезаписываются.
 */
import fs from 'node:fs'
import path from 'node:path'
import sharp from 'sharp'

const ROOT = process.cwd()
const PUBLIC_DIR = path.join(ROOT, 'public')
const SOURCE_PHOTOS = path.join(PUBLIC_DIR, 'main/remont-pomescheniy')

/** slug страницы → файл фотографии в public/main/remont-pomescheniy */
const PREMISES_IMAGES = {
  banki: 'banki.webp',
  magaziny: 'magaziny.webp',
  ofisy: 'ofisy.webp',
  salony: 'salony.webp',
  fitness: 'fitnes.webp',
  sklady: 'sklady.webp',
  proizvodstvo: 'ceha.webp',
  angary: 'angary.webp',
  kliniki: 'medicina.webp',
  mopy: 'mopy.webp',
  fasady: 'fasady.webp',
}

/** 1200×630 — стандарт Open Graph; кроп по центру, без искажений. */
const OG_WIDTH = 1200
const OG_HEIGHT = 630

async function writeOgImage(source, target) {
  await sharp(source)
    .resize(OG_WIDTH, OG_HEIGHT, { fit: 'cover', position: 'centre' })
    .jpeg({ quality: 82, mozjpeg: true })
    .toFile(target)
  console.log(`✓ ${path.relative(ROOT, target)}`)
}

for (const [slug, file] of Object.entries(PREMISES_IMAGES)) {
  const source = path.join(SOURCE_PHOTOS, file)
  if (!fs.existsSync(source)) {
    console.warn(`⚠️ нет исходника: ${path.relative(ROOT, source)} — пропускаю ${slug}`)
    continue
  }

  await writeOgImage(source, path.join(PUBLIC_DIR, `og-${slug}.jpg`))
}

// og-default.jpg — общий фолбэк для страниц без своей картинки
await writeOgImage(path.join(PUBLIC_DIR, 'og-image.jpg'), path.join(PUBLIC_DIR, 'og-default.jpg'))

// logo.png — логотип со стелы: mark + название (кроп внутри панели, без слогана).
// ⚠️ Поворот не применяем: надпись на панели горизонтальна, наклонена только
// сама стела — при повороте кропа текст уходил по диагонали.
const logoSource = path.join(PUBLIC_DIR, 'og-image.jpg')

const logoWidth = 430
const logoHeight = 372
const logoLeft = 395
const logoTop = 392

await sharp(logoSource)
  .extract({ left: logoLeft, top: logoTop, width: logoWidth, height: logoHeight })
  .resize(512, 512, { fit: 'cover', position: 'centre' })
  .png({ compressionLevel: 9 })
  .toFile(path.join(PUBLIC_DIR, 'logo.png'))

console.log('✓ public/logo.png')
