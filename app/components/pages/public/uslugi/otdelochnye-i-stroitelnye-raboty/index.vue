<!-- app/pages/gkl/steny.vue -->
<template>
  <div class="page-gkl-steny">
    <!-- БЛОК 1: HERO -->
    <PageHero
      title="Монтаж гипсокартона на стены <span>под ключ в Рязани</span>"
      subtitle="Ровные стены за 1-3 дня. Монтаж на каркас или клей. Скрываем проводку, утепляем, готовим под обои или плитку. Гарантия 3 года на все работы."
    >
      <template #background>
        <BeforeAfterSlider
          before-image="/gkl/steny/before.jpg"
          after-image="/gkl/steny/after.jpg"
          before-alt="Стена до монтажа ГКЛ"
          after-alt="Стена после монтажа ГКЛ"
          :dimming="true"
          :duration="8000"
          :pause-at-edges="2000"
        />
      </template>
      <template #price>
        <span class="price-main">от 650 ₽/м²</span>
        <span class="price-example">Комната 15 м²: ~9 750 ₽</span>
        <span class="price-note">Без учёта материалов</span>
      </template>
      <template #form>
        <MiniEstimateForm
          room-type="gkl-steny"
          :default-area="20"
          :repair-types="repairTypes"
          id-prefix="gkl-steny-mini"
          @submit="onMiniFormSubmit"
        />
      </template>
      <template #triggers>
        <span class="trigger-item">
          <Icon name="mdi:shield-check-outline" class="trigger-icon" size="18" />
          Гарантия 3 года на монтаж
        </span>
        <span class="trigger-item">
          <Icon name="mdi:clock-fast" class="trigger-icon" size="18" />
          За 1-3 дня без задержек
        </span>
        <span class="trigger-item">
          <Icon name="mdi:cash-multiple" class="trigger-icon" size="18" />
          Цена фиксируется в договоре
        </span>
      </template>
    </PageHero>

    <!-- ХЛЕБНЫЕ КРОШКИ + НАВИГАЦИЯ -->
    <NavBreadcrumbsRow>
      <template #breadcrumbs>
        <Breadcrumbs
          :items="[
            { label: 'Главная', to: '/' },
            { label: 'Виды работ', to: '/vidy-rabot' },
            { label: 'ГКЛ', to: '/gkl' },
            { label: 'Стены' }
          ]"
        />
      </template>
      <template #nav>
        <StickyNav :items="navItems" :scroll-offset="110" label="На странице" />
      </template>
    </NavBreadcrumbsRow>

    <!-- БЛОК 2: Контекстная навигация -->
    <ServiceNavigation
      title="Гипсокартонные <span>работы</span>"
      :items="serviceNavItems"
    />

    <!-- БЛОК 3: Описание услуги -->
    <section id="about" class="page-section">
      <div class="container description-wrap">
        <h2>Что такое <span class="accent">монтаж ГКЛ на стены</span></h2>
        <p>
          Гипсокартон (ГКЛ) — оптимальное решение для быстрого выравнивания стен
          любой кривизны. В отличие от штукатурки, монтаж на каркас позволяет
          скрыть электропроводку, трубы, уложить утеплитель или звукоизоляцию.
          После обшивки поверхность готова под <NuxtLink to="/shpaklevka">шпаклёвку</NuxtLink>,
          покраску или укладку <NuxtLink to="/plitka">плитки</NuxtLink>.
        </p>
        <p>
          Мы используем только влагостойкий ГКЛ (ГКЛВ) в санузлах и на кухне,
          огнестойкий (ГКЛО) — у щитовых и котлов. Стандартный ГКЛ — в сухих
          помещениях. Все профили — с двойным цинкованием, что исключает ржавчину
          и скрипы со временем.
        </p>
      </div>
    </section>

    <!-- БЛОК 4: КАЛЬКУЛЯТОР С ТАБАМИ -->
    <section id="calculator" class="page-section page-section--light">
      <PriceCalculatorTabs
        title="Калькулятор <span>стоимости</span> монтажа ГКЛ"
        subtitle="Выберите тип монтажа и площадь — получите предварительную смету за 30 секунд."
        :tabs="calculatorTabs"
        :default-area="20"
        @order-estimate="scrollToCta"
      />
    </section>

    <!-- БЛОК 5: Что влияет на цену -->
    <section id="price-factors" class="page-section">
      <PriceFactors
        title="Что <span>влияет на итоговую цену</span>"
        :factors="priceFactors"
        footer-note="Точную смету инженер составит после бесплатного выезда на объект. Это ни к чему не обязывает."
      />
    </section>

    <!-- БЛОК 6: Этапы -->
    <section id="stages" class="page-section">
      <WorkStagesTimeline
        title="Как <span>мы работаем</span>: 6 этапов"
        subtitle="От звонка до сдачи готовых стен под отделку"
        :stages="workStages"
      />
    </section>

    <!-- БЛОК 7: Портфолио -->
    <section id="portfolio" class="page-section page-section--light">
      <BeforeAfterGallery
        :slugs="['gkl-steny-1', 'gkl-steny-2']"
        title="Наши работы: <span>стены из ГКЛ</span>"
      />
    </section>

    <!-- БЛОК 8: Гарантии -->
    <section id="guarantees" class="page-section">
      <GuaranteesGrid
        title="Наши <span>гарантии</span>"
        :items="guarantees"
      />
    </section>

    <!-- БЛОК 9: FAQ -->
    <section id="faq" class="page-section page-section--light">
      <FAQBlock
        title="Ответы на <span>частые вопросы</span>"
        :items="faqItems"
        id-prefix="gkl-steny-faq"
      />
    </section>

    <!-- БЛОК 10: Популярные услуги -->
    <section id="popular" class="page-section">
      <ServiceNavigation
        title="Также <span>популярно</span>"
        :items="popularServices"
      />
    </section>

    <!-- БЛОК 11: Кросс-продажи -->
    <section id="related" class="page-section">
      <CrossSalesBlock
        title="С этим <span>часто заказывают</span>"
        subtitle="Услуги, которые обычно выполняются вместе с монтажом ГКЛ"
        :items="crossSales"
      />
    </section>

    <!-- БЛОК 12: CTA -->
    <section id="cta" class="page-section">
      <ApplicationCTA
        title="Рассчитайте <span>точную стоимость</span> вашего объекта"
        subtitle="Оставьте заявку — инженер бесплатно приедет на замер, оценит кривизну стен и подготовит детальную смету."
        phone="+7 (910) 909-69-47"
        telegram="@glavprofii"
        id-prefix="gkl-steny-cta"
        :message-config="{
          emoji: '🧱',
          title: 'Заявка на монтаж ГКЛ',
          sourceLabel: 'ГКЛ на стены — CTA',
        }"
      />
    </section>
  </div>
