# Конструктор коммерческих предложений

КП собирается из двух частей:

1. **Страница** — `app/pages/offers/<slug>.vue`: только список блоков («кубиков»).
2. **Данные** — `app/components/pages/public/offers/data/<slug>.ts`: мета, разделы сметы, примечания.

Стили — единые для всех КП: `app/assets/styles/kp.scss` (подключены в `nuxt.config.ts → css`).
Никакой админки и БД: всё правится в коде.

---

## Новое КП за 5 минут

### 1. Данные

Создать `app/components/pages/public/offers/data/<slug>.ts`:

```ts
import { defineKpData } from '../kp/types'

export default defineKpData({
  meta: {
    title: 'Отделка офиса',
    titleAccent: 'Название клиента',
    object: 'Помещение · 120 м² · г. Рязань',
    number: 'КП-2026-007',
    date: '1 ноября 2026 г.',
    validUntil: '1 декабря 2026 г.',
    totalNote: 'Работы + материалы',
  },

  groups: [
    {
      key: 'works',
      label: 'Работы',
      icon: 'material-symbols:construction',
      totalLabel: 'Итого работы',
      sections: [
        {
          key: 'walls',
          title: 'Стены',
          hint: 'Как считались объёмы',
          chartKey: 'walls',      // объединение с материалами в диаграмме
          chartLabel: 'Стены',
          items: [
            { name: 'Штукатурка стен', unit: 'м²', qty: '120', price: 600 },
            { name: 'Покраска стен', unit: 'м²', qty: '120', price: 350 },
            // material: 'Краска Tikkurila' — добавит колонку «Материал»
            // optional: true — опция, не входит в итог
          ],
        },
      ],
    },
    {
      key: 'materials',
      label: 'Материалы',
      icon: 'material-symbols:inventory-2-outline',
      totalLabel: 'Итого материалы',
      sections: [
        {
          key: 'mat-walls',
          title: 'Материалы для стен',
          chartKey: 'walls',      // тот же ключ → один сегмент «Стены» на диаграмме
          chartLabel: 'Стены',
          items: [
            { name: 'Грунтовка', unit: 'л', qty: '40', price: 250 },
            { name: 'Комплект крепежа', unit: 'компл.', qty: '1', price: null, sum: 5000 },
          ],
        },
      ],
    },
  ],

  estimate: { lead: 'Полная расшифровка по позициям.' },
  charts: { mode: 'both' },

  notes: [
    { icon: 'material-symbols:schedule', title: 'Срок действия', text: 'Цены действительны до <b>1 декабря 2026 г.</b>' },
  ],
})
```

Правила по суммам:

- `price` + `qty` → сумма позиции считается автоматически;
- `price: null` + `sum` → фиксированная сумма (комплект, «по факту»);
- `qty` можно писать как в смете: `'40,2'`, `'~800'`, `'1'`;
- `optional: true` — позиция печатается, но не входит в итог.

### 2. Страница

Создать `app/pages/offers/<slug>.vue`:

```vue
<template>
  <KpPage :offer="offer" />
</template>

<script setup lang="ts">
import KpPage from '~/components/pages/public/offers/kp/KpPage.vue'
import offer from '~/components/pages/public/offers/data/<slug>'

definePageMeta({ layout: 'empy' })

useSeoMeta({
  title: 'Коммерческое предложение — …',
  description: '…',
  robots: 'noindex, nofollow',
})
</script>
```

`KpPage` собирает стандартный набор: hero → переключатель вариантов → сводка →
смета → диаграммы → баннеры → примечания → подвал.

Если нужен нестандартный порядок, страницу можно собрать вручную из блоков
(`KpDocument`, `KpHero`, `KpSummary`, `KpEstimate`, …) — данные от этого не меняются.

---

## Кубики

| Компонент | Что делает | Ключевые пропсы |
|---|---|---|
| `KpDocument` | Оболочка: фон, кнопка «Скачать PDF», QR-код для печати, подготовка к печати | `print` |
| `KpHero` | Шапка: бренд «ГлавПрофи» (только в печати), бейдж, заголовок, объект, №/дата/срок, итог | `meta`, `total` |
| `KpSummary` | Карточки-итоги | `cards` (`doc.summaryCards`) |
| `KpEstimate` | Таблицы разделов, табы групп, итоговый блок | `groups`, `grandTotal`, `showTabs`, `totalRows`, `totalLabel` |
| `KpBudgetCharts` | Диаграммы «группы» и «разделы» | `groups`, `mode` (`both` / `split` / `structure`) |
| `KpCallout` | Тёмный баннер-акцент с кнопкой | `title`, `text`, `icon`, `ctaText`, `ctaHref` |
| `KpNotes` | Сетка примечаний | `items`, `title` |
| `KpFooterCta` | Подвал с телефоном | `title`, `text`, `ctaText`, `href` |
| `KpVariantSwitch` | Переключатель вариантов КП | `variants` (`getVariantSummary`), `modelValue` |
| `KpQrCode` | QR-код со ссылкой на страницу КП (только для печати; библиотека `uqr`) | — |
| `KpPage` | Готовая страница КП: hero + варианты + все блоки | `offer`, `initialVariant` |

