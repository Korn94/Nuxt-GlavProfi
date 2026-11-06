<!-- app/components/pages/public/remontPomescheniy/pageTypes/proizvodstvo/index.vue -->
<template>
  <div class="page-proizvodstvo">
    <!-- ==================== БЛОК 1: HERO ==================== -->
    <PageHero
      title="Ремонт производственных цехов и <span>заводов</span> в Рязани: отделка, плитка, электрика"
      subtitle="Выполняем отделку производственных цехов, заводов и промышленных помещений с учётом специфики технологических процессов. Проектируем промышленные полы под станки, вентиляцию с фильтрацией выбросов, электроснабжение 380В, виброразвязку и пожарную безопасность. Перед стартом проводим аудит объекта и согласуем требования технолога. Смета и срок фиксируются в договоре."
    >
      <template #background>
        <BeforeAfterSlider
          before-image="/main/4.jpg"
          after-image="/main/4-1.jpg"
          before-alt="Производственный цех до ремонта"
          after-alt="Производственный цех после ремонта"
          :dimming="true"
          :duration="10000"
          :pause-on-hover="false"
          :pause-at-edges="2000"
        />
      </template>

      <template #price>
        <span class="price-main">от 12 000 ₽/м²</span>
        <span class="price-example">100 м²: ~1.2–2.5 млн ₽</span>
        <span class="price-note">В стоимость входят работы без материалов</span>
      </template>

      <template #form>
        <MiniEstimateForm
          room-type="proizvodstvo"
          :default-area="100"
          :repair-types="repairTypes"
          id-prefix="proizvodstvo-mini"
          @submit="onMiniFormSubmit"
        />
      </template>

      <template #triggers>
        <span class="trigger-item">
          <Icon name="mdi:factory" class="trigger-icon" size="18" />
          Промышленные полы под станки с виброразвязкой
        </span>
        <span class="trigger-item">
          <Icon name="mdi:air-filter" class="trigger-icon" size="18" />
          Вентиляция с фильтрацией по нормам ПДВ и СанПиН
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
            { label: 'Производство' }
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
        title="Варианты ремонта производственного цеха <span>и от чего зависит цена</span>"
        :variants="repairVariants"
      />

      <PriceFactors
        title="Из чего складывается <span>цена ремонта</span> производственного помещения"
        :factors="priceFactors"
        footer-note="Ориентир по цене: <strong>от 7 500 ₽/м²</strong> для косметического ремонта, <strong>от 12 000 ₽/м²</strong> для капитального. Без стоимости материалов. Точную смету инженер подготовит после бесплатного выезда на объект с согласованием требований технолога — это ни к чему вас не обязывает."
      />
    </section>

    <!-- ==================== БЛОК: КАКИЕ РАБОТЫ ВЫПОЛНЯЕМ ==================== -->
    <WorkTypesLinks category="proizvodstvo" />

    <!-- ==================== БЛОК 4: КАЛЬКУЛЯТОР ==================== -->
    <section id="calculator" class="page-section page-section--light">
      <div class="calculator-wrap">
        <header class="calculator-header">
          <h2 class="calculator-title">Калькулятор сметы онлайн</h2>
          <p class="calculator-subtitle">
            Рассчитайте предварительную стоимость ремонта вашего производственного цеха за 1 минуту.
            Введите площадь, тип производства и вид ремонта — получите ориентировочную смету.
            Точный расчёт — после бесплатного выезда инженера с аудитом нагрузок и выбросов.
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
        title="Наши реализованные проекты <span>производственных цехов в Рязани</span>"
        :subtitle="projectsSubtitle"
        :projects="projects"
      />
    </section>

    <!-- ==================== БЛОК: ПОХОЖИЕ УСЛУГИ ==================== -->
    <RelatedServicesGrid category="proizvodstvo" />

    <!-- ==================== БЛОК: ПРАЙС-ЛИСТ ==================== -->
    <PriceCategoriesGrid />

    <!-- ==================== БЛОК 8: CTA ==================== -->
    <section id="cta" class="page-section">
      <ApplicationCTA
        title="Получите смету и аудит производственного цеха <span>за 24 часа</span>"
        subtitle="Загрузите план или опишите задачу. Инженер проверит помещение на соответствие требованиям технолога, пожарной безопасности и санитарных норм, найдёт слабые места и подготовит детальный расчёт. Консультация бесплатна."
        phone="+7 (910) 909-69-47"
        telegram="@glavprofii"
        max="https://max.ru/u/f9LHodD0cOLfbBSpAeCwHBcJ83SJtKVj9mVKY7K8OLd6OwYB0gH6g3XE_Cs"
        id-prefix="proizvodstvo-cta"
        :custom-fields="customFields"
        :message-config="messageConfig"
      />
    </section>

    <!-- ==================== БЛОК 7: FAQ ==================== -->
    <section id="faq" class="page-section">
      <FAQBlock
        title="Ответы на <span>частые вопросы</span>"
        :items="faqItems"
        id-prefix="proizvodstvo-faq"
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
  key: 'premises-projects:proizvodstvo',
  categories: getProjectsCategories('proizvodstvo'),
  limit: PROJECTS_LIMIT,
})

