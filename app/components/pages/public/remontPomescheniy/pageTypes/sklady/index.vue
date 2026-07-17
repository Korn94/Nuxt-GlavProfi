<!-- app/components/pages/public/remontPomescheniy/pageTypes/sklady/index.vue -->
<template>
  <div class="page-sklady">
    <!-- ==================== БЛОК 1: HERO ==================== -->
    <PageHero
      title="Ремонт складов и <span>логистических центров</span> в Рязани: полы, зонирование, пожарная безопасность"
      subtitle="Выполняем отделку складов, логистических комплексов и мест хранения с учётом интенсивных нагрузок. Проектируем наливные полы с высокой несущей способностью, антипылевые покрытия, зонирование приёмки и отгрузки, ворота с док-левеллерами и пожарную безопасность. Перед стартом проводим аудит объекта и находим решения, чтобы вы не переплачивали за переделки. Смета и срок фиксируются в договоре."
    >
      <template #background>
        <BeforeAfterSlider
          before-image="/main/remont-pomescheniy/sklady.webp"
          after-image=""
          before-alt="Склад до ремонта"
          after-alt="Склад после ремонта"
          :dimming="true"
          :duration="0"
          :pause-on-hover="false"
          :pause-at-edges="2000"
        />
      </template>

      <template #price>
        <span class="price-main">от 8 500 ₽/м²</span>
        <span class="price-example">100 м²: ~0.9–1.3 млн ₽</span>
        <span class="price-note">В стоимость входят работы без материалов</span>
      </template>

      <template #form>
        <MiniEstimateForm
          room-type="sklady"
          :default-area="100"
          :repair-types="repairTypes"
          id-prefix="sklady-mini"
          @submit="onMiniFormSubmit"
        />
      </template>

      <template #triggers>
        <span class="trigger-item">
          <Icon name="mdi:floor-plan" class="trigger-icon" size="18" />
          Наливные полы под нагрузку от 5 т/м² с топпингом
        </span>
        <span class="trigger-item">
          <Icon name="mdi:fire-alert" class="trigger-icon" size="18" />
          Пожарная безопасность по СП 4.13130 и категорирование помещений
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
            { label: 'Склады' }
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
        title="Варианты ремонта склада <span>и от чего зависит цена</span>"
        :variants="repairVariants"
      />

      <PriceFactors
        title="Из чего складывается <span>цена ремонта</span> складского помещения"
        :factors="priceFactors"
        footer-note="Ориентир по цене: <strong>от 5 500 ₽/м²</strong> для косметического ремонта, <strong>от 8 500 ₽/м²</strong> для капитального. Без стоимости материалов. Точную смету инженер подготовит после бесплатного выезда на объект — это ни к чему вас не обязывает."
      />
    </section>

    <!-- ==================== БЛОК 4: КАЛЬКУЛЯТОР ==================== -->
    <section id="calculator" class="page-section page-section--light">
      <div class="calculator-wrap">
        <header class="calculator-header">
          <h2 class="calculator-title">Калькулятор сметы онлайн</h2>
          <p class="calculator-subtitle">
            Рассчитайте предварительную стоимость ремонта вашего склада за 1 минуту.
            Введите площадь, тип склада и вид ремонта — получите ориентировочную смету.
            Точный расчёт — после бесплатного выезда инженера с аудитом нагрузок на полы.
          </p>
        </header>
        <UiCalculator />
      </div>
    </section>

    <!-- ==================== БЛОК 5: РИСКИ ==================== -->
    <section id="risks" class="page-section">
      <RisksSection
        title="Что упускают при ремонте складов — <span>и теряют товар и время</span>"
        subtitle="Ремонт склада — это не офис и не магазин. Цена ошибки здесь измеряется не только в рублях переделки, но и в порче товара, остановке логистики, штрафных предписаниях и травмах персонала. Ниже — типовые просчёты в проектах складов и то, как их избежать ещё до начала работ."
        :groups="riskGroups"
        footer-note="Риск, о котором не предупредили на старте, в складах стоит в разы дороже — на кону не только деньги, но и сохранность товара, безопасность персонала и бесперебойная логистика.<br />Поэтому мы проводим аудит объекта и проекта до подписания договора — и фиксируем всё, что может «выстрелить» через полгода после запуска."
        id-prefix="sklady-risk"
      />
    </section>

    <section id="before-after" class="page-section">
      <BeforeAfterGallery :slugs="projectSlugs" />
    </section>

    <section id="brands" class="page-section">
      <PagesPublicHomePageBrands />
    </section>

    <!-- ==================== БЛОК 6: ПРОЕКТЫ ==================== -->
    <section id="projects" class="page-section">
      <ProjectsShowcase
        title="Наши реализованные проекты <span>складов и логистических центров в Рязани</span>"
        :slugs="projectSlugs"
      />
    </section>

    <!-- ==================== БЛОК 8: CTA ==================== -->
    <section id="cta" class="page-section">
      <ApplicationCTA
        title="Получите смету и аудит нагрузок на полы <span>за 24 часа</span>"
        subtitle="Загрузите план или опишите задачу. Инженер проверит помещение на соответствие требованиям пожарной безопасности и нагрузкам на полы, найдёт слабые места и подготовит детальный расчёт. Консультация бесплатна."
        phone="+7 (910) 909-69-47"
        telegram="@glavprofii"
        max="https://max.ru/u/f9LHodD0cOLfbBSpAeCwHBcJ83SJtKVj9mVKY7K8OLd6OwYB0gH6g3XE_Cs"
        id-prefix="sklady-cta"
        :custom-fields="customFields"
        :message-config="messageConfig"
      />
    </section>

    <!-- ==================== БЛОК 7: FAQ ==================== -->
    <section id="faq" class="page-section">
      <FAQBlock
        title="Ответы на <span>частые вопросы</span>"
        :items="faqItems"
        id-prefix="sklady-faq"
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