`useKpDocument(offer)` возвращает: `groups`, `sections`, `hasMaterials`, `grandTotal`, `summaryCards`, `formatPrice`.
Принимает и `computed`/`ref` — тогда суммы пересчитываются при смене варианта.

---

## Варианты КП

Варианты живут в том же data-файле. На странице появляется переключатель,
итог пересчитывается автоматически, а в PDF попадает выбранный вариант.

```ts
export default defineKpData({
  meta: { /* ... */ },
  groups: [ /* базовый вариант */ ],

  variants: [
    { key: 'paint', label: 'Покраска', default: true },
    {
      key: 'wallpaper',
      label: 'Обои',
      shortLabel: 'Обои',
      hint: 'Что входит в вариант',
      patch: {
        meta: { titleSuffix: 'Вариант 2 (обои)', number: 'КП-2026-001/2' },
        sections: {
          'works-walls': { items: [ /* позиции заменяются целиком */ ] },
          'mat-walls': { items: [ /* ... */ ] },
        },
        addSections: [
          { groupKey: 'works', before: 'works-floors', sections: [ /* ... */ ] },
        ],
        notesPatch: {
          'Срок действия': { text: 'Цены действительны до <b>…</b>' },
        },
      },
    },
  ],
})
```

Правила:

- варианты **взаимоисключающие** — показывается один активный;
- `default: true` — вариант, который открывается по умолчанию;
- `key` разделов должны быть уникальны в пределах документа — по ним работают
  и сводка, и патчи вариантов;
- `patch` накладывается на базовый документ, `data` — полностью самостоятельный документ;
- `sections` — правки по ключу раздела (`null` удаляет раздел);
- `items` заменяют позиции раздела целиком;
- `addSections` добавляет разделы в группу (`before` — перед каким разделом);
- `notesPatch` меняет примечания по заголовку (`null` удаляет примечание);
- `summary`, `notes`, `callouts`, `adjustments` заменяются целиком;
- `meta`, `estimate`, `charts`, `footer` — частичное слияние.

Как это работает на странице:

- переключатель стоит над сметой и показывает итог каждого варианта;
- выбранный вариант пишется в URL: `?variant=wallpaper` — ссылку можно отправить клиенту;
- печать/PDF: переключатель скрыт, печатается активный вариант, в шапке виден `titleSuffix`;
- если `variants` нет (или вариант один) — переключатель не показывается;
- старые ссылки вида `/offers/<slug>-1` можно оставить отдельной страницей
  с `initial-variant="<key>"`.

---

## Печать / PDF

Кнопка «Скачать PDF» вызывает `window.print()` → «Сохранить как PDF» в диалоге печати.

В PDF попадает **только смета**, всё «оформительское» скрывается:

- шапка КП — компактная и **белая**, начинается с бренда «ГлавПрофи · коммерческое
  предложение» (на экране эта подпись скрыта — `.kp-hero__brand { display: none }`),
  далее название, объект, номер/дата, итог (без бейджа и декоративного градиента);
- смета: все группы (работы и материалы), даже если на экране открыта одна вкладка,
  причём колонка «Материал» печатается только если она реально заполнена;
- итоговый блок — в печати светлый (белый фон, тёмный текст, акцентная линия у «Всего»);
- в конце — блок с QR-кодом и ссылкой на страницу КП (`KpQrCode`, генерируется
  локально через `uqr`; ссылка сохраняет выбранный вариант `?variant=…`).
  На экране этот блок скрыт (`.kp-qr { display: none }`).

Что **не** печатается: сводные карточки (`KpSummary`), диаграммы (`KpBudgetCharts`),
баннеры (`KpCallout`), примечания (`KpNotes`), подвал (`KpFooterCta`), табы групп,
переключатель вариантов, кнопка PDF, шапка/меню сайта и кнопка «наверх».

Технические детали:

- печать реализована «белым списком»: печатается только секция с классом
  `kp-section--tables` (его ставит `KpEstimate.vue`), остальные `.kp-section`
  и `.kp-footer` скрыты — новый блок, который должен попадать в PDF,
  обязан иметь этот модификатор;
- шапка таблицы повторяется на каждой странице (`display: table-header-group`),
  строки таблиц и карточки разделов не разрываются между страницами;
- таблицы подогнаны под лист (`.kp-table { font-size: .78rem }`, уменьшенные паддинги,
  снятые `min-width`), формат A4, поля 10 мм;
- градиентный текст (`background-clip: text`) и тёмные заливки в печати заменяются
  сплошными цветами — иначе браузер печатает белый текст на белом фоне.

Стили печати — в конце `app/assets/styles/kp.scss` (блок `@media print`).
