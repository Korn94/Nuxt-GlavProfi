// app/components/pages/public/remontPomescheniy/workTypes/data/pages/oblitsovka-gkl.ts

// Импортируем типы из types.ts вместо .vue файлов
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
 * Навигация по секциям страницы (StickyNav) — обновлённый порядок
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
  { id: 'projects', label: 'Проекты', icon: 'mdi:office-building' },
  { id: 'related', label: 'Другие работы', icon: 'mdi:view-grid-outline' },
  { id: 'cta', label: 'Заказать', icon: 'mdi:send-outline' },
]

/**
 * Преимущества обшивки стен ГКЛ
 */
export const categoryAdvantages: OverviewAdvantage[] = [
  {
    title: 'Быстрый монтаж',
    description: 'Стены готовы за 1-3 дня без «мокрых» процессов',
    icon: 'mdi:clock-fast',
  },
  {
    title: 'Скрытие коммуникаций',
    description: 'Проводка, трубы и вентиляция внутри каркаса',
    icon: 'mdi:pipe',
  },
  {
    title: 'Звукоизоляция',
    description: 'Снижение шума на 15-25 дБ с минватой',
    icon: 'mdi:volume-off',
  },
]

/**
 * Сравнение методов: клей, каркас, штукатурка
 */
export const comparisonMethods: MethodOption[] = [
  {
    title: 'ГКЛ на клей',
    icon: 'mdi:land-fields',
    priceWorkId: 939,
    priceFrom: 1300,
    whenToUse: [
      'Перепад стен не более 2 см на 2 метра',
      'Нужно сохранить максимум площади помещения',
      'Быстрый и бюджетный ремонт',
      'Стены из кирпича, бетона, пеноблока',
    ],
    pros: [
      'Минимальная потеря площади (1-2 см)',
      'Самая низкая стоимость',
      'Быстрый монтаж — 1 день на комнату',
      'Нет сверления и пыли от каркаса',
    ],
    cons: [
      'Нельзя скрыть коммуникации',
      'Не подходит для сильной кривизны',
      'Требует ровного основания',
    ],
  },
  {
    title: 'ГКЛ на каркас',
    icon: 'mdi:frame',
    priceWorkId: 1598,
    priceFrom: 1600,
    recommended: true,
    whenToUse: [
      'Перепад стен более 2 см',
      'Нужно скрыть проводку, трубы, вентиляцию',
      'Требуется звуко- или теплоизоляция',
      'Планируются встроенные ниши или полки',
    ],
    pros: [
      'Скрывает любые коммуникации',
      'Идеально ровная поверхность при любой кривизне',
      'Возможность утепления и шумоизоляции',
      'Подходит для любых стен',
    ],
    cons: [
      'Забирает 5-7 см от площади',
      'Дороже клеевого способа',
      'Монтаж занимает 2-3 дня',
    ],
  },
  {
    title: 'Штукатурка',
    icon: 'mdi:format-paint',
    priceWorkId: 1143,
    priceFrom: 1200,
    whenToUse: [
      'Перепад стен до 5 см',
      'Влажные помещения (ванная, кухня)',
      'Нужна максимальная прочность основания',
      'Планируется укладка тяжёлой плитки',
    ],
    pros: [
      'Максимальная прочность и долговечность',
      'Не забирает площадь',
      'Подходит для влажных помещений',
      'Выдерживает тяжёлые нагрузки (плитка, камень)',
    ],
    cons: [
      'Долго сохнет — 5-7 дней до финишной отделки',
      'Грязный и пыльный процесс',
      'Не скрывает коммуникации',
      'Не подходит для перепадов более 5 см',
      'Требует дальнейшей отделки',
    ],
  },
]

/**
 * Технические нюансы: зачем нужен второй слой ГКЛ
 */