// === Варианты ремонта (специфичные для складов) ===
const repairTypes = [
  { value: 'cosmetic', label: 'Косметический', icon: 'mdi:format-paint' },
  { value: 'capital', label: 'Капитальный', icon: 'mdi:hammer-wrench' },
  { value: 'turnkey', label: 'Под ключ', icon: 'mdi:key-variant' },
  { value: 'cold-storage', label: 'Холодильный склад', icon: 'mdi:snowflake' },
]

const repairVariants: RepairVariant[] = [
  {
    title: 'Косметический',
    lead: 'Для действующих складов, когда нужно обновить покрытие пола, покрасить стены и привести в порядок зону приёмки без остановки логистики.',
    works: [
      'Ремонт наливного пола (локальные участки)',
      'Покраска стен и колонн износостойкими составами',
      'Обновление разметки проездов и зон хранения',
      'Ремонт зоны приёмки и офисной части',
    ],
    duration: 'от 2 недель',
    price: 'от 5 500 ₽/м²',
    icon: 'mdi:format-paint',
  },
  {
    title: 'Капитальный',
    lead: 'Когда склад открывается в новом помещении или требуется полная реконструкция с заменой полов, зонированием и инженерией.',
    works: [
      'Демонтаж старых покрытий и стяжки',
      'Устройство наливного пола с топпингом под расчётную нагрузку',
      'Зонирование: приёмка, хранение, отгрузка, офис',
      'Монтаж ворот, док-левеллеров, пандусов',
      'Антипылевое и антистатическое покрытие',
    ],
    duration: 'от 2 месяцев',
    price: 'от 8 500 ₽/м²',
    icon: 'mdi:hammer-wrench',
    featured: true,
    badge: 'Полная реконструкция',
  },
  {
    title: 'Под ключ',
    lead: 'Полный цикл: аудит, ТЗ, проектирование нагрузок, ремонт всех зон, подготовка оснований под стеллажи, сдача готового объекта.',
    works: [
      'Аудит объекта и помощь с техническим заданием',
      'Полный цикл ремонтных работ',
      'Закладные под стеллажные системы',
      'Пожарная безопасность и спринклерные системы',
      'Освещение высоких пролётов LED-прожекторами',
    ],
    duration: 'от 2,5 месяцев',
    price: 'от 11 000 ₽/м²',
    icon: 'mdi:key-variant',
    badge: 'Под ключ',
  },
]

// === Факторы цены ===
const priceFactors: PriceFactor[] = [
  {
    title: 'Нагрузка на полы',
    description: 'Вес стеллажей, движение погрузчиков, точечные нагрузки от штабелёров. Расчёт основания и выбор типа покрытия (топпинг кварц/корунд, упрочнённый бетон) напрямую влияют на смету.',
    icon: 'mdi:weight-kilogram',
  },
  {
    title: 'Высота потолков и пролёты',
    description: 'Работы на высоте от 6 метров требуют подъёмников, лесов, страховки. Освещение высоких пролётов — отдельная статья: LED-прожекторы с линзами и системой управления.',
    icon: 'mdi:arrow-up-box',
  },
  {
    title: 'Температурный режим',
    description: 'Тёплый склад, холодильник (+2…+8 °C) или морозильник (−18…−25 °C) требуют разных материалов: морозостойкие составы, пароизоляция, теплоизоляция ППУ, ворота с терморазрывом.',
    icon: 'mdi:thermometer',
  },
  {
    title: 'Пожарная категоризация',
    description: 'Категории А, Б, В, Г, Д по СП 12.13130 диктуют разные требования: огнезащитные составы, спринклерные системы, противодымная вентиляция, противопожарные двери и ворота.',
    icon: 'mdi:fire-alert',
  },
  {
    title: 'Зонирование и ворота',
    description: 'Количество ворот, док-левеллеров, пандусов, тамбуров-шлюзов и герметизаторов проёма — всё это проектируется и монтируется индивидуально.',
    icon: 'mdi:door-sliding',
  },
  {
    title: 'График работ',
    description: 'Ремонт без остановки склада (ночные смены, поэтапная сдача зон, временные маршруты для погрузчиков) повышает стоимость человеко-часов.',
    icon: 'mdi:calendar-clock',
  },
]

