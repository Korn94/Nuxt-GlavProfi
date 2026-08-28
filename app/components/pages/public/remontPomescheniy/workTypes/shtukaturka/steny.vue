<!-- app/components/pages/public/remontPomescheniy/workTypes/shtukaturka/steny.vue -->
 <template>
  <div class="page-shtukaturka-sten">
    <!-- ==================== 1. ШАПКА СТРАНИЦЫ ==================== -->
    <HeaderType
      title="Штукатурка стен"
      subtitle="Подготовка стен к финишной отделке: выравнивание перепадов до 5 см, создание прочного основания под шпаклёвку, покраску или плитку."
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
        title="Примеры стен <span>до и после</span> штукатурки"
        :items="beforeAfterItems"
      />
    </section>

    <!-- ==================== 4. ОПИСАНИЕ КАТЕГОРИИ ==================== -->
    <section id="overview" class="page-section page-section--light">
      <WorkTypeOverview
        title="Зачем стенам <span>штукатурка</span>"
        description="Штукатурка — это черновое выравнивание стен толстым слоем (10–50 мм) цементно-песчаным или гипсовым составом. Она превращает кривую поверхность в ровную плоскость, готовую под дальнейшую отделку."
        :advantages="categoryAdvantages"
      >
        <template #details>
          <p>
            В отличие от шпаклёвки, штукатурка убирает крупные перепады: заваленные
            углы, «волны» кладки, неровности стыков плит. Без неё невозможно
            качественно покрасить стену, поклеить обои или уложить плитку —
            финишное покрытие подчеркнёт каждую неровность.
          </p>
          <p>
            <span class="blue">Гипсовая штукатурка</span> подходит для сухих
            помещений — она дышит, быстро сохнет, хорошо изолирует тепло и звук.
            <span class="blue">Цементно-песчаная</span> — для ванных, кухонь, фасадов
            и неотапливаемых помещений: не боится влаги и мороза.
          </p>
          <p>
            После штукатурки стена готова под
            <NuxtLink to="/vidy-rabot/shpaklevka-sten">шпаклёвку</NuxtLink>,
            укладку <NuxtLink to="/vidy-rabot/ukladka-plitki">плитки</NuxtLink>
            или обшивку <NuxtLink to="/vidy-rabot/oblitsovka-gkl">гипсокартоном</NuxtLink>
            (в особо сложных случаях).
          </p>
        </template>
      </WorkTypeOverview>
    </section>

    <!-- ==================== 5. СРАВНЕНИЕ ПОДХОДОВ ==================== -->
    <section id="methods" class="page-section">
      <MethodComparison
        title="Какой тип <span>штукатурки</span> выбрать?"
        subtitle="Зависит от влажности помещения, перепадов стен и типа основания."
        :methods="comparisonMethods"
        :price-data="sections"
        summary="Не уверены, какой вариант нужен? <strong>Инженер бесплатно приедет на осмотр</strong>, замерит перепады лазерным нивелиром и предложит оптимальный состав и технологию."
      />
    </section>

    <!-- ==================== 6. ТИПЫ МАТЕРИАЛОВ ==================== -->
    <section id="materials" class="page-section page-section--light">
      <MaterialsGuide
        title="Какой <span>состав</span> выбрать: гипс, цемент или известь?"
        subtitle="Каждый тип подходит для своих условий. Разбираем плюсы, минусы и области применения."
        :materials="shtukaturkaMaterials"
        :thicknesses="shtukaturkaThicknesses"
        summary="Для офисов и жилых комнат — <strong>гипсовая штукатурка</strong>. Для санузлов и кухонь — <strong>цементная</strong>. Для новостроек с усадкой — <strong>с армированием</strong>. При площадях от 100 м² — <strong>машинная</strong>. Точный подбор сделает инженер на бесплатном замере."
      />
    </section>

    <!-- ==================== 7. ТЕХНИЧЕСКИЕ НЮАНСЫ ==================== -->
    <section id="insights" class="page-section">
      <TechnicalInsights
        title="Что важно знать <span>о штукатурке</span> стен"
        subtitle="Объясняем технологию простыми словами — чтобы вы понимали, за что платите."
        :insights="technicalInsights"
        :comparison-images="[
          {
            src: '/main/vidy-rabot/shtukaturka/mayaki.webp',
            label: 'Установка маяков',
            alt: 'Металлические маяки на стене перед нанесением штукатурки',
          },
          {
            src: '/main/vidy-rabot/shtukaturka/finish.webp',
            label: 'Готовая оштукатуренная стена',
            alt: 'Выровненная оштукатуренная стена после высыхания',
          },
        ]"
        :summary="insightsSummary"
      >
        <template #content>
          <h3>Сравнение подходов</h3>
          <div class="comparison-table">
            <div class="comparison-row comparison-row--header">
              <span>Параметр</span>
              <span>Гипсовая</span>
              <span>С армированием</span>
              <span>Цементная</span>
            </div>
            <div class="comparison-row">
              <span>Слой</span>
              <span data-label="Гипсовая">10–30 мм</span>
              <span data-label="С армированием" class="comparison-better">30–50 мм</span>
              <span data-label="Цементная">10–50 мм</span>
            </div>
            <div class="comparison-row">
              <span>Сохнет</span>
              <span data-label="Гипсовая" class="comparison-better">5–7 дней</span>
              <span data-label="С армированием">5–7 дней</span>
              <span data-label="Цементная">14–21 день</span>
            </div>
            <div class="comparison-row">
              <span>Влагостойкость</span>
              <span data-label="Гипсовая">Нет</span>
              <span data-label="С армированием">Нет</span>
              <span data-label="Цементная" class="comparison-better">Да</span>
            </div>
            <div class="comparison-row">
              <span>Для новостроек</span>
              <span data-label="Гипсовая">Не рекомендуется</span>
              <span data-label="С армированием" class="comparison-better">Идеально</span>
              <span data-label="Цементная">Подходит</span>
            </div>
            <div class="comparison-row">
              <span>Цена работы</span>
              <span data-label="Гипсовая">{{ formatPrice(gipsPrice) }}</span>
              <span data-label="С армированием">{{ formatPrice(armPrice) }}</span>
              <span data-label="Цементная">{{ formatPrice(cementPrice) }}</span>
            </div>
          </div>
        </template>
      </TechnicalInsights>
    </section>

    <!-- ==================== 8. ПРЕДПРОСМОТР ЦЕН ==================== -->
    <section id="price-list" class="page-section">
      <PriceListTable
        title="Полный прайс: <span>штукатурка стен</span>"
        subtitle="Все работы: подготовка, грунтовка, маяки, армирование, нанесение."
        :sub-category-ids="[241, 242, 323, 324, 325, 327]"
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
        title="Калькулятор <span>стоимости</span> штукатурки стен"
        subtitle="Выберите тип штукатурки и площадь — получите предварительную смету сразу."
        :tabs="calculatorTabs"
        :loading="pricePending"
        :default-area="40"
        @order-estimate="scrollToCta"
      />
    </section>

    <!-- ==================== 11. ЭТАПЫ РАБОТ ==================== -->
    <section id="stages" class="page-section page-section--light">
      <WorkStagesTimeline
        title="Как <span>мы работаем</span>: 6 этапов"
        subtitle="От заявки до ровных стен, готовых под финишную отделку"
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
        id-prefix="shtukaturka-sten-faq"
      />
    </section>

    <!-- ==================== 14. ПОРТФОЛИО ==================== -->
    <section id="portfolio" class="page-section">
      <BeforeAfterGallery
        title="Наши работы: <span>штукатурка стен</span>"
        :slugs="projectSlugs"
      />
    </section>

    <!-- ==================== 15. ДРУГИЕ РАБОТЫ ГРУППЫ ==================== -->
    <section id="related" class="page-section">
      <RelatedWorkTypes
        title="Другие работы <span>по штукатурке</span>"
        subtitle="Каждый вид — на отдельной странице с ценами и калькулятором."
        :items="relatedShtukaturkaWorkTypes"
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
        title="Рассчитайте <span>точную стоимость</span> штукатурки"
        subtitle="Оставьте заявку — инженер бесплатно приедет на осмотр, замерит перепады лазерным нивелиром и подготовит детальную смету."
        phone="+7 (910) 909-69-47"
        telegram="@glavprofii"
        id-prefix="shtukaturka-sten-cta"
        :custom-fields="customFields"
        :message-config="messageConfig"
      />
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'nuxt/app'

