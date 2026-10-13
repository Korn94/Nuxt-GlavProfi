<!-- app/components/pages/public/offers/viprum.vue -->
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
          Отделка входной группы <span>Випрум</span>
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
            Работы под ключ · логистика и вывоз мусора включены
          </div>
        </div>
      </div>
    </header>

    <!-- ================= SUMMARY CARDS ================= -->
    <section class="kp-section">
      <div class="kp-container">
        <div class="kp-summary">
          <article class="kp-card">
            <div class="kp-card__icon">
              <Icon name="material-symbols:build-outline" />
            </div>
            <div class="kp-card__label">Демонтаж</div>
            <div class="kp-card__value">{{ formatPrice(sections[0]?.total) }} ₽</div>
            <div class="kp-card__hint">Подготовка поверхностей</div>
          </article>

          <article class="kp-card">
            <div class="kp-card__icon">
              <Icon name="material-symbols:grid-on-outline" />
            </div>
            <div class="kp-card__label">Плиточные работы</div>
            <div class="kp-card__value">{{ formatPrice(sections[1]?.total) }} ₽</div>
            <div class="kp-card__hint">Пол и ступени</div>
          </article>

          <article class="kp-card kp-card--total">
            <div class="kp-card__icon">
              <Icon name="material-symbols:payments-outline" />
            </div>
            <div class="kp-card__label">Итого по смете</div>
            <div class="kp-card__value">{{ formatPrice(grandTotal) }} ₽</div>
            <div class="kp-card__hint">Все разделы под ключ</div>
          </article>
        </div>
      </div>
    </section>

    <!-- ================= TABLES ================= -->
    <section class="kp-section kp-section--tables">
      <div class="kp-container">
        <h2 class="kp-h2">Детализация сметы</h2>
        <p class="kp-lead">
          Полная расшифровка по позициям. Материалы включены в стоимость работ. Обратите внимание: 
          возможно присутствует греющий кабель (точно нам не видно на фотографиях), но в данной смете он не учтён. Если он необходим, сообщите нам — добавим в расчёт.
        </p>

        <div
          v-for="(section, i) in sections"
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
          <div class="kp-grand__row" v-for="section in sections" :key="section.key">
            <span>{{ section.title }}</span>
            <b>{{ formatPrice(section.total) }} ₽</b>
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
          Распределение затрат по основным разделам сметы.
        </p>

        <div class="kp-charts">
          <div class="kp-chart-card kp-chart-card--wide">
            <div class="kp-chart-card__head">
              <h3>Разделы сметы</h3>
              <span>Итоговая стоимость по блокам</span>
            </div>
            <UiEChart :option="structureOption" height="300px" />
          </div>
        </div>
      </div>
    </section>

    <!-- ================= SCHEDULE BANNER ================= -->
    <section class="kp-section kp-section--schedule">
      <div class="kp-container">
        <div class="kp-schedule">
          <div class="kp-schedule__content">
            <div class="kp-schedule__icon">
              <Icon name="material-symbols:rocket-launch-outline" />
            </div>
            <div class="kp-schedule__text">
              <h3>Готовы приступить к работе</h3>
              <p>
                Наша бригада работает оперативно и слаженно. Однако сейчас у нас 
                в работе несколько активных объектов, которые мы завершаем в 
                ближайшие дни. Если смета вам подходит — давайте сразу согласуем 
                удобную дату выхода на объект, чтобы забронировать время в графике.
              </p>
            </div>
          </div>
          <a class="kp-schedule__btn" href="tel:+79109096947">
            <Icon name="material-symbols:calendar-month-outline" />
            Запланировать дату выхода
          </a>
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
              Площадь пола и погонный метраж ступеней рассчитаны на основе обмеров
              входной группы. По факту на объекте возможны незначительные отклонения
              в зависимости от геометрии лестничного марша.
            </p>
          </article>

          <article class="kp-note">
            <div class="kp-note__icon">
              <Icon name="material-symbols:electric-bolt-outline" />
            </div>
            <h4>Греющий кабель</h4>
            <p>
              На предоставленных фотографиях возможно виден греющий кабель. В данной 
              смете он не учтён. Если он предусмотрен проектом или необходим для 
              эксплуатации входной группы, сообщите нам — добавим отдельной позицией.
            </p>
          </article>

          <article class="kp-note">
            <div class="kp-note__icon">
              <Icon name="material-symbols:grid-on-outline" />
            </div>
            <h4>Плитка и затирка</h4>
            <p>
              Для входной группы применена плитка формата 30×30 см и эпоксидная
              затирка, что обеспечивает максимальную износостойкость и защиту от
              влаги в зоне высокой проходимости.
            </p>
          </article>

          <article class="kp-note">
            <div class="kp-note__icon">
              <Icon name="material-symbols:local-shipping-outline" />
            </div>
            <h4>Логистика и уборка</h4>
            <p>
              В смету уже включены разгрузка материалов, подъем на этаж и полный
              сбор с вывозом строительного мусора по завершении работ.
            </p>
          </article>

          <article class="kp-note">
            <div class="kp-note__icon">
              <Icon name="material-symbols:stairs-outline" />
            </div>
            <h4>Лестничная группа</h4>
            <p>
              Работы ведутся на действующей лестнице. Монтаж накладок и облицовка
              ступеней выполняются с учетом требований безопасности и антискользящих
              свойств материалов.
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
  number: 'КП-2026-042',
  date: '13 октября 2026 г.',
  validUntil: '13 ноября 2026 г.',
  object: 'Випрум · Введенская ул., 110 · Входная группа, лестница',
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
   РАЗДЕЛЫ СМЕТЫ (ДАННЫЕ)
   ============================================================ */

