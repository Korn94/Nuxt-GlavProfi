<!-- app/components/pages/public/remontPomescheniy/workTypes/shpaklevka/steny.vue -->
<template>
  <div class="page-shpaklevka-sten">
    <!-- ==================== 1. ШАПКА СТРАНИЦЫ ==================== -->
    <HeaderType
      title="Шпаклёвка <span>стен</span>"
      subtitle="Подготовка стен под покраску, обои или декоративную штукатурку."
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
        title="Примеры стен <span>до и после</span> шпаклёвки"
        :items="beforeAfterItems"
      />
    </section>

    <!-- ==================== 4. КАЛЬКУЛЯТОР ==================== -->
    <section id="calculator" class="page-section">
      <PriceCalculatorTabs
        title="Калькулятор <span>стоимости</span> шпаклёвки стен"
        subtitle="Выберите уровень подготовки и площадь — получите предварительную смету сразу."
        :tabs="calculatorTabs"
        :loading="pricePending"
        :default-area="30"
        @order-estimate="scrollToCta"
      />
    </section>

    <!-- ==================== 5. ПРЕДПРОСМОТР ЦЕН ==================== -->
    <section id="price-list" class="page-section">
      <PriceListTable
        title="Полный прайс: <span>шпаклёвка стен</span>"
        subtitle="Все работы по подготовке стен: грунтовка, шпаклёвка, армирование, шлифовка."
        :sub-category-ids="[250, 251, 252, 254, 255]"
        footer-note="* Цены указаны за работу без учёта стоимости материалов. Доплаты отмечены знаком «+ к цене»."
        theme="light"
      />
    </section>

    <!-- ==================== 6. ФАКТОРЫ ЦЕНЫ ==================== -->
    <section id="price-factors" class="page-section page-section--dark-alt page-section--divider">
      <PriceFactors
        title="Что <span>влияет на итоговую цену</span>"
        :factors="priceFactors"
        footer-note="Точную смету инженер составит после бесплатного выезда на объект. Это ни к чему не обязывает."
        theme="dark"
      />
    </section>

    <!-- ==================== 7. ОПИСАНИЕ КАТЕГОРИИ ==================== -->
    <section id="overview" class="page-section">
      <WorkTypeOverview
        title="Зачем стенам <span>шпаклёвка</span>"
        description="Шпаклёвка — это финишное выравнивание стен тонким слоем пасты (0,5–3 мм). Она превращает шероховатую поверхность после штукатурки или гипсокартона в идеально гладкую, готовую под покраску, обои или декоративную отделку."
        :advantages="categoryAdvantages"
      >
        <template #details>
          <p>
            Любое основание — будь то штукатурка, гипсокартон или бетон — имеет
            микронеровности: поры, следы от инструмента, стыки, мелкие сколы.
            Без шпаклёвки краска ляжет пятнами, обои подчеркнут каждую ямку,
            а декоративное покрытие покажет все дефекты основания.
          </p>
          <p>
            Шпаклёвка заполняет эти дефекты и создаёт единую гладкую плоскость.
            <span class="blue">Стартовый слой</span> убирает перепады до 3 мм,
            <span class="blue">финишный</span> — доводит поверхность до идеала,
            чтобы краска или обои легли ровно и без просветов.
          </p>
          <p>
            После шпаклёвки стена готова под
            <NuxtLink to="/vidy-rabot/pokraska-sten">покраску</NuxtLink>,
            <NuxtLink to="/vidy-rabot/pokleyka-oboev">поклейку обоев</NuxtLink>,
            <NuxtLink to="/vidy-rabot/dekorativnaya-otdelka">декоративную штукатурку</NuxtLink>
            или укладку плитки (в случае цементных составов).
          </p>
        </template>
      </WorkTypeOverview>
    </section>

    <!-- ==================== 8. СРАВНЕНИЕ ПОДХОДОВ ==================== -->
    <section id="methods" class="page-section">
      <MethodComparison
        title="Какой уровень <span>шпаклёвки</span> вам нужен?"
        subtitle="Зависит от финишной отделки и требований к качеству поверхности."
        :methods="comparisonMethods"
        :price-data="sections"
        summary="Не уверены, какой уровень подготовки нужен? <strong>Инженер бесплатно приедет на осмотр</strong>, оценит состояние стен и порекомендует оптимальный вариант под вашу отделку."
      />
    </section>

    <!-- ==================== 9. INLINE CTA ==================== -->
    <section id="quick-cta" class="page-section">
      <InlineCta
        title="Не знаете, какой уровень подготовки <span>нужен вашим стенам?</span>"
        subtitle="Оставьте номер — инженер перезвонит за 15 минут, обсудит вашу отделку и поможет выбрать оптимальный вариант."
        submit-text="Получить консультацию"
        :message-config="{
          emoji: '📞',
          title: 'Быстрая заявка на консультацию',
          sourceLabel: 'Inline CTA — шпаклёвка стен',
        }"
        id-prefix="quick-cta-shpaklevka"
      />
    </section>

    <!-- ==================== 10. ТИПЫ МАТЕРИАЛОВ ==================== -->
    <section id="materials" class="page-section">
      <MaterialsGuide
        title="Какую <span>шпаклёвку</span> выбрать: гипс, цемент или полимер?"
        subtitle="Каждый тип подходит для своих задач. Разбираем плюсы, минусы и области применения."
        :materials="shpaklevkaMaterials"
        :thicknesses="shpaklevkaThicknesses"
        summary="Для офисов и жилых комнат — <strong>гипсовая шпаклёвка</strong>. Для санузлов и кухонь — <strong>цементная</strong>. Под премиальную покраску — <strong>полимерная финишная</strong>. Точный подбор сделает инженер на бесплатном замере."
        theme="light"
      />
    </section>

    <!-- ==================== 11. ТЕХНИЧЕСКИЕ НЮАНСЫ ==================== -->
    <section id="insights" class="page-section">
      <TechnicalInsights
        title="Что важно знать <span>о шпаклёвке</span> стен"
        subtitle="Объясняем технологию простыми словами — чтобы вы понимали, за что платите."
        :insights="technicalInsights"
        :comparison-images="[
          {
            src: '/main/vidy-rabot/shpaklevka/7.jpg',
            label: 'После стартовой шпаклёвки',
            alt: 'Стена после нанесения стартовой шпаклёвки',
          },
          {
            src: '/main/vidy-rabot/shpaklevka/8.jpg',
            label: 'После финишной + шлифовка',
            alt: 'Стена после финишной шпаклёвки и шлифовки',
          },
        ]"
        :summary="insightsSummary"
      />
    </section>

    <!-- ==================== 12. ГАРАНТИИ ==================== -->
    <section id="guarantees" class="page-section">
      <GuaranteesGrid
        title="Наши <span>гарантии</span>"
        :items="guarantees"
        theme="light"
      />
    </section>

    <!-- ==================== 13. ЭТАПЫ РАБОТ ==================== -->
    <section id="stages" class="page-section">
      <WorkStagesTimeline
        title="Как <span>мы работаем</span>: 6 этапов"
        subtitle="От заявки до идеально гладких стен, готовых под отделку"
        :stages="workStages"
      />
    </section>

    <!-- ==================== 14. FAQ ==================== -->
    <section id="faq" class="page-section">
      <FAQBlock
        title="Ответы на <span>частые вопросы</span>"
        :items="faqItems"
        id-prefix="shpaklevka-sten-faq"
        theme="light"
      />
    </section>

    <!-- ==================== 15. ПОРТФОЛИО ==================== -->
    <section id="portfolio" class="page-section">
      <BeforeAfterGallery
        title="Наши работы: <span>шпаклёвка стен</span>"
        :slugs="projectSlugs"
        theme="dark"
      />
    </section>

    <!-- ==================== 16. ПРОЕКТЫ ==================== -->
    <section id="projects" class="page-section">
      <ProjectsShowcase
        title="Наши реализованные проекты <span>для бизнеса в Рязани</span>"
        :slugs="projectSlugs"
      />
    </section>

    <!-- ==================== 17. CTA ==================== -->
    <section id="cta" class="page-section">
      <ApplicationCTA
        title="Рассчитайте <span>точную стоимость</span> шпаклёвки"
        subtitle="Оставьте заявку — инженер бесплатно приедет на осмотр, оценит состояние стен и подготовит детальную смету."
        phone="+7 (910) 909-69-47"
        telegram="@glavprofii"
        id-prefix="shpaklevka-sten-cta"
        :custom-fields="customFields"
        :message-config="messageConfig"
      />
    </section>

    <!-- ==================== 18. ДРУГИЕ РАБОТЫ ГРУППЫ ==================== -->
    <section id="related" class="page-section">
      <RelatedWorkTypes
        title="Другие работы <span>по шпаклёвке</span>"
        subtitle="Каждый вид — на отдельной странице с ценами и калькулятором."
        :items="relatedShpaklevkaWorkTypes"
        :price-data="sections"
        theme="light"
      />
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'nuxt/app'

