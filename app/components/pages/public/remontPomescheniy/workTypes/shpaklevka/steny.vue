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

    <!-- ==================== 4. ОПИСАНИЕ КАТЕГОРИИ ==================== -->
    <section id="overview" class="page-section page-section--light">
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

    <!-- ==================== 5. СРАВНЕНИЕ ПОДХОДОВ ==================== -->
    <section id="methods" class="page-section">
      <MethodComparison
        title="Какой уровень <span>шпаклёвки</span> вам нужен?"
        subtitle="Зависит от финишной отделки и требований к качеству поверхности."
        :methods="comparisonMethods"
        :price-data="sections"
        summary="Не уверены, какой уровень подготовки нужен? <strong>Инженер бесплатно приедет на осмотр</strong>, оценит состояние стен и порекомендует оптимальный вариант под вашу отделку."
      />
    </section>

    <!-- ==================== 6. ТИПЫ МАТЕРИАЛОВ ==================== -->
    <section id="materials" class="page-section page-section--light">
      <MaterialsGuide
        title="Какую <span>шпаклёвку</span> выбрать: гипс, цемент или полимер?"
        subtitle="Каждый тип подходит для своих задач. Разбираем плюсы, минусы и области применения."
        :materials="shpaklevkaMaterials"
        :thicknesses="shpaklevkaThicknesses"
        summary="Для офисов и жилых комнат — <strong>гипсовая шпаклёвка</strong>. Для санузлов и кухонь — <strong>цементная</strong>. Под премиальную покраску — <strong>полимерная финишная</strong>. Точный подбор сделает инженер на бесплатном замере."
      />
    </section>

    <!-- ==================== 7. ТЕХНИЧЕСКИЕ НЮАНСЫ ==================== -->
    <section id="insights" class="page-section">
      <TechnicalInsights
        title="Что важно знать <span>о шпаклёвке</span> стен"
        subtitle="Объясняем технологию простыми словами — чтобы вы понимали, за что платите."
        :insights="technicalInsights"
        :comparison-images="[
          {
            src: '/main/vidy-rabot/shpaklevka/start.webp',
            label: 'После стартовой шпаклёвки',
            alt: 'Стена после нанесения стартовой шпаклёвки',
          },
          {
            src: '/main/vidy-rabot/shpaklevka/finish.webp',
            label: 'После финишной + шлифовка',
            alt: 'Стена после финишной шпаклёвки и шлифовки',
          },
        ]"
        :summary="insightsSummary"
      >
        <template #content>
          <h3>Сравнение уровней подготовки</h3>
          <div class="comparison-table">
            <div class="comparison-row comparison-row--header">
              <span>Параметр</span>
              <span>Стартовая</span>
              <span>Стартовая + Финишная</span>
              <span>Под «лампочку»</span>
            </div>
            <div class="comparison-row">
              <span>Слоёв</span>
              <span data-label="Стартовая">1</span>
              <span data-label="Стартовая + Финишная">2</span>
              <span data-label="Под «лампочку»" class="comparison-better">2 + контроль светом</span>
            </div>
            <div class="comparison-row">
              <span>Под обои</span>
              <span data-label="Стартовая" class="comparison-better">Подходит</span>
              <span data-label="Стартовая + Финишная">Избыточно</span>
              <span data-label="Под «лампочку»">Избыточно</span>
            </div>
            <div class="comparison-row">
              <span>Под покраску</span>
              <span data-label="Стартовая">Не подходит</span>
              <span data-label="Стартовая + Финишная" class="comparison-better">Подходит</span>
              <span data-label="Под «лампочку»" class="comparison-better">Идеально</span>
            </div>
            <div class="comparison-row">
              <span>Шлифовка</span>
              <span data-label="Стартовая">Грубая</span>
              <span data-label="Стартовая + Финишная">Р150</span>
              <span data-label="Под «лампочку»" class="comparison-better">Р180–Р240</span>
            </div>
            <div class="comparison-row">
              <span>Цена работы</span>
              <span data-label="Стартовая">{{ formatPrice(startPrice) }}</span>
              <span data-label="Стартовая + Финишная">{{ formatPrice(finishPrice) }}</span>
              <span data-label="Под «лампочку»">{{ formatPrice(premiumPrice) }}</span>
            </div>
          </div>
        </template>
      </TechnicalInsights>
    </section>

    <!-- ==================== 8. ПРЕДПРОСМОТР ЦЕН ==================== -->
    <section id="price-list" class="page-section">
      <PriceListTable
        title="Полный прайс: <span>шпаклёвка стен</span>"
        subtitle="Все работы по подготовке стен: грунтовка, шпаклёвка, армирование, шлифовка."
        :sub-category-ids="[250, 251, 252, 254, 255]"
        footer-note="* Цены указаны за работу без учёта стоимости материалов. Доплаты отмечены знаком «+ к цене»."
      />
    </section>

    <!-- ==================== 9. ФАКТОРЫ ЦЕНЫ ==================== -->
    <section id="price-factors" class="page-section page-section--light">
      <PriceFactors
        title="Что <span>влияет на итоговую цену</span>"
        :factors="priceFactors"
        footer-note="Точную смету инженер составит после бесплатного выезда на объект. Это ни к чему не обязывает."
      />
    </section>

    <!-- ==================== 10. КАЛЬКУЛЯТОР ==================== -->
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

    <!-- ==================== 11. ЭТАПЫ РАБОТ ==================== -->
    <section id="stages" class="page-section page-section--light">
      <WorkStagesTimeline
        title="Как <span>мы работаем</span>: 6 этапов"
        subtitle="От заявки до идеально гладких стен, готовых под отделку"
        :stages="workStages"
      />
    </section>

    <!-- ==================== 12. ГАРАНТИИ ==================== -->
    <section id="guarantees" class="page-section">
      <GuaranteesGrid title="Наши <span>гарантии</span>" :items="guarantees" />
    </section>

    <!-- ==================== 13. FAQ ==================== -->
    <section id="faq" class="page-section page-section--light">
      <FAQBlock
        title="Ответы на <span>частые вопросы</span>"
        :items="faqItems"
        id-prefix="shpaklevka-sten-faq"
      />
    </section>

    <!-- ==================== 14. ПОРТФОЛИО ==================== -->
    <section id="portfolio" class="page-section">
      <BeforeAfterGallery
        title="Наши работы: <span>шпаклёвка стен</span>"
        :slugs="projectSlugs"
      />
    </section>

    <!-- ==================== 15. ДРУГИЕ РАБОТЫ ГРУППЫ ==================== -->
    <section id="related" class="page-section">
      <RelatedWorkTypes
        title="Другие работы <span>по шпаклёвке</span>"
        subtitle="Каждый вид — на отдельной странице с ценами и калькулятором."
        :items="relatedShpaklevkaWorkTypes"
        :price-data="sections"
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
    <section id="cta" class="page-section page-section--light">
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
  { beforeImage: '/main/1-1.jpg', afterImage: '/main/1.jpg' },
  { beforeImage: '/main/2-1.jpg', afterImage: '/main/2.jpg' },
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
const startWork = computed(() => findWorkById(WORK_IDS.START_GIPS))
const finishWork = computed(() => findWorkById(WORK_IDS.FINISH_GIPS))
const premiumWork = computed(() => findWorkById(WORK_IDS.POD_POKRASKU))
const gruntWork = computed(() => findWorkById(WORK_IDS.GRUNTOVKA))
const shlifWork = computed(() => findWorkById(WORK_IDS.SHLIFOVKA))
const shlifPokrWork = computed(() => findWorkById(WORK_IDS.SHLIFOVKA_POKRASKA))

