<!-- app/components/pages/public/remontPomescheniy/pageTypes/magaziny/index.vue -->
<template>
  <div class="page-magaziny">
    <!-- ==================== БЛОК 1: HERO ==================== -->
    <PageHero
      title="Ремонт магазинов в Рязани с учётом <span>потоков покупателей</span>, витрин и товарооборота"
      subtitle="Выполняем отделку магазинов, супермаркетов и торговых точек по вашему бренд-буку или проекту. Перед стартом проводим аудит помещения с учётом требований пожарной безопасности, санитарных норм и логистики товара. Сдаём объект в срок, минимизируем простой торговой точки и обеспечиваем готовность к приёмке оборудования. Работаем по ночам, чтобы не останавливать продажи."
    >
      <template #background>
        <BeforeAfterSlider
          before-image="/main/3.jpg"
          after-image="/main/3-1.jpg"
          before-alt="Магазин до ремонта"
          after-alt="Магазин после ремонта"
          :dimming="true"
          :duration="10000"
          :pause-on-hover="false"
          :pause-at-edges="2000"
        />
      </template>

      <template #price>
        <span class="price-main">от 13 000 ₽/м²</span>
        <span class="price-example">100 м²: ~1.3–1.9 млн ₽</span>
        <span class="price-note">В стоимость входят работы без материалов</span>
      </template>

      <template #form>
        <MiniEstimateForm
          room-type="magaziny"
          :default-area="100"
          :repair-types="repairTypes"
          id-prefix="magaziny-mini"
          @submit="onMiniFormSubmit"
        />
      </template>

      <template #triggers>
        <span class="trigger-item">
          <Icon name="mdi:fire-alert" class="trigger-icon" size="18" />
          Знаем СП 118.13330 и требования МЧС для торговых объектов
        </span>
        <span class="trigger-item">
          <Icon name="mdi:clock-fast" class="trigger-icon" size="18" />
          Работаем без остановки торговли — ночные смены, поэтапная сдача
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
            { label: 'Магазины' }
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
        title="Варианты ремонта магазина <span>и от чего зависит цена</span>"
        :variants="repairVariants"
      />

      <PriceFactors
        title="Из чего складывается <span>цена ремонта</span> торгового помещения"
        :factors="priceFactors"
        footer-note="Ориентир по цене: <strong>от 4 500 ₽/м²</strong> для косметического ремонта, <strong>от 11 000 ₽/м²</strong> для капитального. Без стоимости материалов. Точную смету инженер подготовит после бесплатного выезда на объект — это ни к чему вас не обязывает."
      />
    </section>

    <!-- ==================== БЛОК: КАКИЕ РАБОТЫ ВЫПОЛНЯЕМ ==================== -->
    <WorkTypesLinks category="magaziny" />

    <!-- ==================== БЛОК 4: КАЛЬКУЛЯТОР ==================== -->
    <section id="calculator" class="page-section page-section--light">
      <div class="calculator-wrap">
        <header class="calculator-header">
          <h2 class="calculator-title">Калькулятор сметы онлайн</h2>
          <p class="calculator-subtitle">
            Рассчитайте предварительную стоимость ремонта вашего магазина за 1 минуту.
            Введите площадь, формат торговли и тип ремонта — получите ориентировочную смету.
            Точный расчёт — после бесплатного выезда инженера с аудитом помещения.
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
        title="Наши реализованные проекты <span>магазинов и торговых помещений в Рязани</span>"
        :subtitle="projectsSubtitle"
        :projects="projects"
      />
    </section>

    <!-- ==================== БЛОК: ПОХОЖИЕ УСЛУГИ ==================== -->
    <RelatedServicesGrid category="magaziny" />

    <!-- ==================== БЛОК: ПРАЙС-ЛИСТ ==================== -->
    <PriceCategoriesGrid />

    <!-- ==================== БЛОК 8: CTA ==================== -->
    <section id="cta" class="page-section">
      <ApplicationCTA
        title="Получите смету и аудит торгового помещения <span>за 24 часа</span>"
        subtitle="Загрузите план или опишите задачу. Инженер проверит помещение на соответствие требованиям МЧС и санитарных норм, найдёт слабые места и подготовит детальный расчёт. Консультация бесплатна."
        phone="+7 (910) 909-69-47"
        telegram="@glavprofii"
        max="https://max.ru/u/f9LHodD0cOLfbBSpAeCwHBcJ83SJtKVj9mVKY7K8OLd6OwYB0gH6g3XE_Cs"
        id-prefix="magaziny-cta"
        :custom-fields="customFields"
        :message-config="messageConfig"
      />
    </section>

    <!-- ==================== БЛОК 7: FAQ ==================== -->
    <section id="faq" class="page-section">
      <FAQBlock
        title="Ответы на <span>частые вопросы</span>"
        :items="faqItems"
        id-prefix="magaziny-faq"
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
  key: 'premises-projects:magaziny',
  categories: getProjectsCategories('magaziny'),
  limit: PROJECTS_LIMIT,
})

