// app/components/pages/public/prices/data/pricesContent.ts
/**
 * 📝 Тексты hero-блока страницы прайс-листа (/prices/<slug>).
 *
 * Зачем отдельный файл: до этого заголовок H1 собирался из словаря
 * `categoryTitlesForH1` прямо в `prices/index.vue`, а мета-тексты жили
 * в `usePriceSeo.ts`. Два словаря расходились: для нового slug в БД H1
 * подменялся на «ремонтные работы», а title оставался прежним.
 * Теперь тексты страницы прайса по slug — в одном месте.
 *
 * ⚠️ Год в заголовках не хардкодим: он берётся из `CURRENT_YEAR`,
 * иначе в январе следующего года страница начинает врать про «2026».
 */

/** Год для заголовков и подписей. Считается один раз при загрузке модуля. */
export const CURRENT_YEAR = new Date().getFullYear()

export interface PricesHeroChip {
  icon: string
  text: string
}

export interface PricesHeroBadge {
  /** Префикс бейджа, если дата обновления из БД известна */
  updatedPrefix: string
  /** Бейдж, если даты нет: «Актуально на <год> год» */
  fallbackPrefix: string
  fallbackSuffix: string
}

export interface PricesHeroContent {
  /** H1: lead + accent (градиент) + tail */
  h1: { lead: string; accent: string; tail: string }
  /**
   * Подзаголовок: две строки через \n (рендерится `white-space: pre-line`).
   * ⚠️ Без счётчиков позиций/категорий: они уже показаны в bento-панели
   * справа от hero, дублировать их в тексте не нужно.
   */
  subtitle: string
  badge: PricesHeroBadge
  /** Чипы доверия под подзаголовком */
  chips: PricesHeroChip[]
  tocTitle: string
  searchLabel: string
  searchPlaceholder: string
  searchStatus: (count: number) => string
  loadingText: string
  emptyTitle: (query: string) => string
  emptyHint: string
}

// ========================================
// 🔢 СКЛОНЕНИЯ
// ========================================

/** «1 позиция / 2 позиции / 5 позиций» */
const pluralPositions = (count: number): string => {
  const mod10 = count % 10
  const mod100 = count % 100

  if (mod10 === 1 && mod100 !== 11) return 'позиция'
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return 'позиции'
  return 'позиций'
}

// ========================================
// 🛡️ ЧИПЫ ДОВЕРИЯ (общие для всех категорий)
// ========================================
// Формулировки взяты из уже используемых на сайте обязательств:
// договор и фиксация сметы, гарантия 3 года, скидки от 100 м²
// (см. workTypes/data/pages/*.ts) — новых обещаний здесь не появляется.
const TRUST_CHIPS: PricesHeroChip[] = [
  { icon: 'mdi:file-sign', text: 'Смета в договоре' },
  { icon: 'mdi:shield-check-outline', text: 'Гарантия 3 года' },
  { icon: 'mdi:percent-outline', text: 'Скидки от 100 м²' },
]

const BADGE: PricesHeroBadge = {
  updatedPrefix: 'Обновлено',
  fallbackPrefix: 'Актуально на',
  fallbackSuffix: 'год',
}

const COMMON_TEXTS = {
  tocTitle: 'Содержание прайса',
  loadingText: 'Загружаем актуальный прайс…',
  emptyHint:
    'Попробуйте изменить запрос — или напишите нам: подскажем, как называется нужная работа, и посчитаем по вашему объёму.',
} as const


// ========================================
// 📄 ТЕКСТЫ ПО SLUG
// ========================================

/** Тексты для slug, которого нет в словаре (новую страницу завели в CRM) */
const DEFAULT_CONTENT: PricesHeroContent = {
  h1: {
    lead: 'Прайс-лист на',
    accent: 'ремонтные работы',
    tail: `в Рязани — цены ${CURRENT_YEAR}`,
  },
  subtitle:
    'Цены за работу без материалов.\nСмета фиксируется в договоре до начала работ. Рязань и область.',
  badge: BADGE,
  chips: TRUST_CHIPS,
  ...COMMON_TEXTS,
  searchLabel: 'Поиск по прайсу',
  searchPlaceholder: 'Найти работу в прайсе…',
  searchStatus: (count) => `Найдено: ${count}`,
  emptyTitle: (query) => `По запросу «${query}» ничего не найдено`,
}

const CONTENT_BY_SLUG: Record<string, PricesHeroContent> = {
  // Отделочные работы
  'otdelochnye-raboty': {
    h1: {
      lead: 'Прайс-лист на',
      accent: 'отделочные работы',
      tail: `в Рязани — цены ${CURRENT_YEAR}`,
    },
    subtitle:
      'Цены за работу без материалов.\nСмета фиксируется в договоре до начала работ. Рязань и область.',
    badge: BADGE,
    chips: TRUST_CHIPS,
    ...COMMON_TEXTS,
    searchLabel: 'Поиск по отделочным работам',
    searchPlaceholder: 'Найти работу: шпаклёвка, плитка, ГКЛ…',
    searchStatus: (count) => `Найдено ${count} ${pluralPositions(count)}`,
    emptyTitle: (query) => `По запросу «${query}» ничего не найдено`,
  },

  // Сантехнические работы
  plumbing: {
    h1: {
      lead: 'Прайс-лист на',
      accent: 'сантехнические работы',
      tail: `в Рязани — цены ${CURRENT_YEAR}`,
    },
    subtitle:
      'Цены за работу с единицей измерения.\nМатериалы считаем отдельно по вашей спецификации. Рязань и область.',
    badge: BADGE,
    chips: TRUST_CHIPS,
    ...COMMON_TEXTS,
    searchLabel: 'Поиск по сантехническим работам',
    searchPlaceholder: 'Найти работу: унитаз, смеситель, разводка…',
    searchStatus: (count) => `Найдено ${count} ${pluralPositions(count)}`,
    emptyTitle: (query) => `По запросу «${query}» ничего не найдено`,
  },

  // Электромонтажные работы
  electricity: {
    h1: {
      lead: 'Прайс-лист на',
      accent: 'электромонтажные работы',
      tail: `в Рязани — цены ${CURRENT_YEAR}`,
    },
    subtitle:
      'Цены за работу.\nМатериалы отдельно. Работы по ПУЭ, смета фиксируется в договоре. Рязань и область.',
    badge: BADGE,
    chips: TRUST_CHIPS,
    ...COMMON_TEXTS,
    searchLabel: 'Поиск по электромонтажным работам',
    searchPlaceholder: 'Найти работу: розетка, щит, кабель…',
    searchStatus: (count) => `Найдено ${count} ${pluralPositions(count)}`,
    emptyTitle: (query) => `По запросу «${query}» ничего не найдено`,
  },
}

/** Тексты hero-блока для конкретной страницы прайса (с fallback). */
export function getPricesHeroContent(slug: string): PricesHeroContent {
  return CONTENT_BY_SLUG[slug] ?? DEFAULT_CONTENT
}
