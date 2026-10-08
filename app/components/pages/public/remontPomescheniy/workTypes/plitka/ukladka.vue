<!-- app/components/pages/public/remontPomescheniy/workTypes/plitka/ukladka.vue -->
<template>
  <div class="page-ukladka-plitki">
    <!-- ==================== 1. ШАПКА СТРАНИЦЫ ==================== -->
    <HeaderType
      title="Укладка <span>плитки</span>"
      subtitle="Пол, стены и ступени: от стяжки и гидроизоляции до ровных швов. Покрытие, которое не боится воды, нагрузок и времени."
    />

    <!-- ==================== 2. ХЛЕБНЫЕ КРОШКИ + STICKYNAV ==================== -->
    <NavBreadcrumbsRow>
      <template #breadcrumbs>
        <Breadcrumbs :items="breadcrumbItems" />
      </template>
      <template #nav>
        <StickyNav :items="navItems" :scroll-offset="110" label="На странице" />
      </template>
    </NavBreadcrumbsRow>

    <!-- ==================== 3. ДО / ПОСЛЕ ==================== -->
    <section id="before-after" class="page-section">
      <BeforeAfterShowcase
        title="Примеры <span>до и после</span> укладки плитки"
        subtitle="Фотографии с реальных объектов в Рязани."
        :items="beforeAfterItems"
      />
    </section>

    <!-- ==================== 4. КАЛЬКУЛЯТОР (Поднят выше для конверсии) ==================== -->
    <section id="calculator" class="page-section page-section--light">
      <PriceCalculatorTabs
        title="Калькулятор <span>стоимости</span> укладки плитки"
        subtitle="Выберите поверхность и площадь — получите предварительную смету сразу."
        :tabs="calculatorTabs"
        :loading="pricePending"
        :default-area="15"
        @order-estimate="scrollToCta"
      />
    </section>

    <!-- ==================== 5. ПРЕДПРОСМОТР ЦЕН ==================== -->
    <section id="price-list" class="page-section">
      <PriceListTable
        title="Полный прайс: <span>плиточные работы</span>"
        subtitle="Демонтаж, подготовка основания, укладка, резка, затирка швов. Точная смета — после бесплатного замера."
        :sub-category-ids="[226, 257, 258, 259, 260, 261, 262, 263, 264, 368]"
        footer-note="* Цены указаны за работу без учёта стоимости материалов. Доплаты отмечены знаком «+ к цене». Резка по шаблону и отверстия считаются отдельно."
      />
    </section>

    <!-- ==================== 6. ФАКТОРЫ ЦЕНЫ ==================== -->
    <section id="price-factors" class="page-section page-section--light">
      <PriceFactors
        title="Что <span>влияет на итоговую цену</span>"
        :factors="priceFactors"
        footer-note="Точную смету инженер составит после бесплатного выезда на объект. Это ни к чему не обязывает."
      />
    </section>

    <!-- ==================== 7. ОПИСАНИЕ КАТЕГОРИИ ==================== -->
    <section id="overview" class="page-section">
      <WorkTypeOverview
        title="Почему плитка — <span>лучшее покрытие</span> для влажных и проходных зон"
        description="Плитка и керамогранит не боятся воды, жира, химии и проходной нагрузки. Поэтому их укладывают там, где другие покрытия не живут: санузлы, кухни, магазины, клиники, пищевые производства."
        :advantages="categoryAdvantages"
      >
        <template #details>
          <p>
            Плитка работает только на <span class="blue">ровном и прочном основании</span>.
            На буграх клей сохнет неравномерно, и плитка трескается под нагрузкой.
            Поэтому работу мы начинаем не с укладки, а с проверки основания:
            стяжка, штукатурка, гидроизоляция.
          </p>
          <p>
            На пол выбираем <span class="blue">керамогранит</span>: он выдерживает тележки,
            каблуки и влажную уборку. На стены — керамическую плитку: она легче
            и проще режется. Для душевых, бассейнов и криволинейных поверхностей — мозаику.
          </p>
          <p>
            Укладка плитки — финальный этап. Перед ним мы готовим основание:
            <NuxtLink to="/vidy-rabot/shtukaturka-sten">штукатурим стены</NuxtLink>,
            выравниваем пол и делаем гидроизоляцию во влажных зонах.
            Всё это берём на себя — вы получаете готовое к использованию покрытие.
          </p>
        </template>
      </WorkTypeOverview>
    </section>

    <!-- ==================== 8. СРАВНЕНИЕ МЕТОДОВ ==================== -->
    <section id="methods" class="page-section page-section--light">
      <MethodComparison
        title="Что укладываем: <span>пол, стены или крупноформат?</span>"
        subtitle="У каждого типа плитки свои задачи, основание и клей. Разберёмся, чтобы вы не переплачивали."
        :methods="comparisonMethods"
        :price-data="sections"
        summary="Для пола магазина, офиса или санузла — <strong>керамогранит 60×60</strong>: он держит нагрузку и мойку. Для стен — <strong>керамика 40×40</strong>. Для дизайнерских проектов — <strong>крупноформат с ректифицированной кромкой</strong>. Подобрать формат и клей инженер поможет на бесплатном замере."
      />
    </section>

    <!-- ==================== 9. INLINE CTA (Быстрый захват лида) ==================== -->
    <section id="quick-cta" class="page-section">
      <InlineCta
        title="Не знаете, какая плитка и основание <span>подойдут вашему помещению?</span>"
        subtitle="Оставьте номер — инженер перезвонит за 15 минут, обсудит задачу и поможет выбрать оптимальный вариант."
        submit-text="Получить консультацию"
        :message-config="{
          emoji: '📞',
          title: 'Быстрая заявка на консультацию',
          sourceLabel: 'Inline CTA — укладка плитки',
        }"
        id-prefix="quick-cta-plitka"
      />
    </section>

    <!-- ==================== 10. ТИПЫ МАТЕРИАЛОВ ==================== -->
    <section id="materials" class="page-section page-section--light">
      <MaterialsGuide
        title="Какую <span>плитку</span> выбрать: керамика, керамогранит, мозаика или клинкер?"
        subtitle="Они похожи внешне, но отличаются прочностью и назначением. Рассказываем, где какая работает."
        :materials="plitkaMaterials"
        :thicknesses="plitkaThicknesses"
        summary="На стены — <strong>керамика</strong>. На пол магазина или санузла — <strong>керамогранит 8–10 мм</strong>. На ступени и улицу — <strong>клинкер</strong>. Для бассейнов и криволинейных форм — <strong>мозаика</strong>. Точный формат и клей инженер посчитает на бесплатном замере."
      />
    </section>

    <!-- ==================== 11. ТЕХНИЧЕСКИЕ НЮАНСЫ (Без дублирующей таблицы) ==================== -->
    <section id="insights" class="page-section">
      <TechnicalInsights
        title="Что важно знать <span>до укладки</span> плитки"
        subtitle="Четыре правила, которые определяют, прослужит плитка 20 лет или треснет через год."
        :insights="technicalInsights"
        :comparison-images="[
          {
            src: '/main/5.jpg',
            label: 'Основание: стяжка и гидроизоляция',
            alt: 'Подготовленное основание под укладку плитки',
          },
          {
            src: '/main/6.jpg',
            label: 'Результат: плитка с ровными швами',
            alt: 'Готовое плиточное покрытие с затёртыми швами',
          },
        ]"
        :summary="insightsSummary"
      />
    </section>

    <!-- ==================== 12. ГАРАНТИИ ==================== -->
    <section id="guarantees" class="page-section page-section--light">
      <GuaranteesGrid title="Наши <span>гарантии</span>" :items="guarantees" />
    </section>

    <!-- ==================== 13. ЭТАПЫ РАБОТ ==================== -->
    <section id="stages" class="page-section">
      <WorkStagesTimeline
        title="Как <span>мы работаем</span>: 6 этапов"
        subtitle="От демонтажа старой плитки до ровных швов и гарантийного талона"
        :stages="workStages"
      />
    </section>

    <!-- ==================== 14. FAQ ==================== -->
    <section id="faq" class="page-section page-section--light">
      <FAQBlock
        title="Ответы на <span>частые вопросы</span>"
        :items="faqItems"
        id-prefix="ukladka-plitki-faq"
      />
    </section>

    <!-- ==================== 15. ПОРТФОЛИО ==================== -->
    <section id="portfolio" class="page-section">
      <BeforeAfterGallery
        title="Наши работы: <span>укладка плитки</span>"
        :slugs="projectSlugs"
      />
    </section>

    <!-- ==================== 16. ПРОЕКТЫ ==================== -->
    <section id="projects" class="page-section page-section--light">
      <ProjectsShowcase
        title="Наши реализованные проекты <span>для бизнеса в Рязани</span>"
        :slugs="projectSlugs"
      />
    </section>

    <!-- ==================== 17. CTA ==================== -->
    <section id="cta" class="page-section">
      <ApplicationCTA
        title="Рассчитайте <span>точную стоимость</span> плиточных работ"
        subtitle="Оставьте заявку — инженер бесплатно приедет на замер, проверит основание и посчитает плитку с запасом."
        phone="+7 (910) 909-69-47"
        telegram="@glavprofii"
        id-prefix="ukladka-plitki-cta"
        :custom-fields="customFields"
        :message-config="messageConfig"
      />
    </section>

    <!-- ==================== 18. ДРУГИЕ РАБОТЫ ГРУППЫ ==================== -->
    <section id="related" class="page-section page-section--light">
      <RelatedWorkTypes
        title="Другие работы <span>по плитке</span>"
        subtitle="Каждый вид — на отдельной странице с ценами и калькулятором."
        :items="relatedPlitkaWorkTypes"
        :price-data="sections"
      />
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'nuxt/app'