// Секции «Фото до/после» и «Проекты» рендерятся только при наличии кейсов:
// пустых блоков и мёртвых пунктов в StickyNav быть не должно
const hasProjects = projects.length > 0
const projectsSubtitle = getProjectsSubtitle('magaziny', ownCount, projects.length)

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

// === Варианты ремонта (специфичные для магазинов) ===
const repairTypes = [
  { value: 'cosmetic', label: 'Косметический', icon: 'mdi:format-paint' },
  { value: 'capital', label: 'Капитальный', icon: 'mdi:hammer-wrench' },
  { value: 'turnkey', label: 'Под ключ', icon: 'mdi:key-variant' },
  { value: 'retail-chain', label: 'Сетевой магазин', icon: 'mdi:store-24-hour' },
]

const repairVariants: RepairVariant[] = [
  {
    title: 'Косметический',
    lead: 'Для действующих магазинов, когда нужно обновить интерьер без перепланировки и замены перегородок.',
    works: [
      'Покраска стен и потолков',
      'Замена напольного покрытия (керамогранит, коммерческий линолеум)',
      'Обновление витринных зон и прикассовой территории',
      'Мелкий ремонт торгового зала',
    ],
    duration: 'от 2 недель',
    price: 'от 4 500 ₽/м²',
    icon: 'mdi:format-paint',
  },
  {
    title: 'Капитальный',
    lead: 'Когда магазин открывается в новом помещении или требуется полная реконструкция с изменением зонирования.',
    works: [
      'Полная замена отделки всех помещений',
      'Перепланировка с зонированием торгового зала, склада, подсобки',
      'Монтаж перегородок и витринных конструкций',
      'Черновые и чистовые работы',
      'Подготовка оснований под торговое и холодильное оборудование',
    ],
    duration: 'от 1,5 месяцев',
    price: 'от 13 000 ₽/м²',
    icon: 'mdi:hammer-wrench',
    featured: true,
    badge: 'Полная реконструкция',
  },
  {
    title: 'Под ключ',
    lead: 'Полный цикл: помощь с формированием ТЗ, ремонт всех помещений, зонирование с учётом потоков покупателей, сдача готового объекта.',
    works: [
      'Аудит объекта и помощь с техническим заданием',
      'Полный цикл ремонтных работ',
      'Зонирование с учётом потоков покупателей и выкладки товара',
      'Отделка с применением износостойких и антивандальных материалов',
      'Работа с соблюдением графика торговой точки',
    ],
    duration: 'от 2 месяцев',
    price: 'от 16 000 ₽/м²',
    icon: 'mdi:key-variant',
    badge: 'Под ключ',
  },
]

// === Факторы цены ===
const priceFactors: PriceFactor[] = [
  {
    title: 'Проходимость и износостойкость',
    description: 'Торговые залы с высокой проходимостью требуют коммерческого керамогранита класса PEI IV–V и антивандальных материалов — это дороже, но служит в 3–4 раза дольше.',
    icon: 'mdi:walk',
  },
  {
    title: 'Вывески и наружная реклама',
    description: 'Монтаж световых коробов, козырьков, входных групп с подсветкой — отдельные статьи сметы с согласованием в администрации.',
    icon: 'mdi:sign-direction',
  },
  {
    title: 'Торговое и холодильное оборудование',
    description: 'Подготовка оснований, подвод электрики, воды, канализации и вентиляции под холодильники, печи, кофемашины и кассовые зоны — индивидуальная инженерия под каждый тип оборудования.',
    icon: 'mdi:fridge-industrial-outline',
  },
  {
    title: 'Состояние помещения',
    description: '«Бетон» или старая отделка требуют разного объёма подготовки: стяжка, штукатурка, выравнивание, усиление проёмов под витрины.',
    icon: 'mdi:wall',
  },
  {
    title: 'График работ',
    description: 'Ремонт без остановки торговли (ночные смены, поэтапная сдача зон) повышает стоимость человеко-часов.',
    icon: 'mdi:calendar-clock',
  },
  {
    title: 'Требования пожарной безопасности',
    description: 'Ширина эвакуационных проходов, огнестойкие отделочные материалы, противодымная вентиляция — всё это проектируется и согласуется до начала работ.',
    icon: 'mdi:fire-alert',
  },
]

