<!-- app/components/pages/public/remontPomescheniy/pageTypes/ofisy/index.vue -->
 <template>
  <div class="page-ofisy">
    <!-- ==================== БЛОК 1: HERO ==================== -->
    <PageHero
      title="Ремонт офисов в Рязани с <span>фиксированной сметой</span> и сроком"
      subtitle="Сдаём офис, в который можно заехать и работать: с готовой планировкой, инженерией и отделкой. Работаем по вашему проекту или составляем ТЗ с нуля. Смета и срок фиксируются в договоре."
    >
      <template #background>
        <BeforeAfterSlider
          before-image="/main/2.jpg"
          after-image="/main/2-1.jpg"
          before-alt="Офис до ремонта"
          after-alt="Офис после ремонта"
          :dimming="true"
          :duration="10000"
          :pause-on-hover="false"
          :pause-at-edges="2000"
        />
      </template>

      <template #price>
        <span class="price-main">от 11 000 ₽/м²</span>
        <span class="price-example">100 м²: ~1.1–1.6 млн ₽</span>
        <span class="price-note">В стоимость входят работы без материалов</span>
      </template>

      <template #form>
        <MiniEstimateForm
          room-type="ofisy"
          :default-area="100"
          @submit="onMiniFormSubmit"
        />
      </template>

      <template #triggers>
        <span class="trigger-item">
          <Icon name="mdi:clock-fast" class="trigger-icon" size="18" />
          Работаем без простоя вашего бизнеса
        </span>
        <span class="trigger-item">
          <Icon name="mdi:file-check-outline" class="trigger-icon" size="18" />
          Смета фиксируется в договоре
        </span>
        <span class="trigger-item">
          <Icon name="mdi:account-hard-hat" class="trigger-icon" size="18" />
          Штатные бригады — один прораб отвечает за весь объект
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
            { label: 'Офисы' }
          ]"
        />
      </template>
      <template #nav>
        <StickyNav :items="navItems" :scroll-offset="110" label="На странице" />
      </template>
    </NavBreadcrumbsRow>

    <!-- ==================== БЛОК 2: STICKY NAV ==================== -->
    <!-- <StickyNav :items="navItems" :scroll-offset="110" /> -->

    <!-- ==================== БЛОК 3: ВАРИАНТЫ РЕМОНТА ==================== -->
    <section id="repair-types" class="page-section">
      <RepairTypes
        title="Варианты ремонта офиса <span>и от чего зависит цена</span>"
        :variants="repairVariants"
      />

      <PriceFactors
        title="От чего зависит <span>цена за м²</span>"
        :factors="priceFactors"
        footer-note="Ориентир по цене: <strong>от 3 000 ₽/м²</strong> для косметического ремонта, <strong>от 14 000 ₽/м²</strong> для капитального. Без стоимости материалов. Точную смету инженер подготовит после выезда на объект — это бесплатно и ни к чему не обязывает."
      />
    </section>

    <!-- ==================== БЛОК 4: КАЛЬКУЛЯТОР ==================== -->
    <section id="calculator" class="page-section page-section--light">
      <div class="calculator-wrap">
        <header class="calculator-header">
          <h2 class="calculator-title">Калькулятор сметы онлайн</h2>
          <p class="calculator-subtitle">
            Рассчитайте предварительную стоимость ремонта вашего офиса за 1 минуту.
            Введите площадь, выберите тип ремонта и получите ориентировочную смету.
            Точный расчёт — после бесплатного выезда инженера.
          </p>
        </header>
        <UiCalculator />
      </div>
    </section>

    <!-- ==================== БЛОК 5: РИСКИ ==================== -->
    <section id="risks" class="page-section">
      <RisksSection
        title="Что упускают при планировании ремонта офиса — <span>и платят дважды</span>"
        subtitle="За 12 лет мы приняли десятки офисов после других подрядчиков. Ошибки повторяются — и почти всегда их можно было избежать на этапе проекта. Вот что мы проверяем в первую очередь, чтобы смета не выросла после сдачи."
        :groups="riskGroups"
        footer-note="Риск, о котором не предупредили на старте, всегда дороже, чем строка в смете.<br />Поэтому мы проводим аудит объекта до подписания договора — и фиксируем всё, что может «выстрелить» через полгода."
      />
    </section>

    <!-- ==================== БЛОК 6: ПРОЕКТЫ ==================== -->
    <section id="projects" class="page-section">
      <ProjectsShowcase
        title="Наши реализованные проекты <span>для бизнеса в Рязани</span>"
        :slugs="projectSlugs"
      />
    </section>
    
    <!-- ==================== БЛОК 8: CTA ==================== -->
    <section id="cta" class="page-section">
      <ApplicationCTA
      title="Получите смету и аудит рисков <span>за 24 часа</span>"
        subtitle="Загрузите план или опишите задачу. Инженер найдёт слабые места и подготовит детальный расчёт. Консультация бесплатна."
        phone="+7 (910) 909-69-47"
        telegram="@glavprofii"
        max="https://max.ru/u/f9LHodD0cOLfbBSpAeCwHBcJ83SJtKVj9mVKY7K8OLd6OwYB0gH6g3XE_Cs"
        source-label="Ремонт офисов в Рязани — CTA"
        subject-title="Заявка на смету ремонта офиса"
        />
      </section>
      
      <!-- ==================== БЛОК 7: FAQ ==================== -->
      <section id="faq" class="page-section">
        <FAQBlock
          title="Ответы на <span>частые вопросы</span>"
          :items="faqItems"
        />
      </section>
  </div>