// === Данные из shared (общие для группы «Плитка») ===
import { plitkaWorkTypes, plitkaMaterials, plitkaThicknesses } from '../data/shared/plitka'
// === Данные из pages (специфичные для этой страницы) ===
import {
  navItems,
  categoryAdvantages,
  comparisonMethods,
  technicalInsights,
  createCalculatorTabs,
  priceFactors,
  workStages,
  guarantees,
  faqItems,
  projectSlugs,
  customFields,
  messageConfig,
  seoData,
  WORK_IDS,
} from '../data/pages/ukladka-plitki'

// === UI: workTypes ===
import HeaderType from '../ui/HeaderType.vue'
import WorkTypeOverview from '../ui/WorkTypeOverview.vue'
import PriceCalculatorTabs from '../ui/PriceCalculatorTabs.vue'
import PriceListTable from '../ui/PriceListTable.vue'
import WorkStagesTimeline from '../ui/WorkStagesTimeline.vue'
import GuaranteesGrid from '../ui/GuaranteesGrid.vue'
import TechnicalInsights from '../ui/TechnicalInsights.vue'
import RelatedWorkTypes from '../ui/RelatedWorkTypes.vue'
import BeforeAfterShowcase from '../ui/BeforeAfterShowcase.vue'
import MethodComparison from '../ui/MethodComparison.vue'
import MaterialsGuide from '../ui/MaterialsGuide.vue'
import InlineCta from '../ui/InlineCta.vue'
// === UI: общие ===
import StickyNav from '../../ui/StickyNav.vue'
import Breadcrumbs from '../../ui/Breadcrumbs.vue'
import NavBreadcrumbsRow from '../../ui/NavBreadcrumbsRow.vue'
import PriceFactors from '../../ui/PriceFactors.vue'
import ProjectsShowcase from '../../pageTypes/ui/ProjectsShowcase.vue'
import BeforeAfterGallery from '../../ui/BeforeAfterGallery.vue'
import FAQBlock from '../../ui/FAQBlock.vue'
import ApplicationCTA from '../../ui/ApplicationCTA.vue'