// === Данные из shared (общие для группы «Шпаклёвка») ===
import { shpaklevkaWorkTypes, shpaklevkaMaterials, shpaklevkaThicknesses } from '../data/shared/shpaklevka'

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
} from '../data/pages/shpaklevka-sten'

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
// ОПРЕДЕЛЕНИЕ АКТИВНОЙ СТРАНИЦЫ ПО URL
// ============================================================
const route = useRoute()

const relatedShpaklevkaWorkTypes = computed(() =>
  shpaklevkaWorkTypes.map(item => ({
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
  { label: 'Шпаклёвка стен' },
]

// ============================================================
// ДО / ПОСЛЕ
// ============================================================
const beforeAfterItems = [
  { beforeImage: '/main/vidy-rabot/shpaklevka/7.jpg', afterImage: '/main/vidy-rabot/shpaklevka/8.jpg' },
  { beforeImage: '/main/vidy-rabot/shpaklevka/3.jpg', afterImage: '/main/vidy-rabot/shpaklevka/4.jpg' },
  { beforeImage: '/main/vidy-rabot/shpaklevka/5.jpg', afterImage: '/main/vidy-rabot/shpaklevka/6.jpg' },
  { beforeImage: '/main/vidy-rabot/shpaklevka/9.jpg', afterImage: '/main/vidy-rabot/shpaklevka/10.jpg' },
  { beforeImage: '/main/vidy-rabot/shpaklevka/11.jpg', afterImage: '/main/vidy-rabot/shpaklevka/12.jpg' },
  { beforeImage: '/main/vidy-rabot/shpaklevka/1.jpg', afterImage: '/main/vidy-rabot/shpaklevka/2.jpg' },
]

// ============================================================
// ПРАЙС-ЛИСТ
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
// АВТОМАТИЧЕСКИЕ ЦЕНЫ ИЗ ПРАЙС-ЛИСТА
// ============================================================
const startWork = computed(() => findWorkById(WORK_IDS.START_GIPS))
const finishWork = computed(() => findWorkById(WORK_IDS.FINISH_GIPS))
const premiumWork = computed(() => findWorkById(WORK_IDS.POD_POKRASKU))
const gruntWork = computed(() => findWorkById(WORK_IDS.GRUNTOVKA))
const shlifWork = computed(() => findWorkById(WORK_IDS.SHLIFOVKA))
const shlifPokrWork = computed(() => findWorkById(WORK_IDS.SHLIFOVKA_POKRASKA))

const startPrice = computed(() => {
  const g = gruntWork.value?.pricePerUnit ?? 0
  const s = startWork.value?.pricePerUnit ?? 0
  return Math.round(g + s)
})

const finishPrice = computed(() => {
  const g = gruntWork.value?.pricePerUnit ?? 0
  const s = startWork.value?.pricePerUnit ?? 0
  const f = finishWork.value?.pricePerUnit ?? 0
  const sh = shlifWork.value?.pricePerUnit ?? 0
  return Math.round(g + s + f + sh)
})

const premiumPrice = computed(() => {
  const g = gruntWork.value?.pricePerUnit ?? 0
  const s = startWork.value?.pricePerUnit ?? 0
  const p = premiumWork.value?.pricePerUnit ?? 0
  const sh = shlifPokrWork.value?.pricePerUnit ?? 0
  return Math.round(g + s + p + sh)
})

const minPrice = computed(() => startWork.value ? Math.round(startWork.value.pricePerUnit) : 0)

const formatPrice = (price: number): string => {
  if (!price) return '—'
  return `${price.toLocaleString('ru-RU')} ₽/м²`
}

// ============================================================
// ВЫЧИСЛЯЕМЫЕ ТЕКСТЫ
// ============================================================
const insightsSummary = computed(() => {
  const delta = finishPrice.value - startPrice.value
  if (delta > 0) {
    return `Финишная шпаклёвка добавляет <strong>+${delta.toLocaleString('ru-RU')} ₽/м²</strong> к стоимости. Это второй слой, который превращает стену в идеально гладкую поверхность. Если планируете красить — без него краска подчеркнёт все микродефекты основания.`
  }
  return 'Финишная шпаклёвка создаёт идеально гладкую поверхность, готовую под покраску любого типа. Без неё краска подчеркнёт все микродефекты основания.'
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
// SEO
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

.page-shpaklevka-sten {
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

  // Альтернативный тёмный оттенок
  &--dark-alt {
    background: #141517;
  }

  // Ромб + линия для разделения двух тёмных блоков
  &--divider {
    &::after {
      content: '';
      position: absolute;
      bottom: -6px;
      left: 50%;
      transform: translateX(-50%) rotate(45deg);
      width: 12px;
      height: 12px;
      background: $blue-gradient;
      border-radius: 2px;
      z-index: 2;
      box-shadow: 0 0 16px rgba(0, 195, 245, 0.6);
    }

    &::before {
      content: '';
      position: absolute;
      bottom: 0;
      left: 50%;
      transform: translateX(-50%);
      width: 90%;
      max-width: 900px;
      height: 1px;
      background: linear-gradient(
        90deg,
        transparent 0%,
        rgba(0, 195, 245, 0.2) 25%,
        rgba(0, 195, 245, 0.5) 50%,
        rgba(0, 195, 245, 0.2) 75%,
        transparent 100%
      );
      z-index: 1;
      pointer-events: none;
    }
  }
}
</style>