// === Риски (новый формат для табов) ===
const risksPages: RiskPage[] = [
  {
    id: 'magaziny',
    label: 'Магазины',
    title: 'Что упускают при ремонте магазина — <span>и потом переплачивают</span>',
    subtitle: 'Каждая неделя простоя — это потерянная выручка. Вот 6 ошибок, которые мы закрываем до старта.',
    note: 'Цель — открыться в срок и не переделывать зал после первых покупателей.',
    items: [
      {
        title: 'Планировка без учёта потоков',
        risk: 'Узкие проходы, очереди на кассе, товар не успевает на полки.',
        fix: 'Разводим «путь покупателя» и «путь товара», проходы делаем по СП 118.13330, склад изолируем от зала.',
      },
      {
        title: 'Бытовые полы вместо коммерческих',
        risk: 'Трескаются за 3–4 месяца, ремонт — с закрытием магазина на 2–3 недели.',
        fix: 'Коммерческий керамогранит PEI IV–V или антистатический линолеум, герметичные швы. Гарантия 3 года.',
      },
      {
        title: 'Пожарные требования согласуют после ремонта',
        risk: 'Магазин не откроют или выдадут предписание, переделка дороже проекта.',
        fix: 'Собираем требования МЧС на эскизе, проверяем проходы и эвакуацию, берём только сертифицированные материалы.',
      },
      {
        title: 'Нет выводов под оборудование',
        risk: 'Не хватает мощности, воды или слива, торговля стоит 3–5 дней.',
        fix: 'Согласуем спецификацию оборудования и делаем выводы под каждую точку, 30% резерва в щите.',
      },
      {
        title: 'Свет не под товар',
        risk: 'Товар выглядит блёклым, покупатели проходят мимо витрин.',
        fix: 'Подбираем спектр и CRI под товар, делаем акцентную подсветку и раздельные сценарии.',
      },
      {
        title: 'Меняют решения по ходу ремонта',
        risk: 'Ломаются готовые участки, открытие откладывается на недели.',
        fix: 'Расстановку и габариты фиксируем в договоре, изменения — через допсоглашение.',
      },
    ],
  },
]


// === FAQ ===
const faqItems: FAQItem[] = [
  {
    question: 'Можно ли делать ремонт, если магазин продолжает работать?',
    answer: 'Да. Шумные и «грязные» работы (демонтаж, штробление, стяжка) переносим на ночные смены и выходные. Днём — тихие этапы: покраска, монтаж, сборка. Зоны работ изолируем временными перегородками, чтобы покупатели и персонал не контактировали со стройкой.',
  },
  {
    question: 'Как фиксируется смета — не вырастет ли цена в процессе?',
    answer: 'Итоговая стоимость закрепляется в договоре и не меняется. Любые дополнительные работы оформляются только через официальное дополнительное соглашение с вашим предварительным согласованием. Если в процессе обнаруживаются скрытые дефекты — заранее согласуем решение и стоимость до начала работ.',
  },
  {
    question: 'Учитываете ли требования пожарной безопасности и санитарных норм?',
    answer: 'Да. На этапе аудита проверяем ширину эвакуационных проходов, класс огнестойкости отделочных материалов, планировку выходов и требования СанПиН для продовольственных магазинов. Все материалы закупаем с сертификатами пожарной и санитарной безопасности.',
  },
  {
    question: 'Кто закупает материалы — вы или мы?',
    answer: 'Как удобнее вам. Можете купить сами по своей спецификации — мы просто монтируем. Или доверите закупку нам: возьмём на себя логистику, проверим сертификаты соответствия для торговых объектов и предоставим все документы.',
  },
  {
    question: 'Какие гарантии на работы?',
    answer: '3 года по договору на все строительно-отделочные работы, включая скрытые дефекты. Если в гарантийный срок что-то отклеится, потрескается или потребует регулировки — приедем и исправим за свой счёт в согласованные сроки, не мешая торговле.',
  },
  {
    question: 'Работаете ли вы с сетевыми ритейлерами и их бренд-буками?',
    answer: 'Да. Работали с федеральными и региональными сетями: знаем требования к фирменным материалам, цветовой палитре, навигации, витринным конструкциям и зонам самообслуживания. Соблюдаем бренд-бук и проходим внутреннюю приёмку службы эксплуатации ритейлера.',
  },
]

const customFields = [
  {
    name: 'retailFormat',
    label: 'Формат торговли',
    type: 'tiles' as const,
    options: [
      { value: 'grocery', label: 'Продуктовый', icon: 'mdi:shopping-outline' },
      { value: 'clothing', label: 'Одежда и обувь', icon: 'mdi:tshirt-crew-outline' },
      { value: 'electronics', label: 'Электроника', icon: 'mdi:cellphone' },
      { value: 'cosmetics', label: 'Косметика', icon: 'mdi:lipstick' },
      { value: 'supermarket', label: 'Супермаркет', icon: 'mdi:cart-outline' },
      { value: 'other', label: 'Другое', icon: 'mdi:dots-horizontal' },
    ],
  },
]

const messageConfig = {
  emoji: '🛒',
  title: 'Заявка на ремонт магазина',
  sourceLabel: 'Ремонт магазинов в Рязани — CTA',
  fieldLabels: { retailFormat: 'Формат торговли' },
}

// === Аналитика ===
const onMiniFormSubmit = (data: unknown) => {
  console.log('[magaziny] Быстрая заявка:', data)
}
</script>

<style lang="scss" scoped>
@use '@/assets/styles/variables' as *;

.page-magaziny {
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