// === SEO ===
import { useWorkTypeSeo } from '../../composables/useWorkTypeSeo'
// === Калькулятор ===
import { usePriceFetcher } from '~/composables/calculator/usePriceFetcher'
import type { NormalizedWorkItem } from '~/types/calculator'

// ============================================================
// 🆕 ОПРЕДЕЛЕНИЕ АКТИВНОЙ СТРАНИЦЫ ПО URL
// ============================================================
const route = useRoute()
const relatedPlitkaWorkTypes = computed(() =>
  plitkaWorkTypes.map(item => ({
    ...item,
    active: route.path === item.to,
  }))
)

// ============================================================
// ХЛЕБНЫЕ КРОШКИ
// ============================================================
const breadcrumbItems = [
  { label: 'Главная', to: '/' },
  { label: 'Виды работ', to: '/remont-pomescheniy' },
  { label: 'Укладка плитки' },
]

// ============================================================
// ДО / ПОСЛЕ (фото-плейсхолдеры, будут заменены)
// ============================================================
const beforeAfterItems = [
  { beforeImage: '/main/vidy-rabot/plitka/1-1.webp', afterImage: '/main/vidy-rabot/plitka/1.webp' },
  { beforeImage: '/main/vidy-rabot/plitka/2-1.webp', afterImage: '/main/vidy-rabot/plitka/2.webp' },
  { beforeImage: '/main/5.jpg', afterImage: '/main/6.jpg' },
]

