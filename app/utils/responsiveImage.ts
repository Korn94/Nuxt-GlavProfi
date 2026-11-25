// app/utils/responsiveImage.ts
/**
 * Респонсив-варианты статических картинок (`public/main/**`, `public/brands/**`).
 *
 * Манифест `shared/constants/responsiveImages.json` генерируется скриптом
 * `scripts/optimize-public-images.mjs` и живёт в репозитории вместе с самими
 * webp-вариантами. Формат записи: `[ширина, высота, [доступные ширины]]`.
 */
import manifest from 'shared/constants/responsiveImages.json'

type ImageEntry = [width: number, height: number, variants: number[]]

// JSON импортируется как `(number | number[])[]` — приводим через unknown к точному типу
const IMAGES = manifest as unknown as Record<string, ImageEntry>

const EXT_RE = /\.(?:jpe?g|png|webp|avif)$/i

/** `/main/1.jpg` → `/main/1-960.webp` */
export function variantSrc(src: string, width: number): string {
  return src.replace(EXT_RE, `-${width}.webp`)
}

export function imageEntry(src: string | undefined | null): ImageEntry | null {
  if (!src) return null
  return IMAGES[src] ?? null
}

/** Есть ли для картинки готовые webp-варианты (иначе рендерим обычный <img>) */
export function hasResponsiveVariants(src: string | undefined | null): boolean {
  return Boolean(imageEntry(src))
}

/** `srcset` вида `/main/1-480.webp 480w, /main/1-960.webp 960w, …` */
export function responsiveSrcset(src: string): string {
  const entry = imageEntry(src)
  if (!entry) return ''
  const [, , variants] = entry
  return variants.map((width) => `${variantSrc(src, width)} ${width}w`).join(', ')
}

/**
 * Наиболее подходящий одиночный вариант — используется как `src` у `<img>`
 * внутри `<picture>` (фолбэк для браузеров без поддержки webp/srcset).
 */
export function bestVariantSrc(src: string): string {
  const entry = imageEntry(src)
  if (!entry) return src
  const [, , variants] = entry
  const widest = variants[variants.length - 1]
  return typeof widest === 'number' ? variantSrc(src, widest) : src
}

/** Исходные размеры картинки (нужны для width/height — без них браузер даёт CLS) */
export function intrinsicSize(src: string | undefined | null): { width?: number; height?: number } {
  const entry = imageEntry(src)
  if (!entry) return {}
  return { width: entry[0], height: entry[1] }
}

export interface ResponsiveImageOptions {
  /** Подсказка браузеру о занимаемой ширине: `(max-width: 768px) 100vw, 33vw` */
  sizes?: string
  /** Переопределить ширину (px или CSS-значение — как у обычного <img>) */
  width?: number | string
  height?: number | string
}

export interface ResponsiveImageAttrs {
  src: string
  srcset?: string
  sizes?: string
  width?: number | string
  height?: number | string
}

/**
 * Атрибуты для существующего `<img>` — без обёрток и без изменений CSS:
 *
 *   <img v-bind="responsiveImageAttrs(item.image, { sizes: '(max-width: 768px) 100vw, 33vw' })"
 *        alt="" loading="lazy" />
 *
 * Браузер сам выберет webp-вариант нужной ширины (`image-set`-подобное поведение).
 * Формат кандидатов определяется по Content-Type ответа, поэтому `src` может
 * оставаться исходным jpg/png — это фолбэк для очень старых браузеров.
 */
export function responsiveImageAttrs(
  src: string,
  options: ResponsiveImageOptions = {}
): ResponsiveImageAttrs {
  const entry = imageEntry(src)

  if (!entry) {
    // Вариантов нет (например `/uploads/**` — уже оптимизированы sharp при загрузке)
    return {
      src,
      width: options.width,
      height: options.height
    }
  }

  return {
    src: bestVariantSrc(src),
    srcset: responsiveSrcset(src),
    sizes: options.sizes ?? '100vw',
    width: options.width ?? entry[0],
    height: options.height ?? entry[1]
  }
}
