// app/components/pages/public/remontPomescheniy/workTypes/data/shared/gkl.ts
import type {
  RelatedWorkTypeItem,
  MaterialCardData,
  ThicknessOption,
} from '../../types'

/**
 * Навигация между ГКЛ работами.
 * Используется в блоке RelatedWorkTypes на всех страницах ГКЛ.
 */
export const gklWorkTypes: RelatedWorkTypeItem[] = [
  {
    title: 'Обшивка стен ГКЛ',
    to: '/vidy-rabot/oblitsovka-gkl',
    icon: 'mdi:wall',
    priceWorkId: 1598,
    priceFrom: 1600,
    active: true,
    description: 'Выравнивание стен на каркас или клей',
    image: '/main/remont-pomescheniy/banki.webp',
  },
  {
    title: 'Перегородки из ГКЛ',
    to: '/vidy-rabot/peregorodki-iz-gkl',
    icon: 'mdi:door-closed',
    priceWorkId: 683,
    priceFrom: 2100,
    description: 'Зонирование с шумоизоляцией',
    image: '/main/remont-pomescheniy/medicina.webp',
  },
  {
    title: 'Потолки из ГКЛ',
    to: '/vidy-rabot/potolki-iz-gkl',
    icon: 'mdi:ceiling-light',
    priceWorkId: 918,
    priceFrom: 2200,
    description: 'Одно- и многоуровневые конструкции',
    image: '/main/vidy-rabot/gkl/gkl.png',
  },
]

/**
 * Типы гипсокартона и гипсоволокнистых листов.
 * Используется в MaterialsGuide на всех страницах ГКЛ.
 */
export const gklMaterials: MaterialCardData[] = [
  {
    name: 'ГКЛ',
    fullName: 'Гипсокартонный лист (стандартный)',
    color: '#B0BEC5',
    image: '/main/vidy-rabot/gkl/gkl.png',
    colorLabel: 'Серый лист с синей маркировкой',
    badge: 'Базовый',
    properties: [
      { label: 'Сухие помещения', icon: 'mdi:home-outline' },
      { label: 'Лёгкий', icon: 'mdi:feather' },
    ],
    useFor: [
      'Стены и потолки в офисах, спальнях, гостиных',
      'Перегородки без особых требований',
      'Декоративные ниши и короба',
    ],
    avoidFor: ['Санузлы и кухни', 'Неотапливаемые помещения'],
  },
  {
    name: 'ГКЛВ',
    fullName: 'Влагостойкий гипсокартон',
    color: '#66BB6A',
    image: '/main/vidy-rabot/gkl/gklv.webp',
    colorLabel: 'Зелёный лист',
    badge: 'Для влажных зон',
    properties: [
      { label: 'Влагостойкость', icon: 'mdi:water-percent' },
      { label: 'Антигрибок', icon: 'mdi:shield-bug' },
    ],
    useFor: [
      'Санузлы, кухни, душевые',
      'Прачечные и мокрые зоны',
      'Откосы окон с конденсатом',
    ],
  },
  {
    name: 'ГКЛО',
    fullName: 'Огнестойкий гипсокартон',
    color: '#F06292',
    image: '/main/vidy-rabot/gkl/gklo.jpg',
    colorLabel: 'Розовый лист с красной маркировкой',
    properties: [
      { label: 'Огнестойкость до 55 мин', icon: 'mdi:fire' },
    ],
    useFor: [
      'Котельные и электрощитовые',
      'Обшивка каминов и саун',
      'Эвакуационные выходы (требования МЧС)',
    ],
  },
  {
    name: 'ГКЛВО',
    fullName: 'Влаго- и огнестойкий гипсокартон',
    image: '/main/vidy-rabot/gkl/gklvo.png',
    color: '#E8A0AC',
    colorLabel: 'Бежевый лист с розовой кромкой или полностью розовый',
    properties: [
      { label: 'Влагостойкость', icon: 'mdi:water-percent' },
      { label: 'Огнестойкость', icon: 'mdi:fire' },
    ],
    useFor: [
      'Сауны и бани',
      'Котельные с высокой влажностью',
      'Производства со спецтребованиями',
    ],
  },
  {
    name: 'ГВЛ',
    fullName: 'Гипсоволокнистый лист',
    color: '#90A4AE',
    image: '/main/vidy-rabot/gkl/gvl.jpg',
    colorLabel: 'Однородный серый лист без картона',
    badge: 'Сверхпрочный',
    properties: [
      { label: 'В 5 раз прочнее ГКЛ', icon: 'mdi:arm-flex' },
      { label: 'Держит саморезы без дюбелей', icon: 'mdi:screw-flat-top' },
      { label: 'Огнестойкий', icon: 'mdi:fire' },
    ],
    useFor: [
      'Полы (сухая стяжка «Кнауф-суперпол»)',
      'Стены под тяжёлые шкафы и технику',
      'Огнестойкие конструкции',
    ],
    avoidFor: ['Сложные криволинейные формы — плохо гнётся'],
  },
  {
    name: 'ГВЛВ',
    fullName: 'Влагостойкий гипсоволокнистый лист',
    color: '#78909C',
    image: '/main/vidy-rabot/gkl/gvlv.png',
    colorLabel: 'Однородный серый лист без картона, отличим от ГВЛ маркировкой',
    properties: [
      { label: 'Прочность', icon: 'mdi:arm-flex' },
      { label: 'Влагостойкость', icon: 'mdi:water-percent' },
    ],
    useFor: [
      'Полы и стены в санузлах',
      'Помещения с тяжёлой плиткой и керамогранитом',
    ],
  },
]

/**
 * Толщина листов ГКЛ/ГВЛ и их применение.
 */
export const gklThicknesses: ThicknessOption[] = [
  { value: '6,5 мм', purpose: 'Арки и криволинейные конструкции (арочный)' },
  { value: '9,5 мм', purpose: 'Потолки — легче, меньше нагрузка на каркас' },
  { value: '12,5 мм', purpose: 'Стены и перегородки — стандарт' },
  { value: '15–25 мм', purpose: 'Огнестойкие и усиленные конструкции (в 2 слоя)' },
]
