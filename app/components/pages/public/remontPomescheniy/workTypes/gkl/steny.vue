<template>
  <div class="page-gkl-steny">
    <!-- ==================== БЛОК 3: Навигация по видам ГКЛ работ (белый фон) ==================== -->
    <WorkTypeNavigator
      title="Виды <span>гипсокартонных работ</span>"
      subtitle="Выберите нужный тип — на каждой странице подробное описание, цены и калькулятор."
      :items="gklWorkTypes"
    />

    <!-- ==================== БЛОК 2: Хлебные крошки + StickyNav ==================== -->
    <NavBreadcrumbsRow>
      <template #breadcrumbs>
        <Breadcrumbs
          :items="[
            { label: 'Главная', to: '/' },
            { label: 'Виды работ', to: '/vidy-rabot' },
            { label: 'ГКЛ', to: '/vidy-rabot/gkl' },
            { label: 'Стены' },
          ]"
        />
      </template>
      <template #nav>
        <StickyNav :items="navItems" :scroll-offset="110" label="На странице" />
      </template>
    </NavBreadcrumbsRow>

    <!-- ==================== БЛОК 1: Описание категории + перелинковка ==================== -->
    <WorkTypeOverview
      category-label="Гипсокартонные работы"
      category-icon="mdi:wall"
      title="Монтаж гипсокартона <span>на стены</span>"
      description="Гипсокартон (ГКЛ) — это готовые листы из гипса в картонной оболочке, которые крепятся на металлический каркас или специальный клей. За 1–3 дня получаем идеально ровную поверхность без штукатурки и длительных сроков высыхания."
      :advantages="categoryAdvantages"
    >
      <!-- Расширенное описание с перелинковкой -->
      <template #details>
        <p>
          В отличие от штукатурки, монтаж на каркас позволяет скрыть электропроводку,
          трубы отопления и вентиляции внутри стены. Это особенно актуально при
          ремонте «под ключ», когда нужно совместить несколько инженерных систем.
        </p>
        <p>
          После обшивки поверхность готова под
          <NuxtLink to="/vidy-rabot/shpaklevka">шпаклёвку</NuxtLink>, покраску
          или укладку <NuxtLink to="/vidy-rabot/plitka">плитки</NuxtLink>.
          Для влажных помещений (санузел, кухня) мы используем влагостойкий ГКЛВ
          зелёного цвета, для зон с повышенными требованиями пожарной безопасности —
          огнестойкий ГКЛО розового цвета.
        </p>
        <p>
          Все профили в нашей работе — с двойным цинкованием от проверенных
          производителей (Knauf, Gyproc). Это исключает ржавчину, скрипы и деформацию
          каркаса со временем, а значит — и трещины по швам.
        </p>
      </template>
    </WorkTypeOverview>

    <!-- БЛОК: До / После (вместо Hero-фона) -->
    <section id="before-after" class="page-section">
      <BeforeAfterShowcase
        title="Результат <span>до и после</span>"
        :items="[
          { beforeImage: '/main/1-1.jpg', afterImage: '/main/1.jpg' },
          { beforeImage: '/main/2-1.jpg', afterImage: '/main/2.jpg' },
          { beforeImage: '/main/5.jpg', afterImage: '/main/6.jpg' },
        ]"
      />
    </section>

    <!-- БЛОК: Что выбрать? -->
    <section id="methods" class="page-section page-section--light">
      <MethodComparison
        title="Что <span>выбрать</span>: клей, каркас или штукатурку?"
        subtitle="Каждый способ подходит для разных задач. Разберём плюсы, минусы и сценарии применения."
        :methods="comparisonMethods"
        summary="Не уверены, что подойдёт именно вам? <strong>Инженер бесплатно приедет на замер</strong>, оценит кривизну стен и предложит оптимальный вариант по цене и срокам."
      />
    </section>

    <!-- БЛОК: Типы материалов -->
    <section id="materials" class="page-section">
      <MaterialsGuide
        title="Какой <span>гипсокартон</span> выбрать: типы и различия"
        subtitle="Не все листы одинаковы. Рассказываем, какой материал подойдёт под вашу задачу — и когда стоит переплатить за ГВЛ."
        :materials="gklMaterials"
        :thicknesses="gklThicknesses"
        summary="Для офисов и жилых комнат достаточно <strong>ГКЛ 12,5 мм</strong>. Для санузлов и кухонь — <strong>ГКЛВ</strong>. Если планируете вешать тяжёлые шкафы или делать пол — берите <strong>ГВЛ</strong>: он дороже, но в разы прочнее. Точную комплектацию инженер посчитает на бесплатном замере."
      />
    </section>

    <!-- ==================== БЛОК 5: Факторы цены ==================== -->
    <section id="price-factors" class="page-section">
      <PriceFactors
        title="Что <span>влияет на итоговую цену</span>"
        :factors="priceFactors"
        footer-note="Точную смету инженер составит после бесплатного выезда на объект. Это ни к чему не обязывает."
      />
    </section>

    <!-- ==================== БЛОК 6: Калькулятор ==================== -->
    <section id="calculator" class="page-section page-section--light">
      <PriceCalculatorTabs
        title="Калькулятор <span>стоимости</span> монтажа ГКЛ"
        subtitle="Выберите тип монтажа и площадь — получите предварительную смету сразу."
        :tabs="calculatorTabs"
        :default-area="20"
        @order-estimate="scrollToCta"
      />
    </section>

    <!-- ==================== БЛОК 7: Этапы работ ==================== -->
    <section id="stages" class="page-section">
      <WorkStagesTimeline
        title="Как <span>мы работаем</span>: 6 этапов"
        subtitle="От звонка до сдачи готовых стен под отделку"
        :stages="workStages"
      />
    </section>

    <!-- ==================== БЛОК 8: Гарантии ==================== -->
    <section id="guarantees" class="page-section page-section--light">
      <GuaranteesGrid title="Наши <span>гарантии</span>" :items="guarantees" />
    </section>

    <!-- ==================== БЛОК 9: FAQ ==================== -->
    <section id="faq" class="page-section">
      <FAQBlock
        title="Ответы на <span>частые вопросы</span>"
        :items="faqItems"
        id-prefix="gkl-steny-faq"
      />
    </section>

    <!-- ==================== БЛОК 10: Кросс-продажи ==================== -->
    <section id="related" class="page-section">
      <CrossSalesBlock
        title="С этим <span>часто заказывают</span>"
        subtitle="Услуги, которые обычно выполняются вместе с монтажом ГКЛ"
        :items="crossSales"
      />
    </section>

    <!-- ==================== БЛОК 11: CTA ==================== -->
    <section id="cta" class="page-section">
      <ApplicationCTA
        title="Рассчитайте <span>точную стоимость</span> вашего объекта"
        subtitle="Оставьте заявку — инженер бесплатно приедет на замер, оценит кривизну стен и подготовит детальную смету."
        phone="+7 (910) 909-69-47"
        telegram="@glavprofii"
        id-prefix="gkl-steny-cta"
        :custom-fields="customFields"
        :message-config="messageConfig"
      />
    </section>
  </div>
