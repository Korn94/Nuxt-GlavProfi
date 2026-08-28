// app/components/pages/public/remontPomescheniy/workTypes/data/shared/shtukaturka.ts
import type { RelatedWorkTypeItem, MaterialCardData, ThicknessOption } from '../../types'

/**
 * Навигация между страницами группы «Штукатурка».
 * 🔄 Цены берутся из прайс-листа автоматически через priceWorkId.
 * 🔄 Активная карточка определяется по текущему URL в компоненте страницы.
 */
export const shtukaturkaWorkTypes: RelatedWorkTypeItem[] = [
  {
    title: 'Штукатурка стен',
    to: '/vidy-rabot/shtukaturka-sten',
    icon: 'mdi:wall',
    priceWorkId: 1143,
    description: 'Гипсовая и цементная, слой 10–50 мм',
    image: '/main/remont-pomescheniy/banki.webp',
  },
  {
    title: 'Штукатурка потолков',
    to: '/vidy-rabot/shtukaturka-potolkov',
    icon: 'mdi:ceiling-light',
    priceWorkId: 1156,
    description: 'Выравнивание потолочных перекрытий',
    image: '/main/remont-pomescheniy/medicina.webp',
  },
  {
    title: 'Штукатурка откосов',
    to: '/vidy-rabot/shtukaturka-otkosov',
    icon: 'mdi:window-open-variant',
    priceWorkId: 1150,
    description: 'Оконные и дверные откосы',
    image: '/main/remont-pomescheniy/medicina.webp',
  },
  {
    title: 'Декоративная штукатурка',
    to: '/vidy-rabot/dekorativnaya-shtukaturka',
    icon: 'mdi:palette-outline',
    priceWorkId: 883,
    description: 'Короед, венецианская, эффект шёлка',
    image: '/main/remont-pomescheniy/banki.webp',
  },
  {
    title: 'Армирование штукатурки',
    to: '/vidy-rabot/armirovanie-shtukaturki',
    icon: 'mdi:grid',
    priceWorkId: 1144,
    description: 'Сетка для толстых слоёв и проблемных оснований',
    image: '/main/remont-pomescheniy/banki.webp',
  },
]

/**
 * Типы штукатурных составов.
 * Используется в MaterialsGuide на всех страницах группы.
 */
export const shtukaturkaMaterials: MaterialCardData[] = [
  {
    name: 'Гипсовая',
    fullName: 'Гипсовая штукатурка (универсальная)',
    color: '#E8E0D4',
    image: '/main/vidy-rabot/shtukaturka/gips.webp',
    colorLabel: 'Белый или светло-серый порошок',
    badge: 'Самая популярная',
    properties: [
      { label: 'Тепло- и звукоизоляция', icon: 'mdi:volume-off' },
      { label: 'Быстрое высыхание', icon: 'mdi:clock-fast' },
      { label: 'Пластичность', icon: 'mdi:wave' },
    ],
    useFor: [
      'Стены и потолки в сухих помещениях',
      'Офисы, жилые комнаты, коридоры',
      'Кирпич, бетон, пеноблок',
    ],
    avoidFor: ['Ванные и душевые', 'Неотапливаемые помещения', 'Уличная отделка'],
  },
  {
    name: 'Цементная',
    fullName: 'Цементно-песчаная штукатурка',
    color: '#9E9E9E',
    image: '/main/vidy-rabot/shtukaturka/cement.webp',
    colorLabel: 'Серая масса с крупным песком',
    badge: 'Для влажных зон',
    properties: [
      { label: 'Влагостойкость', icon: 'mdi:water-percent' },
      { label: 'Высокая прочность', icon: 'mdi:arm-flex' },
      { label: 'Морозостойкость', icon: 'mdi:snowflake' },
    ],
    useFor: [
      'Санузлы, кухни, прачечные',
      'Фасады и неотапливаемые помещения',
      'Цокольные этажи, бойлерные',
    ],
    avoidFor: ['Тонкослойное выравнивание', 'Гладкие бетонные основания без насечки'],
  },
  {
    name: 'Известковая',
    fullName: 'Известковая штукатурка',
    color: '#F5F5DC',
    image: '/main/vidy-rabot/shtukaturka/lime.webp',
    colorLabel: 'Кремово-белая паста',
    badge: 'Антисептик',
    properties: [
      { label: 'Антибактериальность', icon: 'mdi:shield-bug' },
      { label: 'Паропроницаемость', icon: 'mdi:air-filter' },
    ],
    useFor: [
      'Исторические здания и реставрация',
      'Помещения с высокой влажностью воздуха (бани, сауны)',
      'Основания из дерева, самана',
    ],
    avoidFor: ['Влажные зоны прямого контакта с водой', 'Высокие нагрузки'],
  },
  {
    name: 'Машинная',
    fullName: 'Машинная штукатурка (смесь для станции)',
    color: '#B0BEC5',
    image: '/main/vidy-rabot/shtukaturka/machine.webp',
    colorLabel: 'Специальная смесь для штукатурной станции',
    badge: 'Быстрый результат',
    properties: [
      { label: 'Скорость нанесения', icon: 'mdi:speedometer' },
      { label: 'Однородность слоя', icon: 'mdi:circle-outline' },
    ],
    useFor: [
      'Площади от 100 м²',
      'Новостройки с большими объёмами',
      'Коммерческие объекты',
    ],
    avoidFor: ['Малые объёмы (до 30 м²) — невыгодно привозить станцию'],
  },
]

/**
 * Толщина слоёв штукатурки и их назначение.
 */
export const shtukaturkaThicknesses: ThicknessOption[] = [
  { value: '10–20 мм', purpose: 'Лёгкое выравнивание, стены с небольшими перепадами' },
  { value: '20–30 мм', purpose: 'Стандартный слой — подходит для большинства помещений' },
  { value: '30–50 мм', purpose: 'Толстый слой — обязательное армирование сеткой' },
  { value: '> 50 мм', purpose: 'Требуется 2 слоя с промежуточным армированием или обшивка ГКЛ' },
]