// === Риски (2 группы × 3 карточки) ===
const riskGroups: RiskGroup[] = [
  {
    name: 'Полы и нагрузки',
    icon: 'mdi:layers-outline',
    cards: [
      {
        title: 'Не рассчитывают нагрузку на полы',
        icon: 'mdi:weight-kilogram',
        mistake: 'Делают стандартную стяжку М200 толщиной 100 мм, не учитывая вес стеллажей и движение погрузчиков.',
        consequence: 'Через 3–6 месяцев полы трескаются под опорами стеллажей, проседают в проездах погрузчиков. Крошится верхний слой — появляется пыль, которая попадает в товар. Ремонт пола в действующем складе — это остановка зоны, вынос товара и потери.',
        solution: 'Проводим расчёт нагрузок: статические (от стеллажей) и динамические (от погрузчиков). Используем бетон М350–М500 с армированием, топпинг (кварц или корунд) для износостойкости. Закладываем анкерные группы под стеллажи ещё на этапе стяжки. Гарантия на полы — 3 года.',
      },
      {
        title: 'Не предусматривают закладные под стеллажи',
        icon: 'mdi:anchor',
        mistake: 'Сначала делают пол, потом привозят стеллажи и начинают бурить отверстия под анкеры, разрушая стяжку.',
        consequence: 'Нарушается целостность пола, появляются трещины, отслаивается топпинг. В отверстия попадает влага — начинается коррозия арматуры. Стеллажи теряют устойчивость, возрастает риск обрушения.',
        solution: 'На этапе проекта согласуем расстановку стеллажей с заказчиком и закладываем анкерные группы в стяжку с точностью до сантиметра. После укладки пола стеллажи монтируются без разрушения покрытия.',
      },
      {
        title: 'Экономят на антипылевом покрытии',
        icon: 'mdi:broom',
        mistake: 'Оставляют бетонное основание без финишного покрытия, чтобы снизить смету.',
        consequence: 'Бетон пылит: пыль попадает в товар (особенно критично для продуктов, электроники, фармацевтики), забивает технику, вызывает проблемы с дыханием у персонала. При проверках — предписания и штрафы.',
        solution: 'Применяем полимерные пропитки (эпоксидные, полиуретановые) или топпинг с запечаткой пор. Антистатические покрытия — для складов электроники. Все работы — с сертификатами соответствия.',
      },
    ],
  },
  {
    name: 'Инженерия и безопасность',
    icon: 'mdi:shield-alert-outline',
    cards: [
      {
        title: 'Не согласовывают пожарную категоризацию',
        icon: 'mdi:fire-alert',
        mistake: 'Делают отделку без учёта категории склада (А, Б, В, Г, Д) по СП 12.13130, используют горючие материалы.',
        consequence: 'При проверке МЧС склад не вводится в эксплуатацию или получает предписание на закрытие. Переделка — с полным демонтажем отделки и заменой на негорючие материалы. Штрафы до 500 000 ₽.',
        solution: 'Ещё на этапе эскиза определяем категорию склада по хранящимся товарам. Используем только негорючие материалы (НГ, Г1), проектируем спринклерные системы, противодымную вентиляцию, противопожарные ворота и двери. Сдаём объект с паспортом пожарной безопасности.',
      },
      {
        title: 'Не учитывают движение погрузчиков',
        icon: 'mdi:forklift',
        mistake: 'Проектируют проезды по минимальным нормативам, не учитывая габариты реальных погрузчиков и развороты.',
        consequence: 'Погрузчики задевают стеллажи, ворота, колонны. Повреждается товар, техника, отделка. Возрастает риск травм персонала. Приходится переносить стеллажи и расширять проезды.',
        solution: 'Проектируем проезды под конкретную модель погрузчика с запасом 30–50 см. Размечаем зоны движения, пешеходные дорожки, места разворота. Устанавливаем отбойники на колонны, стеллажи и ворота.',
      },
      {
        title: 'Экономят на освещении высоких пролётов',
        icon: 'mdi:lightbulb-on-outline',
        mistake: 'Ставят обычные светильники, не учитывая высоту потолков и требуемую освещённость на уровне пола.',
        consequence: 'В глубине склада темно, персонал плохо видит маркировку товара, возрастает риск ошибок при комплектации и травм. Перерасход электроэнергии из-за неэффективных ламп. Частая замена светильников на высоте — опасные работы.',
        solution: 'Используем LED-прожекторы с линзами для высоких пролётов (от 6 м), с расчётом освещённости 200–300 люкс на уровне пола. Делаем раздельное управление по зонам, датчики присутствия в редко используемых участках. Гарантия на светильники — 5 лет.',
      },
    ],
  },
]

