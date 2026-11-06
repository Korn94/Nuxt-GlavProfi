<!-- app/components/pages/public/remontPomescheniy/pageTypes/fasady/index.vue -->
<template>
  <div class="page-fasady">
    <!-- ==================== БЛОК 1: HERO ==================== -->
    <PageHero
      title="Ремонт и отделка <span>фасадов зданий</span> в Рязани: утепление, облицовка, высотные работы"
      subtitle="Выполняем ремонт фасадов жилых, коммерческих и административных зданий с учётом климата Рязанской области. Проектируем утепление по СП 50.13330, монтируем «мокрые» и вентилируемые системы, герметизируем межпанельные швы, работаем с лепниной и декоративными элементами. Перед стартом проводим обследование основания и согласуем решения с КГА при необходимости. Смета и срок фиксируются в договоре."
    >
      <template #background>
        <BeforeAfterSlider
          before-image="/main/10.jpg"
          after-image=""
          before-alt="Фасад здания до ремонта"
          after-alt="Фасад здания после ремонта"
          :dimming="true"
          :duration="0"
          :pause-on-hover="false"
          :pause-at-edges="2000"
        />
      </template>

      <template #price>
        <span class="price-main">от 3 500 ₽/м²</span>
        <span class="price-example">100 м²: ~0.4–0.7 млн ₽</span>
        <span class="price-note">В стоимость входят работы без материалов</span>
      </template>

      <template #form>
        <MiniEstimateForm
          room-type="fasady"
          :default-area="100"
          :repair-types="repairTypes"
          id-prefix="fasady-mini"
          @submit="onMiniFormSubmit"
        />
      </template>

      <template #triggers>
        <span class="trigger-item">
          <Icon name="mdi:home-thermometer-outline" class="trigger-icon" size="18" />
          Утепление по СП 50.13330: мокрый фасад, вентфасад, облицовка
        </span>
        <span class="trigger-item">
          <Icon name="mdi:human-male-height" class="trigger-icon" size="18" />
          Высотные работы: леса, люльки, промальп — с допусками и страховкой
        </span>
        <span class="trigger-item">
          <Icon name="mdi:account-hard-hat" class="trigger-icon" size="18" />
          Смета фиксируется в договоре, штатные бригады — один прораб на объект
        </span>
      </template>
    </PageHero>

    <!-- ==================== БЛОК: ХЛЕБНЫЕ КРОШКИ + НАВИГАЦИЯ ==================== -->
    <NavBreadcrumbsRow>
      <template #breadcrumbs>
        <Breadcrumbs
          :items="[
            { label: 'Главная', to: '/' },
            { label: 'Ремонт помещений', to: '/remont-pomescheniy' },
            { label: 'Фасады' }
          ]"
        />
      </template>
      <template #nav>
        <StickyNav :items="navItems" :scroll-offset="110" label="На странице" />
      </template>
    </NavBreadcrumbsRow>

    <!-- ==================== БЛОК 3: ВАРИАНТЫ РЕМОНТА ==================== -->
    <section id="repair-types" class="page-section">
      <RepairTypes
        title="Варианты ремонта фасада <span>и от чего зависит цена</span>"
        :variants="repairVariants"
      />

      <PriceFactors
        title="Из чего складывается <span>цена ремонта</span> фасада здания"
        :factors="priceFactors"
        footer-note="Ориентир по цене: <strong>от 2 200 ₽/м²</strong> для косметического ремонта (покраска, локальный ремонт), <strong>от 3 500 ₽/м²</strong> для капитального с утеплением. Без стоимости материалов. Точную смету инженер подготовит после бесплатного выезда на объект с обследованием основания — это ни к чему вас не обязывает."
      />
    </section>

    <!-- ==================== БЛОК: КАКИЕ РАБОТЫ ВЫПОЛНЯЕМ ==================== -->
    <WorkTypesLinks category="fasady" />

    <!-- ==================== БЛОК 4: КАЛЬКУЛЯТОР ==================== -->
    <section id="calculator" class="page-section page-section--light">
      <div class="calculator-wrap">
        <header class="calculator-header">
          <h2 class="calculator-title">Калькулятор сметы онлайн</h2>
          <p class="calculator-subtitle">
            Рассчитайте предварительную стоимость ремонта вашего фасада за 1 минуту.
            Введите площадь фасада, тип здания и вид работ — получите ориентировочную смету.
            Точный расчёт — после бесплатного выезда инженера с обследованием основания и теплотехническим расчётом.
          </p>
        </header>
        <UiCalculator />
      </div>
    </section>

    <!-- ==================== БЛОК 5: РИСКИ ==================== -->
    <section id="risks" class="page-section">
      <RisksSection
        :pages="risksPages"
        btn-text="Заказать аудит объекта"
      />
    </section>

    <section v-if="hasProjects" id="before-after" class="page-section">
      <BeforeAfterGallery
        :projects="projects"
        title="Фото <span>до и после</span> ремонта"
      />
    </section>

    <section id="brands" class="page-section">
      <PagesPublicHomePageBrands />
    </section>

    <!-- ==================== БЛОК 6: ПРОЕКТЫ ==================== -->
    <section v-if="hasProjects" id="projects" class="page-section">
      <ProjectsShowcase
        title="Наши реализованные проекты <span>фасадов зданий в Рязани</span>"
        :subtitle="projectsSubtitle"
        :projects="projects"
      />
    </section>

    <!-- ==================== БЛОК: ПОХОЖИЕ УСЛУГИ ==================== -->
    <RelatedServicesGrid category="fasady" />

    <!-- ==================== БЛОК: ПРАЙС-ЛИСТ ==================== -->
    <PriceCategoriesGrid />

    <!-- ==================== БЛОК 8: CTA ==================== -->
    <section id="cta" class="page-section">
      <ApplicationCTA
        title="Получите смету и обследование фасада <span>за 24 часа</span>"
        subtitle="Загрузите фото здания или опишите задачу. Инженер проведёт обследование основания, проверит несущую способность и подготовит детальный расчёт с теплотехническим обоснованием. Консультация бесплатна."
        phone="+7 (910) 909-69-47"
        telegram="@glavprofii"
        max="https://max.ru/u/f9LHodD0cOLfbBSpAeCwHBcJ83SJtKVj9mVKY7K8OLd6OwYB0gH6g3XE_Cs"
        id-prefix="fasady-cta"
        :custom-fields="customFields"
        :message-config="messageConfig"
      />
    </section>

    <!-- ==================== БЛОК 7: FAQ ==================== -->
    <section id="faq" class="page-section">
      <FAQBlock
        title="Ответы на <span>частые вопросы</span>"
        :items="faqItems"
        id-prefix="fasady-faq"
      />
    </section>
  </div>