</template>

<script setup lang="ts">
// === UI-компоненты pageTypes ===
import PageHero from '../ui/PageHero.vue'
import StickyNav from '../ui/StickyNav.vue'
import BeforeAfterSlider from '../ui/BeforeAfterSlider.vue'
import MiniEstimateForm from '../ui/MiniEstimateForm.vue'
import RepairTypes from '../ui/RepairTypes.vue'
import PriceFactors from '../ui/PriceFactors.vue'
import RisksSection from '../ui/RisksSection.vue'
import ProjectsShowcase from '../ui/ProjectsShowcase.vue'
import FAQBlock from '../ui/FAQBlock.vue'
import ApplicationCTA from '../ui/ApplicationCTA.vue'
import Breadcrumbs from '../ui/Breadcrumbs.vue'
import NavBreadcrumbsRow from '../ui/NavBreadcrumbsRow.vue'


// === Типы данных ===
import type { RepairVariant } from '../ui/RepairTypes.vue'
import type { PriceFactor } from '../ui/PriceFactors.vue'
import type { RiskGroup } from '../ui/RisksSection.vue'
import type { FAQItem } from '../ui/FAQBlock.vue'
import type { StickyNavItem } from '../ui/StickyNav.vue'

// === Навигация ===
const navItems: StickyNavItem[] = [
  { id: 'repair-types', label: 'Варианты ремонта', icon: 'mdi:format-paint' },
  { id: 'calculator', label: 'Калькулятор сметы', icon: 'mdi:calculator' },
  { id: 'risks', label: 'Риски', icon: 'mdi:alert-circle-outline' },
  { id: 'projects', label: 'Проекты', icon: 'mdi:briefcase-outline' },
  { id: 'cta', label: 'Оставить заявку', icon: 'mdi:send-outline' },
  { id: 'faq', label: 'Вопросы', icon: 'mdi:help-circle-outline' },
]