// Секции «Фото до/после» и «Проекты» рендерятся только при наличии кейсов:
// пустых блоков и мёртвых пунктов в StickyNav быть не должно
const hasProjects = projects.length > 0
const projectsSubtitle = getProjectsSubtitle('proizvodstvo', ownCount, projects.length)

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

// === Варианты ремонта (специфичные для производства) ===
const repairTypes = [
  { value: 'cosmetic', label: 'Косметический', icon: 'mdi:format-paint' },
  { value: 'capital', label: 'Капитальный', icon: 'mdi:hammer-wrench' },
  { value: 'turnkey', label: 'Под ключ', icon: 'mdi:key-variant' },
  { value: 'clean-room', label: 'Чистые помещения', icon: 'mdi:shield-star-outline' },
]

const repairVariants: RepairVariant[] = [
  {
    title: 'Косметический',
    lead: 'Для действующих цехов, когда нужно обновить покрытие пола, покрасить стены и привести в порядок бытовые помещения без остановки производства.',
    works: [
      'Локальный ремонт промышленных полов',
      'Покраска стен и колонн износостойкими составами',
      'Обновление разметки проездов и рабочих зон',
      'Ремонт бытовых помещений и зон отдыха',
    ],
    duration: 'от 3 недель',
    price: 'от 7 500 ₽/м²',
    icon: 'mdi:format-paint',
  },
  {
    title: 'Капитальный',
    lead: 'Когда цех открывается в новом помещении или требуется полная реконструкция с заменой полов, вентиляции и электроснабжения под оборудование.',
    works: [
      'Демонтаж старых покрытий и инженерных систем',
      'Устройство промышленных полов с виброразвязкой',
      'Монтаж вентиляции с фильтрацией выбросов',
      'Электроснабжение 380В под станки',
      'Зонирование производственных и бытовых зон',
    ],
    duration: 'от 2 месяцев',
    price: 'от 12 000 ₽/м²',
    icon: 'mdi:hammer-wrench',
    featured: true,
    badge: 'Полная реконструкция',
  },
  {
    title: 'Под ключ',
    lead: 'Полный цикл: аудит, ТЗ с технологом, проектирование инженерии, ремонт всех зон, подготовка оснований под оборудование, сдача готового объекта.',
    works: [
      'Аудит объекта и согласование с технологом',
      'Полный цикл ремонтных работ',
      'Фундаменты и анкерные группы под станки',
      'Чистые помещения (при необходимости)',
      'Сдача с исполнительной документацией',
    ],
    duration: 'от 3 месяцев',
    price: 'от 16 000 ₽/м²',
    icon: 'mdi:key-variant',
    badge: 'Под ключ',
  },
]