</template>

<script setup lang="ts">
// === UI-компоненты pageTypes ===
import PageHero from '../../ui/PageHero.vue'
import StickyNav from '../../ui/StickyNav.vue'
import BeforeAfterSlider from '../../ui/BeforeAfterSlider.vue'
import MiniEstimateForm from '../../ui/MiniEstimateForm.vue'
import RepairTypes from '../ui/RepairTypes.vue'
import WorkTypesLinks from '../ui/WorkTypesLinks.vue'
import RelatedServicesGrid from '../ui/RelatedServicesGrid.vue'
import PriceCategoriesGrid from '../ui/PriceCategoriesGrid.vue'
import PriceFactors from '../../ui/PriceFactors.vue'
import RisksSection from '../ui/RisksSection.vue'
import BeforeAfterGallery from '../../ui/BeforeAfterGallery.vue'
import ProjectsShowcase from '../ui/ProjectsShowcase.vue'
import FAQBlock from '../../ui/FAQBlock.vue'
import ApplicationCTA from '../../ui/ApplicationCTA.vue'
import Breadcrumbs from '../../ui/Breadcrumbs.vue'
import NavBreadcrumbsRow from '../../ui/NavBreadcrumbsRow.vue'

// === Портфолио: категории кейсов + общий SSR-загрузчик проектов ===
import { usePortfolioProjects } from '~/composables/portfolio/usePortfolioProjects'
import { getProjectsCategories, getProjectsSubtitle, PROJECTS_LIMIT } from '../data/projectsByCategory'

// === Типы данных ===
import type { RepairVariant } from '../ui/RepairTypes.vue'
import type { RiskPage } from '../ui/RisksSection.vue'
import type { PriceFactor, FAQItem, StickyNavItem } from '../../ui/types'

