<!-- app/components/pages/public/offers/index.vue -->
<template>
  <div class="kp">
    <!-- ================= HERO ================= -->
    <header class="kp-hero">
      <div class="kp-hero__bg" aria-hidden="true" />

      <div class="kp-container kp-hero__inner">
        <div class="kp-hero__badge">
          <Icon name="material-symbols:description-outline" />
          Предварительный рассчет
        </div>

        <h1 class="kp-hero__title">
          Отделка пространства <span>Движения Первых</span>
        </h1>

        <p class="kp-hero__subtitle">{{ meta.object }}</p>

        <ul class="kp-hero__meta">
          <li>
            <span>№ документа</span>
            <b>{{ meta.number }}</b>
          </li>
          <li>
            <span>Дата</span>
            <b>{{ meta.date }}</b>
          </li>
          <li>
            <span>Действует до</span>
            <b>{{ meta.validUntil }}</b>
          </li>
        </ul>

        <div class="kp-hero__total">
          <div class="kp-hero__total-label">Итого по смете</div>
          <div class="kp-hero__total-value">
            {{ formatPrice(grandTotal) }}<small>₽</small>
          </div>
          <div class="kp-hero__total-note">
            Работы + материалы · без мебели и брендирования
          </div>
        </div>
      </div>
    </header>

    <!-- ================= SUMMARY CARDS ================= -->
    <section class="kp-section">
      <div class="kp-container">
        <div class="kp-summary">
          <article class="kp-card kp-card--works">
            <div class="kp-card__icon">
              <Icon name="material-symbols:construction" />
            </div>
            <div class="kp-card__label">Стоимость работ</div>
            <div class="kp-card__value">{{ formatPrice(worksTotal) }} ₽</div>
            <div class="kp-card__hint">5 разделов · монтаж, отделка, электрика</div>
          </article>

          <article class="kp-card kp-card--materials">
            <div class="kp-card__icon">
              <Icon name="material-symbols:inventory-2-outline" />
            </div>
            <div class="kp-card__label">Стоимость материалов</div>
            <div class="kp-card__value">{{ formatPrice(materialsTotal) }} ₽</div>
            <div class="kp-card__hint">Черновые и чистовые, с запасом 10%</div>
          </article>

          <article class="kp-card kp-card--total">
            <div class="kp-card__icon">
              <Icon name="material-symbols:payments-outline" />
            </div>
            <div class="kp-card__label">Итого</div>
            <div class="kp-card__value">{{ formatPrice(grandTotal) }} ₽</div>
            <div class="kp-card__hint">Работы + материалы под ключ</div>
          </article>
        </div>
      </div>
    </section>

    <!-- ================= TABLES ================= -->
    <section class="kp-section kp-section--tables">
      <div class="kp-container">
        <h2 class="kp-h2">Детализация сметы</h2>
        <p class="kp-lead">
          Полная расшифровка по позициям. Объёмы указаны без учёта подрезки
          (запас материалов заложен отдельно).
        </p>

        <div class="kp-tabs">
          <button
            type="button"
            class="kp-tabs__btn"
            :class="{ 'is-active': activeTab === 'works' }"
            @click="activeTab = 'works'"
          >
            <Icon name="material-symbols:construction" />
            Работы
            <span class="kp-tabs__badge">{{ formatPrice(worksTotal) }} ₽</span>
          </button>

          <button
            type="button"
            class="kp-tabs__btn"
            :class="{ 'is-active': activeTab === 'materials' }"
            @click="activeTab = 'materials'"
          >
            <Icon name="material-symbols:inventory-2-outline" />
            Материалы
            <span class="kp-tabs__badge">{{ formatPrice(materialsTotal) }} ₽</span>
          </button>
        </div>

        <div
          v-for="(section, i) in activeSections"
          :key="section.key"
          class="kp-table-block"
        >
          <header class="kp-table-block__head">
            <div class="kp-table-block__num">{{ String(i + 1).padStart(2, '0') }}</div>
            <h3 class="kp-table-block__title">{{ section.title }}</h3>
            <div class="kp-table-block__total">{{ formatPrice(section.total) }} ₽</div>
          </header>

          <p v-if="section.hint" class="kp-table-block__hint">{{ section.hint }}</p>

          <div class="kp-table-wrap">
            <table class="kp-table">
              <thead>
                <tr>
                  <th class="kp-table__name">Наименование</th>
                  <th>Ед.</th>
                  <th>Объём</th>
                  <th>Цена, ₽</th>
                  <th class="kp-table__sum">Сумма, ₽</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in section.items" :key="item.name">
                  <td class="kp-table__name">{{ item.name }}</td>
                  <td>{{ item.unit }}</td>
                  <td>{{ item.qty }}</td>
                  <td>{{ item.price != null ? formatPrice(item.price) : '—' }}</td>
                  <td class="kp-table__sum">{{ formatPrice(getItemSum(item)) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Итоговый блок -->
        <div class="kp-grand">
          <div class="kp-grand__row">
            <span>Итого работы</span>
            <b>{{ formatPrice(worksTotal) }} ₽</b>
          </div>
          <div class="kp-grand__row">
            <span>Итого материалы</span>
            <b>{{ formatPrice(materialsTotal) }} ₽</b>
          </div>
          <div class="kp-grand__row kp-grand__row--total">
            <span>Всего по смете</span>
            <b>{{ formatPrice(grandTotal) }} ₽</b>
          </div>
        </div>
      </div>
    </section>

        <!-- ================= CHARTS ================= -->
    <section class="kp-section kp-section--charts">
      <div class="kp-container">
        <h2 class="kp-h2">Структура бюджета</h2>
        <p class="kp-lead">
          Соотношение стоимости работ и материалов, а также распределение затрат
          по разделам.
        </p>

        <div class="kp-charts">
          <div class="kp-chart-card">
            <div class="kp-chart-card__head">
              <h3>Работы / Материалы</h3>
              <span>Доля от общей суммы</span>
            </div>
            <UiEChart :option="donutOption" height="300px" />
          </div>

          <div class="kp-chart-card">
            <div class="kp-chart-card__head">
              <h3>Разделы сметы</h3>
              <span>Итоговая стоимость по блокам</span>
            </div>
            <UiEChart :option="structureOption" height="300px" />
          </div>
        </div>
      </div>
    </section>

    <!-- ================= NOTES ================= -->
    <section class="kp-section kp-section--notes">
      <div class="kp-container">
        <h2 class="kp-h2">Важные примечания</h2>

        <div class="kp-notes">
          <article class="kp-note">
            <div class="kp-note__icon">
              <Icon name="material-symbols:straighten" />
            </div>
            <h4>Объёмы</h4>
            <p>
              Периметры (теневой профиль, LED-лента, плинтусы) рассчитаны
              математически из заданных площадей. По факту на объекте возможны
              незначительные отклонения в зависимости от конфигурации помещений.
            </p>
          </article>

          <article class="kp-note">
            <div class="kp-note__icon">
              <Icon name="material-symbols:format-paint" />
            </div>
            <h4>Бренды и сегмент</h4>
            <p>
              Цены на чистовые материалы рассчитаны на средний+ сегмент
              (краски уровня <i>Caparol / Tikkurila</i>, ковровая плитка класса
              33, LED-продукция с гарантией от 3 лет). Премиум-бренды могут
              увеличить бюджет материалов на 20–30%.
            </p>
          </article>

          <article class="kp-note">
            <div class="kp-note__icon">
              <Icon name="material-symbols:local-shipping-outline" />
            </div>
            <h4>Логистика и закупка</h4>
            <p>
              В смету не включены транспортные расходы, подъём на этаж и
              такелаж (если лифт не грузовой или материалы не проходят по
              габаритам — например, листы ГКЛ и длинные рейки).
            </p>
          </article>

          <article class="kp-note">
            <div class="kp-note__icon">
              <Icon name="material-symbols:height" />
            </div>
            <h4>Высотность</h4>
            <p>
              Высота потолков 3,2 м позволяет вести работы со стандартных
              подмостей и стремянок. Коэффициент на высотность не применялся.
            </p>
          </article>

          <article class="kp-note">
            <div class="kp-note__icon">
              <Icon name="material-symbols:chair-outline" />
            </div>
            <h4>Мебель и брендирование</h4>
            <p>
              Изготовление стоек регистрации, гардеробных систем, а также
              нанесение логотипов и паттернов на композитные панели
              рассчитываются отдельно и в данную смету не входят.
            </p>
          </article>

          <article class="kp-note">
            <div class="kp-note__icon">
              <Icon name="material-symbols:schedule" />
            </div>
            <h4>Срок действия</h4>
            <p>
              Цены действительны до <b>{{ meta.validUntil }}</b>. По истечении
              срока возможна корректировка в связи с изменением стоимости
              материалов и логистики.
            </p>
          </article>
        </div>
      </div>
    </section>

    <!-- ================= FOOTER / CTA ================= -->
    <footer class="kp-footer">
      <div class="kp-container kp-footer__inner">
        <div>
          <h3>Готовы приступить к работам</h3>
          <p>
            Свяжитесь с нами, чтобы согласовать смету, график и этапы
            реализации проекта.
          </p>
        </div>

        <a class="kp-footer__btn" href="tel:+79109096947">
          <Icon name="material-symbols:call-outline" />
          Обсудить проект
        </a>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import type { EChartsOption } from 'echarts'
import UiEChart from './ui/EChart.client.vue'

/* ============================================================
   МЕТА
   ============================================================ */

const meta = {
  number: 'КП-2026-001',
  date: '30 сентября 2026 г.',
  validUntil: '30 октября 2026 г.',
  object: 'Помещение · 176 м² · г. Рязань',
}

/* ============================================================
   ТИПЫ И УТИЛИТЫ РАСЧЕТА
   ============================================================ */

interface LineItem {
  name: string
  unit: string
  qty: string | number
  price: number | null
  sum?: number
}

interface SectionData {
  key: string
  title: string
  hint?: string
  items: LineItem[]
}

interface Section extends SectionData {
  total: number
}

const parseQty = (qty: string | number): number => {
  if (typeof qty === 'number') return qty
  const str = String(qty).replace(/[~\s]/g, '').replace(',', '.')
  const num = parseFloat(str)
  return isNaN(num) ? 0 : num
}

const getItemSum = (item: LineItem): number => {
  if (item.price != null) {
    return parseQty(item.qty) * item.price
  }
  return item.sum ?? 0
}

const calcTotal = (items: LineItem[]): number =>
  items.reduce((sum, item) => sum + getItemSum(item), 0)

/* ============================================================
   РАЗДЕЛ 1 · РАБОТЫ (ДАННЫЕ)
   ============================================================ */

const worksData: SectionData[] = [
  {
    key: 'works-ceilings',
    title: 'Отделочные работы: Потолки',
    hint: 'Периметр под теневой профиль и LED-ленту принят ~60 м.п. исходя из площади 176 м².',
    items: [
      { name: 'Монтаж потолка из ГКЛ (одноуровневый)', unit: 'м²', qty: '176', price: 2200 },
      { name: 'Устройство теневого профиля (перепад/ниша)', unit: 'м.п.', qty: '60', price: 500 },
      { name: 'Грунтовка потолка перед шпаклевкой', unit: 'м²', qty: '176', price: 90 },
      { name: 'Шпаклевка потолка (серпянка + стартовая + финишная)', unit: 'м²', qty: '176', price: 1100 },
      { name: 'Грунтовка потолка', unit: 'м²', qty: '176', price: 100 },
      { name: 'Покраска потолка в 3 слоя с промежуточной шлифовкой', unit: 'м²', qty: '176', price: 700 },
    ],
  },
  {
    key: 'works-walls',
    title: 'Стены, короба и проёмы',
    hint: 'Площадь под покраску: фальшстена (32 м²) + короб за стойкой (8,2 м²) = 40,2 м².',
    items: [
      { name: 'Обшивка фальшстены ГКЛ в 2 слоя на каркасе', unit: 'м²', qty: '32', price: 1800 },
      { name: 'Устройство декоративного короба за стойкой (ГКЛ)', unit: 'м²', qty: '8,2', price: 2500 },
      { name: 'Шпаклевка стен и коробов под покраску', unit: 'м²', qty: '40,2', price: 700 },
      { name: 'Покраска стен и коробов в 3 слоя', unit: 'м²', qty: '40,2', price: 750 },
      { name: 'Грунтовка стен и коробов', unit: 'м²', qty: '40,2', price: 100 },
      { name: 'Врезка и монтаж люка скрытого типа (Push-to-open)', unit: 'шт', qty: '1', price: 3000 },
      { name: 'Облицовка дверного проёма (акрил/ПВХ на металлокаркасе)', unit: 'шт', qty: '1', price: 18000 },
    ],
  },
  {
    key: 'works-floors',
    title: 'Отделочные работы: Полы',
    hint: 'Общая площадь ковровой плитки: регистрация (3,75 м²) + рекреация (70 м²) = 73,75 м².',
    items: [
      { name: 'Укладка модульных ковровых плиток на клей', unit: 'м²', qty: '73,75', price: 620 },
      { name: 'Монтаж коврового плинтуса по периметру зон', unit: 'м.п.', qty: '45', price: 350 },
      { name: 'Установка переходных порожков и профилей', unit: 'компл.', qty: '1', price: 4000 },
    ],
  },
  {
    key: 'works-decor',
    title: 'Декоративные элементы и перегородки',
    hint: 'Площадь реечной перегородки: 5,8 × 3,2 = 18,56 м². Акцентная стена с рейками ~15 м².',
    items: [
      { name: 'Монтаж интерьерных реек на акцентную стену', unit: 'м²', qty: '15', price: 1500 },
      { name: 'Монтаж реечной перегородки (скрытый крепёж, латунь)', unit: 'м²', qty: '18,5', price: 3000 },
      { name: 'Монтаж декоративных экранов на радиаторы', unit: 'шт', qty: '4', price: 1500 },
      { name: 'Монтаж рулонных штор «блэкаут»', unit: 'шт', qty: '3', price: 1000 },
    ],
  },
  {
    key: 'works-electric',
    title: 'Электромонтажные работы',
    hint: 'Для встроенных линейных светильников в ГКЛ применена рыночная ставка (усиление каркаса + точная врезка).',
    items: [
      { name: 'Монтаж встраиваемого линейного светильника в ГКЛ', unit: 'шт', qty: '24', price: 4500 },
      { name: 'Монтаж светодиодной ленты в профиле по периметру', unit: 'м.п.', qty: '60', price: 450 },
      { name: 'Установка и подключение блока питания для LED', unit: 'шт', qty: '3', price: 950 },
    ],
  },
]

/* ============================================================
   РАЗДЕЛ 2 · МАТЕРИАЛЫ (ДАННЫЕ)
   ============================================================ */

const materialsData: SectionData[] = [
  {
    key: 'mat-ceilings',
    title: 'Материалы для потолков (176 м²)',
    hint: 'Конструкция ГКЛ в 2 слоя, теневой профиль, подготовка под покраску, встроенное освещение и LED-подсветка.',
    items: [
      { name: 'Гипсокартон ГКЛ 12,5 мм (на 2 слоя, с запасом)', unit: 'м²', qty: '387', price: 450 },
      { name: 'Потолочный металлокаркас (профили, подвесы, крабы)', unit: 'компл.', qty: '1', price: null, sum: 35200 },
      { name: 'Теневой профиль (алюминиевый, с заглушками)', unit: 'м.п.', qty: '60', price: 800 },
      { name: 'Шпаклёвка (стартовая гипсовая + финишная полимерная)', unit: 'кг', qty: '350', price: 50 },
      { name: 'Грунтовка глубокого проникновения', unit: 'л', qty: '40', price: 250 },
      { name: 'Краска водоэмульсионная моющаяся (3 слоя)', unit: 'кг', qty: '160', price: 450 },
      { name: 'Светильник встраиваемый линейный (60W, 220V, IP20)', unit: 'шт', qty: '24', price: 3800 },
      { name: 'LED-лента + алюминиевый профиль с рассеивателем', unit: 'м.п.', qty: '60', price: 1100 },
      { name: 'Блоки питания для LED-подсветки (тонкие, потолочные)', unit: 'шт', qty: '3', price: 3500 },
      { name: 'Кабель ВВГнг-LS, гофра, клеммники Wago, крепёж', unit: 'компл.', qty: '1', price: null, sum: 18000 },
    ],
  },
  {
    key: 'mat-walls',
    title: 'Материалы для стен, коробов и проёмов',
    hint: 'Фальшстена гардероба, короб за стойкой, люк скрытого монтажа, экраны на радиаторы, облицовка портала.',
    items: [
      { name: 'Гипсокартон ГКЛ (на 2 слоя для стен и коробов)', unit: 'м²', qty: '89', price: 450 },
      { name: 'Каркас стоечный и направляющий (профиль, дюбели)', unit: 'компл.', qty: '1', price: null, sum: 12000 },
      { name: 'Шпаклёвка, грунтовка, краска (стены и короб)', unit: 'компл.', qty: '1', price: null, sum: 25000 },
      { name: 'Люк скрытого монтажа под покраску (Push-to-open)', unit: 'шт', qty: '1', price: 8500 },
      { name: 'Листовой акрил/ПВХ (6 мм, красный, матовый)', unit: 'м²', qty: '5', price: 3000 },
      { name: 'Металлокаркас под декоративный портал', unit: 'компл.', qty: '1', price: null, sum: 6000 },
      { name: 'Декоративные экраны на радиаторы (фанера 16 мм + ПВХ)', unit: 'шт', qty: '4', price: 4500 },
    ],
  },
  {
    key: 'mat-floors',
    title: 'Материалы для полов (~81 м² с запасом 10%)',
    hint: 'Ковровая плитка для зоны регистрации и рекреации, клеевая фиксация, плинтусы и порожки.',
    items: [
      { name: 'Ковровая плитка (коммерческий класс 33, ворс 3 мм)', unit: 'м²', qty: '81', price: 1600 },
      { name: 'Клей-фиксация для ковровых модулей (антибактериальный)', unit: 'кг', qty: '25', price: 400 },
      { name: 'Ковровый плинтус (высота 5 см, гибкий/прямой)', unit: 'м.п.', qty: '45', price: 450 },
      { name: 'Переходные порожки и соединительные профили', unit: 'компл.', qty: '1', price: null, sum: 5000 },
    ],
  },
  {
    key: 'mat-decor',
    title: 'Декоративные элементы и перегородки',
    hint: 'Рейки на акцентную стену, массивная реечная перегородка под углом 30° на латунных шпильках, рулонные шторы.',
    items: [
      { name: 'Рейки интерьерные (МДФ/ЛДСП 40×20 мм, берёза)', unit: 'м.п.', qty: '~800', price: 160 },
      { name: 'Рейки для перегородки (МДФ 180×50 мм, 35 шт × 3,2 м)', unit: 'м.п.', qty: '112', price: 650 },
      { name: 'Скрытый крепёж, латунные шпильки, направляющие', unit: 'компл.', qty: '1', price: null, sum: 28000 },
      { name: 'Рулонные шторы «блэкаут» (красные, с механизмом)', unit: 'шт', qty: '3', price: 5500 },
    ],
  },
  {
    key: 'mat-consumables',
    title: 'Общестроительные и расходные материалы',
    hint: 'Материалы для производства работ, защиты помещения и уборки.',
    items: [
      { name: 'Укрывная плёнка, малярный скотч, мешки для мусора', unit: 'компл.', qty: '1', price: null, sum: 15000 },
      { name: 'Расходники для инструмента (буры, диски, насадки)', unit: 'компл.', qty: '1', price: null, sum: 10000 },
      { name: 'Малярный инструментарий (валики, кисти, ванночки, шпатели)', unit: 'компл.', qty: '1', price: null, sum: 12000 },
    ],
  },
]

/* ============================================================
   ВЫЧИСЛЯЕМЫЕ СЕКЦИИ И ИТОГИ
   ============================================================ */

const worksSections = computed<Section[]>(() =>
  worksData.map(s => ({ ...s, total: calcTotal(s.items) })),
)

const materialsSections = computed<Section[]>(() =>
  materialsData.map(s => ({ ...s, total: calcTotal(s.items) })),
)

const worksTotal = computed(() => worksSections.value.reduce((s, x) => s + x.total, 0))
const materialsTotal = computed(() => materialsSections.value.reduce((s, x) => s + x.total, 0))
const grandTotal = computed(() => worksTotal.value + materialsTotal.value)

/* ============================================================
   ТАБЫ
   ============================================================ */

const activeTab = ref<'works' | 'materials'>('works')
const activeSections = computed<Section[]>(() =>
  activeTab.value === 'works' ? worksSections.value : materialsSections.value,
)

/* ============================================================
   УТИЛИТЫ ФОРМАТИРОВАНИЯ
   ============================================================ */

const nf = new Intl.NumberFormat('ru-RU')
const formatPrice = (v: number | null | undefined) =>
  v == null ? '—' : nf.format(Math.round(v))

const printPage = () => window.print()

/* ============================================================
   ГРАФИКИ
   ============================================================ */

const CHART_COLORS = {
  blue: '#00c3f5',
  blueLight: '#02feff',
  yellow: '#FAB702',
  green: '#00A12A',
  purple: '#6610f2',
  pink: '#e83e8c',
}

const getSectionTotal = (workKey: string, matKey: string) => {
  const w = worksSections.value.find(s => s.key === workKey)?.total ?? 0
  const m = materialsSections.value.find(s => s.key === matKey)?.total ?? 0
  return w + m
}

/** Donut: Работы / Материалы */
const donutOption = computed<EChartsOption>(() => ({
  tooltip: {
    trigger: 'item',
    backgroundColor: 'rgba(24,25,27,.95)',
    borderColor: 'transparent',
    textStyle: { color: '#fff' },
    formatter: (p: any) =>
      `<b>${p.name}</b><br/>${formatPrice(p.value)} ₽ · ${p.percent}%`,
  },
  legend: {
    bottom: 0,
    icon: 'circle',
    itemGap: 20,
    textStyle: { color: '#333', fontSize: 13, fontFamily: 'Rubik' },
  },
  series: [
    {
      type: 'pie',
      radius: ['58%', '82%'],
      center: ['50%', '45%'],
      avoidLabelOverlap: false,
      label: { show: false },
      labelLine: { show: false },
      itemStyle: {
        borderColor: '#fff',
        borderWidth: 4,
        borderRadius: 10,
      },
      data: [
        { value: worksTotal.value, name: 'Работы', itemStyle: { color: CHART_COLORS.blue } },
        { value: materialsTotal.value, name: 'Материалы', itemStyle: { color: CHART_COLORS.yellow } },
      ],
    },
  ],
}))

/** Pie: структура итога по разделам */
const structureOption = computed<EChartsOption>(() => ({
  tooltip: {
    trigger: 'item',
    backgroundColor: 'rgba(24,25,27,.95)',
    borderColor: 'transparent',
    textStyle: { color: '#fff' },
    formatter: (p: any) =>
      `<b>${p.name}</b><br/>${formatPrice(p.value)} ₽ · ${p.percent}%`,
  },
  legend: {
    bottom: 0,
    icon: 'circle',
    itemGap: 14,
    textStyle: { color: '#333', fontSize: 12, fontFamily: 'Rubik' },
  },
  series: [
    {
      type: 'pie',
      radius: ['0%', '68%'],
      center: ['50%', '42%'],
      label: { show: false },
      itemStyle: { borderColor: '#fff', borderWidth: 3, borderRadius: 6 },
      data: [
        { value: getSectionTotal('works-ceilings', 'mat-ceilings'), name: 'Потолки', itemStyle: { color: CHART_COLORS.blue } },
        { value: getSectionTotal('works-walls', 'mat-walls'), name: 'Стены и проёмы', itemStyle: { color: CHART_COLORS.blueLight } },
        { value: getSectionTotal('works-floors', 'mat-floors'), name: 'Полы', itemStyle: { color: CHART_COLORS.green } },
        { value: getSectionTotal('works-decor', 'mat-decor'), name: 'Декор', itemStyle: { color: CHART_COLORS.yellow } },
        { value: getSectionTotal('works-electric', 'mat-electric'), name: 'Электрика', itemStyle: { color: CHART_COLORS.purple } },
        { value: getSectionTotal('works-consumables', 'mat-consumables'), name: 'Расходники', itemStyle: { color: CHART_COLORS.pink } },
      ],
    },
  ],
}))
</script>

<style scoped lang="scss">
@use '~/assets/styles/variables' as *;
@use '~/assets/styles/mixins' as *;

/* ============================================================
   КОНТЕЙНЕР
   ============================================================ */

.kp {
  background: #f6f8fa;
  min-height: 100vh;
  color: $text-dark;
  font-family: 'Rubik', sans-serif;
}

.kp-container {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1.5rem;

  @media (max-width: 640px) {
    padding: 0 1rem;
  }
}

/* ============================================================
   ПЛАВАЮЩАЯ КНОПКА ПЕЧАТИ
   ============================================================ */

.kp-print {
  position: fixed;
  right: 24px;
  bottom: 24px;
  z-index: 50;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  font-family: inherit;
  font-size: 14px;
  font-weight: 600;
  color: #18191b;
  background: linear-gradient(120deg, #00c3f5, #71E0FA);
  border: none;
  border-radius: 100px;
  cursor: pointer;
  box-shadow: 0 10px 28px rgba(0, 195, 245, 0.4);
  transition: transform .2s ease, box-shadow .2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 14px 34px rgba(0, 195, 245, 0.55);
  }

  :deep(svg) {
    width: 18px;
    height: 18px;
  }

  @media (max-width: 640px) {
    right: 16px;
    bottom: 16px;
    padding: 10px 16px;
    font-size: 13px;
  }
}

/* ============================================================
   HERO
   ============================================================ */

.kp-hero {
  position: relative;
  overflow: hidden;
  background: linear-gradient(135deg, #18191b 0%, #202226 100%);
  color: #fff;
  padding: 5.5rem 0 6rem;

  @media (max-width: 768px) {
    padding: 3.5rem 0 4rem;
  }

  &__bg {
    position: absolute;
    inset: 0;
    pointer-events: none;
    background:
      radial-gradient(820px 420px at 82% -10%, rgba(0, 195, 245, 0.28), transparent 60%),
      radial-gradient(600px 380px at 8% 110%, rgba(2, 254, 255, 0.18), transparent 60%),
      radial-gradient(500px 300px at 50% 50%, rgba(250, 183, 2, 0.06), transparent 70%);
  }

  &__inner {
    position: relative;
    z-index: 1;
    max-width: 900px;
  }

  &__badge {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 7px 14px;
    margin-bottom: 1.5rem;
    font-size: 13px;
    font-weight: 500;
    letter-spacing: 0.02em;
    color: #02feff;
    background: rgba(0, 195, 245, 0.1);
    border: 1px solid rgba(0, 195, 245, 0.35);
    border-radius: 100px;

    :deep(svg) {
      width: 16px;
      height: 16px;
    }
  }

  &__title {
    font-size: clamp(2rem, 4vw, 3rem);
    font-weight: 700;
    line-height: 1.15;
    letter-spacing: -0.02em;
    margin: 0 0 1rem;

    span {
      background: $blue-gradient;
      -webkit-background-clip: text;
      background-clip: text;
      color: transparent;
    }
  }

  &__subtitle {
    font-size: 1.1rem;
    line-height: 1.6;
    color: rgba(255, 255, 255, 0.7);
    margin: 0 0 2rem;
    max-width: 640px;
  }

  &__meta {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem 2.5rem;
    padding: 0;
    margin: 0 0 3rem;
    list-style: none;

    li {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    span {
      font-size: 12px;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: rgba(255, 255, 255, 0.45);
    }

    b {
      font-size: 1rem;
      font-weight: 600;
      color: #fff;
    }
  }

  &__total {
    display: inline-block;
    padding: 1.5rem 2rem;
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(0, 195, 245, 0.3);
    border-radius: 18px;
    backdrop-filter: blur(6px);

    @media (max-width: 640px) {
      padding: 1.2rem 1.4rem;
    }
  }

  &__total-label {
    font-size: 13px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: rgba(255, 255, 255, 0.55);
    margin-bottom: 6px;
  }

  &__total-value {
    display: flex;
    align-items: baseline;
    gap: 8px;
    font-size: clamp(2rem, 4.2vw, 3.2rem);
    font-weight: 700;
    line-height: 1;
    background: $blue-gradient;
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;

    small {
      font-size: 0.5em;
      font-weight: 500;
      color: rgba(255, 255, 255, 0.6);
      -webkit-text-fill-color: rgba(255, 255, 255, 0.6);
    }
  }

  &__total-note {
    margin-top: 10px;
    font-size: 13px;
    color: rgba(255, 255, 255, 0.55);
  }
}

/* ============================================================
   ОБЩИЕ СЕКЦИИ
   ============================================================ */

.kp-section {
  padding: 4.5rem 0;

  @media (max-width: 768px) {
    padding: 3rem 0;
  }
}

.kp-h2 {
  font-size: clamp(1.6rem, 2.6vw, 2rem);
  font-weight: 700;
  letter-spacing: -0.01em;
  margin: 0 0 .8rem;
  line-height: 1.2;
  position: relative;
  padding-bottom: 1rem;

  &::after {
    content: '';
    position: absolute;
    left: 0;
    bottom: 0;
    width: 72px;
    height: 4px;
    border-radius: 2px;
    background: $blue-gradient;
  }
}

.kp-lead {
  font-size: 1.02rem;
  line-height: 1.65;
  color: $text-gray;
  margin: 0 0 2.5rem;
  max-width: 720px;
}

/* ============================================================
   СВОДНЫЕ КАРТОЧКИ
   ============================================================ */

.kp-summary {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.25rem;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
}

.kp-card {
  position: relative;
  padding: 1.75rem 1.75rem 1.6rem;
  background: #fff;
  border: 1px solid #e8ecf0;
  border-radius: 18px;
  overflow: hidden;
  transition: transform .25s ease, box-shadow .25s ease, border-color .25s ease;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 20px 44px rgba(0, 0, 0, 0.08);
  }

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: $blue-gradient;
    opacity: .9;
  }

  &__icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 44px;
    height: 44px;
    margin-bottom: 1.1rem;
    border-radius: 12px;
    background: rgba(0, 195, 245, 0.1);
    color: $blue;

    :deep(svg) {
      width: 22px;
      height: 22px;
    }
  }

  &__label {
    font-size: 13px;
    font-weight: 500;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: $text-gray;
    margin-bottom: .5rem;
  }

  &__value {
    font-size: 1.9rem;
    font-weight: 700;
    line-height: 1.1;
    letter-spacing: -0.01em;
    color: $text-dark;
    margin-bottom: .5rem;
  }

  &__hint {
    font-size: .85rem;
    line-height: 1.5;
    color: $text-gray;
  }

  &--materials {
    &::before { background: linear-gradient(90deg, $yellow, #fdd35a); }
    .kp-card__icon { background: rgba(250, 183, 2, 0.12); color: #b07c00; }
  }

  &--total {
    background: linear-gradient(135deg, #18191b, #26282c);
    color: #fff;
    border-color: transparent;

    &::before { background: $blue-gradient; }
    .kp-card__icon { background: rgba(0, 195, 245, 0.18); color: $blue-light; }
    .kp-card__label { color: rgba(255, 255, 255, 0.6); }
    .kp-card__value { color: #fff; }
    .kp-card__hint { color: rgba(255, 255, 255, 0.55); }
  }
}

/* ============================================================
   ГРАФИКИ
   ============================================================ */

.kp-charts {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.25rem;
  margin-bottom: 1.25rem;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
}

.kp-chart-card {
  padding: 1.5rem 1.5rem 1.25rem;
  background: #fff;
  border: 1px solid #e8ecf0;
  border-radius: 18px;

  &__head {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 1rem;
    margin-bottom: 1rem;

    h3 {
      font-size: 1.05rem;
      font-weight: 600;
      margin: 0;
      color: $text-dark;
    }

    span {
      font-size: .8rem;
      color: $text-gray;
    }
  }

  &--wide {
    margin-top: .25rem;
  }
}

/* ============================================================
   ТАБЫ
   ============================================================ */

.kp-tabs {
  display: inline-flex;
  gap: 6px;
  padding: 6px;
  margin-bottom: 2rem;
  background: #fff;
  border: 1px solid #e8ecf0;
  border-radius: 100px;

  &__btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 10px 18px;
    font-family: inherit;
    font-size: .95rem;
    font-weight: 500;
    color: $text-gray;
    background: transparent;
    border: none;
    border-radius: 100px;
    cursor: pointer;
    transition: background .2s ease, color .2s ease;

    :deep(svg) {
      width: 18px;
      height: 18px;
    }

    &:hover { color: $text-dark; }

    &.is-active {
      color: #18191b;
      background: linear-gradient(120deg, #00c3f5, #71E0FA);
      font-weight: 600;

      .kp-tabs__badge {
        background: rgba(0, 0, 0, 0.1);
        color: #18191b;
      }
    }

    @media (max-width: 640px) {
      padding: 8px 12px;
      font-size: .85rem;

      .kp-tabs__badge { display: none; }
    }
  }

  &__badge {
    padding: 3px 8px;
    font-size: .75rem;
    font-weight: 600;
    color: $text-gray;
    background: #f0f2f5;
    border-radius: 100px;
  }
}

/* ============================================================
   ТАБЛИЦЫ
   ============================================================ */

.kp-table-block {
  padding: 1.5rem 1.75rem 1.75rem;
  margin-bottom: 1.25rem;
  background: #fff;
  border: 1px solid #e8ecf0;
  border-radius: 18px;

  @media (max-width: 640px) {
    padding: 1.25rem 1rem 1.25rem;
  }

  &__head {
    display: grid;
    grid-template-columns: auto 1fr auto;
    align-items: center;
    gap: 1rem;
    margin-bottom: 1rem;
  }

  &__num {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 38px;
    height: 38px;
    font-size: .9rem;
    font-weight: 700;
    color: $blue;
    background: rgba(0, 195, 245, 0.1);
    border-radius: 10px;
  }

  &__title {
    font-size: 1.05rem;
    font-weight: 600;
    margin: 0;
    color: $text-dark;
    line-height: 1.3;
  }

  &__total {
    font-size: 1.05rem;
    font-weight: 700;
    color: $text-dark;
    white-space: nowrap;
  }

  &__hint {
    font-size: .85rem;
    line-height: 1.55;
    color: $text-gray;
    margin: 0 0 1rem;
    padding: 10px 12px;
    background: #f7f9fb;
    border-radius: 10px;
    border-left: 3px solid rgba(0, 195, 245, 0.5);
  }
}

.kp-table-wrap {
  overflow-x: auto;
  border-radius: 12px;
  border: 1px solid #eef1f4;
}

.kp-table {
  width: 100%;
  border-collapse: collapse;
  font-size: .92rem;
  min-width: 640px;

  th, td {
    padding: 12px 14px;
    text-align: left;
    vertical-align: top;
    border-bottom: 1px solid #eef1f4;
  }

  thead th {
    font-size: .78rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: $text-gray;
    background: #f7f9fb;
    white-space: nowrap;
  }

  tbody tr:last-child td {
    border-bottom: none;
  }

  tbody tr:hover td {
    background: #fbfcfd;
  }

  &__name {
    min-width: 260px;
  }

  &__sum {
    text-align: right;
    font-weight: 600;
    white-space: nowrap;
  }

  th.kp-table__sum { text-align: right; }
}

/* ============================================================
   ИТОГОВЫЙ БЛОК
   ============================================================ */

.kp-grand {
  margin-top: 2rem;
  padding: 1.75rem 2rem;
  background: linear-gradient(135deg, #18191b, #232529);
  color: #fff;
  border-radius: 18px;

  @media (max-width: 640px) {
    padding: 1.25rem 1.4rem;
  }

  &__row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    padding: 10px 0;
    font-size: 1rem;

    span { color: rgba(255, 255, 255, 0.7); }
    b { font-weight: 600; }

    &--total {
      margin-top: 10px;
      padding-top: 18px;
      border-top: 1px solid rgba(255, 255, 255, 0.12);
      font-size: 1.4rem;

      span { color: #fff; font-weight: 600; }

      b {
        background: $blue-gradient;
        -webkit-background-clip: text;
        background-clip: text;
        color: transparent;
        font-weight: 700;
      }
    }
  }
}

/* ============================================================
   ПРИМЕЧАНИЯ
   ============================================================ */

.kp-notes {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.25rem;

  @media (max-width: 900px) {
    grid-template-columns: 1fr 1fr;
  }

  @media (max-width: 560px) {
    grid-template-columns: 1fr;
  }
}

.kp-note {
  padding: 1.5rem;
  background: #fff;
  border: 1px solid #e8ecf0;
  border-radius: 16px;
  transition: transform .25s ease, box-shadow .25s ease, border-color .25s ease;

  &:hover {
    transform: translateY(-3px);
    border-color: rgba(0, 195, 245, 0.4);
    box-shadow: 0 14px 32px rgba(0, 0, 0, 0.06);
  }

  &__icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    margin-bottom: 1rem;
    border-radius: 10px;
    background: rgba(0, 195, 245, 0.1);
    color: $blue;

    :deep(svg) {
      width: 20px;
      height: 20px;
    }
  }

  h4 {
    font-size: 1rem;
    font-weight: 600;
    margin: 0 0 .5rem;
    color: $text-dark;
  }

  p {
    font-size: .9rem;
    line-height: 1.6;
    color: $text-gray;
    margin: 0;

    b, i { color: $text-dark; }
    i { font-style: normal; font-weight: 500; }
  }
}

/* ============================================================
   FOOTER / CTA
   ============================================================ */

.kp-footer {
  padding: 3.5rem 0;
  background: linear-gradient(135deg, #18191b, #202226);
  color: #fff;

  &__inner {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 2rem;

    h3 {
      font-size: 1.5rem;
      font-weight: 700;
      margin: 0 0 .5rem;
    }

    p {
      font-size: .95rem;
      line-height: 1.6;
      color: rgba(255, 255, 255, 0.65);
      margin: 0;
      max-width: 540px;
    }

    @media (max-width: 768px) {
      flex-direction: column;
      align-items: flex-start;
    }
  }

  &__btn {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    padding: 14px 26px;
    font-size: 1rem;
    font-weight: 600;
    color: #18191b;
    background: linear-gradient(120deg, #00c3f5, #71E0FA);
    border-radius: 100px;
    white-space: nowrap;
    transition: transform .2s ease, box-shadow .2s ease;

    :deep(svg) { width: 20px; height: 20px; }

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 14px 34px rgba(0, 195, 245, 0.5);
      color: #18191b;
    }
  }
}

/* ============================================================
   ПЕЧАТЬ
   ============================================================ */

@media print {
  .kp { background: #fff; }
  .kp-print { display: none !important; }
  .kp-hero {
    background: #18191b !important;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
    padding: 2rem 0;
  }
  .kp-section { padding: 1.5rem 0; break-inside: avoid; }
  .kp-table-block,
  .kp-chart-card,
  .kp-note,
  .kp-card { break-inside: avoid; box-shadow: none; }
  .kp-card:hover,
  .kp-note:hover { transform: none; }
  .kp-footer { break-before: page; }
}
</style>