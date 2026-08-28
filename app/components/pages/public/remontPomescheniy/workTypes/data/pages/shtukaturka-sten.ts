// app/components/pages/public/remontPomescheniy/workTypes/data/pages/shtukaturka-sten.ts
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
 * Преимущества штукатурки стен — зачем она нужна
 */
export const categoryAdvantages: OverviewAdvantage[] = [
  {
    title: 'Выравнивание до 5 см',
    description: 'Убирает крупные перепады, которые не исправить шпаклёвкой',
    icon: 'mdi:wall',
  },
  {
    title: 'Прочное основание',
    description: 'Выдерживает тяжёлые полки, навесные шкафы и плитку',
    icon: 'mdi:arm-flex',
  },
  {
    title: 'Тепло- и звукоизоляция',
    description: 'Слой 20–30 мм снижает теплопотери и шум на 5–10 дБ',
    icon: 'mdi:volume-off',
  },
]

/**
 * Сравнение подходов к штукатурке.
 * 🔄 Цены берутся из прайс-листа автоматически через priceWorkId / priceWorkIds.
 */
export const comparisonMethods: MethodOption[] = [
  {
    title: 'Гипсовая (ручная)',
    icon: 'mdi:hand-water',
    priceWorkId: 1143,
    whenToUse: [
      'Сухие помещения: офисы, коридоры, гостиные',
      'Перепады до 30 мм',
      'Средние объёмы (до 100 м²)',
      'Нужна паропроницаемая «дышащая» стена',
    ],
    pros: [
      'Универсальный и самый доступный вариант',
      'Пластичная — легко затирается',
      'Быстро сохнет (5–7 дней до шпаклёвки)',
      'Хорошая тепло- и звукоизоляция',
    ],
    cons: [
      'Не подходит для влажных зон',
      'Требует ручного труда — дольше машинной',
    ],
  },
  {
    title: 'Гипсовая с армированием',
    icon: 'mdi:grid',
    priceWorkIds: [1144],
    recommended: true,
    whenToUse: [
      'Перепады от 30 до 50 мм',
      'Новостройки (усадка 2–3 года)',
      'Стыки разных материалов (кирпич + бетон)',
      'Проблемные основания (газобетон, пеноблок)',
    ],
    pros: [
      'Армосетка исключает трещины при усадке',
      'Подходит для толстых слоёв',
      'Профессиональный стандарт для новостроек',
      'Надёжность на десятилетия',
    ],
    cons: [
      'Дороже обычной гипсовой на 15–20%',
      'Дольше на 1 день (монтаж сетки)',
    ],
  },
  {
    title: 'Цементно-песчаная',
    icon: 'mdi:water-percent',
    priceWorkId: 1147,
    whenToUse: [
      'Влажные помещения: санузлы, кухни, бойлерные',
      'Фасады и неотапливаемые помещения',
      'Основания под керамическую плитку',
      'Цокольные этажи и подвалы',
    ],
    pros: [
      'Полная влагостойкость',
      'Морозостойкость (циклы замораживания)',
      'Высокая прочность — выдерживает плитку',
      'Долговечность 20+ лет',
    ],
    cons: [
      'Долго сохнет — 14–21 день',
      'Тяжелее наносить вручную',
      'Дороже гипсовой на 20–30%',
    ],
  },
]

/**
 * Технические нюансы штукатурки
 */
export const technicalInsights: InsightItem[] = [
  {
    title: 'Маяки — обязательный элемент',
    description:
      'Металлические или растворные маяки задают плоскость. Без них стена получится волнистой. Шаг между маяками — 1,2–1,5 м (по длине правила).',
    icon: 'mdi:format-line-spacing',
    highlight: true,
  },
  {
    title: 'Армирование при слое более 30 мм',
    description:
      'Толстый слой штукатурки при высыхании даёт усадку и трескается. Металлическая или стеклосетка принимает нагрузки на себя. Без неё — трещины через 1–2 года.',
    icon: 'mdi:grid',
  },
  {
    title: 'Срок высыхания критичен',
    description:
      'Гипсовая штукатурка сохнет 5–7 дней (1 мм слоя = 1 день). Цементная — 14–21 день. Нельзя форсировать обогревателями — появятся трещины.',
    icon: 'mdi:clock-outline',
    fact: 'Правило: 1 мм слоя = 1 день сушки при +20°C и нормальной вентиляции',
  },
  {
    title: 'Насечка на гладком бетоне',
    description:
      'Монолитные бетонные стены слишком гладкие — штукатурка отслаивается. Делается насечка (380 ₽/м²) или наносится адгезионная грунтовка (бетоноконтакт).',
    icon: 'mdi:wall',
  },
]

