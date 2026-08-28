// app/components/pages/public/remontPomescheniy/workTypes/data/pages/shpaklevka-sten.ts
import type {
  OverviewAdvantage,
  MethodOption,
  InsightItem,
  PriceFactor,
  CalculatorTab,
  WorkStage,
  GuaranteeItem,
  FAQItem,
  StickyNavItem,
} from '../../types'
import type { NormalizedWorkItem, WorkUnit } from '~/types/calculator'

/**
 * Конвертация внутренних единиц измерения в читаемый формат для UI
 */
const formatUnit = (unit?: WorkUnit): string => {
  switch (unit) {
    case 'm2': return 'м²'
    case 'linear': return 'м.п.'
    case 'piece': return 'шт.'
    default: return 'м²'
  }
}

/**
 * Навигация по секциям страницы (StickyNav)
 */
export const navItems: StickyNavItem[] = [
  { id: 'before-after', label: 'До и после', icon: 'mdi:compare-horizontal' },
  { id: 'overview', label: 'О услуге', icon: 'mdi:information-outline' },
  { id: 'methods', label: 'Что выбрать', icon: 'mdi:help-circle' },
  { id: 'materials', label: 'Материалы', icon: 'mdi:layers-outline' },
  { id: 'insights', label: 'Тех. нюансы', icon: 'mdi:lightbulb-on-outline' },
  { id: 'price-list', label: 'Цены', icon: 'mdi:currency-usd' },
  { id: 'price-factors', label: 'Факторы цены', icon: 'mdi:cash-multiple' },
  { id: 'calculator', label: 'Калькулятор', icon: 'mdi:calculator' },
  { id: 'stages', label: 'Этапы работ', icon: 'mdi:timeline-clock' },
  { id: 'guarantees', label: 'Гарантии', icon: 'mdi:shield-check' },
  { id: 'faq', label: 'Вопросы', icon: 'mdi:help-circle-outline' },
  { id: 'portfolio', label: 'Портфолио', icon: 'mdi:image-multiple' },
  { id: 'related', label: 'Другие работы', icon: 'mdi:view-grid-outline' },
  { id: 'projects', label: 'Проекты', icon: 'mdi:office-building' },
  { id: 'cta', label: 'Заказать', icon: 'mdi:send-outline' },
]

/**
 * Преимущества шпаклёвки стен
 */
export const categoryAdvantages: OverviewAdvantage[] = [
  {
    title: 'Идеальная гладкость',
    description: 'Поверхность готова под покраску без малейших дефектов',
    icon: 'mdi:circle-outline',
  },
  {
    title: 'Защита основания',
    description: 'Шпаклёвка укрепляет поверхность и предотвращает трещины',
    icon: 'mdi:shield-outline',
  },
  {
    title: 'Быстрое высыхание',
    description: 'Каждый слой сохнет 4–6 часов — работаем без задержек',
    icon: 'mdi:clock-fast',
  },
]