</template>

<script setup lang="ts">
import PageHero from '~/components/pages/public/remontPomescheniy/pageTypes/ui/PageHero.vue'
import StickyNav from '~/components/pages/public/remontPomescheniy/pageTypes/ui/StickyNav.vue'
import Breadcrumbs from '~/components/pages/public/remontPomescheniy/pageTypes/ui/Breadcrumbs.vue'
import NavBreadcrumbsRow from '~/components/pages/public/remontPomescheniy/pageTypes/ui/NavBreadcrumbsRow.vue'
import MiniEstimateForm from '~/components/pages/public/remontPomescheniy/pageTypes/ui/MiniEstimateForm.vue'
import BeforeAfterSlider from '~/components/pages/public/remontPomescheniy/pageTypes/ui/BeforeAfterSlider.vue'
import BeforeAfterGallery from '~/components/pages/public/remontPomescheniy/pageTypes/ui/BeforeAfterGallery.vue'
import PriceFactors from '~/components/pages/public/remontPomescheniy/pageTypes/ui/PriceFactors.vue'
import FAQBlock from '~/components/pages/public/remontPomescheniy/pageTypes/ui/FAQBlock.vue'
import ApplicationCTA from '~/components/pages/public/remontPomescheniy/pageTypes/ui/ApplicationCTA.vue'
import ServiceNavigation from '~/components/pages/public/remontPomescheniy/workTypes/ui/ServiceNavigation.vue'
import PriceCalculatorTabs from '~/components/pages/public/remontPomescheniy/workTypes/ui/PriceCalculatorTabs.vue'
import WorkStagesTimeline from '~/components/pages/public/remontPomescheniy/workTypes/ui/WorkStagesTimeline.vue'
import GuaranteesGrid from '~/components/pages/public/remontPomescheniy/workTypes/ui/GuaranteesGrid.vue'
import CrossSalesBlock from '~/components/pages/public/remontPomescheniy/workTypes/ui/CrossSalesBlock.vue'

