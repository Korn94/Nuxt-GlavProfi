<!-- app/components/pages/public/remontPomescheniy/workTypes/oblitsovka/gkl.vue -->
<template>
  <div class="page-oblitsovka-gkl">
    <!-- ==================== 1. ШАПКА СТРАНИЦЫ ==================== -->
    <HeaderType
      title="Монтаж гипсокартона <span>на стены</span>"
      subtitle="Идеально ровные стены за 1–3 дня без штукатурки, демонтажа и грязи. Поверхность сразу готова под шпаклёвку, покраску или плитку."
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
        title="Примеры помещений <span>до и после</span> обшивки стен ГКЛ"
        :items="beforeAfterItems"
      />
    </section>

    <!-- ==================== 4. ОПИСАНИЕ КАТЕГОРИИ ==================== -->
    <section id="overview" class="page-section page-section--light">
      <WorkTypeOverview
        title="Почему это <span>лучшее решение</span> для ваших стен"
        description="Гипсокартон (ГКЛ) — это готовые листы из гипса в картонной оболочке, которые крепятся на металлический каркас или специальный клей. За 1–3 дня получаем идеально ровную поверхность без штукатурки и длительных сроков высыхания."
        :advantages="categoryAdvantages"
      >
        <template #details>
          <p>
            <span class="blue">Клей</span> подходит для стен с перепадом до 2 см — это быстрее и дешевле. <span class="blue">Каркас</span> универсален: скрывает любую кривизну и коммуникации, но забирает 5-7 см площади помещения.
          </p>
          <p>
            В отличие от штукатурки, монтаж на каркас позволяет скрыть электропроводку,
            трубы отопления и вентиляции внутри стены. Это особенно актуально при
            ремонте «под ключ», когда нужно совместить несколько инженерных систем.
          </p>
          <p>
            После обшивки поверхность готова под
            <NuxtLink to="/vidy-rabot/shpaklevka-sten">шпаклёвку</NuxtLink>, покраску
            или укладку <NuxtLink to="/vidy-rabot/ukladka-plitki">плитки</NuxtLink>.
            Для влажных помещений (санузел, кухня) мы используем влагостойкий ГКЛВ
            зелёного цвета, для зон с повышенными требованиями пожарной безопасности —
            огнестойкий ГКЛО розового цвета.
          </p>
        </template>
      </WorkTypeOverview>
    </section>

    <!-- ==================== 5. СРАВНЕНИЕ МЕТОДОВ ==================== -->
    <section id="methods" class="page-section">
      <MethodComparison
        title="Что <span>выбрать</span>: клей, каркас или штукатурку?"
        subtitle="Каждый способ подходит для разных задач. Разберём плюсы, минусы и сценарии применения."
        :methods="comparisonMethods"
        :price-data="sections"
        summary="Не уверены, что подойдёт именно вам? <strong>Инженер бесплатно приедет на замер</strong>, оценит кривизну стен и предложит оптимальный вариант по цене и срокам."
      />
    </section>

    <!-- ==================== 6. ТИПЫ МАТЕРИАЛОВ ==================== -->
    <section id="materials" class="page-section page-section--light">
      <MaterialsGuide
        title="Какой <span>гипсокартон</span> выбрать: типы и различия"
        subtitle="Не все листы одинаковы. Рассказываем, какой материал подойдёт под вашу задачу — и когда стоит переплатить за ГВЛ."
        :materials="gklMaterials"
        :thicknesses="gklThicknesses"
        summary="Для офисов и жилых комнат достаточно <strong>ГКЛ 12,5 мм</strong>. Для санузлов и кухонь — <strong>ГКЛВ</strong>. Если планируете вешать тяжёлые шкафы или делать пол — берите <strong>ГВЛ</strong>: он дороже, но в разы прочнее. Точную комплектацию инженер посчитает на бесплатном замере."
      />
    </section>

    <!-- ==================== 7. ВТОРОЙ СЛОЙ ГКЛ ==================== -->
    <section id="insights" class="page-section">
      <TechnicalInsights
        title="Зачем нужен <span>второй слой</span> гипсокартона"
        subtitle="Объясняем простыми словами, почему в большинстве случаев одного слоя недостаточно."
        :insights="technicalInsights"
        :comparison-images="[
          {
            src: '/main/vidy-rabot/gkl/1layer.webp',
            label: '1 слой ГКЛ',
            alt: 'Обшивка стен одним слоем гипсокартона',
          },
          {
            src: '/main/vidy-rabot/gkl/2layers.webp',
            label: '2 слоя ГКЛ',
            alt: 'Обшивка стен двумя слоями гипсокартона',
          },
        ]"
        summary="Второй слой добавляет <strong>~200 ₽/м²</strong> к стоимости работ, но это плата за стены, которые не треснут через год. Особенно важно для новостроек (усадка), офисов с высокой проходимостью и стен под покраску."
      >
        <template #content>
          <h3>Один слой vs два слоя</h3>
          <div class="comparison-table">
            <div class="comparison-row comparison-row--header">
              <span>Параметр</span>
              <span>1 слой</span>
              <span>2 слоя</span>
            </div>
            <div class="comparison-row">
              <span>Трещины по швам</span>
              <span data-label="1 слой">Возможны при усадке</span>
              <span data-label="2 слоя" class="comparison-better">Исключены</span>
            </div>
            <div class="comparison-row">
              <span>Прочность на удар</span>
              <span data-label="1 слой">Базовая</span>
              <span data-label="2 слоя" class="comparison-better">В 2-3 раза выше</span>
            </div>
            <div class="comparison-row">
              <span>Звукоизоляция</span>
              <span data-label="1 слой">~40 дБ</span>
              <span data-label="2 слоя" class="comparison-better">~52 дБ</span>
            </div>
            <div class="comparison-row">
              <span>Для покраски</span>
              <span data-label="1 слой">Не рекомендуется</span>
              <span data-label="2 слоя" class="comparison-better">Подходит</span>
            </div>
            <div class="comparison-row">
              <span>Цена работы</span>
              <span data-label="1 слой">1600 ₽/м²</span>
              <span data-label="2 слоя" class="comparison-better">1800 ₽/м²</span>
            </div>
          </div>
        </template>
      </TechnicalInsights>
    </section>

    <!-- ==================== 8. ПРЕДПРОСМОТР ЦЕН ==================== -->
    <section id="price-list" class="page-section">
      <PriceListTable
        title="Полный прайс: <span>обшивка стен ГКЛ</span>"
        subtitle="Все работы по монтажу гипсокартона на стены. Точная смета — после бесплатного замера."
        :sub-category-ids="[279, 370]"
        footer-note="* Цены указаны за работу без учёта стоимости материалов. Доплаты отмечены знаком «+ к цене». Короба считаются в погонных метрах."
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
        title="Калькулятор <span>стоимости</span> монтажа ГКЛ"
        subtitle="Выберите тип монтажа и площадь — получите предварительную смету сразу."
        :tabs="calculatorTabs"
        :loading="pricePending"
        :default-area="20"
        @order-estimate="scrollToCta"
      />
    </section>

    <!-- ==================== 11. ЭТАПЫ РАБОТ ==================== -->
    <section id="stages" class="page-section page-section--light">
      <WorkStagesTimeline
        title="Как <span>мы работаем</span>: 6 этапов"
        subtitle="От звонка до сдачи готовых стен под отделку"
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
        id-prefix="oblitsovka-gkl-faq"
      />
    </section>

    <!-- ==================== 14. ПОРТФОЛИО ==================== -->
    <section id="portfolio" class="page-section">
      <BeforeAfterGallery
        title="Наши работы: <span>стены из ГКЛ</span>"
        :slugs="projectSlugs"
      />
    </section>

    <!-- ==================== 15. ПРОЕКТЫ ==================== -->
    <section id="projects" class="page-section page-section--light">
      <ProjectsShowcase
        title="Наши реализованные проекты <span>для бизнеса в Рязани</span>"
        :slugs="projectSlugs"
      />
    </section>

    <!-- ==================== 16. ДРУГИЕ ГКЛ РАБОТЫ ==================== -->
    <section id="related" class="page-section">
      <RelatedWorkTypes
        title="Другие <span>гипсокартонные работы</span>"
        subtitle="Каждый вид работ — на отдельной странице с подробным описанием, ценами и калькулятором."
        :items="gklWorkTypes"
        :price-data="sections"
      />
    </section>

    <!-- ==================== 17. CTA ==================== -->
    <section id="cta" class="page-section page-section--light">
      <ApplicationCTA
        title="Рассчитайте <span>точную стоимость</span> вашего объекта"
        subtitle="Оставьте заявку — инженер бесплатно приедет на замер, оценит кривизну стен и подготовит детальную смету."
        phone="+7 (910) 909-69-47"
        telegram="@glavprofii"
        id-prefix="oblitsovka-gkl-cta"
        :custom-fields="customFields"
        :message-config="messageConfig"
      />
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

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
} from '../data/pages/oblitsovka-gkl'

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
// ХЛЕБНЫЕ КРОШКИ
// ============================================================
const breadcrumbItems = [
  { label: 'Главная', to: '/' },
  { label: 'Виды работ', to: '/remont-pomescheniy' },
  { label: 'Облицовка стен', to: '/vidy-rabot/oblitsovka-gkl' },
  { label: 'Обшивка стен ГКЛ' },
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
// КАЛЬКУЛЯТОР
// ============================================================
const { sections, pending: pricePending } = usePriceFetcher()

const findWorkById = (id: number): NormalizedWorkItem | undefined => {
  const allWorks = Object.values(sections.value).flatMap(section => [
    ...section.standard,
    ...section.piece
  ])
  return allWorks.find(w => w.id === id)
}

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
  faq: faqItems,
})
</script>

<style lang="scss" scoped>
@use '@/assets/styles/variables' as *;
@use '@/assets/styles/mixins' as *;

.page-oblitsovka-gkl {
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