// app/components/pages/public/remontPomescheniy/workTypes/data/pages/ukladka-plitki.ts
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
 * Преимущества плиточного покрытия
 */
export const categoryAdvantages: OverviewAdvantage[] = [
  {
    title: 'Служит десятилетиями',
    description: 'Керамогранит выдерживает проходную нагрузку, тележки и каблуки без износа',
    icon: 'mdi:shield-star',
  },
  {
    title: 'Не боится воды и химии',
    description: 'Можно мыть чем угодно — требование клиник, пищевых производств и санузлов',
    icon: 'mdi:water-off',
  },
  {
    title: 'Гигиеничность',
    description: 'Не впитывает грязь, жир и запахи, на ней не живёт грибок',
    icon: 'mdi:sparkles',
  },
]

/**
 * Сравнение направлений работ: пол, стена, крупноформат.
 * 🔄 Цены берутся из прайс-листа автоматически через priceWorkId.
 */
export const comparisonMethods: MethodOption[] = [
  {
    title: 'Плитка на пол',
    icon: 'mdi:checkerboard',
    priceWorkId: 836,
    whenToUse: [
      'Ванные, санузлы, прихожие, душевые',
      'Магазины, кафе, офисные проходные зоны',
      'Поверх тёплого пола — плитка хорошо отдаёт тепло',
    ],
    pros: [
      'Выдерживает высокую проходную нагрузку и влажную уборку',
      'Защищает стяжку от воды',
      'Легко ремонтируется: меняется одна плитка, а не всё покрытие',
    ],
    cons: [
      'Требует ровной стяжки (перепады до 4 мм на 2 м)',
      'Без тёплого пола поверхность холодная',
    ],
  },
  {
    title: 'Плитка на стены',
    icon: 'mdi:wall',
    priceWorkId: 842,
    whenToUse: [
      'Ванные комнаты и душевые',
      'Кухонные фартуки и рабочие зоны',
      'Стены клиник, салонов, пищевых производств',
    ],
    pros: [
      'Не боится воды, пара и брызг жира',
      'Легко мыть и дезинфицировать',
      'Не выгорает и не меняет вид десятилетиями',
    ],
    cons: [
      'Требует оштукатуренного и прогрунтованного основания',
      'Отверстия под полки — только специальным сверлом',
    ],
  },
  {
    title: 'Крупноформатный керамогранит',
    icon: 'mdi:arrow-expand-all',
    priceWorkId: 846,
    recommended: true,
    whenToUse: [
      'Шоурумы, магазины, входные группы офисов',
      'Когда нужно минимум швов и «монолитный» вид',
      'Ректифицированная плитка с_jointом от 1 мм',
    ],
    pros: [
      'Минимум швов — грязи негде скапливаться',
      'Визуально расширяет помещение',
      'Выдерживает нагрузку рохлей и тяжёлых тележек',
    ],
    cons: [
      'Требует идеально ровного основания и опытной бригады',
      'Резка и укладка дороже стандартного формата',
    ],
  },
]

/**
 * Технические нюансы плиточных работ
 */
export const technicalInsights: InsightItem[] = [
  {
    title: 'Основание решает всё',
    description:
      'Плитка не прощает кривизны: на буграх клей сохнет неравномерно, и плитка трескается под нагрузкой. Допустимое отклонение основания — до 4 мм на 2 метра.',
    icon: 'mdi:foundation',
  },
  {
    title: 'Гидроизоляция во влажных зонах',
    description:
      'В ванных, душевых и мойках обмазочная гидроизоляция наносится в 2 слоя на пол и на 15–20 см вверх по стенам. Без неё вода доходит до стяжки и разрушает её.',
    icon: 'mdi:water-outline',
    highlight: true,
  },
  {
    title: 'Клей подбирается под плитку',
    description:
      'Керамогранит почти не впитывает воду, поэтому обычный дешёвый клей его не удержит. Для керамогранита нужен усиленный состав класса C2, для крупноформата — C2TE S1.',
    icon: 'mdi:glue',
    fact: 'Класс клея указан на мешке: C1, C2, C2TE, S1',
  },
  {
    title: 'Шов — не декор, а необходимость',
    description:
      'Шов 1,5–3 мм компенсирует температурное расширение и разброс размеров плитки. Укладка вплотную приводит к «вздутию» покрытия. Во влажных и медицинских помещениях швы затирают эпоксидной затиркой.',
    icon: 'mdi:grid',
  },
]