// ============================================================
// ПРАЙС-ЛИСТ (единственный источник цен)
// ============================================================
const { sections, pending: pricePending } = usePriceFetcher()
const findWorkById = (id: number): NormalizedWorkItem | undefined => {
  const allWorks = Object.values(sections.value).flatMap(section => [
    ...section.standard,
    ...section.piece,
  ])
  return allWorks.find(w => w.id === id)
}

// ============================================================
// 🔄 АВТОМАТИЧЕСКИЕ ЦЕНЫ ИЗ ПРАЙС-ЛИСТА
// ============================================================
const polWork = computed(() => findWorkById(WORK_IDS.POL_60x60))
const stenaWork = computed(() => findWorkById(WORK_IDS.STENA_40x40))
const krupnoWork = computed(() => findWorkById(WORK_IDS.KRUPNOFORMAT))
const pol30Work = computed(() => findWorkById(WORK_IDS.POL_30x30))
const stena30Work = computed(() => findWorkById(WORK_IDS.STENA_30x30))

/** Цены в ₽/м² для таблицы сравнения */
const polPrice = computed(() => polWork.value ? Math.round(polWork.value.pricePerUnit) : 0)
const stenaPrice = computed(() => stenaWork.value ? Math.round(stenaWork.value.pricePerUnit) : 0)
const krupnoPrice = computed(() => krupnoWork.value ? Math.round(krupnoWork.value.pricePerUnit) : 0)

/** Минимальная цена для SEO (самый доступный формат) */
const minPrice = computed(() => {
  const prices = [
    pol30Work.value?.pricePerUnit ?? 0,
    stena30Work.value?.pricePerUnit ?? 0,
  ].filter(p => p > 0)
  return prices.length ? Math.round(Math.min(...prices)) : 0
})

/** Форматирование цены для отображения */
const formatPrice = (price: number): string => {
  if (!price) return '—'
  return `${price.toLocaleString('ru-RU')} ₽/м²`
}

// ============================================================
// 🔄 ВЫЧИСЛЯЕМЫЕ ТЕКСТЫ С ЦЕНАМИ
// ============================================================
const insightsSummary = computed(() => {
  const delta = krupnoPrice.value - polPrice.value
  if (delta > 0) {
    return `Крупноформатная укладка дороже стандартной на <strong>+${delta.toLocaleString('ru-RU')} ₽/м²</strong> — это плата за монолитный вид и минимум швов. Для проходных зон магазина или офиса это оправдано: грязи негде скапливаться, а покрытие выдерживает тележки и каблуки.`
  }
  return 'Крупноформатная плитка даёт монолитное покрытие с минимумом швов. Для проходных зон магазина или офиса это оптимальный выбор: грязь не скапливается, покрытие выдерживает высокие нагрузки.'
})

// ============================================================
// КАЛЬКУЛЯТОР
// ============================================================
const calculatorTabs = computed(() => createCalculatorTabs(findWorkById))

// ============================================================
// СЛУЖЕБНОЕ
// ============================================================
const scrollToCta = () => {
  const el = document.getElementById('cta')
  el?.scrollIntoView({ behavior: 'smooth' })
}

// ============================================================
// SEO (передаём computed — useWorkTypeSeo разворачивает через toValue)
// ============================================================
useWorkTypeSeo({
  ...seoData,
  priceFrom: minPrice,
  faq: faqItems,
})
</script>

<style lang="scss" scoped>
@use '@/assets/styles/variables' as *;
@use '@/assets/styles/mixins' as *;

.page-ukladka-plitki {
  background: $background-dark;
  color: $text-light;
  margin-top: 5em;

  @media (max-width: 768px) {
    margin: unset;
  }
}

.page-section {
  position: relative;

  &--light {
    background: $background-light;
    color: $text-dark;
  }
}
</style>