export const comparisonMethods: MethodOption[] = [
  {
    title: 'Стартовая шпаклёвка',
    icon: 'mdi:layers-outline',
    priceWorkId: 806, // одна работа — 300 ₽/м²
    whenToUse: [
      'Перепады до 3 мм на 2 метра',
      'Стены после штукатурки',
      'Заделка стыков и мелких дефектов',
      'Подготовка под обои или декоративную штукатурку',
    ],
    pros: [
      '1 слой — быстрый результат за 1 день',
      'Скрывает мелкие неровности основания',
      'Достаточно для обоев и текстурных покрытий',
      'Самая доступная цена',
    ],
    cons: [
      'Не подходит под покраску (видны микродефекты)',
      'Ограниченная толщина слоя',
    ],
  },
  {
    title: 'Стартовая + Финишная',
    icon: 'mdi:layers-triple',
    priceWorkIds: [806, 811], // 🆕 сумма: 300 + 400 = 700 ₽/м²
    recommended: true,
    whenToUse: [
      'Подготовка под покраску',
      'Подготовка под тонкие обои',
      'Офисы, шоурумы, клиники',
      'Новостройки с усадкой',
    ],
    pros: [
      '2 слоя — идеально гладкая поверхность',
      'Готова под покраску любого типа',
      'Исключает просвечивание основания',
      'Профессиональный стандарт отделки',
    ],
    cons: [
      '2 слоя = дольше на 1 день',
      'Стоимость выше стартовой',
    ],
  },
  {
    title: 'Под покраску «под лампочку»',
    icon: 'mdi:spotlight-beam',
    priceWorkIds: [806, 813], // 🆕 сумма: 300 + 500 = 800 ₽/м²
    whenToUse: [
      'Боковое / точечное освещение',
      'Тёмные и глянцевые краски',
      'Выставочные пространства, шоурумы',
      'Максимальные требования к качеству',
    ],
    pros: [
      '2 слоя + контроль под прожектором',
      'Каждый участок проверяется под боковым светом',
      'Исключает любые тени, блики и микродефекты',
      'Премиальный результат',
    ],
    cons: [
      'Самая высокая стоимость',
      'Шлифовка финишного слоя — обязательна',
      'Необходима идеальная подготовка основания',
    ],
  },
]

/**
 * Технические нюансы шпаклёвки
 */
export const technicalInsights: InsightItem[] = [
  {
    title: 'Грунтовка обязательна',
    description:
      'Без грунтовки шпаклёвка отслаивается от основания, трескается и неравномерно сохнет. Каждый слой наносится только на загрунтованную поверхность.',
    icon: 'mdi:alert-outline',
  },
  {
    title: 'Толщина слоя критична',
    description:
      'Гипсовая шпаклёвка наносится слоем не более 3 мм. При большей толщине она трескается при высыхании. Для глубоких дефектов — стартовый состав.',
    icon: 'mdi:layers-plus',
    highlight: true,
  },
  {
    title: 'Серпянка на стыках ГКЛ',
    description:
      'Все стыки гипсокартона проклеиваются армирующей лентой (серпянкой) перед шпаклёвкой. Без неё трещины появятся через 3–6 месяцев.',
    icon: 'mdi:grid',
  },
  {
    title: '«Под лампочку» — не третий слой',
    description:
      'Это тот же второй финишный слой, но каждый участок проверяется под боковым прожектором. Мастер видит даже микронеровности и устраняет их до шлифовки.',
    icon: 'mdi:spotlight-beam',
    fact: 'Разница с обычной финишной — в контроле, а не в количестве слоёв',
  },
]

/**
 * ID работ из прайс-листа (БД) для автоматической подгрузки цен.
 */
export const WORK_IDS = {
  /** Грунтовка глубокого проникновения */
  GRUNTOVKA: 802,
  /** Стартовая гипсовая шпаклёвка (слой до 3 мм) */
  START_GIPS: 806,
  /** Стартовая цементная шпаклёвка */
  START_CEMENT: 807,
  /** Выравнивание перепадов до 5 мм */
  VYRAVNIVANIE: 808,
  /** Финишная гипсовая шпаклёвка (слой 1–2 мм) */
  FINISH_GIPS: 811,
  /** Выравнивание под покраску (под «лампочку») */
  POD_POKRASKU: 813,
  /** Шлифовка стен */
  SHLIFOVKA: 826,
  /** Шлифовка стен под покраску */
  SHLIFOVKA_POKRASKA: 829,
  /** Армирование стыков ГКЛ серпянкой */
  SERPYANKA: 821,
} as const

/**
 * Функция для создания табов калькулятора.
 */
