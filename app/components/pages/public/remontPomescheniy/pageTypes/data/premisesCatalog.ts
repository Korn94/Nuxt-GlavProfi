// app/components/pages/public/remontPomescheniy/pageTypes/data/premisesCatalog.ts
/**
 * 🏢 ЕДИНЫЙ КАТАЛОГ ТИПОВ ПОМЕЩЕНИЙ
 *
 * Зачем отдельный модуль:
 * - данные о типах помещений нужны сразу в двух местах: каталог на `/remont-pomescheniy`
 *   (`index/blocks/PremisesGrid.vue`) и блок «Похожие услуги» на страницах услуг
 *   (`pageTypes/ui/RelatedServicesGrid.vue`). Раньше массив жил локально в PremisesGrid,
 *   и любая правка цены/описания расходилась между блоками;
 * - здесь же лежит логика бизнес-близости категорий (`SIMILAR_PRIORITY`), чтобы
 *   на странице банка не соседствовали только склады.
 *
 * 💰 РЕШЕНИЕ ПО ЦЕНАМ «от … ₽/м²» (единый источник истины — этот файл):
 * - числовое значение хранится в `priceFrom`;
 * - подпись `price` («от 14 000 ₽ за м²») вычисляется из `priceFrom` при загрузке модуля
 *   детерминированным форматтером (без `Intl`, чтобы SSR и CSR давали одинаковую строку);
 * - SEO-обёртки `app/pages/remont-pomescheniy/<slug>.vue` берут цену через
 *   `getPremisesPriceFrom()`, поэтому JSON-LD/snippet и карточки показывают одно и то же.
 *   Меняем цену — меняем ТОЛЬКО `priceFrom`, строка обновится сама.
 *
 * ⚠️ «Пищевые производства» (`pischevye`) лежат в каталоге, но `isReady: false`:
 * страницы услуги ещё нет, поэтому в блок «Похожие услуги» они не попадают.
 *
 * ⚠️ Пути к картинкам исторически записаны без ведущего «/» (`main/remont-pomescheniy/...`).
 * На `/remont-pomescheniy` это работает за счёт относительного разрешения URL, но на
 * вложенных маршрутах (`/remont-pomescheniy/banki`) такой путь сломается. Для блоков
 * страниц услуг используем `getPremisesImageUrl()`, который делает путь абсолютным.
 */
import type { PremisesSlug } from './workTypesByCategory'

/** Группа каталога: коммерческие / производственные / прочие объекты */
export type PremisesCategory = 'commercial' | 'industrial' | 'other'

/** Слаг объекта каталога: 11 готовых страниц + «Пищевые производства» без страницы */
export type PremisesCatalogSlug = PremisesSlug | 'pischevye'

/**
 * Карточка каталога.
 *
 * ⚠️ Объявлен как `type`, а не `interface`: `useGridControls<T extends GridItem>`
 * требует совместимости с `{ slug: string; [key: string]: any }`, а implicit
 * index signature у интерфейсов TypeScript не выводит.
 */
export type PremisesCatalogItem = {
  slug: PremisesCatalogSlug
  title: string
  subtitle: string
  category: PremisesCategory
  /** Числовая цена «от», ₽/м² — источник истины */
  priceFrom: number
  /** Готовая подпись «от … ₽ за м²» — вычисляется из `priceFrom` */
  price: string
  /** Пример стоимости для 100 м² */
  priceExample: string
  description: string
  image: string
  /** Готова ли страница услуги (иначе карточка ведёт «в никуда») */
  isReady: boolean
}

/** Данные карточки до вычисления подписи цены */
type PremisesSeed = Omit<PremisesCatalogItem, 'price'>

/** «от 14000» → «от 14 000 ₽ за м²» (детерминированно, без Intl) */
const formatPrice = (priceFrom: number): string =>
  `от ${String(priceFrom).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} ₽ за м²`

