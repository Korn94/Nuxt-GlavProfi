// app/components/pages/public/remontPomescheniy/workTypes/types.ts
import type { NormalizedWorkItem } from '~/types/calculator'

/**
 * Типы переиспользуемых UI-блоков живут в единственном месте —
 * `../ui/types.ts` (см. комментарий там). Отсюда они ре-экспортируются,
 * чтобы все `data/pages/*.ts` продолжали импортировать их из `../../types`.
 */
export type {
  PriceFactor,
  FAQItem,
  StickyNavItem,
  BreadcrumbItem,
} from '../ui/types'

// === WorkTypeOverview ===
export interface OverviewAdvantage {
  title: string
  description: string
  /** Блок рисует fallback `mdi:check-circle` */
  icon?: string
}

// === MethodComparison ===
export interface MethodSpecs {
  /** Звукоизоляция, напр. «~48 дБ» */
  soundproof?: string
  /** Толщина, напр. «100 мм» */
  thickness?: string
  /** Прочность — «Базовый» / «Высокий» / «Очень высокий» */
  strength?: string
  /** Вес, напр. «~40 кг/м²» */
  weight?: string
  /** Огнестойкость — «Есть» / «REI 30» */
  fireRating?: string
  
  // === Плитка / Напольные покрытия ===
  /** Формат плитки, напр. «30×30 – 60×60 см» */
  format?: string
  /** Основание для укладки */
  base?: string
  /** Допустимая нагрузка */
  load?: string
  /** Особенности ухода */
  care?: string

  // === Выравнивание стен (обшивка ГКЛ) ===
  /** Сколько сантиметров «съедает» от стены */
  spaceLoss?: string
  /** Максимальный перепад, который метод способен выровнять */
  maxDeviation?: string
  /** Время монтажа на типовую комнату/объект */
  speed?: string
  /** Возможность скрыть коммуникации */
  communications?: string

  // === Штукатурка стен ===
  /** Максимальная толщина слоя без армирования */
  maxLayer?: string
  /** Время высыхания до следующего этапа работ */
  dryingTime?: string
  /** Устойчивость к влаге (Нет / Низкая / Высокая) */
  moistureResistance?: string
  /** Под какие финишные покрытия подходит */
  suitableFor?: string
  /** Для каких помещений метод оптимален */
  bestFor?: string

  // === Шпаклёвка стен ===
  /** Общая толщина слоёв шпаклёвки */
  layerThickness?: string
  /** Для какого финишного покрытия подходит */
  finishType?: string
  /** Визуальное качество поверхности */
  smoothness?: string
  /** Время выполнения работ */
  duration?: string
  /** Метод контроля качества */
  qualityControl?: string

  /** 
   * Позволяет добавлять произвольные характеристики для новых услуг 
   * (покраска, полы, потолки) без правки типа
   */
  [key: string]: string | undefined
}

export interface MethodOption {
  /** Название метода */
  title: string
  /** Иконка */
  icon?: string
  /** Короткая характеристика (одна строка) — показывается под названием */
  tagline?: string
  priceWorkId?: number
  priceWorkIds?: number[]
  priceFrom?: number
  /** Технические характеристики для таблицы сравнения */
  specs?: MethodSpecs
  recommended?: boolean
  /** Когда применять */
  whenToUse: string[]
  /** Плюсы (обратная совместимость с другими страницами) */
  pros?: string[]
  /** Минусы / ограничения */
  cons?: string[]
}

// === TechnicalInsights ===
export interface InsightItem {
  title: string
  description: string
  icon?: string
  highlight?: boolean
  fact?: string
}

// === PriceCalculatorTabs ===
export interface CalculatorWorkItem {
  name: string
  price: number
  unit: string
}

export interface CalculatorExtraItem {
  id: string
  name: string
  price: number
  unit: string
  category?: string
  recommended?: boolean
}

export interface ZatirkaOption {
  id: string
  name: string
  price: number
  unit: string
  recommended?: boolean
  description?: string
}

export interface TileSizeOption {
  id: string
  name: string
  price: number
  unit: string
  recommended?: boolean
  description?: string
  workId?: number
}

/**
 * 🆕 Универсальный вариант выбора (для ГКЛ, краски, и т.д.)
 */
export interface BaseOption {
  id: string
  name: string
  price: number
  unit: string
  recommended?: boolean
  description?: string
  badge?: string
}

export interface CalculatorTab {
  id: string
  label: string
  icon: string
  works: CalculatorWorkItem[]
  zatirkaOptions?: ZatirkaOption[]
  tileSizeOptions?: TileSizeOption[]
  /** 🆕 Универсальные варианты выбора (альтернатива tileSizeOptions) */
  baseOptions?: BaseOption[]
  /** 🆕 Кастомный заголовок для блока baseOptions (по умолчанию "Вариант исполнения") */
  baseOptionsLabel?: string
  extras: CalculatorExtraItem[]
}

// === WorkStagesTimeline ===
export interface WorkStage {
  title: string
  description: string
  /** Блок рендерит иконку под `v-if` */
  icon?: string
  /** Мета-строка «Длительность» — рендерится под `v-if` */
  duration?: string
  result?: string
  highlighted?: boolean
}

// === GuaranteesGrid ===
export interface GuaranteeItem {
  title: string
  description: string
  /** Блок рисует fallback `mdi:shield-check` */
  icon?: string
}

// === RelatedWorkTypes ===
export interface RelatedWorkTypeItem {
  title: string
  to: string
  icon: string
  priceWorkId: number
  priceFrom?: number
  active?: boolean
  description: string
  image: string
}

// === MaterialsGuide ===
export interface MaterialProperty {
  label: string
  /** Пилюля рендерит иконку под `v-if` */
  icon?: string
}

export interface MaterialCardData {
  /** Аббревиатура: ГКЛ, ГКЛВ, ГВЛ... */
  name: string
  /** Полное название */
  fullName: string
  /** Цвет листа (для полосы и акцентов) */
  color: string
  /** Фото материала (блок рендерит под `v-if`) */
  image?: string
  /** Alt для фото */
  imageAlt?: string
  /** Подпись про цвет/маркировку */
  colorLabel?: string
  /** Бейдж: "Базовый", "Для влажных"... */
  badge?: string
  /** Свойства (пилюли) */
  properties?: MaterialProperty[]
  /** Где применяется */
  useFor: string[]
  /** Где не применяется */
  avoidFor?: string[]
}

export interface ThicknessOption {
  value: string
  purpose: string
}

// === BeforeAfterShowcase ===
/**
 * Универсальный ShowcaseItem:
 * - Пара (до/после): нужны beforeImage + afterImage
 * - Одиночное фото: нужен src
 */
export interface ShowcaseItem {
  beforeImage?: string
  afterImage?: string
  beforeAlt?: string
  afterAlt?: string
  src?: string
  alt?: string
}

// === TechnicalInsights (сравнение) ===
/** Фото для блока сравнения */
export interface ComparisonImage {
  /** URL изображения */
  src: string
  /** Подпись под фото (например, "1 слой ГКЛ") */
  label: string
  /** alt-атрибут для SEO (если не указан — берётся label) */
  alt?: string
}

// === PriceListTable / MethodComparison / RelatedWorkTypes ===
/** Срез прайса, передаваемый из страницы в блоки, чтобы избежать ре-фетча и рассинхрона SSR/CSR */
export interface PriceData {
  standard: NormalizedWorkItem[]
  piece: NormalizedWorkItem[]
}