// === Варианты ремонта ===
const repairVariants: RepairVariant[] = [
  {
    title: 'Косметический',
    lead: 'Для офисов в хорошем состоянии, когда нужно освежить интерьер без перепланировки и замены коммуникаций.',
    works: [
      'Покраска стен',
      'Замена напольного покрытия',
      'Отделка потолков',
      'Мелкий ремонт',
    ],
    duration: 'от 2 недель',
    price: 'от 3 000 ₽/м²',
    icon: 'mdi:format-paint',
  },
  {
    title: 'Капитальный',
    lead: 'Когда помещение требует полной реконструкции или вы въезжаете в новое здание.',
    works: [
      'Полная замена отделки',
      'Перепланировка',
      'Выравнивание оснований',
      'Черновые и чистовые работы',
    ],
    duration: 'от 1,5 месяцев',
    price: 'от 11 000 ₽/м²',
    icon: 'mdi:hammer-wrench',
    featured: true,
    badge: 'Для новых помещений',
  },
]

// === Факторы цены ===
const priceFactors: PriceFactor[] = [
  {
    title: 'Состояние помещения',
    description: '«Бетон» или старая отделка требуют разного объёма подготовки — стяжка, штукатурка, выравнивание.',
    icon: 'mdi:wall',
  },
  {
    title: 'Объём демонтажа',
    description: 'Нужно ли снимать старые перегородки, покрытия, коммуникации — это отдельные работы и время.',
    icon: 'mdi:delete-outline',
  },
  {
    title: 'Сложность геометрии',
    description: 'Высокие потолки, ниши, колонны, кривые стены — увеличивают время на разметку и подгонку материалов.',
    icon: 'mdi:vector-polygon',
  },
  {
    title: 'Материалы',
    description: 'Стоимость работ фиксирована, но итоговый бюджет зависит от выбранных покрытий (эконом / бизнес / премиум). Закупаем по оптовым ценам.',
    icon: 'mdi:palette-outline',
  },
  {
    title: 'График работ',
    description: 'Стандартный график или ускоренный (с увеличением состава бригад) — влияет на стоимость человеко-часов.',
    icon: 'mdi:calendar-clock',
  },
]

// === Риски (2 группы × 3 карточки) ===
const riskGroups: RiskGroup[] = [
  {
    name: 'Инженерные системы',
    icon: 'mdi:flash-outline',
    cards: [
      {
        title: 'Розетки и эргономика',
        icon: 'mdi:power-plug-outline',
        mistake: 'Розетки закладывают строго под текущую расстановку мебели — 1–2 на стену.',
        consequence: 'При перестановке столов или найме новых сотрудников начинаются проблемы с питанием. Удлинители и тройники тянутся через проходы, провода путаются под ногами. Офис выглядит неопрятно, возрастает риск травм и выхода техники из строя.',
        solution: 'Проектируем розеточную сеть с привязкой к функциональным зонам, а не только к мебели. Закладываем запас 30% от текущего количества рабочих мест. Используем напольные лючки и кабель-каналы — перестановка не потребует штробления.',
      },
      {
        title: 'Электрощит и мощность',
        icon: 'mdi:transmission-tower',
        mistake: 'Щиток собирают ровно под текущую нагрузку, без резерва.',
        consequence: 'Через год купили сервер, мощный кондиционер или кофемашину — автоматы выбивает. Нет свободного места в щите, приходится вскрывать стены, менять вводной кабель. Офис встанет на 3–5 дней.',
        solution: 'Рассчитываем выделенную мощность с учётом пиковых нагрузок и будущего оборудования. Оставляем в щите 20–30% свободных модулей под расширение. Используем кабель с запасом по сечению, чтобы избежать перегрева и переделки проводки при росте энергопотребления.',
      },
      {
        title: 'Вентиляция и кондиционирование',
        icon: 'mdi:air-conditioner',
        mistake: 'Перегородки возводят без пересчёта воздухообмена.',
        consequence: 'В новых кабинетах становится душно, сотрудники испытывают головную боль и усталость, эффективность падает. Общая система не справляется с изменившейся планировкой, а переделка воздуховодов после ремонта — это демонтаж потолка и новая смета.',
        solution: 'На этапе проектирования проверяем совместимость новой планировки с действующей вентиляцией. Заранее предупреждаем о рисках и необходимости корректировки системы, чтобы стоимость доработок была зафиксирована в смете до старта работ, а не стала сюрпризом после сдачи.',
      },
    ],
  },
  {
    name: 'Отделка и комфорт',
    icon: 'mdi:sofa-outline',
    cards: [
      {
        title: 'Подготовка оснований',
        icon: 'mdi:layers-outline',
        mistake: 'Экономят на выравнивании пола и стен, чтобы снизить смету.',
        consequence: 'Через полгода линолеум идёт волнами, плитка отклеивается, мебель шатается на кривом полу. Переделка стоит в 2–3 раза дороже своевременной подготовки.',
        solution: 'Контролируем геометрию лазерным нивелиром на каждом этапе. Выравниваем основания по СНиП до укладки чистовых материалов. Гарантия на подготовительные работы — 3 года.',
      },
      {
        title: 'Звукоизоляция переговорных',
        icon: 'mdi:volume-off',
        mistake: 'Ставят обычные гипсокартонные перегородки без минваты и акустических уплотнителей — так дешевле.',
        consequence: 'Разговоры в переговорной слышны во всём офисе. Зарплатные переговоры, разговоры с клиентами, совещания совета директоров — всё становится достоянием офиса.',
        solution: 'Используем двойную обшивку, звукопоглощающие плиты и уплотнители по контуру. Разговор на повышенных тонах не будет слышен в соседнем кабинете.',
      },
      {
        title: 'Освещение и сценарии',
        icon: 'mdi:ceiling-light-outline',
        mistake: 'Ставят одинаковые светильники везде, без привязки к задачам зон. Нет раздельного управления.',
        consequence: 'В open-space бликует на мониторах, в переговорной слишком ярко для презентаций, в зонах отдыха невозможно расслабиться. Сотрудники устают к обеду.',
        solution: 'Подбираем цветовую температуру и рассеиватели под задачу зоны. Делаем раздельное управление: днём гасим свет у окон, в переговорной включаем сценарий «презентация», в зоне отдыха — мягкий акцентный.',
      },
    ],
  },
]

