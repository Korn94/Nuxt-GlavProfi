// app/components/pages/public/remontPomescheniy/workTypes/data/pages/gkl-peregorodki.ts

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
    case 'm2':
      return 'м²'
    case 'linear':
      return 'м.п.'
    case 'piece':
      return 'шт.'
    default:
      return 'м²'
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
 * Преимущества перегородок из ГКЛ
 */
export const categoryAdvantages: OverviewAdvantage[] = [
  {
    title: 'Зонирование пространства',
    description: 'Разделите помещение без капитальных стен и согласований',
    icon: 'mdi:floor-plan',
  },
  {
    title: 'Звукоизоляция 45-58 дБ',
    description: 'Минвата + 2 слоя ГКЛ = тишина как в спальне',
    icon: 'mdi:volume-off',
  },
  {
    title: 'Быстрый монтаж',
    description: 'Перегородка готова за 2-4 дня без грязи и пыли',
    icon: 'mdi:clock-fast',
  },
]

/**
 * Сравнение методов: 1 слой ГКЛ, 2 слоя ГКЛ, ГВЛ.
 * 🔄 Цены берутся из прайс-листа автоматически через priceWorkId.
 * 🆕 3 слоя убраны — применяются крайне редко (серверные, кассовые зоны).
 */
export const comparisonMethods: MethodOption[] = [
  {
    title: '1 слой ГКЛ',
    icon: 'mdi:layers-outline',
    priceWorkId: 683,
    whenToUse: [
      'Кладовые, гардеробные, технические помещения',
      'Декоративные ниши и зонирование',
      'Бюджетный ремонт без строгих требований',
    ],
    pros: [
      'Самая низкая стоимость',
      'Быстрый монтаж — 2 дня',
      'Минимальная толщина 75 мм',
    ],
    cons: [
      'Звукоизоляция ~35 дБ — слышно разговор',
      'Не подходит для жилых комнат и офисов',
      'Хрупкость при ударах',
    ],
  },
  {
    title: '2 слоя ГКЛ',
    icon: 'mdi:layers-plus',
    priceWorkId: 684,
    recommended: true,
    whenToUse: [
      'Спальни, детские, гостиные',
      'Офисы с переговорными комнатами',
      'Стены с дверями и розетками',
      'Новостройки с усадкой',
    ],
    pros: [
      'Звукоизоляция ~48 дБ — разговор не слышен',
      'Прочность в 2-3 раза выше',
      'Швы не трескаются при усадке',
    ],
    cons: [
      'Дороже на ~500 ₽/м²',
      'Толщина перегородки 100 мм',
    ],
  },
  {
    title: 'Перегородка из ГВЛ',
    icon: 'mdi:arm-flex',
    priceWorkId: 1601,
    whenToUse: [
      'Стены под тяжёлые шкафы без закладных',
      'Помещения с высокой механической нагрузкой',
      'Зоны с требованиями по огнестойкости',
    ],
    pros: [
      'В 5 раз прочнее обычного ГКЛ',
      'Держит саморезы без дюбелей (до 30 кг)',
      'Огнестойкий материал',
    ],
    cons: [
      'Тяжелее ГКЛ — нужен усиленный каркас',
      'Плохо гнётся — не подходит для арок',
      'Дороже базового варианта',
    ],
  },
]

/**
 * Технические нюансы: почему важна шумоизоляция
 */
export const technicalInsights: InsightItem[] = [
  {
    title: 'Мостик звука',
    description:
      'Без минваты каркас перегородки передаёт звук как барабан. Минвата 100 мм гасит вибрации и снижает шум на 20-25 дБ.',
    icon: 'mdi:waveform',
  },
  {
    title: 'Двойной слой обязателен',
    description:
      'Перегородка — это несущая конструкция. Один слой ГКЛ прогибается при ударе, швы трескаются. Два слоя со смещением — монолит.',
    icon: 'mdi:layers-plus',
    highlight: true,
  },
  {
    title: 'Закладные для дверей',
    description:
      'В зоне установки дверного короба закладывается брус 100×100 мм или усиленный профиль UA. Без этого дверь расшатается за полгода.',
    icon: 'mdi:door-closed',
  },
  {
    title: 'Коммуникации внутри',
    description:
      'Электрика, интернет-кабели, вентиляция закладываются внутрь каркаса. Розетки и выключатели — с двух сторон перегородки.',
    icon: 'mdi:pipe',
  },
]

/**
 * ID работ из прайс-листа (БД) для автоматической подгрузки цен.
 * 🔄 Все цены берутся через usePriceFetcher — никаких хардкодов.
 */
