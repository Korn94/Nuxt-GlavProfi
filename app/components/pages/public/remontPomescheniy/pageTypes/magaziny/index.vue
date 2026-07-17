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
        title="Что упускают при ремонте магазинов — <span>и теряют покупателей</span>"
        subtitle="Ремонт магазина — это не офис и не квартира. Цена ошибки здесь измеряется не только в рублях переделки, но и в потерянном товарообороте, закрытии точки и штрафных предписаниях. Ниже — типовые просчёты в проектах магазинов и то, как их избежать ещё до начала работ."
        :groups="riskGroups"
        footer-note="Риск, о котором не предупредили на старте, в магазинах стоит в разы дороже — на кону не только деньги, но и поток покупателей.<br />Поэтому мы проводим аудит объекта и проекта до подписания договора — и фиксируем всё, что может «выстрелить» через месяц после открытия."
        id-prefix="magaziny-risk"
      />
    </section>

    <!-- ==================== БЛОК 6: ПРОЕКТЫ ==================== -->
    <section id="projects" class="page-section">
      <ProjectsShowcase
        title="Наши реализованные проекты <span>магазинов и торговых помещений в Рязани</span>"
        :slugs="projectSlugs"
      />
    </section>

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

// === Риски (6 карточек) ===
const riskGroups: RiskGroup[] = [
  {
    name: 'Планировка и потоки',
    icon: 'mdi:store-outline',
    cards: [
      {
        title: 'Не учитывают логистику товара и потоки покупателей',
        icon: 'mdi:map-marker-path',
        mistake: 'Делают планировку «как красиво», без учёта движения покупателей, тележек, разгрузки товара и хранения.',
        consequence: 'Узкие проходы, очереди на кассе, травмы покупателей, товар не поступает на полки вовремя. Сотрудники тратят время на обход препятствий, а не на продажи.',
        solution: 'Проектируем торговый зал по принципу «пути покупателя» и «пути товара» — без пересечений. Ширина проходов — по СП 118.13330 для торговых объектов. Зона разгрузки и склад изолированы от торгового зала.',
      },
      {
        title: 'Экономят на полах',
        icon: 'mdi:layers-outline',
        mistake: 'Ставят обычный ламинат или бытовую плитку, чтобы снизить смету на старте.',
        consequence: 'Через 3–4 месяца плитка трескается под тележками, ламинат вздувается от ежедневной влажной уборки. Переделка — с закрытием магазина и потерей товарооборота на 2–3 недели.',
        solution: 'Используем только коммерческий керамогранит класса PEI IV–V и антистатический линолеум с заводом на стену. Все швы — герметизируем. Гарантия на полы — 3 года.',
      },
    ],
  },
  {
    name: 'Инженерия и безопасность',
    icon: 'mdi:flash-outline',
    cards: [
      {
        title: 'Не согласовывают пожарные требования на старте',
        icon: 'mdi:fire-alert',
        mistake: 'Сначала делают ремонт, потом идут в МЧС за согласованием. Или покупают материалы без сертификатов огнестойкости.',
        consequence: 'Ширина эвакуационных проходов не соответствует нормам, материалы не имеют сертификатов — магазин не открывается или получает предписание на закрытие. Переделка и штрафы обходятся дороже, чем первоначальный проект.',
        solution: 'Ещё на этапе эскиза собираем требования МЧС, проверяем ширину проходов, класс огнестойкости отделки, планировку эвакуационных выходов. Все материалы — только с сертификатами пожарной безопасности.',
      },
      {
        title: 'Не предусматривают инженерные выводы под оборудование',
        icon: 'mdi:power-plug-outline',
        mistake: 'Делают стандартную разводку электрики и воды, без учёта холодильников, кофемашин, печей, кассовых зон.',
        consequence: 'При установке оборудования не хватает мощности, нет воды, нет слива. Приходится вскрывать полы и стены, останавливать торговлю на 3–5 дней.',
        solution: 'На этапе проекта согласуем спецификацию оборудования с заказчиком и делаем отдельные выводы под каждую точку: электрика с запасом мощности, вода, канализация, вентиляция. Оставляем 30% резерва в щите под расширение ассортимента.',
      },
      {
        title: 'Делают витрины без учёта освещённости и экспозиции',
        icon: 'mdi:ceiling-light-outline',
        mistake: 'Ставят одинаковые светильники везде, без привязки к типу товара и выкладке.',
        consequence: 'Товар выглядит блёклым, покупатели не останавливаются у витрин, продажи падают. Продукты портятся под неправильным светом, одежда теряет цвет.',
        solution: 'Подбираем спектр и освещённость под тип товара: тёплый свет для выпечки, холодный — для ювелирки, высокий CRI для одежды. Делаем акцентную подсветку витрин и полок, раздельное управление сценариями.',
      },
    ],
  },
  {
    name: 'Процесс и сроки',
    icon: 'mdi:calendar-clock',
    cards: [
      {
        title: 'Меняют решения в процессе ремонта',
        icon: 'mdi:pencil-off-outline',
        mistake: 'В середине работ решают «перенести кассу», «расширить склад», «добавить зону самообслуживания».',
        consequence: 'Ломаются смежные этапы, приходится переделывать уже готовые участки, растут сроки и смета. Открытие откладывается на недели.',
        solution: 'Фиксируем ключевые параметры (расстановка оборудования, габариты зон, отметки проёмов) в приложении к договору. Любые изменения — через допсоглашение с расчётом влияния на сроки и стоимость.',
      },
    ],
  },
]

// === Проекты ===
const projectSlugs = ['zerno']

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