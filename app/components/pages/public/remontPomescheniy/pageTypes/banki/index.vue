<!-- app/components/pages/public/remontPomescheniy/pageTypes/banki/index.vue -->
<template>
  <div class="page-banki">
    <!-- ==================== БЛОК 1: HERO ==================== -->
    <PageHero
      title="Ремонт банков и банковских отделений в Рязани: под стандарты <span>ЦБ, безопасность</span> и бренд"
      subtitle="Выполняем отделку банковских помещений по вашему ТЗ или проекту. Перед стартом проводим детальный аудит объекта: если проектное решение конфликтует с реальным состоянием конструкций или строительными нормативами — аргументированно сообщаем об этом до начала работ и находим решение, чтобы вы не переплачивали. Сдаем объекты в срок, минимизируем простой отделения и обеспечиваем полную конфиденциальность на всех этапах."
    >
      <template #background>
        <BeforeAfterSlider
          before-image="/main/1.jpg"
          after-image="/main/1-1.jpg"
          before-alt="Банк до ремонта"
          after-alt="Банк после ремонта"
          :dimming="true"
          :duration="10000"
          :pause-on-hover="false"
          :pause-at-edges="2000"
        />
      </template>

      <template #price>
        <span class="price-main">от 14 000 ₽/м²</span>
        <span class="price-example">100 м²: ~1.4–2.0 млн ₽</span>
        <span class="price-note">В стоимость входят работы без материалов</span>
      </template>

      <template #form>
        <MiniEstimateForm
          room-type="banki"
          :default-area="100"
          :repair-types="repairTypes"
          id-prefix="banki-mini"
          @submit="onMiniFormSubmit"
        />
      </template>

      <template #triggers>
        <span class="trigger-item">
          <Icon name="mdi:shield-lock-outline" class="trigger-icon" size="18" />
          Соблюдаем ГОСТ, СНиП и стандарты ЦБ РФ
        </span>
        <span class="trigger-item">
          <Icon name="mdi:clock-fast" class="trigger-icon" size="18" />
          Работаем без остановки обслуживания клиентов
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
            { label: 'Банки' }
          ]"
        />
      </template>
      <template #nav>
        <StickyNav :items="navItems" :scroll-offset="110" label="На странице" />
      </template>
    </NavBreadcrumbsRow>

    <!-- ==================== 2. ДО / ПОСЛЕ ==================== -->
    <section id="before-after" class="page-section">
      <BeforeAfterShowcase
        title="Примеры объектов <span>до и после</span>"
        subtitle="Фотографии с реальных объектов в Рязани."
        :items="beforeAfterItems"
        :auto-switch-after-passes="4"
      />
    </section>

    <!-- ==================== БЛОК 3: ВАРИАНТЫ РЕМОНТА ==================== -->
    <section id="repair-types" class="page-section">
      <RepairTypes
        title="Варианты ремонта банковского помещения <span>и от чего зависит цена</span>"
        :variants="repairVariants"
      />

      <PriceFactors
        title="Из чего складывается <span>цена ремонта</span> банковского помещения"
        :factors="priceFactors"
        footer-note="Ориентир по цене: <strong>от 8 500 ₽/м²</strong> для косметического ремонта, <strong>от 14 000 ₽/м²</strong> для капитального. Без стоимости материалов. Точную смету инженер подготовит после бесплатного выезда на объект — это ни к чему вас не обязывает."
      />
    </section>

    <!-- ==================== БЛОК: КАКИЕ РАБОТЫ ВЫПОЛНЯЕМ ==================== -->
    <WorkTypesLinks category="banki" />

    <!-- ==================== БЛОК 4: КАЛЬКУЛЯТОР ==================== -->
    <section id="calculator" class="page-section page-section--light">
      <div class="calculator-wrap">
        <header class="calculator-header">
          <h2 class="calculator-title">Калькулятор сметы онлайн</h2>
          <p class="calculator-subtitle">
            Рассчитайте предварительную стоимость ремонта вашего банка за 1 минуту.
            Введите площадь, тип объекта и вид ремонта — получите ориентировочную смету.
            Точный расчёт — после бесплатного выезда инженера с аудитом требований безопасности.
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

    <section v-if="hasProjects" id="before-after-gallery" class="page-section">
      <BeforeAfterGallery
        :projects="projects"
        title="Фото банков <span>до и после</span> ремонта"
      />
    </section>

    <section id="brands" class="page-section">
      <PagesPublicHomePageBrands />
    </section>

    <!-- ==================== БЛОК 6: ПРОЕКТЫ ==================== -->
    <section v-if="hasProjects" id="projects" class="page-section">
      <ProjectsShowcase
        title="Наши реализованные проекты <span>банковских отделений в Рязани</span>"
        :subtitle="projectsSubtitle"
        :projects="projects"
      />
    </section>

    <!-- ==================== БЛОК: ПОХОЖИЕ УСЛУГИ ==================== -->
    <RelatedServicesGrid category="banki" />

    <!-- ==================== БЛОК: ПРАЙС-ЛИСТ ==================== -->
    <PriceCategoriesGrid />

    <!-- ==================== БЛОК 8: CTA ==================== -->
    <section id="cta" class="page-section">
      <ApplicationCTA
        title="Получите смету и аудит на соответствие стандартам ЦБ <span>за 24 часа</span>"
        subtitle="Загрузите план или опишите задачу. Инженер проверит помещение на соответствие требованиям безопасности, найдёт слабые места и подготовит детальный расчёт. Консультация бесплатна."
        phone="+7 (910) 909-69-47"
        telegram="@glavprofii"
        max="https://max.ru/u/f9LHodD0cOLfbBSpAeCwHBcJ83SJtKVj9mVKY7K8OLd6OwYB0gH6g3XE_Cs"
        id-prefix="banki-cta"
        :custom-fields="customFields"
        :message-config="messageConfig"
      />
    </section>

    <!-- ==================== БЛОК 7: FAQ ==================== -->
    <section id="faq" class="page-section">
      <FAQBlock
        title="Ответы на <span>частые вопросы</span>"
        :items="faqItems"
        id-prefix="banki-faq"
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
import BeforeAfterShowcase from '../../workTypes/ui/BeforeAfterShowcase.vue'

