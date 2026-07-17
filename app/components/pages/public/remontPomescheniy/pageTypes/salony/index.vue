<!-- app/components/pages/public/remontPomescheniy/pageTypes/salony/index.vue -->
<template>
  <div class="page-salony">
    <!-- ==================== БЛОК 1: HERO ==================== -->
    <PageHero
      title="Ремонт салонов красоты и <span>барбершопов</span> в Рязани: СанПиН, вентиляция, освещение"
      subtitle="Выполняем отделку салонов красоты, барбершопов и nail-студий с учётом специфики индустрии. Проектируем вентиляцию под химию, подвод воды к каждому рабочему месту, освещение с высоким CRI для мастеров и мокрые зоны с правильной гидроизоляцией. Перед стартом проводим аудит помещения и находим решения, чтобы вы не переплачивали за переделки. Смета и срок фиксируются в договоре."
    >
      <template #background>
        <BeforeAfterSlider
          before-image="/main/8.jpg"
          after-image="/main/8-1.jpg"
          before-alt="Салон красоты до ремонта"
          after-alt="Салон красоты после ремонта"
          :dimming="true"
          :duration="10000"
          :pause-on-hover="false"
          :pause-at-edges="2000"
        />
      </template>

      <template #price>
        <span class="price-main">от 15 000 ₽/м²</span>
        <span class="price-example">100 м²: ~1.5–2.2 млн ₽</span>
        <span class="price-note">В стоимость входят работы без материалов</span>
      </template>

      <template #form>
        <MiniEstimateForm
          room-type="salony"
          :default-area="100"
          :repair-types="repairTypes"
          id-prefix="salony-mini"
          @submit="onMiniFormSubmit"
        />
      </template>

      <template #triggers>
        <span class="trigger-item">
          <Icon name="mdi:shield-check-outline" class="trigger-icon" size="18" />
          Знаем СанПиН 2.1.3678-20 для салонов красоты
        </span>
        <span class="trigger-item">
          <Icon name="mdi:clock-fast" class="trigger-icon" size="18" />
          Работаем без остановки приёма клиентов
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
            { label: 'Салоны красоты' }
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
        title="Варианты ремонта салона красоты <span>и от чего зависит цена</span>"
        :variants="repairVariants"
      />

      <PriceFactors
        title="Из чего складывается <span>цена ремонта</span> салона красоты"
        :factors="priceFactors"
        footer-note="Ориентир по цене: <strong>от 9 000 ₽/м²</strong> для косметического ремонта, <strong>от 15 000 ₽/м²</strong> для капитального. Без стоимости материалов. Точную смету инженер подготовит после бесплатного выезда на объект — это ни к чему вас не обязывает."
      />
    </section>

    <!-- ==================== БЛОК 4: КАЛЬКУЛЯТОР ==================== -->
    <section id="calculator" class="page-section page-section--light">
      <div class="calculator-wrap">
        <header class="calculator-header">
          <h2 class="calculator-title">Калькулятор сметы онлайн</h2>
          <p class="calculator-subtitle">
            Рассчитайте предварительную стоимость ремонта вашего салона красоты за 1 минуту.
            Введите площадь, профиль салона и тип ремонта — получите ориентировочную смету.
            Точный расчёт — после бесплатного выезда инженера с проверкой на соответствие СанПиН.
          </p>
        </header>
        <UiCalculator />
      </div>
    </section>

    <!-- ==================== БЛОК 5: РИСКИ ==================== -->
    <section id="risks" class="page-section">
      <RisksSection
        title="Что упускают при ремонте салонов красоты — <span>и получают отказ в согласовании</span>"
        subtitle="Ремонт салона красоты — это не офис и не квартира. Цена ошибки здесь измеряется не только в рублях переделки, но и в предписаниях Роспотребнадзора, потере клиентов и порче дорогого оборудования. Ниже — типовые просчёты в проектах салонов и то, как их избежать ещё до начала работ."
        :groups="riskGroups"
        footer-note="Риск, о котором не предупредили на старте, в салонах красоты стоит в разы дороже — на кону не только деньги, но и здоровье клиентов, репутация и лицензия.<br />Поэтому мы проводим аудит объекта и проекта до подписания договора — и фиксируем всё, что может «выстрелить» при проверке."
        id-prefix="salony-risk"
      />
    </section>

    <section id="before-after" class="page-section">
      <BeforeAfterGallery
        :slugs="projectSlugs"
        title="Фото <span>до и после</span> ремонта"
      />
    </section>

    <section id="brands" class="page-section">
      <PagesPublicHomePageBrands />
    </section>

    <!-- ==================== БЛОК 6: ПРОЕКТЫ ==================== -->
    <section id="projects" class="page-section">
      <ProjectsShowcase
        title="Наши реализованные проекты <span>салонов красоты и барбершопов в Рязани</span>"
        :slugs="projectSlugs"
      />
    </section>

    <!-- ==================== БЛОК 8: CTA ==================== -->
    <section id="cta" class="page-section">
      <ApplicationCTA
        title="Получите смету и аудит на соответствие СанПиН <span>за 24 часа</span>"
        subtitle="Загрузите план или опишите задачу. Инженер проверит помещение на соответствие требованиям Роспотребнадзора, найдёт слабые места и подготовит детальный расчёт. Консультация бесплатна."
        phone="+7 (910) 909-69-47"
        telegram="@glavprofii"
        max="https://max.ru/u/f9LHodD0cOLfbBSpAeCwHBcJ83SJtKVj9mVKY7K8OLd6OwYB0gH6g3XE_Cs"
        id-prefix="salony-cta"
        :custom-fields="customFields"
        :message-config="messageConfig"
      />
    </section>

    <!-- ==================== БЛОК 7: FAQ ==================== -->
    <section id="faq" class="page-section">
      <FAQBlock
        title="Ответы на <span>частые вопросы</span>"
        :items="faqItems"
        id-prefix="salony-faq"
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