// === Факторы цены ===
const priceFactors: PriceFactor[] = [
  {
    title: 'Тип производства',
    description: 'Металлообработка, пищевое, химическое, деревообработка, электроника — у каждого свои требования к полам, вентиляции, отделке и санитарным нормам.',
    icon: 'mdi:factory',
  },
  {
    title: 'Нагрузка на полы и вибрации',
    description: 'Вес станков, ударная нагрузка от прессов, вибрация от токарных и фрезерных центров. Промышленные полы М400–М600 с армированием и топпингом, фундаменты с виброразвязкой — отдельные статьи сметы.',
    icon: 'mdi:weight-kilogram',
  },
  {
    title: 'Вентиляция и фильтрация',
    description: 'Местные отсосы над рабочими местами, пылеуловители, скрубберы, угольные адсорберы для химических выбросов, выброс в атмосферу по нормам ПДВ — индивидуальная инженерия под каждый тип производства.',
    icon: 'mdi:air-filter',
  },
  {
    title: 'Электроснабжение',
    description: 'Трёхфазное питание 380В, расчёт мощности под пусковые токи станков, отдельные линии с ИБП для критичного оборудования, медицинское заземление для электроники.',
    icon: 'mdi:transmission-tower',
  },
  {
    title: 'Пожарная категоризация',
    description: 'Категории А, Б, В, Г, Д по СП 12.13130 диктуют разные требования: огнезащитные составы, спринклерные системы, противодымная вентиляция, противопожарные двери.',
    icon: 'mdi:fire-alert',
  },
  {
    title: 'График работ',
    description: 'Ремонт без остановки производства (ночные смены, поэтапная сдача зон, временные маршруты) повышает стоимость человеко-часов.',
    icon: 'mdi:calendar-clock',
  },
]

// === Риски (новый формат для табов) ===
const risksPages: RiskPage[] = [
  {
    id: 'proizvodstva',
    label: 'Производства',
    title: 'Что упускают при ремонте производства — <span>и потом переплачивают</span>',
    subtitle: 'Простой цеха стоит дороже самого ремонта. Вот 6 ошибок, которые мы закрываем на этапе проекта.',
    note: 'Вместе с вашим технологом сверяем проект с паспортами оборудования до начала работ.',
    items: [
      {
        title: 'Полы без расчёта нагрузок',
        risk: 'Трещины под станками, пыль в продукции, рост брака.',
        fix: 'Считаем нагрузки вместе с технологом: бетон М400–М600, двойное армирование, топпинг. Гарантия 3 года.',
      },
      {
        title: 'Нет виброразвязки',
        risk: 'Падает точность станков, разрушается отделка, приходят предписания.',
        fix: 'Для станков с вибрацией делаем отдельные фундаменты с демпферами, анкеры закладываем по паспорту станка.',
      },
      {
        title: 'Покрытия без учёта среды',
        risk: 'Бетон разъедают кислоты и щёлочи, на пищевом производстве могут приостановить выпуск.',
        fix: 'Эпоксидные или полиуретановые полы под ваши реагенты, для пищевых цехов — сертифицированные, для электроники — антистатические.',
      },
      {
        title: 'Вентиляция без местных отсосов',
        risk: 'Пыль и пары копятся в цеху, штрафы до 500 000 ₽.',
        fix: 'Местные отсосы на постах, фильтры под тип выбросов, паспорт системы и расчёт ПДВ.',
      },
      {
        title: 'Электрика без учёта пусковых токов',
        risk: 'Просадки напряжения, ремонт ЧПУ от 300 000 ₽, срыв плана, в худшем случае — пожар.',
        fix: 'Считаем пуск всех станков, даём отдельные линии 380 В на крупное оборудование, ИБП и 30% резерва.',
      },
      {
        title: 'Не определена категория пожарной опасности',
        risk: 'Производство не введут в эксплуатацию. Для категорий А и Б штрафы до 1 млн ₽.',
        fix: 'Определяем категорию на эскизе по СП 12.13130, берём негорючие материалы, проектируем пожаротушение и противодымную вентиляцию.',
      },
    ],
  },
]