/**
 * ID работ из прайс-листа (БД) для автоматической подгрузки цен.
 * 🔄 Все цены берутся через usePriceFetcher — никаких хардкодов.
 */
export const WORK_IDS = {
  // === ДЕМОНТАЖ СТАРОЙ ПЛИТКИ ===
  /** Демонтаж плитки со стены */
  DEMONTAZH_STENA: 664,
  /** Демонтаж плитки с пола */
  DEMONTAZH_POL: 666,
  /** Удаление единичной плитки без повреждения соседних */
  DEMONTAZH_EDINICHNAYA: 670,
  /** Демонтаж мозаики (стеклянная, керамическая) */
  DEMONTAZH_MOZAIKA: 671,
  /** Удаление фриза или декоративной вставки */
  DEMONTAZH_FRIZ: 672,
  /** Демонтаж плинтуса из плитки */
  DEMONTAZH_PLINTUS: 1392,

  // === ПОДГОТОВКА ОСНОВАНИЯ ===
  /** Очистка стен от пыли, грязи */
  OCHISTKA_STEN: 758,
  /** Механическая насечка бетона */
  NASECHKA: 759,
  /** Обработка пятен (масляные, жировые) */
  OBRABOTKA_PYATEN: 761,
  /** Стандартная стяжка по маякам (30–50 мм) */
  STYAZHKA_STANDARD: 718,
  /** Стяжка для влажных помещений (ванна, бойлерная) */
  STYAZHKA_VLAZHNAYA: 723,
  /** Штукатурка стен (слой 10–30 мм) */
  SHTUKATURKA_STEN: 1143,
  /** Штукатурка для влажных и технических помещений */
  SHTUKATURKA_VLAZHNAYA: 1147,
  /** Нанесение обмазочной гидроизоляции (цементно-полимерная, 2 слоя) */
  GIDROIZOLYATSIYA: 750,

  // === ГРУНТОВКА ПОД ПЛИТКУ ===
  /** Адгезионная грунтовка (бетоноконтакт) */
  GRUNTOVKA_ADGEZIYA: 831,
  /** Грунтовка пористых оснований (газобетон) */
  GRUNTOVKA_PORIST: 832,
  /** Обработка примыканий и труднодоступных зон */
  GRUNTOVKA_PRIMYKANIYA: 833,
  /** Повторное грунтование (при высоком впитывании) */
  GRUNTOVKA_POVTOR: 834,

  // === УКЛАДКА НАПОЛЬНОЙ ПЛИТКИ ===
  /** Плитка 30×30 см (пол) */
  POL_30x30: 835,
  /** Плитка 40×40 см (пол) */
  POL_40x40: 836,
  /** Плитка 60×60 см (пол) */
  POL_60x60: 837,
  /** Плитка 60×120 см (пол) */
  POL_60x120: 838,
  /** Доплата за укладку на тёплый пол */
  POL_TEPLY: 839,
  /** Доплата за укладку с уклоном */
  POL_UKLON: 841,

  // === УКЛАДКА НАСТЕННОЙ ПЛИТКИ ===
  /** Плитка 30×30 см (стена) */
  STENA_30x30: 840,
  /** Плитка 40×40 см (стена) */
  STENA_40x40: 842,
  /** Плитка 60×60 см (стена) */
  STENA_60x60: 843,
  /** Плитка 60×120 см (стена) */
  STENA_60x120: 844,
  /** Доплата за сложные поверхности (ниши, выступы, криволинейные стены) */
  STENA_SLOZHNAYA: 845,

  // === КРУПНОФОРМАТНАЯ ПЛИТКА ===
  /** Плитка 120×120 см и больше */
  KRUPNOFORMAT: 846,
  /** Ректифицированная плитка (ювелирный шов) */
  REKTIFIKAT: 847,
  /** Монтаж безрамного формата (без опоры по краям) */
  BEZRAMNY: 848,
  /** Работа с тяжёлым керамогранитом (≥20 кг/лист) */
  TYAZHELY_KERAMOGRANIT: 849,

  // === ЛЕСТНИЦЫ, СТУПЕНИ, ОТКОСЫ ===
  /** Облицовка ступеней */
  STUPENI: 850,
  /** Облицовка откосов */
  OTKOSY: 853,
  /** Подрезка плитки под 45 градусов + к цене */
  PODREZKA_45: 854,

  // === МОЗАИКА ===
  /** Стеклянная мозаика на сетке */
  MOZAIKA_STEKLO: 855,
  /** Керамическая мозаика */
  MOZAIKA_KERAMIKA: 856,
  /** Модульная мозаика */
  MOZAIKA_MODULNAYA: 857,
  /** Доплата за арочные и криволинейные поверхности */
  MOZAIKA_KRIVOLINEYNAYA: 858,

  // === РЕЗКА И ФИГУРНАЯ ОБРАБОТКА ===
  /** Прямая резка плитки (входит в стоимость укладки) */
  REZKA_PRYAMAYA: 859,
  /** Резка плитки по шаблону (под трубы, люки, ниши) */
  REZKA_SHABLON: 860,
  /** Сквозная резка крупноформатной плитки */
  REZKA_SKVOZNAYA: 861,
  /** Фигурная резка (арки, внутренние углы, сложные контуры) */
  REZKA_FIGURNAYA: 862,
  /** Подрезка под сантехнику */
  REZKA_SANTEHNIKA: 863,
  /** Сверление плитки */
  REZKA_SVERLENIE: 1413,

  // === ЗАТИРКА ШВОВ ===
  /** Цементная затирка (2–5 мм) */
  ZATIRKA_TSEMENT: 864,
  /** Эпоксидная затирка (устойчивая к влаге, химии, истиранию) */
  ZATIRKA_EPOKSID: 865,
  /** Антисептическая затирка (для влажных и медицинских помещений) */
  ZATIRKA_ANTISEPTIK: 866,
  /** Восстановление старых швов (очистка + повторная затирка) */
  ZATIRKA_VOSSTANOVLENIE: 867,
  /** Колеровка затирки */
  ZATIRKA_KOLEROVKA: 868,

    /** Тонкая стяжка (слой 20–30 мм) на готовое основание */
  STYAZHKA_TONKAYA: 719,
  /** Тонкослойное выравнивание наливным полом (3–5 мм) */
  NALIVNOY_TONKIY: 725,
  /** Восстановление основания под плитку после демонтажа */
  VOSSTANOVLENIE_POSLE_DEMONTAZHA: 745,
} as const