// === Варианты ремонта (специфичные для салонов красоты) ===
const repairTypes = [
  { value: 'cosmetic', label: 'Косметический', icon: 'mdi:format-paint' },
  { value: 'capital', label: 'Капитальный', icon: 'mdi:hammer-wrench' },
  { value: 'turnkey', label: 'Под ключ', icon: 'mdi:key-variant' },
  { value: 'single-cabinet', label: 'Отдельные кабинеты', icon: 'mdi:door' },
]

const repairVariants: RepairVariant[] = [
  {
    title: 'Косметический',
    lead: 'Для действующих салонов, когда нужно обновить интерьер без изменения зонирования и замены инженерных систем.',
    works: [
      'Покраска стен химстойкими составами',
      'Замена напольного покрытия',
      'Обновление потолков и освещения',
      'Ремонт зоны ресепшена и зала ожидания',
    ],
    duration: 'от 2 недель',
    price: 'от 9 000 ₽/м²',
    icon: 'mdi:format-paint',
  },
  {
    title: 'Капитальный',
    lead: 'Когда салон открывается в новом помещении или требуется полная реконструкция с перепрофилированием кабинетов.',
    works: [
      'Полная замена отделки всех помещений',
      'Перепланировка с зонированием рабочих мест и мокрых зон',
      'Черновые и чистовые работы',
      'Перекладка инженерных систем под оборудование',
      'Многослойная гидроизоляция мокрых зон',
    ],
    duration: 'от 1,5 месяцев',
    price: 'от 15 000 ₽/м²',
    icon: 'mdi:hammer-wrench',
    featured: true,
    badge: 'Полная реконструкция',
  },
  {
    title: 'Под ключ',
    lead: 'Полный цикл: проект, ремонт, инженерия, подбор и монтаж оборудования, подготовка пакета документов для Роспотребнадзора.',
    works: [
      'Проектирование по СанПиН',
      'Полный цикл ремонтных работ',
      'Инженерия под оборудование (солярии, лазеры, автоклавы)',
      'Подготовка документов для Роспотребнадзора',
    ],
    duration: 'от 2 месяцев',
    price: 'от 17 000 ₽/м²',
    icon: 'mdi:key-variant',
    badge: 'Под ключ',
  },
]

// === Факторы цены ===
const priceFactors: PriceFactor[] = [
  {
    title: 'Профиль салона',
    description: 'Парикмахерская, барбершоп, nail-студия, многопрофильный салон или SPA — у каждого типа свои нормативы по вентиляции, отделке и инженерии.',
    icon: 'mdi:content-cut',
  },
  {
    title: 'Мокрые зоны',
    description: 'Мойки для волос, педикюрные кабинеты, стерилизационные требуют отдельных подводок воды, канализации и многослойной гидроизоляции — это отдельные статьи сметы.',
    icon: 'mdi:water',
  },
  {
    title: 'Освещение и цветопередача',
    description: 'Для мастеров критически важен высокий CRI (индекс цветопередачи) и правильная цветовая температура. Подбираем светильники под каждую зону: парикмахерскую, маникюрную, ресепшен.',
    icon: 'mdi:ceiling-light-outline',
  },
  {
    title: 'Вентиляция и вытяжки',
    description: 'Химия для окрашивания, кератина, ламинирования требует отдельной вытяжной вентиляции с повышенной кратностью воздухообмена — отдельно от общей системы.',
    icon: 'mdi:air-conditioner',
  },
  {
    title: 'Состояние помещения',
    description: '«Бетон» или старая отделка требуют разного объёма подготовки: стяжка, штукатурка, выравнивание под оборудование.',
    icon: 'mdi:wall',
  },
  {
    title: 'График работ',
    description: 'Стандартный график или работа в ночные смены, чтобы не останавливать приём клиентов — влияет на стоимость человеко-часов.',
    icon: 'mdi:calendar-clock',
  },
]

