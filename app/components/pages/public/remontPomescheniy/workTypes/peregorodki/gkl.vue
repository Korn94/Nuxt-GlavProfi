<!-- app/components/pages/public/remontPomescheniy/workTypes/peregorodki/gkl.vue -->
<template>
  <div class="page-gkl-peregorodki">
    <!-- ==================== 1. ШАПКА СТРАНИЦЫ ==================== -->
    <HeaderType
      title="Перегородки <span>из гипсокартона</span>"
      subtitle="Зонирование пространства, шумоизоляция и монтаж дверей за 2-4 дня. Лёгкая конструкция без капитальных стен и согласований."
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
        title="Примеры <span>до и после</span> монтажа перегородок"
        :items="beforeAfterItems"
      />
    </section>

    <!-- ==================== 4. ОПИСАНИЕ КАТЕГОРИИ ==================== -->
    <section id="overview" class="page-section page-section--light">
      <WorkTypeOverview
        title="Почему перегородки из <span>ГКЛ — это выгодно</span>"
        description="Перегородка из гипсокартона — это каркас из металлического профиля, обшитый листами ГКЛ с обеих сторон. Внутри каркаса закладывается звукоизоляция (минвата) и коммуникации. Конструкция в 5-7 раз легче кирпичной стены."
        :advantages="categoryAdvantages"
      >
        <template #details>
          <p>
            <span class="blue">Зонирование</span> — самый частый сценарий: разделить студию на спальню и гостиную, выделить кабинет в офисе, создать гардеробную. Перегородка ставится за 2-4 дня без согласования с БТИ (если не затрагивает несущие стены и мокрые зоны).
          </p>
          <p>
            В отличие от кирпичной кладки, монтаж перегородки из ГКЛ — это сухой процесс без грязи и пыли. После заделки швов поверхность готова под
            <NuxtLink to="/vidy-rabot/shpaklevka-sten">шпаклёвку</NuxtLink>, покраску или укладку <NuxtLink to="/vidy-rabot/ukladka-plitki">плитки</NuxtLink>.
          </p>
          <p>
            Внутри перегородки можно спрятать электропроводку, интернет-кабели, трубы вентиляции. Розетки и выключатели устанавливаются с обеих сторон стены. Для дверных проёмов закладывается усиленный брус или UA-профиль.
          </p>
        </template>
      </WorkTypeOverview>
    </section>

    <!-- ==================== 5. СРАВНЕНИЕ МЕТОДОВ ==================== -->
    <section id="methods" class="page-section">
      <MethodComparison
        title="Что <span>выбрать</span>: 1, 2 слоя или ГВЛ?"
        subtitle="Количество слоёв определяет прочность, звукоизоляцию и цену. Разберём плюсы, минусы и сценарии применения."
        :methods="comparisonMethods"
        :price-data="sections"
        :summary="methodsSummary"
      />
    </section>

    <!-- ==================== 6. ТИПЫ МАТЕРИАЛОВ ==================== -->
    <section id="materials" class="page-section page-section--light">
      <MaterialsGuide
        title="Какой <span>гипсокартон</span> выбрать для перегородок"
        subtitle="Тип листа зависит от назначения помещения. Рассказываем, где использовать ГКЛ, ГКЛВ, ГВЛ и ГКЛО."
        :materials="gklMaterials"
        :thicknesses="gklThicknesses"
        summary="Для стандартных перегородок в жилых комнатах и офисах достаточно <strong>ГКЛ 12,5 мм</strong>. Для санузлов и кухонь — <strong>ГКЛВ</strong>. Если планируете вешать тяжёлые шкафы без закладных — берите <strong>ГВЛ</strong>: он держит до 30 кг на дюбель."
      />
    </section>

    <!-- ==================== 7. ТЕХНИЧЕСКИЕ НЮАНСЫ ==================== -->
    <section id="insights" class="page-section">
      <TechnicalInsights
        title="Ключевые <span>технические нюансы</span> монтажа"
        subtitle="Что отличает надёжную перегородку от хлипкой конструкции, которая треснет через полгода."
        :insights="technicalInsights"
        :comparison-images="[
          {
            src: '/main/vidy-rabot/gkl/1.webp',
            label: 'Перегородка ГКЛ в 1 слой',
            alt: 'Перегородка из одного слоя гипсокартона',
          },
          {
            src: '/main/vidy-rabot/gkl/2.webp',
            label: 'Перегородка ГКЛ в 2 слоя',
            alt: 'Перегородка из двух слоёв гипсокартона',
          },
        ]"
        :summary="insightsSummary"
      >
        <template #content>
          <h3>Сравнение конструкций перегородок</h3>
          <div class="comparison-table">
            <div class="comparison-row comparison-row--header">
              <span>Параметр</span>
              <span>1 слой</span>
              <span>2 слоя</span>
            </div>
            <div class="comparison-row">
              <span>Звукоизоляция</span>
              <span data-label="1 слой">~35 дБ</span>
              <span data-label="2 слоя" class="comparison-better">~48 дБ</span>
            </div>
            <div class="comparison-row">
              <span>Прочность на удар</span>
              <span data-label="1 слой">Базовая</span>
              <span data-label="2 слоя" class="comparison-better">В 2-3 раза выше</span>
            </div>
            <div class="comparison-row">
              <span>Трещины по швам</span>
              <span data-label="1 слой">Возможны</span>
              <span data-label="2 слоя" class="comparison-better">Исключены</span>
            </div>
            <div class="comparison-row">
              <span>Для жилых комнат</span>
              <span data-label="1 слой">Не рекомендуется</span>
              <span data-label="2 слоя" class="comparison-better">Подходит</span>
            </div>
            <div class="comparison-row">
              <span>Толщина перегородки</span>
              <span data-label="1 слой">75 мм</span>
              <span data-label="2 слоя">100 мм</span>
            </div>
            <div class="comparison-row">
              <span>Цена работы</span>
              <span data-label="1 слой">{{ formatPrice(p1Price) }}</span>
              <span data-label="2 слоя">{{ formatPrice(p2Price) }}</span>
            </div>
          </div>
        </template>
      </TechnicalInsights>
    </section>

    <!-- ==================== 8. ПРЕДПРОСМОТР ЦЕН ==================== -->
    <section id="price-list" class="page-section">
      <PriceListTable
        title="Полный прайс: <span>перегородки из ГКЛ</span>"
        subtitle="Все работы по монтажу гипсокартонных перегородок. Точная смета — после бесплатного замера."
        :sub-category-ids="[228, 231, 232]"
        footer-note="* Цены указаны за работу без учёта стоимости материалов. Доплаты отмечены знаком «+ к цене». Монтаж дверей и коробок считается отдельно."
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
        title="Калькулятор <span>стоимости</span> перегородки"
        subtitle="Выберите тип конструкции и площадь — получите предварительную смету сразу."
        :tabs="calculatorTabs"
        :loading="pricePending"
        :default-area="10"
        @order-estimate="scrollToCta"
      />
    </section>

    <!-- ==================== 11. ЭТАПЫ РАБОТ ==================== -->
    <section id="stages" class="page-section page-section--light">
      <WorkStagesTimeline
        title="Как <span>мы работаем</span>: 7 этапов"
        subtitle="От звонка до сдачи готовой перегородки под отделку"
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
        id-prefix="gkl-peregorodki-faq"
      />
    </section>

    <!-- ==================== 14. ПОРТФОЛИО ==================== -->
    <section id="portfolio" class="page-section">
      <BeforeAfterGallery
        title="Наши работы: <span>перегородки из ГКЛ</span>"
        :slugs="projectSlugs"
      />
    </section>
    
    <!-- ==================== 15. ДРУГИЕ ГКЛ РАБОТЫ ==================== -->
    <section id="related" class="page-section">
      <RelatedWorkTypes
        title="Другие <span>гипсокартонные работы</span>"
        subtitle="Каждый вид работ — на отдельной странице с подробным описанием, ценами и калькулятором."
        :items="relatedGklWorkTypes"
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
        title="Рассчитайте <span>точную стоимость</span> вашей перегородки"
        subtitle="Оставьте заявку — инженер бесплатно приедет на замер, обсудит планировку и подготовит детальную смету."
        phone="+7 (910) 909-69-47"
        telegram="@glavprofii"
        id-prefix="gkl-peregorodki-cta"
        :custom-fields="customFields"
        :message-config="messageConfig"
      />
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'nuxt/app'