/**
 * Функция для создания табов калькулятора.
 * 🔄 Все цены берутся из прайс-листа через findWorkById.
 */
export const createCalculatorTabs = (
  findWorkById: (id: number) => NormalizedWorkItem | undefined
): CalculatorTab[] => {
  const pol60 = findWorkById(WORK_IDS.POL_60x60)
  const stena40 = findWorkById(WORK_IDS.STENA_40x40)
  const krupnoformat = findWorkById(WORK_IDS.KRUPNOFORMAT)
  const zatirkaTsement = findWorkById(WORK_IDS.ZATIRKA_TSEMENT)
  const tepliyPol = findWorkById(WORK_IDS.POL_TEPLY)
  const uklon = findWorkById(WORK_IDS.POL_UKLON)
  const gidro = findWorkById(WORK_IDS.GIDROIZOLYATSIYA)
  const slozhnaya = findWorkById(WORK_IDS.STENA_SLOZHNAYA)
  const podrezka45 = findWorkById(WORK_IDS.PODREZKA_45)
  const tyazhely = findWorkById(WORK_IDS.TYAZHELY_KERAMOGRANIT)
  // 🆕 Подготовка основания
  const gruntovka = findWorkById(WORK_IDS.GRUNTOVKA_ADGEZIYA)
  const styazhka = findWorkById(WORK_IDS.STYAZHKA_STANDARD)
  const tonkayaStyazhka = findWorkById(WORK_IDS.STYAZHKA_TONKAYA)
  const nalivnoyPol = findWorkById(WORK_IDS.NALIVNOY_TONKIY)
  const vosstanovlenie = findWorkById(WORK_IDS.VOSSTANOVLENIE_POSLE_DEMONTAZHA)

  return [
    {
      id: 'pol',
      label: 'Пол',
      icon: 'mdi:checkerboard',
      works: [
        {
          name: pol60?.name ?? 'Плитка 60×60 см (пол)',
          price: pol60?.pricePerUnit ?? 0,
          unit: formatUnit(pol60?.normalizedUnit),
        },
        {
          name: zatirkaTsement?.name ?? 'Цементная затирка (2–5 мм)',
          price: zatirkaTsement?.pricePerUnit ?? 0,
          unit: formatUnit(zatirkaTsement?.normalizedUnit),
        },
      ],
      extras: [
        {
          id: 'gruntovka-pol',
          name: gruntovka?.name ?? 'Адгезионная грунтовка (бетоноконтакт)',
          price: gruntovka?.pricePerUnit ?? 0,
          unit: formatUnit(gruntovka?.normalizedUnit),
        },
        {
          id: 'styazhka-pol',
          name: styazhka?.name ?? 'Стандартная стяжка по маякам (30–50 мм)',
          price: styazhka?.pricePerUnit ?? 0,
          unit: formatUnit(styazhka?.normalizedUnit),
        },
        {
          id: 'tonkaya-styazhka-pol',
          name: tonkayaStyazhka?.name ?? 'Тонкая стяжка (слой 20–30 мм) на готовое основание',
          price: tonkayaStyazhka?.pricePerUnit ?? 0,
          unit: formatUnit(tonkayaStyazhka?.normalizedUnit),
        },
        {
          id: 'nalivnoy-pol',
          name: nalivnoyPol?.name ?? 'Тонкослойное выравнивание наливным полом (3–5 мм)',
          price: nalivnoyPol?.pricePerUnit ?? 0,
          unit: formatUnit(nalivnoyPol?.normalizedUnit),
        },
        {
          id: 'vosstanovlenie-pol',
          name: vosstanovlenie?.name ?? 'Восстановление основания под плитку после демонтажа',
          price: vosstanovlenie?.pricePerUnit ?? 0,
          unit: formatUnit(vosstanovlenie?.normalizedUnit),
        },
        {
          id: 'gidro',
          name: gidro?.name ?? 'Нанесение обмазочной гидроизоляции (2 слоя)',
          price: gidro?.pricePerUnit ?? 0,
          unit: formatUnit(gidro?.normalizedUnit),
        },
        {
          id: 'teply-pol',
          name: tepliyPol?.name ?? 'Доплата за укладку на тёплый пол',
          price: tepliyPol?.pricePerUnit ?? 0,
          unit: formatUnit(tepliyPol?.normalizedUnit),
        },
        {
          id: 'uklon',
          name: uklon?.name ?? 'Доплата за укладку с уклоном',
          price: uklon?.pricePerUnit ?? 0,
          unit: formatUnit(uklon?.normalizedUnit),
        },
      ],
    },
    {
      id: 'stena',
      label: 'Стены',
      icon: 'mdi:wall',
      works: [
        {
          name: stena40?.name ?? 'Плитка 40×40 см (стена)',
          price: stena40?.pricePerUnit ?? 0,
          unit: formatUnit(stena40?.normalizedUnit),
        },
        {
          name: zatirkaTsement?.name ?? 'Цементная затирка (2–5 мм)',
          price: zatirkaTsement?.pricePerUnit ?? 0,
          unit: formatUnit(zatirkaTsement?.normalizedUnit),
        },
      ],
      extras: [
        {
          id: 'gruntovka-stena',
          name: gruntovka?.name ?? 'Адгезионная грунтовка (бетоноконтакт)',
          price: gruntovka?.pricePerUnit ?? 0,
          unit: formatUnit(gruntovka?.normalizedUnit),
        },
        {
          id: 'slozhnaya',
          name: slozhnaya?.name ?? 'Доплата за сложные поверхности (ниши, выступы)',
          price: slozhnaya?.pricePerUnit ?? 0,
          unit: formatUnit(slozhnaya?.normalizedUnit),
        },
        {
          id: 'podrezka45',
          name: podrezka45?.name ?? 'Подрезка плитки под 45 градусов',
          price: podrezka45?.pricePerUnit ?? 0,
          unit: formatUnit(podrezka45?.normalizedUnit),
        },
      ],
    },
    {
      id: 'krupnoformat',
      label: 'Крупноформат',
      icon: 'mdi:arrow-expand-all',
      works: [
        {
          name: krupnoformat?.name ?? 'Плитка 120×120 см и больше',
          price: krupnoformat?.pricePerUnit ?? 0,
          unit: formatUnit(krupnoformat?.normalizedUnit),
        },
        {
          name: zatirkaTsement?.name ?? 'Цементная затирка (2–5 мм)',
          price: zatirkaTsement?.pricePerUnit ?? 0,
          unit: formatUnit(zatirkaTsement?.normalizedUnit),
        },
      ],
      extras: [
        {
          id: 'gruntovka-krupno',
          name: gruntovka?.name ?? 'Адгезионная грунтовка (бетоноконтакт)',
          price: gruntovka?.pricePerUnit ?? 0,
          unit: formatUnit(gruntovka?.normalizedUnit),
        },
        {
          id: 'styazhka-krupno',
          name: styazhka?.name ?? 'Стандартная стяжка по маякам (30–50 мм)',
          price: styazhka?.pricePerUnit ?? 0,
          unit: formatUnit(styazhka?.normalizedUnit),
        },
        {
          id: 'nalivnoy-krupno',
          name: nalivnoyPol?.name ?? 'Тонкослойное выравнивание наливным полом (3–5 мм)',
          price: nalivnoyPol?.pricePerUnit ?? 0,
          unit: formatUnit(nalivnoyPol?.normalizedUnit),
        },
        {
          id: 'vosstanovlenie-krupno',
          name: vosstanovlenie?.name ?? 'Восстановление основания под плитку после демонтажа',
          price: vosstanovlenie?.pricePerUnit ?? 0,
          unit: formatUnit(vosstanovlenie?.normalizedUnit),
        },
        {
          id: 'gidro-krupno',
          name: gidro?.name ?? 'Нанесение обмазочной гидроизоляции (2 слоя)',
          price: gidro?.pricePerUnit ?? 0,
          unit: formatUnit(gidro?.normalizedUnit),
        },
        {
          id: 'tyazhely',
          name: tyazhely?.name ?? 'Работа с тяжёлым керамогранитом (≥20 кг/лист)',
          price: tyazhely?.pricePerUnit ?? 0,
          unit: formatUnit(tyazhely?.normalizedUnit),
        },
        {
          id: 'podrezka45-large',
          name: podrezka45?.name ?? 'Подрезка плитки под 45 градусов',
          price: podrezka45?.pricePerUnit ?? 0,
          unit: formatUnit(podrezka45?.normalizedUnit),
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
    title: 'Формат плитки',
    description:
      'Крупный формат дороже в укладке: 60×120 и больше требуют присосок, двух мастеров и идеального основания.',
    icon: 'mdi:resize',
  },
  {
    title: 'Состояние основания',
    description:
      'Нужны стяжка, штукатурка или гидроизоляция — они входят в смету отдельными позициями и влияют на итог.',
    icon: 'mdi:foundation',
  },
  {
    title: 'Раскладка и подрезка',
    description:
      'Диагональ, вразбежку, ниши, трубы и люки увеличивают количество резов и время работы.',
    icon: 'mdi:content-cut',
  },
  {
    title: 'Тип затирки',
    description:
      'Эпоксидная затирка дороже цементной в 2–3 раза, но во влажных зонах служит без замены и плесени.',
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
    title: 'Заявка и замер',
    description:
      'Инженер замеряет помещение, проверяет основание уровнем и правилом, считает раскладку и запас плитки 5–10%.',
    icon: 'mdi:clipboard-text',
    duration: '1 день',
    result: 'Точная смета',
  },
  {
    title: 'Демонтаж и подготовка',
    description:
      'Снимаем старую плитку и отслаивающийся клей, очищаем основание, обезжириваем и грунтуем.',
    icon: 'mdi:hammer-wrench',
    duration: '1–2 дня',
  },
  {
    title: 'Стяжка и гидроизоляция',
    description:
      'Выравниваем пол стяжкой, стены — штукатуркой. Во влажных зонах наносим обмазочную гидроизоляцию в 2 слоя.',
    icon: 'mdi:water-outline',
    duration: '1–3 дня',
    result: 'Ровное основание',
  },
  {
    title: 'Раскладка и укладка',
    description:
      'Размечаем раскладку без узких подрезок у входа, укладываем плитку по уровню, каждую простукиваем на пустоты.',
    icon: 'mdi:checkerboard',
    duration: '2–5 дней',
    highlighted: true,
    result: 'Ровное покрытие',
  },
  {
    title: 'Затирка швов',
    description:
      'Через сутки после схватывания клея затираем швы. Во влажных и медицинских помещениях — эпоксидной затиркой.',
    icon: 'mdi:grid',
    duration: '1 день',
  },
  {
    title: 'Приёмка и гарантия',
    description:
      'Проверяем плоскость правилом и простукиванием, подписываем акт. Гарантия 3 года на работы.',
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
    description: 'На все плиточные работы. Трещины, отслоения — устраним бесплатно.',
    icon: 'mdi:shield-check',
  },
  {
    title: 'Без пустот под плиткой',
    description: 'Простукиваем каждую плитку при приёмке. Пустоты — перекладываем за свой счёт.',
    icon: 'mdi:ear-hearing',
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
    title: 'Геометрия швов',
    description: 'Ровные швы и стыки в углах, отклонение плоскости — не более 2 мм на 2 м.',
    icon: 'mdi:ruler',
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
    question: 'Когда можно ходить по уложенной плитке?',
    answer:
      'Через 24 часа после укладки на цементный клей. Полная нагрузка (мебель, оборудование, тележки) — через 3 суток. Затирку швов делаем через 24 часа после укладки.',
  },
  {
    question: 'Можно ли положить плитку на старую плитку?',
    answer:
      'Технически да: старую плитку простукивают, обрабатывают адгезионной грунтовкой (бетоноконтактом) и клеят новый слой. Но надёжнее снять старое покрытие и выровнять основание — так мы и рекомендуем.',
  },
  {
    question: 'Сколько плитки покупать с запасом?',
    answer:
      '5% при прямой раскладке, 10% при диагонали и сложной раскладке с подрезкой. Остатки сохраняйте: плитка из другой партии может отличаться тоном.',
  },
  {
    question: 'Какая затирка лучше: цементная или эпоксидная?',
    answer:
      'Цементная — для сухих помещений. Эпоксидная — для ванных, душевых, кухонь, клиник и пищевых зон: не впитывает воду и жир, не плесневеет, не вымывается. Эпоксидная дороже, но служит столько же, сколько плитка.',
  },
  {
    question: 'Плитка бухтит (звенит при простукивании) — что делать?',
    answer:
      'Пустота означает, что клей не сцепился с основанием: плитка треснет под нагрузкой. На наших объектах пустот нет — каждую плитку простукиваем при приёмке. Если бухтение появится в гарантийный срок — перекладываем за свой счёт.',
  },
  {
    question: 'Можно ли укладывать плитку на тёплый пол?',
    answer:
      'Да, с эластичным клеем класса S1 и эластичной затиркой. Включают тёплый пол только после полного высыхания стяжки и клея — обычно через 28 дней, нагрев поднимают постепенно.',
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
    name: 'surface',
    label: 'Что облицовываем',
    type: 'tiles' as const,
    options: [
      { value: 'floor', label: 'Пол', icon: 'mdi:checkerboard' },
      { value: 'walls', label: 'Стены', icon: 'mdi:wall' },
      { value: 'both', label: 'Пол и стены', icon: 'mdi:home-outline' },
    ],
  },
  {
    name: 'roomType',
    label: 'Тип помещения',
    type: 'tiles' as const,
    options: [
      { value: 'bathroom', label: 'Санузел / душевая', icon: 'mdi:shower' },
      { value: 'kitchen', label: 'Кухня / фартук', icon: 'mdi:stove' },
      { value: 'commercial', label: 'Магазин / офис', icon: 'mdi:storefront' },
      { value: 'wet', label: 'Производство / мойка', icon: 'mdi:factory' },
    ],
  },
]

/**
 * Конфигурация сообщения для CTA
 */
export const messageConfig = {
  emoji: '🔲',
  title: 'Заявка на укладку плитки',
  sourceLabel: 'Укладка плитки — CTA',
  fieldLabels: { surface: 'Поверхность', roomType: 'Помещение' },
}

/**
 * SEO данные для страницы.
 * 🔄 priceFrom вычисляется в компоненте из прайс-листа.
 */
export const seoData = {
  category: 'plitka',
  categoryName: 'Плитка',
  slug: 'ukladka',
  title: 'Укладка плитки в Рязани — плиточные работы под ключ',
  description:
    'Укладка плитки в Рязани: пол и стены, керамогранит, мозаика, крупноформат. Стяжка, гидроизоляция, эпоксидная затирка. Гарантия 3 года, фиксированная цена.',
  city: 'Рязани',
  serviceType: 'Укладка плитки',
  ogImage: 'https://glavprofi.ru/og-ukladka-plitki.jpg',
  pageUrl: '/vidy-rabot/ukladka-plitki',
  categoryUrl: '/vidy-rabot/ukladka-plitki',
}