// === Проекты ===
const projectSlugs = []

// === FAQ ===
const faqItems: FAQItem[] = [
  {
    question: 'Можно ли делать ремонт, если склад продолжает работать?',
    answer: 'Да. Работы проводим поэтапно: изолируем зону ремонта герметичными перегородками, переносим шумные этапы (демонтаж, стяжка) на ночные смены и выходные. Движение погрузчиков и приёмку товара организуем по временным маршрутам, чтобы логистика не останавливалась.',
  },
  {
    question: 'Как фиксируется смета — не вырастет ли цена в процессе?',
    answer: 'Итоговая стоимость и сроки закрепляются в договоре и не меняются. Любые дополнительные работы оформляются только через официальное дополнительное соглашение с вашим предварительным согласованием. Если в процессе обнаруживаются скрытые дефекты (например, разрушение основания пола) — заранее согласуем решение и стоимость до начала работ.',
  },
  {
    question: 'Делаете ли вы полы под высокую нагрузку от погрузчиков и стеллажей?',
    answer: 'Да. Выполняем наливные полы с топпингом (кварц, корунд), упрочнённый бетон класса М350–М500, с расчётом нагрузки на квадратный метр под ваши стеллажи и технику. Для холодильных складов — морозостойкие составы с антиобледенительными добавками. Закладываем анкерные группы под стеллажные системы ещё на этапе стяжки.',
  },
  {
    question: 'Кто закупает материалы — вы или мы?',
    answer: 'Как удобнее вам. Можете купить сами по своей спецификации — мы просто монтируем. Или доверите закупку нам: возьмём на себя логистику больших объёмов, проверим сертификаты соответствия для складских объектов (огнестойкость, антипылевые свойства, износостойкость) и предоставим все документы.',
  },
  {
    question: 'Какие гарантии на работы?',
    answer: '3 года по договору на все строительно-отделочные работы, включая скрытые дефекты. Если в гарантийный срок что-то потрескается, отслоится антипылевое покрытие или потребует регулировки — приедем и исправим за свой счёт в согласованные сроки, не мешая работе склада.',
  },
  {
    question: 'Работаете ли вы с холодильными и пищевыми складами?',
    answer: 'Да. Для холодильных складов используем морозостойкие покрытия, пароизоляцию, теплоизоляцию из ППУ или минваты, специальные ворота с терморазрывом. Для пищевых складов — отделку с сертификатами для контакта с продуктами и моющиеся поверхности по СанПиН. Проектируем вентиляцию под конкретный температурный режим.',
  },
]

const customFields = [
  {
    name: 'warehouseType',
    label: 'Тип склада',
    type: 'tiles' as const,
    options: [
      { value: 'general', label: 'Универсальный', icon: 'mdi:warehouse' },
      { value: 'cold-storage', label: 'Холодильный', icon: 'mdi:snowflake' },
      { value: 'food', label: 'Продуктовый', icon: 'mdi:food-apple-outline' },
      { value: 'pharma', label: 'Фармацевтический', icon: 'mdi:pill' },
      { value: 'logistics', label: 'Логистический центр', icon: 'mdi:truck-delivery' },
      { value: 'archive', label: 'Архив / хранилище', icon: 'mdi:archive-outline' },
      { value: 'other', label: 'Другое', icon: 'mdi:dots-horizontal' },
    ],
  },
]

const messageConfig = {
  emoji: '📦',
  title: 'Заявка на ремонт склада',
  sourceLabel: 'Ремонт складов в Рязани — CTA',
  fieldLabels: { warehouseType: 'Тип склада' },
}

// === Аналитика ===
const onMiniFormSubmit = (data: unknown) => {
  console.log('[sklady] Быстрая заявка:', data)
}
</script>

<style lang="scss" scoped>
@use '@/assets/styles/variables' as *;

.page-sklady {
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