// === Типы данных ===
import type { RepairVariant } from '../ui/RepairTypes.vue'
import type { RiskPage } from '../ui/RisksSection.vue'
import type { PriceFactor, FAQItem, StickyNavItem } from '../../ui/types'

// === Проекты (SSR: карточки попадают в HTML, фильтр по категории — на сервере) ===
const { projects, ownCount } = await usePortfolioProjects({
  key: 'premises-projects:banki',
  categories: getProjectsCategories('banki'),
  limit: PROJECTS_LIMIT,
})

// Секции «Фото до/после» и «Проекты» рендерятся только при наличии кейсов:
// пустых блоков и мёртвых пунктов в StickyNav быть не должно
const hasProjects = projects.length > 0
const projectsSubtitle = getProjectsSubtitle('banki', ownCount, projects.length)

// === Навигация ===
const navItems: StickyNavItem[] = [
  { id: 'repair-types', label: 'Варианты ремонта', icon: 'mdi:format-paint' },
  { id: 'works', label: 'Виды работ', icon: 'mdi:hammer-screwdriver' },
  { id: 'calculator', label: 'Калькулятор сметы', icon: 'mdi:calculator' },
  { id: 'risks', label: 'Риски', icon: 'mdi:alert-circle-outline' },
  { id: 'before-after', label: 'Фото до/после', icon: 'mdi:image-multiple-outline' },
  ...(hasProjects ? [{ id: 'projects', label: 'Проекты', icon: 'mdi:briefcase-outline' }] : []),
  { id: 'cta', label: 'Оставить заявку', icon: 'mdi:send-outline' },
  { id: 'faq', label: 'Вопросы', icon: 'mdi:help-circle-outline' },
]

// ============================================================
// ДО / ПОСЛЕ
// ============================================================
const beforeAfterItems = [
  { beforeImage: '/main/1-1.jpg', afterImage: '/main/1.jpg' },
  { beforeImage: '/main/remont-pomescheniy/banki/2-1.webp', afterImage: '/main/remont-pomescheniy/banki/2.webp' },
  { beforeImage: '/main/remont-pomescheniy/banki/3-1.webp', afterImage: '/main/remont-pomescheniy/banki/3.webp' },
  { beforeImage: '/main/remont-pomescheniy/banki/4-1.webp', afterImage: '/main/remont-pomescheniy/banki/4.webp' },
]