// ============================================================
// 📚 ДАННЫЕ КАТАЛОГА (порядок = порядок карточек на /remont-pomescheniy)
// ============================================================
const PREMISES_SEED: PremisesSeed[] = [
  { slug: 'banki', title: 'Банки', subtitle: 'отделения, операционные залы, хранилища', category: 'commercial', priceFrom: 14000, priceExample: 'за 100 м² ~1.4–2.0 млн ₽', description: 'Работаем с учетом требований безопасности: усиленные перегородки, кабель-каналы под охранно-пожарную сигнализацию, зоны для инкассации. Выполняем монтаж по спец. ТЗ, соблюдаем режим конфиденциальности на объекте.', image: 'main/remont-pomescheniy/banki.webp', isReady: true },
  { slug: 'magaziny', title: 'Магазины', subtitle: 'ТЦ, стрит-ритейл, бутики', category: 'commercial', priceFrom: 13000, priceExample: 'за 100 м² ~1.3–1.9 млн ₽', description: 'Монтируем витринные группы, торговое оборудование, напольные покрытия по вашей спецификации. Работаем в график ТЦ (ночные смены) или в свободном режиме для отдельно стоящих зданий. Сдаем объект готовым к выкладке товара.', image: 'main/remont-pomescheniy/magaziny.webp', isReady: true },
  { slug: 'ofisy', title: 'Офисы', subtitle: 'административные здания, кол-центры', category: 'commercial', priceFrom: 11000, priceExample: 'за 100 м² ~1.1–1.6 млн ₽', description: 'Выполняем отделку по вашему ТЗ или проекту. Перед стартом проверяем основание и коммуникации: если проект конфликтует с реальным объектом — сообщаем до начала работ. Собственные бригады: ГКЛ, маляры, электрики.', image: 'main/remont-pomescheniy/ofisy.webp', isReady: true },
  { slug: 'salony', title: 'Салоны красоты', subtitle: 'барбершопы, СПА', category: 'commercial', priceFrom: 15000, priceExample: 'за 100 м² ~1.5–2.2 млн ₽', description: 'Реализуем проект с «мокрыми» зонами: гидроизоляция, закладные под оборудование. Проверяем вводные мощности и сечение кабелей до начала чистовой отделки.', image: 'main/remont-pomescheniy/salony.webp', isReady: true },
  { slug: 'fitness', title: 'Фитнес-клубы', subtitle: 'спортивные залы', category: 'commercial', priceFrom: 14000, priceExample: 'за 100 м² ~1.4–2.0 млн ₽', description: 'Монтаж ударопрочных покрытий, зеркальных стен, душевых с трапами — строго по проекту. Проверяем основание под спортивные полы, герметичность мокрых зон.', image: 'main/remont-pomescheniy/fitnes.webp', isReady: true },
  { slug: 'sklady', title: 'Склады', subtitle: 'логистические центры, места хранения', category: 'industrial', priceFrom: 8500, priceExample: 'за 100 м² ~0.9–1.3 млн ₽', description: 'Устройство промышленных полов (топпинг, наливные) по вашей технологии. Проверяем геометрию основания, усадку бетона перед началом работ. Монтируем пандусы, разметку, освещение по проекту.', image: 'main/remont-pomescheniy/sklady.webp', isReady: true },
  { slug: 'proizvodstvo', title: 'Производство', subtitle: 'цеха, заводы', category: 'industrial', priceFrom: 12000, priceExample: 'за 100 м² ~1.2–2.5 млн ₽', description: 'Работаем по тех. заданию инженеров: усиленные коммуникации, спец. покрытия, безопасные зоны. Проверяем допуски под оборудование, соответствие монтажа нормам охраны труда.', image: 'main/remont-pomescheniy/ceha.webp', isReady: true },
  { slug: 'angary', title: 'Ангары', subtitle: 'модульные здания', category: 'industrial', priceFrom: 9000, priceExample: 'за 100 м² ~0.9–1.4 млн ₽', description: 'Внутренняя отделка по проекту: утепление, обшивка, ввод коммуникаций. Проверяем герметичность контура, мостики холода до начала чистовых работ. Работаем с сэндвич-панелями, профлистом.', image: 'main/remont-pomescheniy/angary.webp', isReady: true },
  // ❗ Страницы нет — карточка в каталоге остаётся неактивной, в «Похожие услуги» не попадает
  { slug: 'pischevye', title: 'Пищевые производства', subtitle: '', category: 'industrial', priceFrom: 16000, priceExample: 'за 100 м² ~1.6–2.4 млн ₽', description: 'Монтаж по СанПиН: плитка, стоки, бесшовные покрытия — по вашей спецификации. Проверяем уклоны полов, герметичность стыков до сдачи. Работаем с пищевыми материалами (нержавейка, спец. смеси).', image: 'main/remont-pomescheniy/pischevye.webp', isReady: false },
  { slug: 'kliniki', title: 'Медицинские помещения', subtitle: 'клиники, стоматологии, аптеки, лаборатории', category: 'other', priceFrom: 18000, priceExample: 'за 100 м² ~0.8–1.5 млн ₽', description: 'Отделка по проекту или ТЗ: бесшовные покрытия, стены под дезинфекцию, специфические материалы. Проверяем основание под спец. полы, герметичность мокрых зон. Работаем с медицинскими материалами (линолеум, нержавейка, спец. смеси и прочие).', image: 'main/remont-pomescheniy/medicina.webp', isReady: true },
  { slug: 'mopy', title: 'МОПы', subtitle: 'подъезды, холлы ЖК', category: 'other', priceFrom: 4500, priceExample: 'за 100 м² ~0.5–0.8 млн ₽', description: 'Ремонт по регламенту УК: антивандальные материалы, износостойкая покраска. Работаем в график, не создаем шум в часы покоя.', image: 'main/remont-pomescheniy/mopy.webp', isReady: true },
  { slug: 'fasady', title: 'Фасады зданий', subtitle: '', category: 'other', priceFrom: 3500, priceExample: 'за 100 м² ~0.4–0.7 млн ₽', description: 'Монтаж фасадов: утепление, облицовка, герметизация. Проверяем основание, крепеж, точку росы до начала работ. Работаем на высоте с допуском, соблюдаем ГОСТ по теплоизоляции.', image: 'main/remont-pomescheniy/fasady.webp', isReady: true },
]

