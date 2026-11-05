// app/components/pages/public/remontPomescheniy/pageTypes/data/workTypesByCategory.ts
/**
 * 🔗 Перелинковка «страница типа помещения → страница вида работ».
 *
 * Зачем отдельный файл:
 * - все 11 страниц `/remont-pomescheniy/*` собираются по одному каркасу
 *   (`pageTypes/<slug>/index.vue`), и блок «Какие работы выполняем» должен
 *   ссылаться на виды работ, которые реально существуют как страницы;
 * - реестр `WORK_TYPES` — единственный источник правды по URL, иконке и
 *   `priceWorkId` (цена тянется из прайс-листа через `usePriceFetcher`,
 *   как в `workTypes/ui/RelatedWorkTypes.vue`), поэтому ссылки не разъезжаются
 *   при переименовании страниц видов работ;
 * - в маппинге по категориям лежит только контекстная подпись под конкретный
 *   тип помещения — разный акцент для банка, склада и клиники.
 *
 * ⚠️ Ссылаться можно ТОЛЬКО на готовые страницы видов работ: сейчас это 5 URL.
 * Остальные виды работ (кирпич, ПГП, панели, потолки и т.д.) ещё в разработке —
 * они лежат в `homePage/WorksPreview.vue` с `isReady: false` и сюда не попадают.
 */
import type { RelatedWorkTypeItem } from '../../workTypes/types'

/** Slug типа помещения = имя папки в `pageTypes/` и значение `category` в компоненте */
export type PremisesSlug =
  | 'banki'
  | 'magaziny'
  | 'ofisy'
  | 'salony'
  | 'fitness'
  | 'sklady'
  | 'proizvodstvo'
  | 'angary'
  | 'kliniki'
  | 'mopy'
  | 'fasady'

/** Slug готовой страницы вида работ */
export type WorkTypeSlug =
  | 'peregorodki-gkl'
  | 'oblitsovka-gkl'
  | 'shtukaturka-sten'
  | 'shpaklevka-sten'
  | 'ukladka-plitki'

interface WorkTypeDefinition {
  /** Название карточки */
  title: string
  /** URL готовой страницы вида работ */
  to: string
  /** Иконка mdi (в карточке рисуется в оверлее изображения) */
  icon: string
  /** ID работы в прайс-листе — из него считается цена «от … ₽/м²» */
  priceWorkId: number
  /** Изображение карточки */
  image: string
}

// ============================================================
// 📚 РЕЕСТР ГОТОВЫХ ВИДОВ РАБОТ
// ============================================================
export const WORK_TYPES: Record<WorkTypeSlug, WorkTypeDefinition> = {
  'peregorodki-gkl': {
    title: 'Перегородки из ГКЛ',
    to: '/vidy-rabot/peregorodki-gkl',
    icon: 'mdi:door-closed',
    priceWorkId: 683,
    image: '/main/vidy-rabot/peregorodki-gkl/1.jpg',
  },
  'oblitsovka-gkl': {
    title: 'Облицовка стен ГКЛ',
    to: '/vidy-rabot/oblitsovka-gkl',
    icon: 'mdi:wall',
    priceWorkId: 1598,
    image: '/main/vidy-rabot/gkl/1.webp',
  },
  'shtukaturka-sten': {
    title: 'Штукатурка стен',
    to: '/vidy-rabot/shtukaturka-sten',
    icon: 'mdi:format-paint',
    priceWorkId: 1143,
    image: '/main/vidy-rabot/shtukaturka/4.jpg',
  },
  'shpaklevka-sten': {
    title: 'Шпаклёвка стен',
    to: '/vidy-rabot/shpaklevka-sten',
    icon: 'mdi:brush',
    priceWorkId: 806,
    image: '/main/vidy-rabot/shpaklevka/1.jpg',
  },
  'ukladka-plitki': {
    title: 'Укладка плитки',
    to: '/vidy-rabot/ukladka-plitki',
    icon: 'mdi:checkerboard',
    priceWorkId: 835,
    image: '/main/vidy-rabot/plitka/1.webp',
  },
}

