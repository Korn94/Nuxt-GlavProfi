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
  RelatedWorkTypeItem,
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
 * 🔄 Порядок строго соответствует template
 */
export const navItems: StickyNavItem[] = [
  { id: 'before-after', label: 'До и после', icon: 'mdi:compare-horizontal' },
  { id: 'calculator', label: 'Калькулятор', icon: 'mdi:calculator' },
  { id: 'price-list', label: 'Цены', icon: 'mdi:currency-usd' },
  { id: 'price-factors', label: 'Факторы цены', icon: 'mdi:cash-multiple' },
  { id: 'overview', label: 'О услуге', icon: 'mdi:information-outline' },
  { id: 'methods', label: 'Что выбрать', icon: 'mdi:help-circle' },
  { id: 'quick-cta', label: 'Консультация', icon: 'mdi:phone-outline' },
  { id: 'materials', label: 'Материалы', icon: 'mdi:layers-outline' },
  { id: 'insights', label: 'Тех. нюансы', icon: 'mdi:lightbulb-on-outline' },
  { id: 'guarantees', label: 'Гарантии', icon: 'mdi:shield-check' },
  { id: 'stages', label: 'Этапы работ', icon: 'mdi:timeline-clock' },
  { id: 'faq', label: 'Вопросы', icon: 'mdi:help-circle-outline' },
  { id: 'portfolio', label: 'Портфолио', icon: 'mdi:image-multiple' },
  { id: 'projects', label: 'Проекты', icon: 'mdi:office-building' },
  { id: 'cta', label: 'Заказать', icon: 'mdi:send-outline' },
  { id: 'related', label: 'Другие работы', icon: 'mdi:view-grid-outline' },
]

/**
 * Преимущества шпаклёвки стен
 */
export const categoryAdvantages: OverviewAdvantage[] = [
  {
    title: 'Ровная поверхность',
    description: 'Под выбранную отделку: от стартового слоя под обои до контроля прожектором под покраску',
    icon: 'mdi:circle-outline',
  },
  {
    title: 'Меньше трещин',
    description: 'Армируем стыки ГКЛ серпянкой и соблюдаем толщину слоя по технологии',
    icon: 'mdi:shield-outline',
  },
  {
    title: 'Понятные сроки',
    description: 'Каждый слой сохнет по технологии, график фиксируем в договоре',
    icon: 'mdi:clock-fast',
  },
]