export const WORK_IDS = {
  /** Перегородка из ГКЛ в 1 слой с двух сторон */
  PARTITION_1_LAYER: 683,
  /** Перегородка из ГКЛ в 2 слоя с двух сторон */
  PARTITION_2_LAYERS: 684,
  /** Перегородка из ГВЛ в 1 слой с двух сторон */
  PARTITION_GVL: 1601,
  /** Перегородка из ГВЛ в 2 слоя с двух сторон */
  PARTITION_GVL_2: 1602,
  /** Огнестойкая перегородка из ГКЛО (REI 30) */
  PARTITION_FIREPROOF: 685,
  /** Укладка минераловатного утеплителя в каркас */
  INSULATION: 700,
  /** Арочный проем в ГКЛ-перегородке (радиус >50 см) */
  ARCH_OPENING: 1135,
} as const

/**
 * Функция для создания табов калькулятора.
 * 🔄 Все цены берутся из прайс-листа через findWorkById.
 * 🆕 По умолчанию — 1 слой, 2 слоя и утеплитель идут как доп. опции.
 */
export const createCalculatorTabs = (
  findWorkById: (id: number) => NormalizedWorkItem | undefined
): CalculatorTab[] => {
  const gkl1 = findWorkById(WORK_IDS.PARTITION_1_LAYER)
  const gkl2 = findWorkById(WORK_IDS.PARTITION_2_LAYERS)
  const gvl1 = findWorkById(WORK_IDS.PARTITION_GVL)
  const gvl2 = findWorkById(WORK_IDS.PARTITION_GVL_2)
  const insulation = findWorkById(WORK_IDS.INSULATION)

  // Дельты вычисляются автоматически из прайса
  const gkl2LayersSurcharge = Math.max(
    0,
    (gkl2?.pricePerUnit ?? 0) - (gkl1?.pricePerUnit ?? 0)
  )
  const gvl2LayersSurcharge = Math.max(
    0,
    (gvl2?.pricePerUnit ?? 0) - (gvl1?.pricePerUnit ?? 0)
  )

  return [
    {
      id: 'gkl',
      label: 'ГКЛ',
      icon: 'mdi:layers-outline',
      works: [
        {
          name: gkl1?.name ?? 'Перегородка из ГКЛ в 1 слой с двух сторон',
          price: gkl1?.pricePerUnit ?? 0,
          unit: formatUnit(gkl1?.normalizedUnit),
        },
      ],
      extras: [
        {
          id: 'gkl-2layers',
          name: 'Второй слой ГКЛ (доплата)',
          price: gkl2LayersSurcharge,
          unit: formatUnit(gkl1?.normalizedUnit),
        },
        {
          id: 'insulation',
          name: insulation?.name ?? 'Укладка утеплителя/звукоизоляции 100 мм',
          price: insulation?.pricePerUnit ?? 0,
          unit: formatUnit(insulation?.normalizedUnit),
        },
      ],
    },
    {
      id: 'gvl',
      label: 'ГВЛ',
      icon: 'mdi:arm-flex',
      works: [
        {
          name: gvl1?.name ?? 'Перегородка из ГВЛ в 1 слой с двух сторон',
          price: gvl1?.pricePerUnit ?? 0,
          unit: formatUnit(gvl1?.normalizedUnit),
        },
      ],
      extras: [
        {
          id: 'gvl-2layers',
          name: 'Второй слой ГВЛ (доплата)',
          price: gvl2LayersSurcharge,
          unit: formatUnit(gvl1?.normalizedUnit),
        },
        {
          id: 'insulation',
          name: insulation?.name ?? 'Укладка утеплителя/звукоизоляции 100 мм',
          price: insulation?.pricePerUnit ?? 0,
          unit: formatUnit(insulation?.normalizedUnit),
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
    title: 'Высота перегородки',
    description:
      'Выше 3,5 м — требуется усиленный каркас и леса. Доплата к базовой цене м².',
    icon: 'mdi:human-male-height',
  },
  {
    title: 'Количество дверных проёмов',
    description:
      'Каждый проём требует усиления брусом или UA-профилем. Арочные проёмы считаются отдельно.',
    icon: 'mdi:door',
  },
  {
    title: 'Звукоизоляция',
    description:
      'Минвата 50 мм — базовая. 100 мм — комфорт. 150 мм — студия. Цена зависит от толщины слоя.',
    icon: 'mdi:volume-off',
  },
  {
    title: 'Объём работ',
    description: 'При площади свыше 100 м² действуют оптовые скидки до 15%.',
    icon: 'mdi:ruler-square',
  },
  {
    title: 'Коммуникации',
    description:
      'Закладка под розетки, выключатели, трубы учитывается отдельно.',
    icon: 'mdi:pipe',
  },
]

/**
 * Этапы работ
 */
export const workStages: WorkStage[] = [
  {
    title: 'Заявка и замер',
    description:
      'Инженер приезжает, замеряет помещение, обсуждает планировку и коммуникации.',
    icon: 'mdi:clipboard-text',
    duration: '1 день',
    result: 'Точная смета',
  },
  {
    title: 'Подписание договора',
    description: 'Фиксируем цену, сроки, список работ. Предоплата только 30%.',
    icon: 'mdi:file-sign',
    duration: '1 день',
  },
  {
    title: 'Доставка материалов',
    description: 'Привозим ГКЛ, профили, крепёж, минвату. Все материалы с сертификатами.',
    icon: 'mdi:truck-delivery',
    duration: '1-2 дня',
  },
  {
    title: 'Монтаж каркаса',
    description: 'Собираем каркас, закладываем закладные под двери и коммуникации.',
    icon: 'mdi:hammer-wrench',
    duration: '1-2 дня',
    highlighted: true,
    result: 'Готовый каркас',
  },
  {
    title: 'Обшивка и изоляция',
    description: 'Укладываем минвату, обшиваем с двух сторон ГКЛ в 1-2 слоя.',
    icon: 'mdi:layers-plus',
    duration: '1-2 дня',
    result: 'Готовая перегородка',
  },
  {
    title: 'Заделка швов',
    description: 'Проклеиваем серпянку, наносим первый слой шпаклёвки.',
    icon: 'mdi:format-paint',
    duration: '1 день',
  },
  {
    title: 'Приёмка и гарантия',
    description:
      'Принимаете работу, подписываем акт. Гарантия 3 года на монтаж.',
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
    description: 'На все монтажные работы. Устраняем дефекты за свой счёт.',
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
      'Убираем мусор каждый день. После работ — выносим весь строительный мусор.',
    icon: 'mdi:broom',
  },
  {
    title: 'Мастера с опытом 5+ лет',
    description: 'Штатные бригады, каждый прошёл аттестацию Knauf.',
    icon: 'mdi:account-hard-hat',
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
    question: 'Нужно ли согласовывать перегородку из ГКЛ?',
    answer:
      'Если перегородка не несущая и не затрагивает мокрые зоны (перенос санузла, кухни) — согласование не требуется. Мы поможем с проектом перепланировки, если это нужно.',
  },
  {
    question: 'Можно ли вешать тяжёлые шкафы на перегородку из ГКЛ?',
    answer:
      'Да, если на этапе монтажа закладываются деревянные закладные или используется ГВЛ (гипсоволокнистый лист). ГВЛ держит до 30 кг на один дюбель без закладных.',
  },
  {
    question: 'Какая звукоизоляция у перегородки из ГКЛ?',
    answer:
      'Однослойная без минваты — ~35 дБ (слышно разговор). Двухслойная с минватой 100 мм — ~48 дБ (разговор не слышен).',
  },
  {
    question: 'Сколько весит перегородка из ГКЛ?',
    answer:
      'Однослойная перегородка — ~25 кг/м². Двухслойная — ~40 кг/м². Это в 5-7 раз легче кирпичной стены, поэтому перегородки можно ставить на любые перекрытия без усиления.',
  },
  {
    question: 'Можно ли сделать перегородку во влажном помещении?',
    answer:
      'Да, используем влагостойкий ГКЛВ (зелёный) для санузлов и кухонь. Для зон прямого контакта с водой дополнительно гидроизоляция и плиточная отделка.',
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
    name: 'partitionHeight',
    label: 'Высота перегородки',
    type: 'tiles' as const,
    options: [
      { value: 'up-to-3m', label: 'До 3 м', icon: 'mdi:human-male-height' },
      { value: '3m-4m', label: '3-4 м', icon: 'mdi:human-male-height' },
      { value: 'above-4m', label: 'Выше 4 м', icon: 'mdi:human-male-height' },
    ],
  },
  {
    name: 'hasDoors',
    label: 'Дверные проёмы',
    type: 'tiles' as const,
    options: [
      { value: 'no', label: 'Без дверей', icon: 'mdi:door-closed' },
      { value: '1-2', label: '1-2 двери', icon: 'mdi:door' },
      { value: '3-plus', label: '3 и более', icon: 'mdi:door-sliding' },
    ],
  },
]

/**
 * Конфигурация сообщения для CTA
 */
export const messageConfig = {
  emoji: '🚪',
  title: 'Заявка на монтаж перегородок из ГКЛ',
  sourceLabel: 'Перегородки из ГКЛ — CTA',
  fieldLabels: { partitionHeight: 'Высота', hasDoors: 'Двери' },
}

/**
 * SEO данные для страницы.
 * 🔄 priceFrom убран — вычисляется в компоненте из прайс-листа.
 */
export const seoData = {
  category: 'gkl',
  categoryName: 'ГКЛ',
  slug: 'peregorodki',
  title: 'Перегородки из гипсокартона',
  description:
    'Монтаж перегородок из ГКЛ под ключ в Рязани: зонирование, шумоизоляция, монтаж дверей. Гарантия 3 года, фиксированная цена.',
  city: 'Рязани',
  serviceType: 'Перегородки из ГКЛ',
  ogImage: 'https://glavprofi.ru/og-gkl-peregorodki.jpg',
  pageUrl: '/vidy-rabot/peregorodki-gkl',
  categoryUrl: '/vidy-rabot/oblitsovka-gkl',
}
