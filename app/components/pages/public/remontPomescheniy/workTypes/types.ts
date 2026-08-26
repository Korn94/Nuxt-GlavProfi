// app/components/pages/public/remontPomescheniy/workTypes/types.ts

// === WorkTypeOverview ===
export interface OverviewAdvantage {
  title: string
  description: string
  icon: string
}

// === MethodComparison ===
export interface MethodOption {
  title: string
  icon: string
  priceWorkId: number
  priceFrom: number
  recommended?: boolean
  whenToUse: string[]
  pros: string[]
  cons: string[]
}

// === TechnicalInsights ===
export interface InsightItem {
  title: string
  description: string
  icon: string
  highlight?: boolean
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
}

export interface CalculatorTab {
  id: string
  label: string
  icon: string
  works: CalculatorWorkItem[]
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
  priceFrom: number
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