// === Проекты (SSR: карточки попадают в HTML, фильтр по категории — на сервере) ===
const { projects, ownCount } = await usePortfolioProjects({
  key: 'premises-projects:fasady',
  categories: getProjectsCategories('fasady'),
  limit: PROJECTS_LIMIT,
})

// Секции «Фото до/после» и «Проекты» рендерятся только при наличии кейсов:
// пустых блоков и мёртвых пунктов в StickyNav быть не должно
const hasProjects = projects.length > 0
const projectsSubtitle = getProjectsSubtitle('fasady', ownCount, projects.length)

// === Навигация ===
const navItems: StickyNavItem[] = [
  { id: 'repair-types', label: 'Варианты ремонта', icon: 'mdi:format-paint' },
  { id: 'works', label: 'Виды работ', icon: 'mdi:hammer-screwdriver' },
  { id: 'calculator', label: 'Калькулятор сметы', icon: 'mdi:calculator' },
  { id: 'risks', label: 'Риски', icon: 'mdi:alert-circle-outline' },
  ...(hasProjects ? [{ id: 'projects', label: 'Проекты', icon: 'mdi:briefcase-outline' }] : []),
  { id: 'cta', label: 'Оставить заявку', icon: 'mdi:send-outline' },
  { id: 'faq', label: 'Вопросы', icon: 'mdi:help-circle-outline' },
]

// === Варианты ремонта (специфичные для фасадов) ===
const repairTypes = [
  { value: 'cosmetic', label: 'Косметический', icon: 'mdi:format-paint' },
  { value: 'capital', label: 'Капитальный', icon: 'mdi:hammer-wrench' },
  { value: 'turnkey', label: 'Под ключ', icon: 'mdi:key-variant' },
  { value: 'insulation', label: 'Утепление', icon: 'mdi:home-thermometer-outline' },
]

const repairVariants: RepairVariant[] = [
  {
    title: 'Косметический',
    lead: 'Для фасадов в удовлетворительном состоянии, когда нужно обновить внешний вид без замены утеплителя и полной переделки отделки.',
    works: [
      'Локальный ремонт штукатурного слоя',
      'Покраска фасада атмосферостойкими составами',
      'Герметизация межпанельных и деформационных швов',
      'Ремонт водосточной системы и отливов',
    ],
    duration: 'от 2 недель',
    price: 'от 2 200 ₽/м²',
    icon: 'mdi:format-paint',
  },
  {
    title: 'Капитальный',
    lead: 'Когда фасад требует полной реконструкции: замена отделки, утепление, устранение высолов, трещин и отслоений.',
    works: [
      'Демонтаж старой отделки до основания',
      'Восстановление и усиление основания',
      'Монтаж системы утепления (мокрый или вентфасад)',
      'Финишная отделка и декоративные элементы',
      'Водосточная система и архитектурная подсветка',
    ],
    duration: 'от 1,5 месяцев',
    price: 'от 3 500 ₽/м²',
    icon: 'mdi:hammer-wrench',
    featured: true,
    badge: 'Полная реконструкция',
  },
  {
    title: 'Под ключ',
    lead: 'Полный цикл: обследование, проект с согласованием в КГА, леса и подмости, все виды работ, сдача с исполнительной документацией.',
    works: [
      'Обследование основания и теплотехнический расчёт',
      'Проект и согласование цветового паспорта',
      'Монтаж лесов, люлек или организация промальпа',
      'Полный цикл фасадных работ',
      'Архитектурная подсветка и благоустройство',
    ],
    duration: 'от 2 месяцев',
    price: 'от 5 000 ₽/м²',
    icon: 'mdi:key-variant',
    badge: 'Под ключ',
  },
]