export const createCalculatorTabs = (
  findWorkById: (id: number) => NormalizedWorkItem | undefined
): CalculatorTab[] => {
  const grunt = findWorkById(WORK_IDS.GRUNTOVKA)
  const startGips = findWorkById(WORK_IDS.START_GIPS)
  const finishGips = findWorkById(WORK_IDS.FINISH_GIPS)
  const podPokrasku = findWorkById(WORK_IDS.POD_POKRASKU)
  const shlifovka = findWorkById(WORK_IDS.SHLIFOVKA)
  const shlifPokraska = findWorkById(WORK_IDS.SHLIFOVKA_POKRASKA)
  const serpyanka = findWorkById(WORK_IDS.SERPYANKA)

  return [
    {
      id: 'basic',
      label: 'Стартовая',
      icon: 'mdi:layers-outline',
      works: [
        {
          name: grunt?.name ?? 'Грунтовка глубокого проникновения',
          price: grunt?.pricePerUnit ?? 0,
          unit: formatUnit(grunt?.normalizedUnit),
        },
        {
          name: startGips?.name ?? 'Стартовая гипсовая шпаклёвка (слой до 3 мм)',
          price: startGips?.pricePerUnit ?? 0,
          unit: formatUnit(startGips?.normalizedUnit),
        },
      ],
      extras: [
        {
          id: 'serpyanka',
          name: serpyanka?.name ?? 'Армирование стыков ГКЛ серпянкой',
          price: serpyanka?.pricePerUnit ?? 0,
          unit: 'м.п.',
        },
      ],
    },
    {
      id: 'finish',
      label: 'Стартовая + Финишная',
      icon: 'mdi:layers-triple',
      works: [
        {
          name: grunt?.name ?? 'Грунтовка глубокого проникновения',
          price: grunt?.pricePerUnit ?? 0,
          unit: formatUnit(grunt?.normalizedUnit),
        },
        {
          name: startGips?.name ?? 'Стартовая гипсовая шпаклёвка (слой до 3 мм)',
          price: startGips?.pricePerUnit ?? 0,
          unit: formatUnit(startGips?.normalizedUnit),
        },
        {
          name: finishGips?.name ?? 'Финишная гипсовая шпаклёвка (слой 1–2 мм)',
          price: finishGips?.pricePerUnit ?? 0,
          unit: formatUnit(finishGips?.normalizedUnit),
        },
        {
          name: shlifovka?.name ?? 'Шлифовка стен',
          price: shlifovka?.pricePerUnit ?? 0,
          unit: formatUnit(shlifovka?.normalizedUnit),
        },
      ],
      extras: [
        {
          id: 'serpyanka',
          name: serpyanka?.name ?? 'Армирование стыков ГКЛ серпянкой',
          price: serpyanka?.pricePerUnit ?? 0,
          unit: 'м.п.',
        },
      ],
    },
    {
      id: 'premium',
      label: 'Под покраску',
      icon: 'mdi:spotlight-beam',
      works: [
        {
          name: grunt?.name ?? 'Грунтовка глубокого проникновения',
          price: grunt?.pricePerUnit ?? 0,
          unit: formatUnit(grunt?.normalizedUnit),
        },
        {
          name: startGips?.name ?? 'Стартовая гипсовая шпаклёвка (слой до 3 мм)',
          price: startGips?.pricePerUnit ?? 0,
          unit: formatUnit(startGips?.normalizedUnit),
        },
        {
          name: podPokrasku?.name ?? 'Выравнивание под покраску (под «лампочку»)',
          price: podPokrasku?.pricePerUnit ?? 0,
          unit: formatUnit(podPokrasku?.normalizedUnit),
        },
        {
          name: shlifPokraska?.name ?? 'Шлифовка стен под покраску',
          price: shlifPokraska?.pricePerUnit ?? 0,
          unit: formatUnit(shlifPokraska?.normalizedUnit),
        },
      ],
      extras: [
        {
          id: 'serpyanka',
          name: serpyanka?.name ?? 'Армирование стыков ГКЛ серпянкой',
          price: serpyanka?.pricePerUnit ?? 0,
          unit: 'м.п.',
        },
      ],
    },
  ]
}

/**
 * Факторы, влияющие на цену
 */