export const technicalInsights: InsightItem[] = [
  {
    title: 'Швы — слабое место',
    description:
      'Первый слой ГКЛ крепится к каркасу, но стыки между листами остаются уязвимыми. При малейшей усадке дома или вибрации швы трескаются.',
    icon: 'mdi:alert-outline',
  },
  {
    title: 'Второй слой перекрывает швы',
    description:
      'Листы второго слоя укладываются со смещением — их швы не совпадают со швами первого. Получается монолитная стена без слабых мест.',
    icon: 'mdi:layers-plus',
    highlight: true,
  },
  {
    title: 'Когда одного слоя достаточно',
    description:
      'Для кладовок, гардеробных, стен под обои (обои скроют микротрещины). Если стена короткая и не несёт нагрузки — можно сэкономить.',
    icon: 'mdi:check-circle-outline',
  },
  {
    title: 'Когда нужны два слоя',
    description:
      'Новостройки (усадка 2-3 года), длинные стены, стены под покраску, офисы с высокой проходимостью, перегородки с дверями.',
    icon: 'mdi:alert-circle-outline',
  },
]

/**
 * ID работ из прайс-листа для калькулятора
 */
export const WORK_IDS = {
  /** Обшивка стен ГКЛ 1 слой на металлическом каркасе — 1600 ₽/м² */
  GKL_1_LAYER: 1598,
  /** Обшивка стен ГКЛ 2 слоя на металлическом каркасе — 1800 ₽/м² */
  GKL_2_LAYERS: 938,
  /** Обшивка стен ГКЛ на клеевом составе — 1300 ₽/м² */
  GKL_GLUE: 939,
  /** Укладка минераловатного утеплителя в каркас — 380 ₽/м² */
  INSULATION: 700,
} as const

/**
 * Функция для создания табов калькулятора
 */
export const createCalculatorTabs = (
  findWorkById: (id: number) => NormalizedWorkItem | undefined
): CalculatorTab[] => {
  const gkl1 = findWorkById(WORK_IDS.GKL_1_LAYER)
  const gkl2 = findWorkById(WORK_IDS.GKL_2_LAYERS)
  const gklGlue = findWorkById(WORK_IDS.GKL_GLUE)
  const insulation = findWorkById(WORK_IDS.INSULATION)

  return [
    {
      id: 'frame',
      label: 'На каркас',
      icon: 'mdi:frame',
      works: [
        {
          name: gkl1?.name ?? 'Обшивка стен ГКЛ 1 слой на металлическом каркасе',
          price: gkl1?.pricePerUnit ?? 1600,
          unit: formatUnit(gkl1?.normalizedUnit),
        },
      ],
      extras: [
        {
          id: '2layers',
          name: 'Обшивка в 2 слоя (доплата)',
          price: Math.max(0, (gkl2?.pricePerUnit ?? 1800) - (gkl1?.pricePerUnit ?? 1600)),
          unit: formatUnit(gkl1?.normalizedUnit),
        },
        {
          id: 'insulation',
          name: insulation?.name ?? 'Укладка утеплителя/звукоизоляции',
          price: insulation?.pricePerUnit ?? 380,
          unit: formatUnit(insulation?.normalizedUnit),
        },
      ],
    },
    {
      id: 'glue',
      label: 'На клей',
      icon: 'mdi:land-fields',
      works: [
        {
          name: gklGlue?.name ?? 'Обшивка стен ГКЛ на клеевом составе',
          price: gklGlue?.pricePerUnit ?? 1300,
          unit: formatUnit(gklGlue?.normalizedUnit),
        },
      ],
      extras: [],
    },
  ]
}

/**
 * Факторы, влияющие на цену
 */
export const priceFactors: PriceFactor[] = [
  {
    title: 'Кривизна стен',
    description:
      'При перепадах более 5 см монтаж на клей невозможен — нужен каркас, что дороже.',
    icon: 'mdi:wall',
  },
  {
    title: 'Высота потолков',
    description:
      'Работы выше 3 м требуют лесов и страховки — увеличивается стоимость м².',
    icon: 'mdi:human-male-height',
  },
  {
    title: 'Коммуникации',
    description:
      'Закладка под розетки, выключатели, трубы учитывается отдельно.',
    icon: 'mdi:pipe',
  },
  {
    title: 'Объём работ',
    description: 'При площади свыше 100 м² действуют оптовые скидки до 15%.',
    icon: 'mdi:ruler-square',
  },
  {
    title: 'Срочность',
    description:
      'Работа в ночные смены оплачивается с коэффициентом 1.3.',
    icon: 'mdi:clock-alert',
  },
]

