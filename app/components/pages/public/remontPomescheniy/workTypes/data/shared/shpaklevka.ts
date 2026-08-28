// app/components/pages/public/remontPomescheniy/workTypes/data/shared/shpaklevka.ts
import type { RelatedWorkTypeItem } from '../../types'

/**
 * Навигация между страницами группы «Шпаклёвка».
 * 🔄 Цены берутся из прайс-листа автоматически через priceWorkId.
 * 🔄 Активная карточка определяется по текущему URL в компоненте страницы.
 */
export const shpaklevkaWorkTypes: RelatedWorkTypeItem[] = [
  {
    title: 'Шпаклёвка стен',
    to: '/vidy-rabot/shpaklevka-sten',
    icon: 'mdi:wall',
    priceWorkId: 806,
    description: 'Стартовая и финишная подготовка стен',
    image: '/main/remont-pomescheniy/banki.webp',
  },
  {
    title: 'Шпаклёвка потолков',
    to: '/vidy-rabot/shpaklevka-potolkov',
    icon: 'mdi:ceiling-light',
    priceWorkId: 1597,
    description: 'Подготовка потолков под покраску',
    image: '/main/remont-pomescheniy/medicina.webp',
  },
  {
    title: 'Шпаклёвка откосов',
    to: '/vidy-rabot/shpaklevka-otkosov',
    icon: 'mdi:window-open-variant',
    priceWorkId: 816,
    description: 'Оконные и дверные откосы под покраску',
    image: '/main/remont-pomescheniy/medicina.webp',
  },
  {
    title: 'Шлифовка стен',
    to: '/vidy-rabot/shlifovka-sten',
    icon: 'mdi:sander',
    priceWorkId: 826,
    description: 'Финишное выравнивание поверхности',
    image: '/main/remont-pomescheniy/banki.webp',
  },
  {
    title: 'Грунтовка стен',
    to: '/vidy-rabot/gruntovka-sten',
    icon: 'mdi:brush-variant',
    priceWorkId: 802,
    description: 'Подготовка основания перед шпаклёвкой',
    image: '/main/remont-pomescheniy/banki.webp',
  },
]

/**
 * Типы шпаклёвочных составов.
 * Используется в MaterialsGuide на всех страницах группы.
 */
export const shpaklevkaMaterials = [
  {
    name: 'Гипсовая',
    fullName: 'Гипсовая шпаклёвка (стартовая и финишная)',
    color: '#E8E0D4',
    colorLabel: 'Белая или светло-серая паста',
    badge: 'Универсальная',
    properties: [
      { label: 'Быстро сохнет', icon: 'mdi:clock-fast' },
      { label: 'Легко шлифуется', icon: 'mdi:sander' },
    ],
    useFor: [
      'Стены и потолки в сухих помещениях',
      'Заделка стыков ГКЛ',
      'Финишное выравнивание под покраску',
    ],
    avoidFor: ['Ванные и душевые', 'Неотапливаемые помещения'],
  },
  {
    name: 'Цементная',
    fullName: 'Цементная шпаклёвка (влагостойкая)',
    color: '#9E9E9E',
    colorLabel: 'Серая масса, крупнее помол',
    badge: 'Для влажных зон',
    properties: [
      { label: 'Влагостойкость', icon: 'mdi:water-percent' },
      { label: 'Высокая прочность', icon: 'mdi:arm-flex' },
    ],
    useFor: [
      'Санузлы, кухни, бойлерные',
      'Фасады и неотапливаемые помещения',
      'Основание под керамическую плитку',
    ],
  },
  {
    name: 'Полимерная',
    fullName: 'Полимерная (латексная/акриловая) шпаклёвка',
    color: '#F5F5F5',
    colorLabel: 'Идеально белая, эластичная',
    badge: 'Премиум-финиш',
    properties: [
      { label: 'Идеальная гладкость', icon: 'mdi:circle-outline' },
      { label: 'Эластичность', icon: 'mdi:wave' },
    ],
    useFor: [
      'Финишный слой под покраску «под лампочку»',
      'Помещения с высокими требованиями к отделке',
      'Реставрация и локальный ремонт',
    ],
  },
]

/**
 * Толщина слоёв и их назначение.
 */
export const shpaklevkaThicknesses = [
  { value: '0,5–1 мм', purpose: 'Финишный слой под покраску — идеально гладкая поверхность' },
  { value: '1–3 мм', purpose: 'Стартовая шпаклёвка — выравнивание мелких дефектов' },
  { value: '3–5 мм', purpose: 'Выравнивание перепадов — локальная заделка' },
  { value: '> 5 мм', purpose: 'Требуется штукатурка, шпаклёвка не подходит' },
]
