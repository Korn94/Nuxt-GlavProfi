// app/components/pages/public/remontPomescheniy/workTypes/data/shared/plitka.ts
import type { RelatedWorkTypeItem, ThicknessOption } from '../../types'

/**
 * Навигация между страницами группы «Плитка».
 * 🔄 Цены берутся из прайс-листа автоматически через priceWorkId.
 * 🔄 Активная карточка определяется по текущему URL в компоненте страницы.
 */
export const plitkaWorkTypes: RelatedWorkTypeItem[] = [
  {
    title: 'Укладка плитки',
    to: '/vidy-rabot/ukladka-plitki',
    icon: 'mdi:checkerboard',
    priceWorkId: 835,
    description: 'Пол, стены, керамогранит и мозаика',
    image: '/main/remont-pomescheniy/banki.webp',
  },
  // {
  //   title: 'Укладка мозаики',
  //   to: '/vidy-rabot/ukladka-mozaiki',
  //   icon: 'mdi:grid',
  //   priceWorkId: 856,
  //   description: 'Бассейны, души, криволинейные поверхности',
  //   image: '/main/remont-pomescheniy/medicina.webp',
  // },
  // {
  //   title: 'Облицовка ступеней',
  //   to: '/vidy-rabot/oblitsovka-stupeney',
  //   icon: 'mdi:stairs',
  //   priceWorkId: 850,
  //   description: 'Крыльцо, лестницы, антискользящее покрытие',
  //   image: '/main/remont-pomescheniy/banki.webp',
  // },
]

/**
 * Типы плитки и их назначение.
 * Используется в MaterialsGuide на всех страницах группы.
 *  Фото пока не указаны — карточки работают без них, добавите позже.
 */
export const plitkaMaterials = [
  {
    name: 'Керамика',
    fullName: 'Керамическая плитка (настенная)',
    color: '#C86B4A',
    colorLabel: 'Глазурованная поверхность, красное или белое тело',
    badge: 'Для стен',
    properties: [
      { label: 'Лёгкая', icon: 'mdi:feather' },
      { label: 'Легко режется и сверлится', icon: 'mdi:content-cut' },
    ],
    useFor: [
      'Стены ванных комнат и санузлов',
      'Фартуки и рабочие зоны кухонь',
      'Декоративные панно и фризы',
    ],
    avoidFor: [
      'Полы в прихожих и магазинах — быстро истирается',
      'Улица и ступени',
    ],
  },
  {
    name: 'Керамогранит',
    fullName: 'Керамический гранит (пол и стены)',
    color: '#607D8B',
    colorLabel: 'Однородный по всей толщине, матовый или полированный',
    badge: 'Универсальный',
    properties: [
      { label: 'Класс износостойкости PEI IV–V', icon: 'mdi:shield-star' },
      { label: 'Водопоглощение < 0,05%', icon: 'mdi:water-off' },
      { label: 'Морозостойкий', icon: 'mdi:snowflake' },
    ],
    useFor: [
      'Полы магазинов, офисов, прихожих',
      'Влажные помещения и душевые',
      'Поверх тёплого пола',
    ],
    avoidFor: ['Сложные криволинейные поверхности — тяжело резать'],
  },
  {
    name: 'Мозаика',
    fullName: 'Стеклянная и керамическая мозаика',
    color: '#4FC3F7',
    colorLabel: 'Матрицы на сетке 30×30 см',
    badge: 'Для криволинейных поверхностей',
    properties: [
      { label: 'Гнётся под любые формы', icon: 'mdi:wave' },
      { label: 'Не боится постоянной воды', icon: 'mdi:water-percent' },
    ],
    useFor: [
      'Бассейны, чаши душевых, хамамы',
      'Колонны, арки, криволинейные стены',
      'Панно и акцентные вставки',
    ],
    avoidFor: ['Полы с высокой нагрузкой — стекло царапается'],
  },
  {
    name: 'Клинкер',
    fullName: 'Клинкерная плитка и ступени',
    color: '#8D6E63',
    colorLabel: 'Под кирпич, шероховатая поверхность',
    badge: 'Ступени и улица',
    properties: [
      { label: 'Антискольжение R11–R13', icon: 'mdi:footprint' },
      { label: 'Морозостойкость', icon: 'mdi:snowflake' },
    ],
    useFor: [
      'Ступени крыльца и входных групп',
      'Террасы и веранды',
      'Полы производств и складов',
    ],
    avoidFor: ['Стены внутри помещений — тяжело и дороже'],
  },
]

/**
 * Толщина плитки и её назначение.
 */
export const plitkaThicknesses: ThicknessOption[] = [
  { value: '6–9 мм', purpose: 'Керамика на стены — лёгкая, просто режется и сверлится' },
  { value: '8–10 мм', purpose: 'Керамогранит на пол — стандарт для магазинов и квартир' },
  { value: '10–12 мм', purpose: 'Высокие нагрузки: прихожие, склады, производственные полы' },
  { value: '20 мм', purpose: 'Улица, ступени, террасы — укладка на усиленное основание' },
]