// === Данные из shared (общие для всех ГКЛ работ) ===
import { gklWorkTypes, gklMaterials, gklThicknesses } from '../data/shared/gkl'

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
} from '../data/pages/gkl-peregorodki'

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

/**
 * 🔄 Автоматически помечает текущую страницу в блоке "Другие работы".
 * Не нужно хардкодить `active: true` в shared-данных.
 */
const relatedGklWorkTypes = computed(() =>
  gklWorkTypes.map(item => ({
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
  { label: 'Перегородки из ГКЛ' },
]

// ============================================================
// ДО / ПОСЛЕ
// ============================================================
const beforeAfterItems = [
  { beforeImage: '/main/vidy-rabot/peregorodki-gkl/1.jpg', afterImage: '/main/vidy-rabot/peregorodki-gkl/2.jpg' },
  { beforeImage: '/main/vidy-rabot/peregorodki-gkl/10.jpg', afterImage: '/main/vidy-rabot/peregorodki-gkl/2.jpg' },
  { beforeImage: '/main/vidy-rabot/peregorodki-gkl/3.jpg', afterImage: '/main/vidy-rabot/peregorodki-gkl/4.jpg' },
  { beforeImage: '/main/vidy-rabot/peregorodki-gkl/9.jpg', afterImage: '/main/vidy-rabot/peregorodki-gkl/4.jpg' },
  { beforeImage: '/main/vidy-rabot/peregorodki-gkl/5.jpg', afterImage: '/main/vidy-rabot/peregorodki-gkl/6.jpg' },
  { beforeImage: '/main/vidy-rabot/peregorodki-gkl/7.jpg', afterImage: '/main/vidy-rabot/peregorodki-gkl/8.jpg' },
  { beforeImage: '/main/vidy-rabot/peregorodki-gkl/11.jpg', afterImage: '/main/vidy-rabot/peregorodki-gkl/12.jpg' },
  { beforeImage: '/main/5.jpg', afterImage: '/main/6.jpg' },
]

// ============================================================
// ПРАЙС-ЛИСТ (единственный источник цен)
// ============================================================
const { sections, pending: pricePending } = usePriceFetcher()

const findWorkById = (id: number): NormalizedWorkItem | undefined => {
  const allWorks = Object.values(sections.value).flatMap(section => [
    ...section.standard,
    ...section.piece
  ])
  return allWorks.find(w => w.id === id)
}

// ============================================================
// 🔄 АВТОМАТИЧЕСКИЕ ЦЕНЫ ИЗ ПРАЙС-ЛИСТА
// ============================================================
const p1 = computed(() => findWorkById(WORK_IDS.PARTITION_1_LAYER))
const p2 = computed(() => findWorkById(WORK_IDS.PARTITION_2_LAYERS))

/** Цены в ₽/м² (только те, что используются в шаблоне) */
const p1Price = computed(() => p1.value ? Math.round(p1.value.pricePerUnit) : 0)
const p2Price = computed(() => p2.value ? Math.round(p2.value.pricePerUnit) : 0)

/** Дельта между 1 и 2 слоями (для summary в TechnicalInsights) */
const priceDelta1to2 = computed(() => {
  if (p1Price.value && p2Price.value) {
    return p2Price.value - p1Price.value
  }
  return 0
})

/** Форматирование цены для отображения */
const formatPrice = (price: number): string => {
  if (!price) return '—'
  return `${price.toLocaleString('ru-RU')} ₽/м²`
}

/** Минимальная цена для SEO (из прайса) */
const minPrice = computed(() => p1Price.value || 0)

// ============================================================
// 🔄 ВЫЧИСЛЯЕМЫЕ ТЕКСТЫ С ЦЕНАМИ
// ============================================================
const methodsSummary = computed(() => {
  return `Для жилых комнат и офисов рекомендуем <strong>2 слоя ГКЛ с минватой 100 мм</strong> — это оптимальное соотношение цены и звукоизоляции. Для кладовых достаточно <strong>1 слоя</strong>. Для серверных и архивов — <strong>3 слоя</strong> или <strong>ГВЛ</strong>.`
})

const insightsSummary = computed(() => {
  if (priceDelta1to2.value > 0) {
    return `Двухслойная обшивка добавляет <strong>+${priceDelta1to2.value.toLocaleString('ru-RU')} ₽/м²</strong>, но это плата за прочность и тишину. Минвата 100 мм + 2 слоя ГКЛ = перегородка с звукоизоляцией 48 дБ, как стена в тихой спальне.`
  }
  return 'Двухслойная обшивка значительно повышает прочность и звукоизоляцию перегородки. Минвата 100 мм + 2 слоя ГКЛ = перегородка с звукоизоляцией 48 дБ, как стена в тихой спальне.'
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
  priceFrom: minPrice,  // ← useWorkTypeSeo использует toValue(), computed работает реактивно
  faq: faqItems,
})
</script>

<style lang="scss" scoped>
@use '@/assets/styles/variables' as *;
@use '@/assets/styles/mixins' as *;

.page-gkl-peregorodki {
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
  grid-template-columns: 2fr 1fr 1fr;
  gap: 1rem;
  padding: 0.9rem 1.2rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  font-size: 0.92rem;

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
  }

  .comparison-better {
    color: $green !important;
    font-weight: 600;
  }
}

@media (max-width: 640px) {
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
  }
}
</style>