// === Факторы цены ===
const priceFactors: PriceFactor[] = [
  {
    title: 'Тип фасадной системы',
    description: 'Мокрая штукатурка (эконом), вентилируемый фасад (керамогранит, фиброцемент, металлокассеты), облицовка кирпичом или натуральным камнем — разброс по стоимости работ и материалов в 3–4 раза.',
    icon: 'mdi:layers-triple-outline',
  },
  {
    title: 'Высота и сложность геометрии',
    description: 'Малоэтажные здания — рамные леса, высотные — фасадные люльки, сложные конфигурации — промальп. Количество эркеров, пилястр, карнизов и лепнины увеличивает время на подгонку.',
    icon: 'mdi:human-male-height',
  },
  {
    title: 'Состояние основания',
    description: 'Кирпич, бетон, штукатурка или SIP-панели — у каждого свои требования к подготовке. Высолы, трещины, отслоения, грибок — отдельный объём работ по восстановлению несущего слоя.',
    icon: 'mdi:wall',
  },
  {
    title: 'Утепление и толщина',
    description: 'Минвата или ПСБ-С, 50 мм, 100 мм или 150 мм — от этого зависит и теплосопротивление, и количество крепежа, и стоимость системы. Расчёт — по СП 50.13330 для климата Рязани.',
    icon: 'mdi:home-thermometer-outline',
  },
  {
    title: 'Декоративные элементы',
    description: 'Лепнина, карнизы, пилястры, русты, архивольты — каждый элемент проектируется и монтируется индивидуально. Реставрация исторического декора — отдельная статья сметы.',
    icon: 'mdi:palette-outline',
  },
  {
    title: 'Согласования и допуски',
    description: 'Здания в охранных зонах, объекты культурного наследия, центральные улицы — требуют согласования с КГА и цветового паспорта. Мы берём всю документацию на себя.',
    icon: 'mdi:file-check-outline',
  },
]

// === Риски (новый формат для табов) ===
const risksPages: RiskPage[] = [
  {
    id: 'fasady',
    label: 'Фасады',
    title: 'Что упускают при ремонте фасада — <span>и потом переплачивают</span>',
    subtitle: 'Ошибки на фасаде видны всем и обходятся дорого. Вот 6 главных и как мы их исключаем.',
    note: 'Фасад — это ещё и безопасность прохожих. Поэтому каждое испытание и расчёт мы оформляем актом.',
    items: [
      {
        title: 'Не проверяют основание',
        risk: 'Фасад вместе со старой штукатуркой может обрушиться через 1–2 года.',
        fix: 'Простукиваем стену, делаем вырывные испытания дюбелей, проверяем адгезию. Результат — в акте.',
      },
      {
        title: 'Экономят на крепеже и подсистеме',
        risk: 'Облицовка отпадает, на фасаде появляются ржавые потёки.',
        fix: 'Дюбели с расчётной нагрузкой, подсистема из нержавейки или оцинковки от 60 мкм.',
      },
      {
        title: 'Нет расчёта ветровой нагрузки',
        risk: 'В углах и на верхних этажах облицовку может сорвать ветром.',
        fix: 'Считаем давление по СП 20.13330 для района и высоты здания, в углах усиливаем крепёж на 30%.',
      },
      {
        title: 'Нарушают технологию «мокрого» фасада',
        risk: 'Составы не набирают прочность и отслаиваются в первую зиму, гарантия производителя пропадает.',
        fix: 'Работаем по техкарте: не ниже +5 °C, выдерживаем сушку слоёв, ведём журнал работ.',
      },
      {
        title: 'Нет пароизоляции и гидрофобизации',
        risk: 'Утеплитель намокает, стена промерзает, счета за отопление растут на 30–40%.',
        fix: 'Проектируем так, чтобы паропроницаемость росла изнутри наружу, и считаем точку росы.',
      },
      {
        title: 'Небрежные узлы примыкания',
        risk: 'Мостики холода, протечки под окнами, плесень внутри.',
        fix: 'Прорабатываем каждый узел: уплотнительные ленты, отливы с уклоном от 10°, двойная герметизация.',
      },
    ],
  },
]