// === SEO ===
useHead({
  title: 'Монтаж гипсокартона на стены в Рязани — от 650 ₽/м² | ГлавПрофи',
  meta: [
    {
      name: 'description',
      content: 'Монтаж ГКЛ на стены под ключ в Рязани: на каркас или клей. Выравнивание стен, утепление, звукоизоляция. Гарантия 3 года, фиксированная цена.',
    },
  ],
})

// === Навигация ===
const navItems = [
  { id: 'about', label: 'Об услуге' },
  { id: 'calculator', label: 'Калькулятор' },
  { id: 'price-factors', label: 'Цена' },
  { id: 'stages', label: 'Этапы работ' },
  { id: 'portfolio', label: 'Портфолио' },
  { id: 'guarantees', label: 'Гарантии' },
  { id: 'faq', label: 'Вопросы' },
  { id: 'popular', label: 'Похожие услуги' },
  { id: 'related', label: 'Заказывают вместе' },
  { id: 'cta', label: 'Заказать' },
]

// === Мини-форма в Hero ===
const repairTypes = [
  { value: 'frame', label: 'На каркас', icon: 'mdi:frame' },
  { value: 'glue', label: 'На клей', icon: 'mdi:glue' },
  { value: 'complex', label: 'Комплексно', icon: 'mdi:wrench' },
]

// === БЛОК 2: Контекстная навигация ===
const serviceNavItems = [
  {
    title: 'ГКЛ на стены',
    description: 'Выравнивание стен, скрытая проводка, утепление.',
    to: '/gkl/steny',
    icon: 'mdi:wall',
    priceFrom: 650,
    active: true,
  },
  {
    title: 'Перегородки из ГКЛ',
    description: 'Зонирование комнат, офисов, санузлов.',
    to: '/gkl/peregorodki',
    icon: 'mdi:room-divider',
    priceFrom: 850,
  },
  {
    title: 'Потолки из ГКЛ',
    description: 'Одно- и многоуровневые потолки, подсветка.',
    to: '/gkl/potolki',
    icon: 'mdi:ceiling-light',
    priceFrom: 950,
  },
]