export const priceFactors: PriceFactor[] = [
  {
    title: 'Состояние основания',
    description:
      'Кривизна, трещины, остатки старых покрытий — всё влияет на количество слоёв и объём работ.',
    icon: 'mdi:wall',
  },
  {
    title: 'Тип финишной отделки',
    description:
      'Под обои достаточно 1–2 слоёв. Под покраску — 3 слоя + шлифовка. Под «лампочку» — премиум-подготовка.',
    icon: 'mdi:palette-outline',
  },
  {
    title: 'Высота потолков',
    description:
      'При высоте свыше 3 м требуются леса и подмости — стоимость м² увеличивается.',
    icon: 'mdi:human-male-height',
  },
  {
    title: 'Тип шпаклёвки',
    description:
      'Цементная дороже гипсовой на 15–20%, полимерная финишная — на 30–40%.',
    icon: 'mdi:flask-outline',
  },
  {
    title: 'Объём работ',
    description: 'При площади свыше 100 м² действуют оптовые скидки до 15%.',
    icon: 'mdi:ruler-square',
  },
]

/**
 * Этапы работ
 */
export const workStages: WorkStage[] = [
  {
    title: 'Заявка и осмотр',
    description:
      'Инженер приезжает, оценивает состояние стен, тип основания и необходимую толщину слоёв.',
    icon: 'mdi:clipboard-text',
    duration: '1 день',
    result: 'Точная смета',
  },
  {
    title: 'Подготовка основания',
    description:
      'Очистка от пыли, удаление старых покрытий, заделка крупных дефектов.',
    icon: 'mdi:broom',
    duration: '1 день',
  },
  {
    title: 'Грунтовка',
    description:
      'Нанесение грунтовки глубокого проникновения. Для пористых оснований — 2 слоя.',
    icon: 'mdi:brush-variant',
    duration: '4–6 часов',
    result: 'Готовое основание',
  },
  {
    title: 'Стартовая шпаклёвка',
    description:
      'Нанесение выравнивающего слоя (до 3 мм). Армирование стыков ГКЛ серпянкой.',
    icon: 'mdi:layers-outline',
    duration: '1 день',
    // highlight: true,
    result: 'Выровненная поверхность',
  },
  {
    title: 'Финишная шпаклёвка',
    description:
      'Тонкий слой (1–2 мм) для идеальной гладкости. Шлифовка абразивом Р150–Р180.',
    icon: 'mdi:layers-triple',
    duration: '1 день',
  },
  {
    title: 'Приёмка и гарантия',
    description:
      'Проверяем поверхность под лампу. Подписываем акт. Гарантия 3 года.',
    icon: 'mdi:check-decagram',
    duration: '1 день',
    result: 'Гарантийный талон',
  },
]

/**
 * Гарантии
 */
export const guarantees: GuaranteeItem[] = [
  {
    title: 'Гарантия 3 года',
    description: 'На все шпаклёвочные работы. Трещины, отслоения — устраним бесплатно.',
    icon: 'mdi:shield-check',
  },
  {
    title: 'Фиксированная цена',
    description: 'Смета в договоре. Доп. работы — только через допсоглашение.',
    icon: 'mdi:cash-lock',
  },
  {
    title: 'Сроки по договору',
    description: 'При просрочке — неустойка 0.1% в день от стоимости работ.',
    icon: 'mdi:clock-check',
  },
  {
    title: 'Чистота на объекте',
    description:
      'Укрываем полы и мебель. Убираем пыль после шлифовки. Выносим мусор.',
    icon: 'mdi:broom',
  },
  {
    title: 'Проверка под лампу',
    description:
      'Каждый этап принимаем с боковым освещением — вы видите идеальный результат.',
    icon: 'mdi:spotlight-beam',
  },
  {
    title: 'Документы для бухгалтерии',
    description: 'Договор, акты КС-2/КС-3, чеки на материалы.',
    icon: 'mdi:file-document-check',
  },
]

/**
 * FAQ
 */