/**
 * Публичный каталог с готовой подписью цены.
 * Порядок элементов = порядок карточек на `/remont-pomescheniy` (не сортировать!).
 */
export const PREMISES_CATALOG: PremisesCatalogItem[] = PREMISES_SEED.map((item) => ({
  ...item,
  price: formatPrice(item.priceFrom),
}))

// ============================================================
// 🔗 БЛИЗОСТЬ КАТЕГОРИЙ ДЛЯ БЛОКА «ПОХОЖИЕ УСЛУГИ»
// ============================================================
/**
 * Приоритетный порядок «похожих» категорий для каждой страницы услуги.
 *
 * Группы:
 * - коммерческий ритейл/сервис: banki, magaziny, salony, fitness, kliniki → друг другу;
 * - офисно-административный: ofisy, mopy, kliniki;
 * - индустриальный: sklady, proizvodstvo, angary;
 * - внешний контур: fasady — соседствует со всеми «зданиями», но намеренно НЕ указан
 *   в чужих приоритетах: в каталоге он последний, поэтому попадает только через
 *   fallback в самом конце и при `limit = 3` не вытесняет профильные категории.
 */
export const SIMILAR_PRIORITY: Record<PremisesSlug, PremisesSlug[]> = {
  // Режимные/финансовые объекты: ближе всего офисы и клиники, затем ритейл
  banki: ['ofisy', 'kliniki', 'magaziny', 'salony', 'fitness'],
  // Ритейл: салоны и фитнес (сервисные форматы), затем банки и клиники
  magaziny: ['salony', 'fitness', 'banki', 'kliniki', 'ofisy'],
  // Офисно-административная группа: МОПы (общие зоны здания) и клиники
  ofisy: ['mopy', 'kliniki', 'banki', 'magaziny', 'salony'],
  // Сервис с «мокрыми» зонами: фитнес, магазины, клиники
  salony: ['fitness', 'magaziny', 'kliniki', 'banki', 'ofisy'],
  // Спортивные объекты: салоны и магазины (мокрые зоны, покрытия), клиники
  fitness: ['salony', 'magaziny', 'kliniki', 'banki', 'ofisy'],
  // Индустриальная группа: производство и ангары, затем офисы/бытовки
  sklady: ['proizvodstvo', 'angary', 'ofisy', 'mopy'],
  proizvodstvo: ['sklady', 'angary', 'ofisy', 'mopy'],
  angary: ['sklady', 'proizvodstvo', 'ofisy', 'mopy'],
  // Медицина: сервисные «мокрые» зоны + офисно-административные стандарты
  kliniki: ['salony', 'ofisy', 'banki', 'magaziny', 'fitness'],
  // Общие зоны жилых/административных зданий: офисы, клиники, банки
  mopy: ['ofisy', 'kliniki', 'banki', 'magaziny', 'sklady'],
  // Внешний контур: фасад делают для любых зданий — от ритейла до складов
  fasady: ['magaziny', 'ofisy', 'sklady', 'kliniki', 'banki'],
}

/**
 * Похожие услуги для текущей страницы.
 * Всегда исключает саму категорию и неготовые страницы (`isReady: false`).
 * Гарантия непустого результата: готовых категорий 10, минус текущая = 10 кандидатов,
 * поэтому при `limit = 3` карточек всегда ровно 3.
 */
export function getSimilarPremises(currentSlug: string, limit = 3): PremisesCatalogItem[] {
  const safeLimit = Number.isFinite(limit) && limit > 0 ? Math.floor(limit) : 0

  const ready = PREMISES_CATALOG.filter(
    (item) => item.isReady && item.slug !== currentSlug,
  )

  const ordered: PremisesCatalogItem[] = []

  const push = (slug: string): void => {
    const item = ready.find((candidate) => candidate.slug === slug)
    if (item && !ordered.includes(item)) ordered.push(item)
  }

  // 1. Профильные категории по бизнес-близости
  const priority = SIMILAR_PRIORITY[currentSlug as PremisesSlug] ?? []
  priority.forEach(push)

  // 2. Fallback — остальные готовые категории в исходном порядке каталога
  ready.forEach((item) => {
    if (!ordered.includes(item)) ordered.push(item)
  })

  return ordered.slice(0, safeLimit)
}

/**
 * Числовая цена «от» для SEO (JSON-LD `priceFrom` в `usePageSeo`).
 * 0 — если категория неизвестна (тогда JSON-LD не отдаёт Offer).
 */
export function getPremisesPriceFrom(slug: PremisesCatalogSlug): number {
  const item = PREMISES_CATALOG.find((candidate) => candidate.slug === slug)
  return item?.priceFrom ?? 0
}

/**
 * Абсолютный URL картинки карточки.
 * Нужен блокам на вложенных маршрутах: «main/...» там разрешился бы
 * в `/remont-pomescheniy/main/...`.
 */
export function getPremisesImageUrl(item: PremisesCatalogItem): string {
  return item.image.startsWith('/') ? item.image : `/${item.image}`
}