/**
 * ID работ из прайс-листа (БД) для автоматической подгрузки цен.
 */
export const WORK_IDS = {
  /** Очистка стен от пыли, грязи */
  OCHISTKA: 758,
  /** Грунтовка */
  GRUNTOVKA: 763,
  /** Грунтовка для пористых оснований */
  GRUNTOVKA_PORIST: 764,
  /** Механическая насечка бетона */
  NASECHKA: 759,
  /** Монтаж маяков */
  MAYAKI: 1141,
  /** Армирующая сетка */
  SETKA: 1140,
  /** Штукатурка стен (слой 10–30 мм) — гипсовая */
  GIPS_BASIC: 1143,
  /** Штукатурка стен с армированием (слой 30–50 мм) */
  GIPS_ARM: 1144,
  /** Штукатурка для влажных и технических помещений (цементная) */
  CEMENT: 1147,
  /** Влагостойкая штукатурка (бассейны, мойки) */
  CEMENT_VL: 1148,
  /** Отделка углов армирующим уголком */
  UGOL: 1142,
} as const

/**
 * Функция для создания табов калькулятора.
 */
export const createCalculatorTabs = (
  findWorkById: (id: number) => NormalizedWorkItem | undefined
): CalculatorTab[] => {
  const grunt = findWorkById(WORK_IDS.GRUNTOVKA)
  const ochistka = findWorkById(WORK_IDS.OCHISTKA)
  const mayaki = findWorkById(WORK_IDS.MAYAKI)
  const setka = findWorkById(WORK_IDS.SETKA)
  const gipsBasic = findWorkById(WORK_IDS.GIPS_BASIC)
  const gipsArm = findWorkById(WORK_IDS.GIPS_ARM)
  const cement = findWorkById(WORK_IDS.CEMENT)
  const ugol = findWorkById(WORK_IDS.UGOL)
  const nasetchka = findWorkById(WORK_IDS.NASECHKA)

  return [
    {
      id: 'gips-basic',
      label: 'Гипсовая',
      icon: 'mdi:hand-water',
      works: [
        {
          name: grunt?.name ?? 'Грунтовка',
          price: grunt?.pricePerUnit ?? 0,
          unit: formatUnit(grunt?.normalizedUnit),
        },
        {
          name: mayaki?.name ?? 'Монтаж маяков',
          price: mayaki?.pricePerUnit ?? 0,
          unit: formatUnit(mayaki?.normalizedUnit),
        },
        {
          name: gipsBasic?.name ?? 'Штукатурка стен (слой 10–30 мм)',
          price: gipsBasic?.pricePerUnit ?? 0,
          unit: formatUnit(gipsBasic?.normalizedUnit),
        },
      ],
      extras: [
        {
          id: 'ochistka',
          name: ochistka?.name ?? 'Очистка стен от пыли, грязи',
          price: ochistka?.pricePerUnit ?? 0,
          unit: formatUnit(ochistka?.normalizedUnit),
        },
        {
          id: 'ugol',
          name: ugol?.name ?? 'Отделка углов армирующим уголком',
          price: ugol?.pricePerUnit ?? 0,
          unit: 'м.п.',
        },
      ],
    },
    {
      id: 'gips-arm',
      label: 'С армированием',
      icon: 'mdi:grid',
      works: [
        {
          name: grunt?.name ?? 'Грунтовка',
          price: grunt?.pricePerUnit ?? 0,
          unit: formatUnit(grunt?.normalizedUnit),
        },
        {
          name: mayaki?.name ?? 'Монтаж маяков',
          price: mayaki?.pricePerUnit ?? 0,
          unit: formatUnit(mayaki?.normalizedUnit),
        },
        {
          name: setka?.name ?? 'Армирующая сетка',
          price: setka?.pricePerUnit ?? 0,
          unit: formatUnit(setka?.normalizedUnit),
        },
        {
          name: gipsArm?.name ?? 'Штукатурка стен с армированием (слой 30–50 мм)',
          price: gipsArm?.pricePerUnit ?? 0,
          unit: formatUnit(gipsArm?.normalizedUnit),
        },
      ],
      extras: [
        {
          id: 'ochistka',
          name: ochistka?.name ?? 'Очистка стен от пыли, грязи',
          price: ochistka?.pricePerUnit ?? 0,
          unit: formatUnit(ochistka?.normalizedUnit),
        },
        {
          id: 'ugol',
          name: ugol?.name ?? 'Отделка углов армирующим уголком',
          price: ugol?.pricePerUnit ?? 0,
          unit: 'м.п.',
        },
      ],
    },
    {
      id: 'cement',
      label: 'Цементная',
      icon: 'mdi:water-percent',
      works: [
        {
          name: grunt?.name ?? 'Грунтовка',
          price: grunt?.pricePerUnit ?? 0,
          unit: formatUnit(grunt?.normalizedUnit),
        },
        {
          name: mayaki?.name ?? 'Монтаж маяков',
          price: mayaki?.pricePerUnit ?? 0,
          unit: formatUnit(mayaki?.normalizedUnit),
        },
        {
          name: cement?.name ?? 'Штукатурка для влажных и технических помещений',
          price: cement?.pricePerUnit ?? 0,
          unit: formatUnit(cement?.normalizedUnit),
        },
      ],
      extras: [
        {
          id: 'ochistka',
          name: ochistka?.name ?? 'Очистка стен от пыли, грязи',
          price: ochistka?.pricePerUnit ?? 0,
          unit: formatUnit(ochistka?.normalizedUnit),
        },
        {
          id: 'setka',
          name: setka?.name ?? 'Армирующая сетка (обязательно для толстого слоя)',
          price: setka?.pricePerUnit ?? 0,
          unit: formatUnit(setka?.normalizedUnit),
        },
        {
          id: 'nasetchka',
          name: nasetchka?.name ?? 'Механическая насечка бетона',
          price: nasetchka?.pricePerUnit ?? 0,
          unit: formatUnit(nasetchka?.normalizedUnit),
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
    title: 'Кривизна стен',
    description:
      'Перепады до 30 мм — базовая цена. От 30 до 50 мм — армирование и доплата. Более 50 мм — 2 слоя или обшивка ГКЛ.',
    icon: 'mdi:wall',
  },
  {
    title: 'Тип основания',
    description:
      'Бетон требует насечки или бетоноконтакта. Газобетон — обязательного армирования. Кирпич — самый простой вариант.',
    icon: 'mdi:bricks',
  },
  {
    title: 'Площадь и геометрия',
    description:
      'Большие ровные поверхности дешевле. Ниши, арки, эркеры, оконные откосы считаются отдельно — больше ручного труда.',
    icon: 'mdi:ruler-square',
  },
  {
    title: 'Тип состава',
    description:
      'Гипсовая дешевле. Цементная дороже на 20–30%. Декоративные и специализированные смеси — на 50–100%.',
    icon: 'mdi:flask-outline',
  },
  {
    title: 'Способ нанесения',
    description:
      'Машинная штукатурка дешевле ручной на 10–15% при площадях от 100 м². Ручная — для малых объёмов и сложных зон.',
    icon: 'mdi:robot',
  },
]

/**
 * Этапы работ
 */
export const workStages: WorkStage[] = [
  {
    title: 'Заявка и осмотр',
    description:
      'Инженер приезжает, замеряет стены, определяет перепады лазерным нивелиром, подбирает тип состава.',
    icon: 'mdi:clipboard-text',
    duration: '1 день',
    result: 'Точная смета',
  },
  {
    title: 'Подготовка основания',
    description:
      'Очистка от пыли, удаление старой штукатурки, обработка пятен. Для бетона — насечка или бетоноконтакт.',
    icon: 'mdi:broom',
    duration: '1 день',
  },
  {
    title: 'Грунтовка и маяки',
    description:
      'Грунтовка глубокого проникновения. Установка металлических маяков с шагом 1,2 м по лазерному уровню.',
    icon: 'mdi:format-line-spacing',
    duration: '1 день',
    result: 'Плоскость задана',
  },
  {
    title: 'Нанесение штукатурки',
    description:
      'Наброс раствора, вытягивание правилом по маякам, затирка. При слое более 30 мм — армирование сеткой.',
    icon: 'mdi:hand-water',
    duration: '1–3 дня',
    // highlight: true,
    result: 'Ровные стены',
  },
  {
    title: 'Сушка и контроль',
    description:
      'Естественная сушка 5–7 дней (гипс) или 14–21 день (цемент). Проверяем плоскость правилом и лазером.',
    icon: 'mdi:clock-outline',
    duration: '5–21 день',
  },
  {
    title: 'Приёмка и гарантия',
    description:
      'Подписываем акт. Выдаём гарантийный талон на 3 года. Стена готова под шпаклёвку или финишную отделку.',
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
    description: 'На отсутствие трещин, отслоений и усадки. Устраняем дефекты бесплатно.',
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
    title: 'Контроль плоскости',
    description:
      'Принимаем работу лазерным нивелиром и правилом. Отклонение — не более 2 мм на 2 м.',
    icon: 'mdi:laser-pointer',
  },
  {
    title: 'Мастера с опытом 5+ лет',
    description: 'Штатные бригады, каждый прошёл аттестацию Knauf / Weber.',
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
    question: 'Сколько сохнет штукатурка стен?',
    answer:
      'Гипсовая — 5–7 дней (правило: 1 мм слоя = 1 день сушки при +20°C). Цементная — 14–21 день. Ускорять обогревателями нельзя — появятся трещины.',
  },
  {
    question: 'Когда нужна армирующая сетка?',
    answer:
      'Обязательно при слое более 30 мм, на стыках разных материалов (кирпич + бетон), в новостройках (усадка 2–3 года), на газобетоне и пеноблоке.',
  },
  {
    question: 'Чем отличается штукатурка от шпаклёвки?',
    answer:
      'Штукатурка выравнивает крупные перепады (слой 10–50 мм), шпаклёвка — финишная гладкость (слой 0,5–3 мм). Штукатурка делается до шпаклёвки, а не вместо неё.',
  },
  {
    question: 'Машинная или ручная штукатурка — что выбрать?',
    answer:
      'Машинная дешевле на 10–15% при площадях от 100 м², даёт более однородный слой. Ручная — для малых объёмов, сложных зон и локального ремонта.',
  },
  {
    question: 'Можно ли штукатурить по старой краске или обоям?',
    answer:
      'Нет. Краску и обои нужно полностью удалить. Иначе штукатурка отслоится вместе со старым покрытием. После удаления — обязательная насечка или бетоноконтакт.',
  },
  {
    question: 'Какая штукатурка подойдёт для ванной?',
    answer:
      'Только цементно-песчаная. Гипсовая во влажной среде разбухает и теряет прочность за 1–2 года. После высыхания цементной штукатурки делается гидроизоляция перед плиткой.',
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
    name: 'wallMaterial',
    label: 'Материал стен',
    type: 'tiles' as const,
    options: [
      { value: 'brick', label: 'Кирпич', icon: 'mdi:bricks' },
      { value: 'concrete', label: 'Бетон', icon: 'mdi:wall' },
      { value: 'foam', label: 'Пеноблок / газобетон', icon: 'mdi:layers' },
      { value: 'old', label: 'Старая штукатурка', icon: 'mdi:refresh' },
    ],
  },
  {
    name: 'roomType',
    label: 'Тип помещения',
    type: 'tiles' as const,
    options: [
      { value: 'dry', label: 'Сухое (офис, комната)', icon: 'mdi:home-outline' },
      { value: 'wet', label: 'Влажное (санузел, кухня)', icon: 'mdi:water-percent' },
      { value: 'cold', label: 'Неотапливаемое', icon: 'mdi:snowflake' },
      { value: 'commercial', label: 'Коммерческое', icon: 'mdi:office-building' },
    ],
  },
]

/**
 * Конфигурация сообщения для CTA
 */
export const messageConfig = {
  emoji: '🧱',
  title: 'Заявка на штукатурку стен',
  sourceLabel: 'Штукатурка стен — CTA',
  fieldLabels: {
    wallMaterial: 'Материал стен',
    roomType: 'Тип помещения',
  },
}

/**
 * SEO данные для страницы.
 * 🔄 priceFrom вычисляется в компоненте из прайс-листа.
 */
export const seoData = {
  category: 'shtukaturka',
  categoryName: 'Штукатурка',
  slug: 'sten',
  title: 'Штукатурка стен в Рязани — гипсовая и цементная',
  description:
    'Штукатурка стен в Рязани: гипсовая, цементная, с армированием. Ручное и машинное нанесение. Выравнивание перепадов до 5 см. Гарантия 3 года.',
  city: 'Рязани',
  serviceType: 'Штукатурка стен',
  ogImage: 'https://glavprofi.ru/og-shtukaturka-sten.jpg',
  pageUrl: '/vidy-rabot/shtukaturka-sten',
  categoryUrl: '/vidy-rabot/shtukaturka-sten',
}