// === Проекты (slugs) ===
const projectSlugs = ['ddx', 'klinika-alma']

// === FAQ ===
const faqItems: FAQItem[] = [
  {
    question: 'Можно ли делать ремонт, если в офисе работают люди?',
    answer: 'Да. Шумные работы (демонтаж, штробление, стяжку) переносим на вечер или выходные. Днём занимаемся тихими этапами: покраска, сборка, монтаж. График согласуем с вами заранее, чтобы бизнес не останавливался.',
  },
  {
    question: 'Как фиксируется смета — не вырастет ли цена в процессе?',
    answer: 'Все изменения — только через дополнительное соглашение с вашей подписью. Итоговая сумма в акте всегда совпадает с договором.',
  },
  {
    question: 'Кто закупает материалы — вы или мы?',
    answer: 'Как удобнее вам. Можете купить сами по своей спецификации — мы просто монтируем. Или доверите закупку нам: возьмём на себя логистику, проверим качество на входе и предоставим чеки/накладные.',
  },
  {
    question: 'Какая гарантия на работы?',
    answer: '3 года по договору. Если в этот период что-то отклеится, потрескается или потребует регулировки — приедем и исправим за свой счёт. Гарантийный акт и исполнительную документацию передаём вместе с ключами. Гарантия распространяется и на скрытые дефекты, которые могут проявиться со временем.',
  },
]

// === Аналитика (опционально) ===
const onMiniFormSubmit = (data: unknown) => {
  console.log('[ofisy] Быстрая заявка:', data)
  // Здесь можно дёрнуть цель Я.Метрики:
  // ym(XXXXXX, 'reachGoal', 'office_quick_estimate')
}
</script>

<style lang="scss" scoped>
@use '@/assets/styles/variables' as *;

.page-ofisy {
  background: $background-dark;
  color: $text-light;
}

// Общие обёртки секций (для якорных ID + фоновые чередования)
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