export const faqItems: FAQItem[] = [
  {
    question: 'Сколько слоёв шпаклёвки нужно для стен?',
    answer:
      'Зависит от финишной отделки. Под обои — 1 стартовый слой. Под покраску — стартовый + финишный. Под «лампочку» (боковое освещение) — 3 слоя с промежуточной шлифовкой.',
  },
  {
    question: 'Сколько сохнет шпаклёвка?',
    answer:
      'Гипсовая — 4–6 часов при +20°C и нормальной влажности. Цементная — 12–24 часа. Нельзя ускорять нагревателями — появятся трещины.',
  },
  {
    question: 'Можно ли шпаклевать по старой краске?',
    answer:
      'Нет. Краску нужно удалить или покрыть адгезионной грунтовкой (бетоноконтакт). Иначе шпаклёвка отслоится вместе с краской.',
  },
  {
    question: 'Чем отличается шпаклёвка от штукатурки?',
    answer:
      'Штукатурка выравнивает крупные перепады (до 5 см), шпаклёвка — финишное выравнивание (до 3 мм). Штукатурка крупнозернистая, шпаклёвка — мелкая паста для гладкости.',
  },
  {
    question: 'Нужно ли грунтовать между слоями шпаклёвки?',
    answer:
      'Да, обязательно. Грунтовка обеспечивает сцепление слоёв, уменьшает расход и предотвращает отслоение. Мы грунтуем каждый слой.',
  },
  {
    question: 'Какую шпаклёвку выбрать для ванной?',
    answer:
      'Только цементную или полимерную влагостойкую. Гипсовая в условиях повышенной влажности разбухает и трескается за 1–2 года.',
  },
]

/**
 * Проекты для портфолио
 */
export const projectSlugs = ['fora-bank', 'klinika-alma']

/**
 * Кастомные поля для CTA формы
 */
export const customFields = [
  {
    name: 'wallState',
    label: 'Состояние стен',
    type: 'tiles' as const,
    options: [
      { value: 'new', label: 'Новые (после штукатурки)', icon: 'mdi:wall' },
      { value: 'gkl', label: 'Гипсокартон', icon: 'mdi:layers' },
      { value: 'old', label: 'Старое покрытие', icon: 'mdi:refresh' },
      { value: 'damaged', label: 'Есть трещины/дефекты', icon: 'mdi:alert-outline' },
    ],
  },
  {
    name: 'finishType',
    label: 'Финишная отделка',
    type: 'tiles' as const,
    options: [
      { value: 'paint', label: 'Покраска', icon: 'mdi:palette-outline' },
      { value: 'wallpaper', label: 'Обои', icon: 'mdi:image-outline' },
      { value: 'decor', label: 'Декоративная штукатурка', icon: 'mdi:texture' },
      { value: 'tile', label: 'Плитка', icon: 'mdi:grid' },
    ],
  },
]

/**
 * Конфигурация сообщения для CTA
 */
export const messageConfig = {
  emoji: '🎨',
  title: 'Заявка на шпаклёвку стен',
  sourceLabel: 'Шпаклёвка стен — CTA',
  fieldLabels: {
    wallState: 'Состояние стен',
    finishType: 'Финишная отделка',
  },
}

/**
 * SEO данные для страницы.
 * 🔄 priceFrom вычисляется в компоненте из прайс-листа.
 */
export const seoData = {
  category: 'shpaklevka',
  categoryName: 'Шпаклёвка',
  slug: 'sten',
  title: 'Шпаклёвка стен под покраску и обои',
  description:
    'Шпаклёвка стен в Рязани: стартовая, финишная, под покраску «под лампочку». Гипсовые и цементные составы. Гарантия 3 года, фиксированная цена.',
  city: 'Рязани',
  serviceType: 'Шпаклёвка стен',
  ogImage: 'https://glavprofi.ru/og-shpaklevka-sten.jpg',
  pageUrl: '/vidy-rabot/shpaklevka-sten',
  categoryUrl: '/vidy-rabot/shpaklevka-sten',
}