// === FAQ ===
const faqItems: FAQItem[] = [
  {
    question: 'Работаете ли на высоте — с лесов, люлек или методом промальпа?',
    answer: 'Да. Подбираем метод под высоту и конфигурацию здания: для малоэтажных — рамные и клиновые леса, для 5–9 этажей — фасадные люльки, для сложных конфигураций и точечного ремонта — промышленный альпинизм. Все высотники — с допусками и страховкой, леса — с паспортом и актом приёмки.',
  },
  {
    question: 'Нужно ли согласование с КГА для фасада в Рязани?',
    answer: 'Зависит от здания: для объектов в охранных зонах, на центральных улицах и зданий-памятников — обязательно. Для рядовых коммерческих объектов вне охранной зоны — достаточно уведомления. Мы берём на себя сбор документации, согласование цветового паспорта и колористическое решение. Всё делаем до начала работ.',
  },
  {
    question: 'При какой температуре можно делать мокрый фасад?',
    answer: 'По технологии — не ниже +5 °C и без заморозков в течение 72 часов после нанесения составов. При отрицательных температурах используем зимние клеевые смеси с антифризными добавками и организуем тепловые контуры. Работать в мороз без подготовки — это гарантированные отслоения через год.',
  },
  {
    question: 'Утепляете ли вы существующий фасад без демонтажа старой отделки?',
    answer: 'Да, если основание имеет достаточную несущую способность. Перед утеплением проводим обследование: простукиваем поверхность, проверяем адгезию, делаем вырывные испытания дюбелей. Если старая штукатурка держится — монтируем утеплитель поверх, если нет — локальный демонтаж с восстановлением основания.',
  },
  {
    question: 'Какие гарантии на фасадные работы?',
    answer: '3 года по договору на все строительно-отделочные работы, включая скрытые дефекты. На системы вентилируемого фасада — по гарантии производителя (до 15 лет на керамогранит и фиброцемент). Если в гарантийный срок появятся отслоения, трещины, высолы или протечки — приедем и исправим за свой счёт.',
  },
  {
    question: 'Какие фасадные системы используете — мокрые или вентилируемые?',
    answer: 'Работаем со всеми основными системами: «мокрый» фасад (штукатурка по утеплителю), вентилируемые фасады (керамогранит, фиброцемент, металлокассеты, HPL-панели), облицовка кирпичом и натуральным камнем, светопрозрачные конструкции. Подбираем систему под задачу: бюджет, теплопотери, архитектура и сроки эксплуатации.',
  },
]

const customFields = [
  {
    name: 'buildingType',
    label: 'Тип здания',
    type: 'tiles' as const,
    options: [
      { value: 'residential-multi', label: 'Многоэтажный жилой', icon: 'mdi:office-building' },
      { value: 'residential-private', label: 'Частный дом', icon: 'mdi:home' },
      { value: 'office', label: 'Офисное здание', icon: 'mdi:domain' },
      { value: 'commercial', label: 'Торговый центр', icon: 'mdi:store-24-hour' },
      { value: 'administrative', label: 'Административное', icon: 'mdi:city-variant-outline' },
      { value: 'historic', label: 'Историческое здание', icon: 'mdi:bank' },
      { value: 'industrial', label: 'Промышленное', icon: 'mdi:factory' },
      { value: 'other', label: 'Другое', icon: 'mdi:dots-horizontal' },
    ],
  },
]

const messageConfig = {
  emoji: '🏢',
  title: 'Заявка на ремонт фасада',
  sourceLabel: 'Ремонт фасадов в Рязани — CTA',
  fieldLabels: { buildingType: 'Тип здания' },
}

// === Аналитика ===
const onMiniFormSubmit = (data: unknown) => {
  console.log('[fasady] Быстрая заявка:', data)
}
</script>

<style lang="scss" scoped>
@use '@/assets/styles/variables' as *;

.page-fasady {
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

// === Калькулятор (обёртка блока 4) ===
.calculator-wrap {
  max-width: 900px;
  margin: 0 auto;
  padding: 5rem 2rem;

  @media (max-width: 768px) {
    padding: 3.5rem 1.2rem;
  }
}

.calculator-header {
  text-align: center;
  max-width: 720px;
  margin: 0 auto 2.5rem;
}

.calculator-title {
  font-family: 'Rubik', sans-serif;
  font-size: 2.2rem;
  font-weight: 700;
  color: $text-dark;
  margin: 0 0 1rem;
  line-height: 1.25;
  position: relative;
  padding-bottom: 1rem;

  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 80px;
    height: 4px;
    background: $blue-gradient;
    border-radius: 2px;
    box-shadow: 0 0 10px rgba(0, 195, 245, 0.3);
  }

  @media (max-width: 768px) {
    font-size: 1.7rem;
  }
}

.calculator-subtitle {
  font-size: 1.05rem;
  line-height: 1.65;
  color: $text-gray;
  margin: 1rem 0 0;
}
</style>