// === БЛОК 4: Калькулятор ===
const calculatorTabs = [
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

// === БЛОК 5: Факторы цены ===
const priceFactors = [
  {
    title: 'Кривизна стен',
    description: 'При перепадах более 5 см монтаж на клей невозможен — нужен каркас, что дороже.',
    icon: 'mdi:wall',
  },
  {
    title: 'Высота потолков',
    description: 'Работы выше 3 м требуют лесов и страховки — увеличивается стоимость м².',
    icon: 'mdi:human-male-height',
  },
  {
    title: 'Коммуникации',
    description: 'Закладка под розетки, выключатели, трубы учитывается отдельно.',
    icon: 'mdi:pipe',
  },
  {
    title: 'Объём работ',
    description: 'При площади свыше 50 м² действуют оптовые скидки до 15%.',
    icon: 'mdi:ruler-square',
  },
  {
    title: 'Срочность',
    description: 'Работа в выходные и ночные смены оплачивается с коэффициентом 1.3.',
    icon: 'mdi:clock-alert',
  },
]

// === БЛОК 6: Этапы ===
const workStages = [
  {
    title: 'Заявка и замер',
    description: 'Инженер приезжает, замеряет помещение, оценивает кривизну и коммуникации.',
    icon: 'mdi:clipboard-text',
    duration: '1 день',
    result: 'Точная смета',
  },
  {
    title: 'Подписание договора',
    description: 'Фиксируем цену, сроки, список работ. Предоплата только за материалы.',
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
    description: 'Принимаете работу, подписываем акт. Гарантия 3 года на монтаж.',
    icon: 'mdi:check-decagram',
    duration: '1 день',
    result: 'Гарантийный талон',
  },
]

// === БЛОК 8: Гарантии ===
const guarantees = [
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
    description: 'Убираем мусор каждый день. После работ — выносим весь строительный мусор.',
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

// === БЛОК 9: FAQ ===
const faqItems = [
  {
    question: 'Какой гипсокартон выбрать для ванной?',
    answer: 'Только влагостойкий (ГКЛВ, зелёного цвета). Обычный ГКЛ во влажной среде разбухает за 2-3 года. Для зон прямого контакта с водой лучше дополнительно использовать гидроизоляцию.',
  },
  {
    question: 'Можно ли клеить ГКЛ на кирпичную стену?',
    answer: 'Да, если перепад стен не превышает 2 см на 2 метра. При большей кривизне — только каркасный монтаж, иначе листы могут отойти или треснуть по швам.',
  },
  {
    question: 'Сколько сохнет шпаклёвка на ГКЛ перед покраской?',
    answer: 'Первый слой — 4-6 часов при +20°C. Полный цикл (грунт + 2 слоя + шлифовка) — 2-3 дня. После этого можно клеить обои или красить.',
  },
  {
    question: 'Можно ли на стену из ГКЛ вешать тяжёлые полки?',
    answer: 'Да, но только на специальные дюбели (Molly, "бабочка"). Для телевизора и кухонных шкафов закладываем деревянные закладные на этапе монтажа каркаса.',
  },
  {
    question: 'Какая звукоизоляция у стены из ГКЛ?',
    answer: 'Стандартная стена 1 слой + минвата 50 мм — ~45 дБ. С двумя слоями ГКЛ + минвата 100 мм — до 58 дБ (уровень тихой спальни).',
  },
]

// === БЛОК 10: Популярные услуги ===
const popularServices = [
  {
    title: 'Шпаклёвка стен',
    description: 'Подготовка ГКЛ под обои или покраску.',
    to: '/shpaklevka-sten',
    icon: 'mdi:format-paint',
    priceFrom: 250,
  },
  {
    title: 'Укладка плитки',
    description: 'На ГКЛ, бетон, кирпич. Любые форматы.',
    to: '/plitka',
    icon: 'mdi:grid',
    priceFrom: 850,
  },
  {
    title: 'Натяжные потолки',
    description: 'Матовые, глянцевые, с подсветкой.',
    to: '/natyazhnye-potolki',
    icon: 'mdi:ceiling-light',
    priceFrom: 450,
  },
]

// === БЛОК 11: Кросс-продажи ===
const crossSales = [
  {
    title: 'Шпаклёвка и покраска',
    description: 'Подготовка и финишная отделка стен после монтажа ГКЛ.',
    to: '/shpaklevka-pokraska',
    priceFrom: 450,
    image: '/services/shpaklevka.jpg',
  },
  {
    title: 'Разводка электрики',
    description: 'Закладка в каркас ГКЛ: розетки, выключатели, LED-подсветка.',
    to: '/elektrika',
    priceFrom: 550,
    image: '/services/elektrika.jpg',
  },
  {
    title: 'Звукоизоляция',
    description: 'Минвата + виброразвязка для тихих спален и домашних кинотеатров.',
    to: '/zvukoizolyaciya',
    priceFrom: 350,
    image: '/services/zvuk.jpg',
  },
]

// === Служебное ===
const onMiniFormSubmit = (data: unknown) => {
  console.log('[gkl/steny] Мини-форма отправлена:', data)
}

const scrollToCta = () => {
  const el = document.getElementById('cta')
  el?.scrollIntoView({ behavior: 'smooth' })
}
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

.description-wrap {
  max-width: 900px;
  margin: 0 auto;
  padding: 5rem 2rem;

  @media (max-width: 768px) { padding: 3.5rem 1.2rem; }

  h2 {
    font-family: 'Rubik', sans-serif;
    font-size: 2rem;
    font-weight: 700;
    margin: 0 0 1.5rem;
    :deep(.accent) {
      background: $blue-gradient;
      -webkit-background-clip: text;
      background-clip: text;
      color: transparent;
    }
  }

  p {
    font-size: 1.05rem;
    line-height: 1.7;
    color: rgba($text-light, 0.85);
    margin: 0 0 1rem;

    a {
      color: $blue-light;
      text-decoration: underline;
      &:hover { color: $blue; }
    }
  }
}
</style>