// === FAQ ===
const faqItems: FAQItem[] = [
  {
    question: 'Можно ли делать ремонт, если производство продолжает работать?',
    answer: 'Да. Работы проводим поэтапно: изолируем зону ремонта герметичными перегородками, переносим шумные и «грязные» этапы на ночные смены и выходные. Движение техники и логистику организуем по временным маршрутам, чтобы производство не останавливалось.',
  },
  {
    question: 'Как фиксируется смета — не вырастет ли цена в процессе?',
    answer: 'Итоговая стоимость и сроки закрепляются в договоре и не меняются. Любые дополнительные работы оформляются только через официальное дополнительное соглашение с вашим предварительным согласованием. Если в процессе обнаруживаются скрытые дефекты (например, разрушение основания пола) — заранее согласуем решение и стоимость до начала работ.',
  },
  {
    question: 'Делаете ли вы полы под станки с высокой вибрацией и ударной нагрузкой?',
    answer: 'Да. Выполняем промышленные бетонные полы М400–М600 с армированием и топпингом (корунд, кварц), виброразвязку под тяжёлое оборудование, фундаменты под станки с отдельной опалубкой и анкерными группами. Для химической и пищевой промышленности — полимерные наливные покрытия (эпоксидные, полиуретановые) с химстойкостью.',
  },
  {
    question: 'Проектируете ли вы вентиляцию под промышленные выбросы?',
    answer: 'Да. Разрабатываем приточно-вытяжную вентиляцию с местными отсосами над рабочими местами, фильтрами (пылеуловители, скрубберы, угольные адсорберы) и выбросом в атмосферу по нормам ПДВ. Для сварочных постов, окрасочных камер, химических участков — отдельные вытяжные системы с расчётом кратности по СанПиН и ГОСТ.',
  },
  {
    question: 'Какие гарантии на работы?',
    answer: '3 года по договору на все строительно-отделочные работы, включая скрытые дефекты. Если в гарантийный срок что-то потрескается, отслоится покрытие, выйдет из строя вентиляция или потребуется регулировка — приедем и исправим за свой счёт в согласованные сроки, не мешая производству.',
  },
  {
    question: 'Работаете ли вы с чистыми помещениями для фармацевтики и электроники?',
    answer: 'Да. Выполняем чистые помещения классов ISO 5–8 (по ГОСТ ИСО 14644): герметичные ограждающие конструкции, антистатические полы, ламинарные потоки воздуха, HEPA-фильтры, шлюзы и избыточное давление. Передаём валидационную документацию по GMP.',
  },
]

const customFields = [
  {
    name: 'productionType',
    label: 'Тип производства',
    type: 'tiles' as const,
    options: [
      { value: 'metalworking', label: 'Металлообработка', icon: 'mdi:anvil' },
      { value: 'food', label: 'Пищевое', icon: 'mdi:food-apple-outline' },
      { value: 'chemical', label: 'Химическое', icon: 'mdi:flask-outline' },
      { value: 'woodworking', label: 'Деревообработка', icon: 'mdi:tree-outline' },
      { value: 'electronics', label: 'Электроника', icon: 'mdi:chip' },
      { value: 'pharma', label: 'Фармацевтика', icon: 'mdi:pill' },
      { value: 'light-industry', label: 'Лёгкая промышленность', icon: 'mdi:tshirt-crew-outline' },
      { value: 'other', label: 'Другое', icon: 'mdi:dots-horizontal' },
    ],
  },
]

const messageConfig = {
  emoji: '🏭',
  title: 'Заявка на ремонт производства',
  sourceLabel: 'Ремонт производства в Рязани — CTA',
  fieldLabels: { productionType: 'Тип производства' },
}

// === Аналитика ===
const onMiniFormSubmit = (data: unknown) => {
  console.log('[proizvodstvo] Быстрая заявка:', data)
}
</script>

<style lang="scss" scoped>
@use '@/assets/styles/variables' as *;

.page-proizvodstvo {
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