const sectionsData: SectionData[] = [
  {
    key: 'demolition',
    title: 'Демонтаж',
    hint: 'Демонтаж существующего покрытия.',
    items: [
      { name: 'Демонтаж плитки', unit: 'м²', qty: '21,06', price: 400 },
    ],
  },
  {
    key: 'tiling',
    title: 'Плиточные работы',
    hint: 'Комплексная отделка пола и ступеней лестницы.',
    items: [
      { name: 'Грунтовка', unit: 'м²', qty: '21,06', price: 140 },
      { name: 'Выравнивание пола', unit: 'м²', qty: '4,05', price: 780 },
      { name: 'Грунтовка для укладки плитки', unit: 'м²', qty: '21,06', price: 140 },
      { name: 'Укладка плитки 30×30 см', unit: 'м²', qty: '4,05', price: 2100 },
      { name: 'Затирка эпоксидная 30×30 см', unit: 'м²', qty: '21,06', price: 650 },
      { name: 'Облицовка ступеней', unit: 'м.п.', qty: '39,20', price: 2500 },
      { name: 'Монтаж накладок на ступени', unit: 'м.п.', qty: '39,10', price: 1200 },
    ],
  },
  {
    key: 'general',
    title: 'Общие работы',
    hint: 'Логистика, подъем и уборка строительного мусора.',
    items: [
      { name: 'Разгрузка материала', unit: 'компл', qty: '1', price: 3000 },
      { name: 'Сбор и вывоз мусора', unit: 'компл', qty: '1', price: 19000 },
    ],
  },
]

/* ============================================================
   ВЫЧИСЛЯЕМЫЕ СЕКЦИИ И ИТОГИ
   ============================================================ */

const sections = computed<Section[]>(() =>
  sectionsData.map(s => ({ ...s, total: calcTotal(s.items) })),
)

const grandTotal = computed(() => sections.value.reduce((s, x) => s + x.total, 0))

/* ============================================================
   УТИЛИТЫ ФОРМАТИРОВАНИЯ
   ============================================================ */

const nf = new Intl.NumberFormat('ru-RU')
const formatPrice = (v: number | null | undefined) =>
  v == null ? '—' : nf.format(Math.round(v))

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
        { value: sections.value[0]?.total ?? 0, name: 'Демонтаж', itemStyle: { color: CHART_COLORS.blue } },
        { value: sections.value[1]?.total ?? 0, name: 'Плиточные работы', itemStyle: { color: CHART_COLORS.yellow } },
        { value: sections.value[2]?.total ?? 0, name: 'Общие работы', itemStyle: { color: CHART_COLORS.green } },
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
  grid-template-columns: 1fr;
  gap: 1.25rem;
  margin-bottom: 1.25rem;
  width: 100%;
}

.kp-chart-card {
  padding: 1.5rem 1.5rem 1.25rem;
  background: #fff;
  border: 1px solid #e8ecf0;
  border-radius: 18px;
  
  // КРИТИЧНО: ограничиваем ширину и разрешаем сжатие внутри grid/flex
  width: 100%;
  max-width: 100%;
  min-width: 0;
  overflow: hidden; // Обрезаем canvas графика, если он пытается вылезти

  &__head {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 1rem;
    margin-bottom: 1rem;
    flex-wrap: wrap; // Позволяет заголовку и подписи переноситься на узких экранах

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

  // Адаптив для очень узких экранов (смартфоны в портретной ориентации)
  @media (max-width: 480px) {
    padding: 1.25rem 1rem 1rem;
    
    &__head {
      flex-direction: column;
      align-items: flex-start;
      gap: 0.25rem;
    }
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
   SCHEDULE BANNER
   ============================================================ */

.kp-section--schedule {
  padding: 0 0 4.5rem;

  @media (max-width: 768px) {
    padding: 0 0 3rem;
  }
}

.kp-schedule {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 2rem;
  padding: 2.5rem;
  background: linear-gradient(135deg, #18191b, #26282c);
  border-radius: 20px;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: -50%;
    right: -10%;
    width: 400px;
    height: 400px;
    background: radial-gradient(circle, rgba(0, 195, 245, 0.15), transparent 70%);
    pointer-events: none;
  }

  &__content {
    display: flex;
    align-items: flex-start;
    gap: 1.5rem;
    position: relative;
    z-index: 1;
  }

  &__icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 56px;
    height: 56px;
    flex-shrink: 0;
    border-radius: 14px;
    background: rgba(0, 195, 245, 0.15);
    color: #02feff;

    :deep(svg) {
      width: 28px;
      height: 28px;
    }
  }

  &__text {
    h3 {
      font-size: 1.4rem;
      font-weight: 700;
      margin: 0 0 .75rem;
      color: #fff;
      line-height: 1.3;
    }

    p {
      font-size: .95rem;
      line-height: 1.65;
      color: rgba(255, 255, 255, 0.7);
      margin: 0;
    }
  }

  &__btn {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    padding: 16px 28px;
    font-size: 1rem;
    font-weight: 600;
    color: #18191b;
    background: linear-gradient(120deg, #00c3f5, #71E0FA);
    border-radius: 100px;
    white-space: nowrap;
    transition: transform .2s ease, box-shadow .2s ease;
    position: relative;
    z-index: 1;
    flex-shrink: 0;

    :deep(svg) { width: 22px; height: 22px; }

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 14px 34px rgba(0, 195, 245, 0.5);
      color: #18191b;
    }
  }

  @media (max-width: 900px) {
    flex-direction: column;
    align-items: flex-start;
    text-align: left;

    &__btn {
      width: 100%;
      justify-content: center;
    }
  }

  @media (max-width: 640px) {
    padding: 2rem 1.5rem;

    &__content {
      flex-direction: column;
      gap: 1rem;
    }

    &__text h3 {
      font-size: 1.2rem;
    }
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