// === Риски (2 группы × 3 карточки) ===
const riskGroups: RiskGroup[] = [
  {
    name: 'Инженерные системы и СанПиН',
    icon: 'mdi:flash-outline',
    cards: [
      {
        title: 'Вентиляция под химию',
        icon: 'mdi:air-conditioner',
        mistake: 'Ставят обычную офисную вентиляцию, не предусматривая отдельные вытяжки над рабочими местами парикмахеров и nail-мастеров.',
        consequence: 'Пары химии (аммиак, формальдегид, акриловая пудра) накапливаются в помещении. Мастера жалуются на головную боль, клиенты — на резкий запах. При проверке Роспотребнадзор выписывает предписание на приостановку деятельности.',
        solution: 'Проектируем приточно-вытяжную вентиляцию с отдельными вытяжками над каждым рабочим местом парикмахера и nail-мастера. Кратность воздухообмена рассчитываем по СанПиН 2.1.3678-20. В стерилизационных — отдельная вытяжка. Сдаём объект с паспортом вентсистемы.',
      },
      {
        title: 'Водоснабжение под оборудование',
        icon: 'mdi:water-pump',
        mistake: 'Подводят одну точку воды на весь кабинет, не предусматривая подвод к каждой мойке, педикюрной ванне и стерилизатору.',
        consequence: 'Парикмахерская мойка, раковина для мастера, педикюрная ванна и сухожаровой шкаф требуют отдельных подводок. Переделка после укладки плитки и монтажа мебели — это вскрытие пола и стен.',
        solution: 'На этапе проекта согласуем схему подводок с расстановкой оборудования. Для каждой точки — свой подвод воды с запорной арматурой и сифон с разрывом струи по СанПиН. Канализация — с уклоном и прочистками в доступных местах.',
      },
      {
        title: 'Электрика под оборудование',
        icon: 'mdi:transmission-tower',
        mistake: 'Прокладывают обычную проводку без учёта мощности соляриев, лазерных аппаратов, автоклавов и ламп для маникюра.',
        consequence: 'При одновременном включении оборудования выбивает автоматы, проседает напряжение, выходит из строя дорогостоящая техника. Ремонт солярия — от 100 000 ₽, плюс простой кабинета.',
        solution: 'Рассчитываем выделенную мощность с учётом пиковых нагрузок. Закладываем отдельные линии для соляриев, лазеров и автоклавов, стабилизаторы на каждый контур. Оставляем 30% резерва в щите под новое оборудование.',
      },
    ],
  },
  {
    name: 'Отделка и комфорт',
    icon: 'mdi:sparkles',
    cards: [
      {
        title: 'Освещение и цветопередача',
        icon: 'mdi:ceiling-light-outline',
        mistake: 'Ставят обычные светильники без учёта индекса цветопередачи (CRI) и цветовой температуры.',
        consequence: 'Парикмахеры не могут точно подобрать цвет краски, nail-мастера — оттенок гель-лака. Клиенты получают не тот результат, что ожидали. Жалобы, возвраты, потеря репутации.',
        solution: 'Подбираем светильники с CRI 90+ для рабочих зон и правильную цветовую температуру (4000K для парикмахерской, 3000K для зоны отдыха). Делаем раздельное управление: основное, акцентное, декоративное. В маникюрной зоне — отдельные лампы над каждым столом.',
      },
      {
        title: 'Покрытия пола и стен',
        icon: 'mdi:palette-outline',
        mistake: 'Используют обычные обои, ламинат, гипсокартон без химической защиты — как в офисе.',
        consequence: 'Поверхности не выдерживают ежедневной дезинфекции хлорсодержащими средствами и агрессивной химией. Обои отклеиваются, ламинат вздувается, ГКЛ впитывает влагу и становится средой для плесени. Роспотребнадзор требует замены.',
        solution: 'Применяем только химстойкие материалы: моющиеся краски, коммерческий керамогранит, антистатический линолеум с заводом на стену, потолки типа «Армстронг» с моющимися кассетами. Все стыки герметизируются, углы — скруглены.',
      },
      {
        title: 'Мокрые зоны и гидроизоляция',
        icon: 'mdi:shower',
        mistake: 'Делают однослойную гидроизоляцию «как в квартире» в педикюрных кабинетах и стерилизационных.',
        consequence: 'Через полгода — протечки в соседние помещения, плесень под плиткой, вздутие отделки. Переделка мокрых зон — это полный демонтаж и новая смета.',
        solution: 'Многослойная гидроизоляция (2–3 слоя) с заводом на стены на 1,5 м, трапы с уклоном 1–2%, противоскользящая плитка класса R11. Перед укладкой плитки проводим гидравлические испытания гидроизоляции на 48 часов.',
      },
    ],
  },
]