// === Варианты ремонта (специфичные для банков) ===
const repairTypes = [
  { value: 'cosmetic', label: 'Косметический', icon: 'mdi:format-paint' },
  { value: 'capital', label: 'Капитальный', icon: 'mdi:hammer-wrench' },
  { value: 'turnkey', label: 'Под ключ', icon: 'mdi:key-variant' },
  { value: 'zones', label: 'Отдельных зон', icon: 'mdi:view-grid-outline' },
]

const repairVariants: RepairVariant[] = [
  {
    title: 'Косметический',
    lead: 'Для действующих отделений, когда нужно обновить интерьер клиентской зоны и кабинетов без перепланировки и замены перегородок.',
    works: [
      'Покраска стен и потолков',
      'Замена напольного покрытия (керамогранит, коммерческий линолеум)',
      'Обновление отделки клиентского зала',
      'Мелкий ремонт',
    ],
    duration: 'от 2 недель',
    price: 'от 8 500 ₽/м²',
    icon: 'mdi:format-paint',
  },
  {
    title: 'Капитальный',
    lead: 'Когда отделение открывается в новом помещении или требуется полная реконструкция с изменением зонирования или усилением безопасности.',
    works: [
      'Полная замена отделки всех помещений',
      'Перепланировка с зонированием на клиентскую и служебную зоны',
      'Монтаж перегородок',
      'Черновые и чистовые работы',
      'Подготовка проёмов, закладных и технологических ниш под оборудование и системы безопасности',
    ],
    duration: 'от 1,5 месяцев',
    price: 'от 14 000 ₽/м²',
    icon: 'mdi:hammer-wrench',
    featured: true,
    badge: 'Полная реконструкция',
  },
  {
    title: 'Под ключ',
    lead: 'Полный цикл: помощь с формированием ТЗ, ремонт всех помещений, зонирование с учетом требований к конфиденциальности, сдача готового объекта.',
    works: [
      'Аудит объекта и помощь с техническим заданием',
      'Полный цикл ремонтных работ',
      'Зонирование с повышенной звукоизоляцией',
      'Отделка с применением износостойких и антивандальных материалов',
      'Работа с соблюдением пропускного режима и графика отделения',
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
    title: 'Класс защиты помещений',
    description: 'Кассовый узел, хранилище и зона инкассации требуют бронепанелей, усиленных перекрытий, специальных дверей и окон — это отдельные статьи сметы.',
    icon: 'mdi:shield-lock-outline',
  },
  {
    title: 'Соблюдение бренд-бука',
    description: 'Точная цветовая палитра, фирменные материалы, навигация, стойки и зоны самообслуживания увеличивают объём проектных и отделочных работ.',
    icon: 'mdi:palette-outline',
  },
  {
    title: 'Состояние помещения',
    description: '«Бетон» или старая отделка требуют большего объёма подготовки: стяжка, штукатурка, выравнивание, усиление проёмов.',
    icon: 'mdi:wall',
  },
  {
    title: 'График работ',
    description: 'Ремонт без остановки отделения (ночные смены, поэтапная сдача зон) повышает стоимость человеко-часов.',
    icon: 'mdi:calendar-clock',
  },
]

// === Риски (новый формат для табов) ===
const risksPages: RiskPage[] = [
  {
    id: 'banki',
    label: 'Банки',
    title: 'Что упускают при ремонте банка — <span>и потом переплачивают</span>',
    subtitle: 'Банк — не офис и не магазин. Вот 5 ошибок, которые мы закрываем ещё до начала работ.',
    note: 'В банке ошибка стоит дороже: на кону безопасность и бесперебойная работа отделения.',
    items: [
      {
        title: 'Нет чёткого ТЗ по зонированию',
        risk: 'Не хватает места под оборудование, планировку приходится переделывать.',
        fix: 'Фиксируем зоны, маршруты и нормативы ЦБ в ТЗ до сметы.',
      },
      {
        title: 'Материалы выбирают только по цене',
        risk: 'Покрытие в кассовой зоне и коридорах изнашивается за полгода.',
        fix: 'Подбираем под нагрузку и уборку, считаем стоимость владения, а не только покупки.',
      },
      {
        title: 'Не учитывают график отделения',
        risk: 'Либо ночные смены по повышенной цене, либо простой и потеря выручки.',
        fix: 'Считаем смету для трёх сценариев: дневной, ночной, поэтапный. Вы выбираете осознанно.',
      },
      {
        title: 'Требования СБ согласуют после ремонта',
        risk: 'Планировка не проходит приёмку, перегородки и полы переделывают.',
        fix: 'Собираем требования ЦБ, СБ, ИТ и страховой на этапе эскиза и согласуем проект до стройки.',
      },
      {
        title: 'Меняют решения по ходу работ',
        risk: 'Ломаются смежные этапы, растут сроки и смета.',
        fix: 'Ключевые параметры фиксируем в договоре, изменения — допсоглашением с расчётом сроков и цены.',
      },
    ],
  },
]


// === FAQ ===
const faqItems: FAQItem[] = [
  {
    question: 'Можно ли проводить ремонт, если отделение продолжает работать?',
    answer: 'Да. Мы разрабатываем поэтапный план работ или переносим шумные и «грязные» этапы на ночные смены и выходные дни. На время работ возводим временные пыле- и шумозащитные перегородки, чтобы не мешать обслуживанию клиентов и работе сотрудников.',
  },
  {
    question: 'Как фиксируется смета? Может ли цена вырасти в процессе?',
    answer: 'Итоговая стоимость и сроки закрепляются в договоре и не меняются. Любые дополнительные работы (если они возникают по инициативе заказчика или из-за скрытых дефектов, выявленных при демонтаже) оформляются только через официальное дополнительное соглашение с вашим предварительным согласованием.',
  },
  {
    question: 'Учитываете ли вы требования службы безопасности и нормативы при ремонте?',
    answer: 'Да. На этапе аудита мы собираем все технические требования (включая внутренние регламенты банка, нормы ЦБ и Росгвардии) и закладываем их в смету. Мы готовим проёмы, усиления и технологические ниши под монтаж специализированного оборудования, которое впоследствии устанавливают профильные подрядчики.',
  },
  {
    question: 'Кто занимается закупкой черновых и чистовых материалов?',
    answer: 'Как вам удобнее. Мы можем взять закупку на себя (с предоставлением всех сертификатов соответствия, паспортов безопасности и чеков), либо работать с давальческими материалами, которые предоставляет заказчик. В любом случае мы проверяем их соответствие техническому заданию и нормам пожарной безопасности.',
  },
  {
    question: 'Какую гарантию вы предоставляете на выполненные работы?',
    answer: 'Мы даем гарантию 3 года по договору на все выполненные строительно-отделочные работы, включая скрытые дефекты. В случае выявления недостатков в гарантийный срок мы устраняем их своими силами и за свой счет в оговоренные сроки, не мешая работе отделения.',
  },
  {
    question: 'Предоставляете ли вы полный пакет закрывающих документов для бухгалтерии?',
    answer: 'Обязательно. Мы работаем официально с юридическими лицами (с НДС или без). По завершении этапов или всего объекта предоставляем акты формы КС-2, КС-3, исполнительную документацию и все необходимые сертификаты на использованные материалы.',
  },
]

const customFields = [
  {
    name: 'objectType',
    label: 'Тип объекта',
    type: 'tiles' as const,
    options: [
      { value: 'branch', label: 'Отделение', icon: 'mdi:bank' },
      { value: 'office', label: 'Офис банка', icon: 'mdi:office-building' },
      { value: 'cash-center', label: 'Кассовый центр', icon: 'mdi:cash-register' },
      { value: 'other', label: 'Другое', icon: 'mdi:dots-horizontal' },
    ],
  },
]

const messageConfig = {
  emoji: '🏦',
  title: 'Заявка на ремонт банка',
  sourceLabel: 'Ремонт банков в Рязани — CTA',
  fieldLabels: { objectType: 'Тип объекта' },
}

// === Аналитика ===
const onMiniFormSubmit = (data: unknown) => {
  console.log('[banki] Быстрая заявка:', data)
}
</script>

<style lang="scss" scoped>
@use '@/assets/styles/variables' as *;

.page-banki {
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