/** Цены в ₽/м² для таблицы сравнения */
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

/** Минимальная цена для SEO */
const minPrice = computed(() => startWork.value ? Math.round(startWork.value.pricePerUnit) : 0)

/** Форматирование цены для отображения */
const formatPrice = (price: number): string => {
  if (!price) return '—'
  return `${price.toLocaleString('ru-RU')} ₽/м²`
}

// ============================================================
// 🔄 ВЫЧИСЛЯЕМЫЕ ТЕКСТЫ
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
}

// === Таблица сравнения (для блока TechnicalInsights) ===
.comparison-table {
  margin-top: 1rem;
  border-radius: 10px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.comparison-row {
  display: grid;
  grid-template-columns: 1.5fr 1fr 1fr 1fr;
  gap: 0.8rem;
  padding: 0.9rem 1.2rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  font-size: 0.88rem;

  &:last-child {
    border-bottom: none;
  }

  &--header {
    background: rgba(0, 195, 245, 0.08);
    font-weight: 600;
    color: $text-light;
    font-family: 'Rubik', sans-serif;

    span:first-child {
      color: rgba($text-light, 0.7);
      font-weight: 500;
    }
  }

  > span:first-child {
    color: rgba($text-light, 0.9);
    font-weight: 500;
  }

  > span:not(:first-child) {
    color: rgba($text-light, 0.7);
    text-align: center;
  }

  .comparison-better {
    color: $green !important;
    font-weight: 600;
  }
}

@media (max-width: 768px) {
  .comparison-row {
    grid-template-columns: 1fr;
    gap: 0.3rem;
    padding: 0.8rem 1rem;

    &--header {
      display: none;
    }

    > span[data-label]::before {
      content: attr(data-label) ': ';
      font-weight: 600;
      color: $blue;
    }

    > span:first-child {
      margin-top: 0.4rem;
    }

    > span:not(:first-child) {
      text-align: left;
    }
  }
}
</style>