/**
 * Хвост подзаголовка — важная оговорка: показываем не все работы,
 * чтобы не создавать впечатление, что компания делает только эти 2–4 вида.
 */
const SUBTITLE_TAIL =
  'Это не весь перечень: выполняем полный цикл отделочных работ — от демонтажа и стяжки до чистовой отделки. Полный список позиций с ценами — в прайс-листе.'

interface PremisesConfig {
  /** H2 с градиентным акцентом в `<span>` */
  title: string
  /** Родительный падеж для подзаголовка: «для банковских отделений» */
  categoryName: string
  /** Порядок ключей = порядок карточек. Значение — подпись под тип помещения */
  items: Partial<Record<WorkTypeSlug, string>>
}

// ============================================================
// 🏢 МАППИНГ: ТИП ПОМЕЩЕНИЯ → ВИДЫ РАБОТ
// ============================================================
export const PREMISES_WORK_TYPES: Record<PremisesSlug, PremisesConfig> = {
  banki: {
    title: 'Какие работы выполняем при ремонте <span>банковских отделений</span>',
    categoryName: 'банковских отделений',
    items: {
      'peregorodki-gkl':
        'Зонирование клиентской и служебной зон, звукоизоляция переговорных и кассового узла',
      'oblitsovka-gkl': 'Выравнивание стен под брендбук и закладные под оборудование',
      'shtukaturka-sten': 'Подготовка стен в служебных, технических и подсобных помещениях',
      'ukladka-plitki': 'Керамогранит в санузлах, зонах уборки и на входных группах',
    },
  },

  magaziny: {
    title: 'Какие работы выполняем при ремонте <span>магазинов</span>',
    categoryName: 'торговых помещений',
    items: {
      'oblitsovka-gkl': 'Выравнивание стен под витрины, стеллажи и навигацию',
      'ukladka-plitki': 'Полы и стены торгового зала, санузлов и зоны приёмки товара',
      'peregorodki-gkl': 'Подсобные помещения, примерочные и зона персонала',
      'shtukaturka-sten': 'Черновая подготовка стен под покраску и торговое оборудование',
    },
  },

  ofisy: {
    title: 'Какие работы выполняем при ремонте <span>офисов</span>',
    categoryName: 'офисных помещений',
    items: {
      'peregorodki-gkl': 'Кабинеты, переговорные и open space с шумоизоляцией',
      'oblitsovka-gkl': 'Быстрое выравнивание стен без мокрых процессов',
      'shtukaturka-sten': 'Ровные стены под покраску в коридорах и кабинетах',
      'shpaklevka-sten': 'Финишная подготовка под покраску и декоративные покрытия',
    },
  },

  salony: {
    title: 'Какие работы выполняем при ремонте <span>салонов красоты</span>',
    categoryName: 'салонов красоты',
    items: {
      'peregorodki-gkl': 'Зонирование рабочих мест, кабинетов и зоны ожидания',
      'oblitsovka-gkl': 'Ниши, короба и выравнивание стен под декоративную отделку',
      'ukladka-plitki': 'Мокрые зоны, санузлы и входная группа',
      'shpaklevka-sten': 'Идеально ровные стены под покраску и зеркала',
    },
  },

  fitness: {
    title: 'Какие работы выполняем при ремонте <span>фитнес-клубов</span>',
    categoryName: 'фитнес-клубов',
    items: {
      'peregorodki-gkl': 'Разделение залов, раздевалок и технических помещений',
      'oblitsovka-gkl': 'Выравнивание стен под панели, зеркала и навигацию',
      'ukladka-plitki': 'Душевые, раздевалки, санузлы и чаши бассейна',
      'shtukaturka-sten': 'Подготовка стен в залах с высокой влажностью и нагрузкой',
    },
  },


  sklady: {
    title: 'Какие работы выполняем при ремонте <span>складов</span>',
    categoryName: 'складских помещений',
    items: {
      'shtukaturka-sten': 'Обеспыливание и выравнивание стен под стеллажные системы',
      'peregorodki-gkl': 'Офисная зона, комната персонала и санузлы внутри склада',
      'shpaklevka-sten': 'Подготовка стен административных и бытовых помещений',
    },
  },

  proizvodstvo: {
    title: 'Какие работы выполняем при ремонте <span>производственных помещений</span>',
    categoryName: 'производственных помещений',
    items: {
      'shtukaturka-sten': 'Выравнивание стен цехов и бытовых помещений',
      'peregorodki-gkl': 'Офисные зоны, диспетчерские и комнаты отдыха смен',
      'ukladka-plitki': 'Санузлы, душевые и зоны мокрой уборки',
    },
  },

  angary: {
    title: 'Какие работы выполняем при ремонте <span>ангаров</span>',
    categoryName: 'ангаров и быстровозводимых зданий',
    items: {
      'shtukaturka-sten': 'Стены офисных и бытовых помещений внутри ангара',
      'peregorodki-gkl': 'Быстровозводимые кабинеты, кладовые и комнаты персонала',
      'ukladka-plitki': 'Санузлы и зоны мокрых процессов',
    },
  },

  kliniki: {
    title: 'Какие работы выполняем при ремонте <span>клиник</span>',
    categoryName: 'медицинских центров',
    items: {
      'peregorodki-gkl': 'Кабинеты, процедурные и зоны ожидания с шумоизоляцией',
      'oblitsovka-gkl': 'Выравнивание стен под гигиеничные покрытия',
      'shtukaturka-sten': 'Подготовка стен под покраску и моющиеся покрытия',
      'ukladka-plitki': 'Процедурные, санузлы и зоны дезинфекции',
    },
  },

  mopy: {
    title: 'Какие работы выполняем при ремонте <span>МОПов и подъездов</span>',
    categoryName: 'мест общего пользования',
    items: {
      'shtukaturka-sten': 'Выравнивание стен в коридорах, холлах и на лестничных клетках',
      'oblitsovka-gkl': 'Короба, откосы и выравнивание без остановки эксплуатации',
      'shpaklevka-sten': 'Финишная подготовка под покраску в местах общего пользования',
    },
  },

  fasady: {
    title: 'Какие работы выполняем при ремонте <span>фасадов</span>',
    categoryName: 'фасадов зданий',
    items: {
      'shtukaturka-sten': 'Фасадная штукатурка по утеплителю и подготовка основания',
      'ukladka-plitki': 'Облицовка фасада керамогранитом и клинкерной плиткой',
    },
  },
}

/**
 * Карточки видов работ для страницы типа помещения.
 * Возвращает пустой массив, если категория неизвестна — компонент тогда не рендерится.
 */
export function getWorkTypesForCategory(category: string): RelatedWorkTypeItem[] {
  const config = PREMISES_WORK_TYPES[category as PremisesSlug]
  if (!config) return []

  const result: RelatedWorkTypeItem[] = []

  for (const [slug, note] of Object.entries(config.items)) {
    if (!note) continue

    const definition = WORK_TYPES[slug as WorkTypeSlug]
    if (!definition) continue

    result.push({
      title: definition.title,
      to: definition.to,
      icon: definition.icon,
      priceWorkId: definition.priceWorkId,
      description: note,
      image: definition.image,
    })
  }

  return result
}

/** Заголовок и подзаголовок секции «Какие работы выполняем» */
export function getWorkTypesSection(
  category: string,
): { title: string; subtitle: string } | null {
  const config = PREMISES_WORK_TYPES[category as PremisesSlug]
  if (!config) return null

  return {
    title: config.title,
    subtitle: `Для ${config.categoryName} чаще всего заказывают эти работы. ${SUBTITLE_TAIL}`,
  }
}