</template>

<script setup lang="ts">
// === UI: workTypes (новые компоненты) ===
import WorkTypeOverview from '../ui/WorkTypeOverview.vue'
import WorkTypeNavigator from '../ui/WorkTypeNavigator.vue'
import PriceCalculatorTabs from '../ui/PriceCalculatorTabs.vue'
import WorkStagesTimeline from '../ui/WorkStagesTimeline.vue'
import GuaranteesGrid from '../ui/GuaranteesGrid.vue'
import CrossSalesBlock from '../ui/CrossSalesBlock.vue'
import BeforeAfterShowcase from '../ui/BeforeAfterShowcase.vue'
import MethodComparison from '../ui/MethodComparison.vue'
import type { MethodOption } from '../ui/MethodComparison.vue'
import MaterialsGuide from '../ui/MaterialsGuide.vue'
import type { MaterialCardData, ThicknessOption } from '../ui/MaterialsGuide.vue'

// === UI: общие ===
import StickyNav from '../../ui/StickyNav.vue'
import Breadcrumbs from '../../ui/Breadcrumbs.vue'
import NavBreadcrumbsRow from '../../ui/NavBreadcrumbsRow.vue'
import PriceFactors from '../../ui/PriceFactors.vue'
import FAQBlock from '../../ui/FAQBlock.vue'
import ApplicationCTA from '../../ui/ApplicationCTA.vue'

// === Типы ===
import type { OverviewAdvantage } from '../ui/WorkTypeOverview.vue'
import type { WorkTypeNavItem } from '../ui/WorkTypeNavigator.vue'
import type { CalculatorTab } from '../ui/PriceCalculatorTabs.vue'
import type { WorkStage } from '../ui/WorkStagesTimeline.vue'
import type { GuaranteeItem } from '../ui/GuaranteesGrid.vue'
import type { CrossSalesItem } from '../ui/CrossSalesBlock.vue'
import type { PriceFactor } from '../../ui/PriceFactors.vue'
import type { FAQItem } from '../../ui/FAQBlock.vue'
import type { StickyNavItem } from '../../ui/StickyNav.vue'

