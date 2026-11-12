// app/components/pages/public/offers/kp/types.ts
//
// Модель данных коммерческого предложения.
//
// Идея конструктора: «страница КП» = список готовых блоков (KpHero, KpEstimate, ...),
// а все суммы, наименования и тексты лежат в отдельном файле
// app/components/pages/public/offers/data/<slug>.ts в формате KpData.
//
// Смета обычно уже посчитана вручную/в CRM, поэтому здесь нет формул ценообразования:
// есть только количество × цена (либо фиксированная сумма) и группировка по разделам.

/** Позиция сметы. Сумма = price × qty; если price не задан — берётся sum. */
export interface KpLineItem {
  /** Наименование работы/материала */
  name: string
  /** Единица измерения: м², м.п., шт, компл., кг, л... */
  unit?: string
  /** Объём. Можно писать как в смете: '40,2', '~800', '1' */
  qty?: string | number
  /** Цена за единицу. null/undefined → сумма берётся из sum */
  price?: number | null
  /** Фиксированная сумма по позиции (комплект, «по факту») */
  sum?: number
  /** Материал по позиции. Если заполнен хоть у одной позиции — в таблице появится колонка «Материал» */
  material?: string
  /** Сноска под наименованием (уточнение по объёму, бренду и т.п.) */
  note?: string
  /** Опция: показывается в смете, но не входит в итоговую сумму */
  optional?: boolean
}

/** Раздел сметы (подраздел внутри группы) */
export interface KpSection {
  /** Уникальный ключ — используется в summary и диаграммах */
  key: string
  title: string
  /** Пояснение под заголовком раздела (как считались объёмы и т.п.) */
  hint?: string
  /** Иконка material-symbols:* (резерв под будущие блоки) */
  icon?: string
  /**
   * Ключ объединения для диаграммы «Разделы сметы».
   * Разделы разных групп с одинаковым chartKey суммируются в один сегмент
   * (например «Потолки» = работы по потолкам + материалы для потолков).
   */
  chartKey?: string
  /** Подпись сегмента диаграммы (по умолчанию — title) */
  chartLabel?: string
  items: KpLineItem[]
}

/** Группа разделов: «Работы», «Материалы» или любая другая */
export interface KpGroup {
  key: string
  label: string
  icon?: string
  /** Подпись под карточкой в KpSummary (авто-режим) */
  hint?: string
  /** Своя подпись строки итога в KpEstimate (например «Итого работы») */
  totalLabel?: string
  sections: KpSection[]
}

/** Шапка документа */
export interface KpMeta {
  /** Основной заголовок, например «Отделка пространства» */
  title: string
  /** Акцентная часть заголовка (градиент), например «Движения Первых» */
  titleAccent?: string
  /** Хвост заголовка после акцента, например «Вариант 2 (Армстронг)» */
  titleSuffix?: string
  /** Объект: «Помещение · 176 м² · г. Рязань» */
  object?: string
  number?: string
  date?: string
  /** Срок действия предложения */
  validUntil?: string
  /** Заказчик (необязательная строка в шапке) */
  customer?: string
  /** Плашка над заголовком. undefined → «Предварительный рассчет», null → скрыть */
  badge?: string | null
  /** Иконка плашки */
  badgeIcon?: string
  /** Подпись над итоговой суммой (по умолчанию «Итого по смете») */
  totalLabel?: string
  /** Пояснение под итоговой суммой */
  totalNote?: string
}

/** Карточка сводки (KpSummary) */
export interface KpSummaryCard {
  label: string
  hint?: string
  icon?: string
  /** Сумма группы по её ключу */
  groupKey?: string
  /** Сумма раздела по его ключу (если нужна разбивка по разделам) */
  sectionKey?: string
  /** Карточка «Итого по смете» */
  total?: boolean
  /** Оформление: обычная / «материалы» (жёлтая) / итоговая (тёмная) */
  tone?: 'default' | 'materials' | 'total'
}

/** Примечание (KpNotes) */
export interface KpNote {
  title?: string
  /** Текст. Можно использовать <b>/<i> — это авторский контент, а не пользовательский ввод */
  text: string
  icon?: string
}

/** Баннер-акцент (KpCallout) */
export interface KpCalloutData {
  title?: string
  text?: string
  icon?: string
  ctaText?: string
  ctaHref?: string
  ctaIcon?: string
}

/** Подвал с призывом (KpFooterCta) */
export interface KpFooterData {
  title?: string
  text?: string
  ctaText?: string
  ctaHref?: string
  icon?: string
}