export const comparisonMethods: MethodOption[] = [
  {
    title: 'Стартовая (1 слой)',
    icon: 'mdi:layers-outline',
    priceWorkId: 806,
    tagline: 'Под плотные обои и декоративную штукатурку',
    specs: {
      layerThickness: 'До 3 мм за проход',
      finishType:     'Плотные обои, декоративная штукатурка',
      smoothness:     'Шероховатая: видна фактура',
      duration:       '1 день',
      qualityControl: 'Визуальный осмотр',
    },
    whenToUse: [
      'Под плотные виниловые или флизелиновые обои',
      'Под декоративную штукатурку с крупным рельефом',
      'Заделка стыков ГКЛ и мелких выбоин за 1 день',
      'Когда отделка скрывает фактуру основания',
    ],
    cons: [
      'Под покраску и тонкие бумажные обои не подходит — проявятся неровности',
      'Не заменяет выравнивание перепадов до 5 мм — это отдельная работа',
      'Оставляет микрошероховатость на поверхности',
    ],
  },
  {
    title: 'Стартовая + финишная (2 слоя)',
    icon: 'mdi:layers-triple',
    priceWorkIds: [806, 811],
    recommended: true,
    tagline: 'Под покраску и тонкие обои',
    specs: {
      layerThickness: 'Старт до 3 мм + финиш 1–2 мм',
      finishType:     'Матовая краска, тонкие обои',
      smoothness:     'Ровная при боковом свете',
      duration:       '2–3 дня',
      qualityControl: 'Боковой свет',
    },
    whenToUse: [
      'Под матовую покраску и тонкие бумажные обои',
      'Когда важно, чтобы не проступали пятна основания',
      'Стандарт для жилых и офисных помещений',
      'Под глянцевую краску — если нет бокового света',
    ],
    cons: [
      'Срок больше на 1–2 дня: каждый слой сохнет 12–24 часа',
      'Шлифовка даёт пыль — укрываем полы и мебель',
      'Под тёмные и глянцевые цвета при боковом свете нужен уровень «под лампочку»',
    ],
  },
  {
    title: 'Под покраску «под лампочку»',
    icon: 'mdi:spotlight-beam',
    priceWorkIds: [806, 813],
    tagline: 'Тёмные и глянцевые цвета при боковом свете',
    specs: {
      layerThickness: 'Те же 2 слоя: старт до 3 мм + финиш 1–2 мм',
      finishType:     'Тёмная, насыщенная и глянцевая краска',
      smoothness:     'Перепад не более 1 мм на 2 м при боковом свете',
      duration:       '3–4 дня',
      qualityControl: 'Прожектор по всей площади',
    },
    whenToUse: [
      'Покраска в тёмные, насыщенные и глянцевые цвета',
      'Помещения с боковым или направленным светом (треки, бра)',
      'Когда стена освещается почти вплотную',
      'Когда нужен измеримый критерий приёмки: 1 мм на 2 м',
    ],
    cons: [
      'Дороже варианта под покраску на 100 ₽/м² за слои',
      'Требует ровного основания: перепад больше 1 мм на 2 м сначала выравниваем',
      'Дольше из-за контроля и доводки',
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
      'Без грунтовки шпаклёвка хуже держится, неравномерно сохнет и может отслоиться. Основание грунтуем перед первым слоем, каждый следующий слой — по требованиям производителя. Повторное грунтование в прайсе — 90 ₽/м².',
    icon: 'mdi:alert-outline',
  },
  {
    title: 'Толщина слоя',
    description:
      'Гипсовая шпаклёвка наносится слоем до 3 мм за проход. При большей толщине трескается при высыхании. Перепады до 5 мм выравниваем отдельной работой — 500 ₽/м².',
    icon: 'mdi:layers-plus',
    highlight: true,
  },
  {
    title: 'Стыки ГКЛ армируем',
    description:
      'Стыки гипсокартона проклеиваем серпянкой перед шпаклёвкой. Без армирования трещины часто появляются через 3–6 месяцев. В прайсе — 180 ₽/м.п.',
    icon: 'mdi:grid',
  },
  {
    title: '«Под лампочку» — не третий слой',
    description:
      'Это те же два слоя, но каждый участок проверяем боковым светом и прожектором, находим неровности и устраняем до шлифовки. Критерий приёмки — перепад не более 1 мм на 2 м.',
    icon: 'mdi:spotlight-beam',
    fact: 'Разница с обычной подготовкой — в контроле и доводке, а не в количестве слоёв',
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
  /** Демонтаж шпаклёвки */
  DEMONTAZH_SHPAKLEVKA: 646,
  /** Снятие обоев */
  SNYATIE_OBOEV: 647,
  /** Удаление покраски */
  UDALENIE_POKRASKI: 649,
  /** Локальная заделка выбоин */
  ZADELKA_VYBOIN: 810,
} as const

/**
 * 🆕 Функция для создания табов калькулятора шпаклёвки стен.
 * Использует baseOptions для выбора типа отделки.
 */
export const createCalculatorTabs = (
  findWorkById: (id: number) => NormalizedWorkItem | undefined
): CalculatorTab[] => {
  const grunt = findWorkById(WORK_IDS.GRUNTOVKA)
  const startGips = findWorkById(WORK_IDS.START_GIPS)
  const startCement = findWorkById(WORK_IDS.START_CEMENT)
  const finishGips = findWorkById(WORK_IDS.FINISH_GIPS)
  const podPokrasku = findWorkById(WORK_IDS.POD_POKRASKU)
  const shlifovka = findWorkById(WORK_IDS.SHLIFOVKA)
  const shlifPokraska = findWorkById(WORK_IDS.SHLIFOVKA_POKRASKA)
  const serpyanka = findWorkById(WORK_IDS.SERPYANKA)
  const demontazhShpaklevka = findWorkById(WORK_IDS.DEMONTAZH_SHPAKLEVKA)
  const snyatieOboev = findWorkById(WORK_IDS.SNYATIE_OBOEV)
  const udaleniePokraski = findWorkById(WORK_IDS.UDALENIE_POKRASKI)
  const zadelkaVyboin = findWorkById(WORK_IDS.ZADELKA_VYBOIN)

  return [
    {
      id: 'shpaklevka',
      label: 'Шпаклёвка',
      icon: 'mdi:layers-outline',
      works: [],
      baseOptionsLabel: 'Тип отделки',
      // Базовая цена — только шпаклёвочные слои. Грунтовка и шлифовка вынесены
      // в доплаты ниже, чтобы итог складывался построчно:
      // 700 ₽ (2 слоя) + 140 ₽ (грунтовка) + 180 ₽ (шлифовка) = 1 020 ₽/м².
      baseOptions: [
        {
          id: 'start-only',
          name: 'Стартовая (1 слой)',
          price: startGips?.pricePerUnit ?? 0,
          unit: formatUnit(startGips?.normalizedUnit),
          description: 'Под плотные обои и декоративную штукатурку',
        },
        {
          id: 'start-finish',
          name: 'Стартовая + финишная (2 слоя)',
          price: (startGips?.pricePerUnit ?? 0) + (finishGips?.pricePerUnit ?? 0),
          unit: formatUnit(startGips?.normalizedUnit),
          recommended: true,
          description: 'Под покраску и тонкие обои',
          badge: 'Рекомендуем',
        },
        {
          id: 'premium',
          name: 'Под покраску «под лампочку»',
          price: (startGips?.pricePerUnit ?? 0) + (podPokrasku?.pricePerUnit ?? 0),
          unit: formatUnit(startGips?.normalizedUnit),
          description: '2 слоя + контроль прожектором, тёмные и глянцевые цвета',
        },
        {
          id: 'cement',
          name: 'Цементная (для влажных)',
          price: startCement?.pricePerUnit ?? 0,
          unit: formatUnit(startCement?.normalizedUnit),
          description: 'Ванные, кухни, технические помещения',
        },
      ],
      extrasLabel: 'Грунтовка, шлифовка и дополнительные работы',
      extrasBeforeTotal: true,
      extras: [
        {
          id: 'grunt',
          name: grunt?.name ?? 'Грунтовка глубокого проникновения',
          price: grunt?.pricePerUnit ?? 0,
          unit: formatUnit(grunt?.normalizedUnit),
          required: true,
          description: 'Без грунтовки шпаклёвка хуже держится и может отслоиться',
          defaultFor: ['start-only', 'start-finish', 'premium', 'cement'],
        },
        {
          id: 'shlifovka',
          name: shlifovka?.name ?? 'Шлифовка стен',
          price: shlifovka?.pricePerUnit ?? 0,
          unit: formatUnit(shlifovka?.normalizedUnit),
          description: 'После набора прочности: абразив Р150–Р180',
          appliesToOptionIds: ['start-only', 'start-finish', 'cement'],
          defaultFor: ['start-finish'],
        },
        {
          id: 'shlifovka-pokraska',
          name: shlifPokraska?.name ?? 'Шлифовка стен под покраску',
          price: shlifPokraska?.pricePerUnit ?? 0,
          unit: formatUnit(shlifPokraska?.normalizedUnit),
          description: 'Шлифовка и доводка под боковой свет',
          appliesToOptionIds: ['premium'],
          defaultFor: ['premium'],
        },
        {
          id: 'serpyanka',
          name: serpyanka?.name ?? 'Армирование стыков ГКЛ серпянкой',
          price: serpyanka?.pricePerUnit ?? 0,
          unit: 'м.п.',
          recommended: true,
          description: 'Считается отдельно по м.п.',
          countsInTotal: false,
        },
        {
          id: 'demontazh-shpaklevka',
          name: demontazhShpaklevka?.name ?? 'Демонтаж старой шпаклёвки',
          price: demontazhShpaklevka?.pricePerUnit ?? 0,
          unit: formatUnit(demontazhShpaklevka?.normalizedUnit),
        },
        {
          id: 'snyatie-oboev',
          name: snyatieOboev?.name ?? 'Снятие старых обоев',
          price: snyatieOboev?.pricePerUnit ?? 0,
          unit: formatUnit(snyatieOboev?.normalizedUnit),
        },
        {
          id: 'udalenie-pokraski',
          name: udaleniePokraski?.name ?? 'Удаление старой краски',
          price: udaleniePokraski?.pricePerUnit ?? 0,
          unit: formatUnit(udaleniePokraski?.normalizedUnit),
        },
        {
          id: 'zadelka-vyboin',
          name: zadelkaVyboin?.name ?? 'Локальная заделка выбоин и углублений',
          price: zadelkaVyboin?.pricePerUnit ?? 0,
          unit: formatUnit(zadelkaVyboin?.normalizedUnit),
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
      'Под плотные обои — 1 стартовый слой (300 ₽/м²). Под покраску — 2 слоя + шлифовка (700 ₽/м² за слои). Под «лампочку» — 2 слоя с контролем (800 ₽/м²).',
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
      'Грунтуем основание перед первым слоем. Для пористых оснований — 2 слоя; повторное грунтование в прайсе — 90 ₽/м².',
    icon: 'mdi:brush-variant',
    duration: '4–6 часов',
    result: 'Готовое основание',
  },
  {
    title: 'Стартовая шпаклёвка',
    description:
      'Выравнивающий слой до 3 мм за проход. Стыки ГКЛ армируем серпянкой.',
    icon: 'mdi:layers-outline',
    duration: '1–2 дня',
    highlighted: true,
    result: 'Выровненная поверхность',
  },
  {
    title: 'Финишная шпаклёвка',
    description:
      'Слой 1–2 мм, затем шлифовка абразивом Р150–Р180 после высыхания.',
    icon: 'mdi:layers-triple',
    duration: '1–2 дня',
  },
  {
    title: 'Приёмка и гарантия',
    description:
      'Проверяем ровность боковым светом, подписываем акт. Гарантия 3 года.',
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
    description: 'При просрочке — неустойка 0,1% в день от стоимости работ.',
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
      'Принимаем этапы при боковом свете: вы видите ровность поверхности до покраски.',
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
      'Зависит от отделки. Под плотные обои и декоративную штукатурку — 1 стартовый слой. Под покраску и тонкие обои — 2 слоя: стартовая + финишная, со шлифовкой. «Под лампочку» — те же 2 слоя, но с контролем боковым светом и прожектором: третий слой не наносим.',
  },
  {
    question: 'Сколько сохнет шпаклёвка?',
    answer:
      'Гипсовая — 12–24 часа до шлифовки и следующего слоя при +20 °C и нормальной влажности. Полный набор прочности — до 48 часов. Цементная — от 24 часов. Нагревателями не сушим: появятся трещины.',
  },
  {
    question: 'Можно ли шпаклевать по старой краске?',
    answer:
      'Если краска держится прочно — да, по адгезионной грунтовке (бетоноконтакт). Если отслаивается — удаляем: иначе шпаклёвка отслоится вместе с краской.',
  },
  {
    question: 'Чем отличается шпаклёвка от штукатурки?',
    answer:
      'Штукатурка выравнивает крупные перепады — до 5 см. Шпаклёвка — финишный слой 0,5–3 мм; перепады до 5 мм выравниваем отдельной работой за 500 ₽/м². Штукатурка крупнозернистая, шпаклёвка — мелкая паста.',
  },
  {
    question: 'Нужно ли грунтовать между слоями?',
    answer:
      'Да. Основание грунтуем перед первым слоем, каждый следующий — по требованиям производителя. Грунтовка улучшает сцепление и снижает расход шпаклёвки. Повторное грунтование в прайсе — 90 ₽/м².',
  },
  {
    question: 'Какую шпаклёвку выбрать для ванной?',
    answer:
      'Цементную или влагостойкую полимерную. Гипсовая во влажной среде набухает и разрушается — обычно в течение 1–2 лет.',
  },
]

/**
 * Проекты для галереи «до/после»
 */
export const projectSlugs = ['fora-bank', 'klinika-alma']

/**
 * Проекты для витрины кейсов (не дублируют галерею «до/после»)
 */
export const projectShowcaseSlugs = ['ddx', 'zerno', 'cast']

/**
 * Смежные работы по отделке стен.
 * 🔄 Показываем только реально существующие страницы — битых ссылок не добавляем.
 */
export const relatedWorkTypes: RelatedWorkTypeItem[] = [
  {
    title: 'Штукатурка стен',
    to: '/vidy-rabot/shtukaturka-sten',
    icon: 'mdi:format-paint',
    priceWorkId: 1143,
    description: 'Выравнивание перепадов до 5 см',
    image: '/main/remont-pomescheniy/banki.webp',
  },
  {
    title: 'Облицовка стен ГКЛ',
    to: '/vidy-rabot/oblitsovka-gkl',
    icon: 'mdi:wall',
    priceWorkId: 1598,
    description: 'Ровные стены без штукатурки',
    image: '/main/remont-pomescheniy/medicina.webp',
  },
  {
    title: 'Перегородки из ГКЛ',
    to: '/vidy-rabot/peregorodki-gkl',
    icon: 'mdi:door-closed',
    priceWorkId: 683,
    description: 'Зонирование с шумоизоляцией',
    image: '/main/remont-pomescheniy/medicina.webp',
  },
  {
    title: 'Укладка плитки',
    to: '/vidy-rabot/ukladka-plitki',
    icon: 'mdi:checkerboard',
    priceWorkId: 835,
    description: 'Пол, стены, керамогранит',
    image: '/main/remont-pomescheniy/banki.webp',
  },
]

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
  title: 'Шпаклёвка стен',
  /**
   * 🆕 Полный meta title без суффикса «| ГлавПрофи»:
   * его добавляет titleTemplate в app.vue. Цена берётся из прайса автоматически.
   */
  metaTitle: ({ priceLabel }: { priceLabel: string }) =>
    `Шпаклёвка стен в Рязани — ${priceLabel}, гарантия 3 года`,
  description:
    'Шпаклёвка стен под покраску в Рязани: 2 слоя — 700 ₽/м², с грунтовкой и шлифовкой — 1 020 ₽/м². Цена в договоре, гарантия 3 года, замер бесплатный.',
  city: 'Рязани',
  serviceType: 'Шпаклёвка стен',
  ogImage: 'https://glavprofi.ru/og-remont-kommercheskih.jpg',
  pageUrl: '/vidy-rabot/shpaklevka-sten',
}