// ============================================================
// НАВИГАЦИЯ ПО СЕКЦИЯМ (StickyNav)
// ============================================================
const navItems: StickyNavItem[] = [
  { id: 'before-after', label: 'До и после', icon: 'mdi:compare-horizontal' },
  { id: 'portfolio', label: 'Портфолио', icon: 'mdi:image-multiple' },
  { id: 'price-factors', label: 'Цена', icon: 'mdi:cash-multiple' },
  { id: 'calculator', label: 'Калькулятор', icon: 'mdi:calculator' },
  { id: 'stages', label: 'Этапы работ', icon: 'mdi:timeline-clock' },
  { id: 'guarantees', label: 'Гарантии', icon: 'mdi:shield-check' },
  { id: 'faq', label: 'Вопросы', icon: 'mdi:help-circle-outline' },
  { id: 'related', label: 'Заказывают вместе', icon: 'mdi:puzzle' },
  { id: 'cta', label: 'Заказать', icon: 'mdi:send-outline' },
]

// ============================================================
// БЛОК 1: WorkTypeOverview — преимущества категории
// ============================================================
const categoryAdvantages: OverviewAdvantage[] = [
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

// ============================================================
// БЛОК 3: WorkTypeNavigator — виды ГКЛ работ
// ============================================================
const gklWorkTypes: WorkTypeNavItem[] = [
  {
    title: 'Обшивка стен ГКЛ',
    to: '/vidy-rabot/gkl/steny',
    icon: 'mdi:wall',
    priceFrom: 650,
    active: true,
    description: 'Выравнивание стен на каркас или клей',
  },
  {
    title: 'Перегородки из ГКЛ',
    to: '/vidy-rabot/gkl/peregorodki',
    icon: 'mdi:door-closed',
    priceFrom: 850,
    description: 'Зонирование с шумоизоляцией',
  },
  {
    title: 'Потолки из ГКЛ',
    to: '/vidy-rabot/gkl/potolki',
    icon: 'mdi:ceiling-light',
    priceFrom: 950,
    description: 'Одно- и многоуровневые конструкции',
  },
]

const comparisonMethods: MethodOption[] = [
  {
    title: 'ГКЛ на клей',
    icon: 'mdi:glue',
    priceFrom: 350,
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
    priceFrom: 650,
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
    priceFrom: 450,
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
    ],
  },
]