// === Данные из shared (общие для группы «Штукатурка») ===
import {
  shtukaturkaWorkTypes,
  shtukaturkaMaterials,
  shtukaturkaThicknesses,
} from '../data/shared/shtukaturka'

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
} from '../data/pages/shtukaturka-sten'

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

const relatedShtukaturkaWorkTypes = computed(() =>
  shtukaturkaWorkTypes.map(item => ({
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
  { label: 'Штукатурка стен' },
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
const gipsWork = computed(() => findWorkById(WORK_IDS.GIPS_BASIC))
const armWork = computed(() => findWorkById(WORK_IDS.GIPS_ARM))
const cementWork = computed(() => findWorkById(WORK_IDS.CEMENT))

/** Цены в ₽/м² для таблицы сравнения (только основная работа, без грунта/маяков) */
const gipsPrice = computed(() => gipsWork.value ? Math.round(gipsWork.value.pricePerUnit) : 0)
const armPrice = computed(() => armWork.value ? Math.round(armWork.value.pricePerUnit) : 0)
const cementPrice = computed(() => cementWork.value ? Math.round(cementWork.value.pricePerUnit) : 0)

/** Минимальная цена для SEO (берём самую дешёвую — гипсовую) */
const minPrice = computed(() => gipsPrice.value || 0)

/** Форматирование цены для отображения */
const formatPrice = (price: number): string => {
  if (!price) return '—'
  return `${price.toLocaleString('ru-RU')} ₽/м²`
}

// ============================================================
// 🔄 ВЫЧИСЛЯЕМЫЕ ТЕКСТЫ
// ============================================================
const insightsSummary = computed(() => {
  const delta = armPrice.value - gipsPrice.value
  if (delta > 0) {
    return `Штукатурка с армированием добавляет <strong>+${delta.toLocaleString('ru-RU')} ₽/м²</strong> к стоимости, но это страховка от трещин в новостройках и на проблемных основаниях. Если дом новый (до 3 лет) или стены из газобетона — армирование обязательно.`
  }
  return 'Штукатурка с армированием предотвращает трещины при усадке дома и на стыках разных материалов. Обязательна для новостроек и газобетона.'
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

.page-shtukaturka-sten {
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