/**
 * Этапы работ
 */
export const workStages: WorkStage[] = [
  {
    title: 'Заявка и замер',
    description:
      'Инженер приезжает, замеряет помещение, оценивает кривизну и коммуникации.',
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
    description: 'Привозим ГКЛ, профили, крепёж. Все материалы с сертификатами.',
    icon: 'mdi:truck-delivery',
    duration: '1-2 дня',
  },
  {
    title: 'Монтаж',
    description: 'Собираем каркас, укладываем изоляцию, обшиваем листами.',
    icon: 'mdi:hammer-wrench',
    duration: '1-3 дня',
    highlighted: true,
    result: 'Ровные стены',
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
    question: 'Какой гипсокартон выбрать для ванной?',
    answer:
      'Только влагостойкий (ГКЛВ, зелёного цвета). Обычный ГКЛ во влажной среде разбухает за 2-3 года. Для зон прямого контакта с водой лучше дополнительно использовать гидроизоляцию.',
  },
  {
    question: 'Можно ли клеить ГКЛ на кирпичную стену?',
    answer:
      'Да, если перепад стен не превышает 2 см на 2 метра. При большей кривизне — только каркасный монтаж, иначе листы могут отойти или треснуть по швам.',
  },
  {
    question: 'Сколько сохнет шпаклёвка на ГКЛ перед покраской?',
    answer:
      'Первый слой — 4-6 часов при +20°C. Полный цикл (грунт + 2 слоя + шлифовка) — 2-3 дня. После этого можно клеить обои или красить.',
  },
  {
    question: 'Можно ли на стену из ГКЛ вешать тяжёлые полки?',
    answer:
      'Да, но только на специальные дюбели (Molly, «бабочка»). Для телевизора и кухонных шкафов закладываем деревянные закладные на этапе монтажа каркаса.',
  },
  {
    question: 'Какая звукоизоляция у стены из ГКЛ?',
    answer:
      'Стандартная стена 1 слой + минвата 50 мм — ~45 дБ. С двумя слоями ГКЛ + минвата 100 мм — до 58 дБ (уровень тихой спальни).',
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
    name: 'wallType',
    label: 'Тип стены',
    type: 'tiles' as const,
    options: [
      { value: 'concrete', label: 'Бетон', icon: 'mdi:wall' },
      { value: 'brick', label: 'Кирпич', icon: 'mdi:bricks' },
      { value: 'foam', label: 'Пеноблок', icon: 'mdi:layers' },
      { value: 'wood', label: 'Дерево', icon: 'mdi:tree' },
    ],
  },
]

/**
 * Конфигурация сообщения для CTA
 */
export const messageConfig = {
  emoji: '🧱',
  title: 'Заявка на монтаж ГКЛ',
  sourceLabel: 'ГКЛ на стены — CTA',
  fieldLabels: { wallType: 'Тип стены' },
}

/**
 * SEO данные для страницы
 */
export const seoData = {
  category: 'gkl',
  categoryName: 'ГКЛ',
  slug: 'steny',
  title: 'Монтаж гипсокартона на стены',
  description:
    'Монтаж ГКЛ на стены под ключ в Рязани: на каркас или клей. Выравнивание стен, утепление, звукоизоляция. Гарантия 3 года, фиксированная цена от 1800 ₽/м².',
  city: 'Рязани',
  priceFrom: 1800,
  serviceType: 'Монтаж гипсокартона',
  ogImage: 'https://glavprofi.ru/og-gkl-steny.jpg',
}