// === Типы ГКЛ / ГВЛ ===
const gklMaterials: MaterialCardData[] = [
  {
    name: 'ГКЛ',
    fullName: 'Гипсокартонный лист (стандартный)',
    color: '#B0BEC5',
    image: '/main/vidy-rabot/gkl/ГКЛ.png',
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
    image: '/main/vidy-rabot/gkl/ГКЛВ.webp',
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
    image: '/main/vidy-rabot/gkl/ГКЛО.jpg',
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
    image: '/main/vidy-rabot/gkl/ГКЛВО.png',
    color: '#E8A0AC', // розовый акцент для аббревиатуры и бейджей
    colorLabel: 'Бывает двух видов: бежевый лист с розовой кромкой или полностью розовый',
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
    image: '/main/vidy-rabot/gkl/ГВЛ.jpg',
    colorLabel: 'Однородный серый лист без картона',
    badge: 'Сверхпрочный',
    properties: [
      { label: 'В 5 раз прочнее ГКЛ', icon: 'mdi:arm-flex' },
      { label: 'Держит саморезы без дюбелей', icon: 'mdi:screw' },
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
    image: '/main/vidy-rabot/gkl/ГВЛВ.png',
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

// === Толщины ===
const gklThicknesses: ThicknessOption[] = [
  { value: '6,5 мм', purpose: 'Арки и криволинейные конструкции (арочный)' },
  { value: '9,5 мм', purpose: 'Потолки — легче, меньше нагрузка на каркас' },
  { value: '12,5 мм', purpose: 'Стены и перегородки — стандарт' },
  { value: '15–25 мм', purpose: 'Огнестойкие и усиленные конструкции (в 2 слоя)' },
]

// ============================================================
// БЛОК 6: Калькулятор
// ============================================================
const calculatorTabs: CalculatorTab[] = [
  {
    id: 'frame',
    label: 'На каркас',
    icon: 'mdi:frame',
    works: [
      { name: 'Монтаж каркаса (профиль + подвесы)', price: 280 },
      { name: 'Укладка утеплителя/звукоизоляции', price: 120 },
      { name: 'Обшивка ГКЛ в 1 слой', price: 200 },
      { name: 'Заделка швов серпянкой', price: 50 },
    ],
    extras: [
      { id: '2layers', name: 'Обшивка в 2 слоя', price: 150 },
      { id: 'gklv', name: 'Влагостойкий ГКЛ (вместо обычного)', price: 40 },
      { id: 'curved', name: 'Криволинейные участки', price: 200 },
    ],
  },
  {
    id: 'glue',
    label: 'На клей',
    icon: 'mdi:glue',
    works: [
      { name: 'Грунтовка стены', price: 40 },
      { name: 'Нанесение монтажного клея', price: 80 },
      { name: 'Приклейка листов ГКЛ', price: 180 },
      { name: 'Заделка швов', price: 50 },
    ],
    extras: [
      { id: 'primer2', name: 'Двойная грунтовка', price: 30 },
      { id: 'gklv', name: 'Влагостойкий ГКЛ', price: 40 },
    ],
  },
]

// ============================================================
// БЛОК 5: Факторы цены
// ============================================================
const priceFactors: PriceFactor[] = [
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
    description: 'При площади свыше 50 м² действуют оптовые скидки до 15%.',
    icon: 'mdi:ruler-square',
  },
  {
    title: 'Срочность',
    description:
      'Работа в выходные и ночные смены оплачивается с коэффициентом 1.3.',
    icon: 'mdi:clock-alert',
  },
]

// ============================================================
// БЛОК 7: Этапы работ
// ============================================================
const workStages: WorkStage[] = [
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

// ============================================================
// БЛОК 8: Гарантии
// ============================================================
const guarantees: GuaranteeItem[] = [
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

// ============================================================
// БЛОК 9: FAQ
// ============================================================
const faqItems: FAQItem[] = [
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

// ============================================================
// БЛОК 10: Кросс-продажи
// ============================================================
const crossSales: CrossSalesItem[] = [
  {
    title: 'Шпаклёвка и покраска',
    description: 'Подготовка и финишная отделка стен после монтажа ГКЛ.',
    to: '/vidy-rabot/shpaklevka-pokraska',
    priceFrom: 450,
    image: '/services/shpaklevka.jpg',
  },
  {
    title: 'Разводка электрики',
    description: 'Закладка в каркас ГКЛ: розетки, выключатели, LED-подсветка.',
    to: '/vidy-rabot/elektrika',
    priceFrom: 550,
    image: '/services/elektrika.jpg',
  },
  {
    title: 'Звукоизоляция',
    description:
      'Минвата + виброразвязка для тихих спален и домашних кинотеатров.',
    to: '/vidy-rabot/zvukoizolyaciya',
    priceFrom: 350,
    image: '/services/zvuk.jpg',
  },
]

// ============================================================
// БЛОК 11: CTA — кастомные поля
// ============================================================
const customFields = [
  {
    name: 'wallType',
    label: 'Тип стены',
    type: 'tiles' as const,
    options: [
      { value: 'concrete', label: 'Бетон', icon: 'mdi:wall' },
      { value: 'brick', label: 'Кирпич', icon: 'mdi:brick' },
      { value: 'foam', label: 'Пеноблок', icon: 'mdi:layers' },
      { value: 'wood', label: 'Дерево', icon: 'mdi:tree' },
    ],
  },
]

const messageConfig = {
  emoji: '🧱',
  title: 'Заявка на монтаж ГКЛ',
  sourceLabel: 'ГКЛ на стены — CTA',
  fieldLabels: { wallType: 'Тип стены' },
}

// ============================================================
// Служебное
// ============================================================
const scrollToCta = () => {
  const el = document.getElementById('cta')
  el?.scrollIntoView({ behavior: 'smooth' })
}

// Экспортируем FAQ для SEO на роутинг-странице
defineExpose({ faqItems })
</script>

<style lang="scss" scoped>
@use '@/assets/styles/variables' as *;

.page-gkl-steny {
  background: $background-dark;
  color: $text-light;
}

.page-section {
  position: relative;

  &--light {
    background: $background-light;
    color: $text-dark;
  }
}
</style>