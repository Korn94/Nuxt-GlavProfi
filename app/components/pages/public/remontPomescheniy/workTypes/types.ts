// app/components/pages/public/remontPomescheniy/workTypes/types.ts

// === WorkTypeOverview ===
export interface OverviewAdvantage {
  title: string
  description: string
  icon: string
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

// === PriceFactors ===
export interface PriceFactor {
  title: string
  description: string
  icon: string
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
  icon: string
  duration: string
  result?: string
  highlighted?: boolean
}

// === GuaranteesGrid ===
export interface GuaranteeItem {
  title: string
  description: string
  icon: string
}

// === FAQBlock ===
export interface FAQItem {
  question: string
  answer: string
}

// === StickyNav ===
export interface StickyNavItem {
  id: string
  label: string
  icon: string
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
  icon: string
}

export interface MaterialCardData {
  name: string
  fullName: string
  color: string
  image: string
  colorLabel: string
  badge?: string
  properties: MaterialProperty[]
  useFor: string[]
  avoidFor?: string[]
}

export interface ThicknessOption {
  value: string
  purpose: string
}

// === Breadcrumbs ===
export interface BreadcrumbItem {
  label: string
  to?: string
}

// === BeforeAfterShowcase ===
export interface BeforeAfterItem {
  beforeImage: string
  afterImage: string
}