/** Строка своего подытога итогового блока KpEstimate */
export interface KpEstimateTotalRow {
  /**
   * Подпись строки. Не задана — берётся заголовок единственного раздела
   * (для строк, где суммируется один раздел)
   */
  label?: string
  /** Ключи разделов, сумма которых попадает в строку */
  sectionKeys: string[]
}

/** Свой подытог итогового блока KpEstimate (KpEstimateConfig.totalGroups) */
export interface KpEstimateTotalGroup {
  /** Подпись строки-подытога, например «Итого работы» */
  label: string
  /** Строки подытога в нужном порядке; сумму подытога считаем по ним */
  rows: KpEstimateTotalRow[]
}

/** Настройки блока сметы (KpEstimate) */
export interface KpEstimateConfig {
  title?: string
  lead?: string
  /** Табы между группами. По умолчанию включаются, если групп больше одной */
  showTabs?: boolean
  /** Строки итогового блока: по группам (по умолчанию) или по разделам */
  totalRows?: 'groups' | 'sections'
  /**
   * Свои подытоги итогового блока — когда табы сгруппированы не так, как итоги
   * (например табы по этажам, а итоги «Работы» / «Материалы»).
   * Если заданы, группы в итоговом блоке не используются.
   */
  totalGroups?: KpEstimateTotalGroup[]
  /** Подпись финальной строки (по умолчанию «Всего по смете») */
  totalLabel?: string
}

/** Настройки диаграмм (KpBudgetCharts) */
export interface KpChartsConfig {
  title?: string
  lead?: string
  /** both — «группы + разделы», split — только группы, structure — только разделы */
  mode?: 'both' | 'split' | 'structure'
}

/** Корректировка итога: скидка (минус) или надбавка (плюс) */
export interface KpAdjustment {
  label: string
  amount: number
}

/** Правка одного существующего раздела сметы внутри варианта */
export interface KpSectionPatch {
  title?: string
  hint?: string
  chartKey?: string
  chartLabel?: string
  /** Полная замена позиций раздела */
  items?: KpLineItem[]
}

/** Что меняется в документе при выборе варианта */
export interface KpVariantPatch {
  meta?: Partial<KpMeta>
  /** Правки существующих разделов по ключу; null — удалить раздел */
  sections?: Record<string, KpSectionPatch | null>
  /** Новые разделы: в какую группу, перед каким разделом, какие разделы */
  addSections?: { groupKey: string, before?: string, sections: KpSection[] }[]
  /** Полная замена групп (если различия глобальные) */
  groups?: KpGroup[]
  summary?: KpSummaryCard[]
  estimate?: KpEstimateConfig
  charts?: KpChartsConfig
  callouts?: KpCalloutData[]
  notesTitle?: string
  /** Полная замена примечаний */
  notes?: KpNote[]
  /** Точечные правки примечаний по заголовку; null — удалить примечание */
  notesPatch?: Record<string, Partial<KpNote> | null>
  footer?: KpFooterData
  adjustments?: KpAdjustment[]
}

/**
 * Вариант коммерческого предложения.
 *
 * Варианты взаимоисключающие: на странице показывается один активный.
 * Достаточно задать `patch` — он накладывается на базовый документ.
 * Если вариант проще описать целиком, используйте `data`.
 */
export interface KpVariant {
  key: string
  label: string
  /** Короткая подпись для мобильных */
  shortLabel?: string
  /** Пояснение под переключателем */
  hint?: string
  icon?: string
  /** Плашка «рекомендуем», «дешевле» и т.п. */
  badge?: string
  /** Вариант по умолчанию */
  default?: boolean
  /** Патч поверх базового документа */
  patch?: KpVariantPatch
  /** Либо полностью самостоятельный документ (без наследования) */
  data?: KpData
}

/** Полный документ КП */
export interface KpData {
  meta: KpMeta
  groups: KpGroup[]
  /**
   * Варианты КП. Если не заданы (или их меньше двух) —
   * документ показывается как есть, без переключателя.
   */
  variants?: KpVariant[]
  /** Свои карточки сводки. Если не заданы — строятся автоматически по группам + «Итого» */
  summary?: KpSummaryCard[]
  estimate?: KpEstimateConfig
  charts?: KpChartsConfig
  callouts?: KpCalloutData[]
  notesTitle?: string
  notes?: KpNote[]
  footer?: KpFooterData
  adjustments?: KpAdjustment[]
}

/** Типизация data-файла без импорта интерфейсов в каждом файле */
export const defineKpData = (data: KpData): KpData => data