// === Проекты ===
const projectSlugs = []

// === FAQ ===
const faqItems: FAQItem[] = [
  {
    question: 'Можно ли делать ремонт, если салон продолжает принимать клиентов?',
    answer: 'Да. Шумные и «грязные» работы (демонтаж, штробление, стяжка) переносим на ночные смены и выходные. Днём — тихие этапы: покраска, монтаж, сборка. Зоны работ изолируем герметичными перегородками, чтобы клиенты не контактировали со стройкой и не дышали пылью или парами химии.',
  },
  {
    question: 'Как фиксируется смета — не вырастет ли цена в процессе?',
    answer: 'Итоговая стоимость и сроки закрепляются в договоре и не меняются. Любые дополнительные работы оформляются только через официальное дополнительное соглашение с вашим предварительным согласованием. Если в процессе обнаруживаются скрытые дефекты — заранее согласуем решение и стоимость до начала работ.',
  },
  {
    question: 'Помогаете ли вы с согласованием по СанПиН для салонов красоты?',
    answer: 'Да. Ремонт ведём строго под требования СанПиН 2.1.3678-20 для салонов красоты и барбершопов. По завершении передаём исполнительную документацию, акты скрытых работ, паспорта на инженерные системы и сертификаты на материалы — всё, что нужно для Роспотребнадзора.',
  },
  {
    question: 'Кто закупает материалы — вы или мы?',
    answer: 'Как удобнее вам. Можете купить сами по своей спецификации — мы просто монтируем. Или доверите закупку нам: возьмём на себя логистику, проверим сертификаты соответствия для салонов красоты (химстойкость, огнестойкость, экологичность) и предоставим все документы.',
  },
  {
    question: 'Какие гарантии на работы?',
    answer: '3 года по договору на все строительно-отделочные работы, включая скрытые дефекты. Если в гарантийный срок что-то отклеится, потрескается, разгерметизируется гидроизоляция или потребует регулировки — приедем и исправим за свой счёт в согласованные сроки, не мешая работе салона.',
  },
  {
    question: 'Делаете ли вы отдельные кабинеты — например, только маникюр или солярий?',
    answer: 'Да. Можем выполнить ремонт одного кабинета или группы помещений в действующем салоне: с защитой, инженерией под конкретное оборудование и сдачей под ключ. Это частый запрос при расширении или переоборудовании.',
  },
]

const customFields = [
  {
    name: 'salonProfile',
    label: 'Профиль салона',
    type: 'tiles' as const,
    options: [
      { value: 'hairdresser', label: 'Парикмахерская', icon: 'mdi:content-cut' },
      { value: 'barbershop', label: 'Барбершоп', icon: 'mdi:razor-double-edge' },
      { value: 'nail-studio', label: 'Nail-студия', icon: 'mdi:hand-heart-outline' },
      { value: 'multidisciplinary', label: 'Многопрофильный', icon: 'mdi:store-outline' },
      { value: 'spa', label: 'SPA-салон', icon: 'mdi:spa' },
      { value: 'other', label: 'Другое', icon: 'mdi:dots-horizontal' },
    ],
  },
]

const messageConfig = {
  emoji: '💇',
  title: 'Заявка на ремонт салона красоты',
  sourceLabel: 'Ремонт салонов красоты в Рязани — CTA',
  fieldLabels: { salonProfile: 'Профиль салона' },
}

// === Аналитика ===
const onMiniFormSubmit = (data: unknown) => {
  console.log('[salony] Быстрая заявка:', data)
}
</script>

<style lang="scss" scoped>
@use '@/assets/styles/variables' as *;

.page-salony {
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