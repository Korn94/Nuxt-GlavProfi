<!-- app/components/pages/public/remontPomescheniy/workTypes/ui/MethodComparison.vue -->
<template>
  <section class="method-compare">
    <div class="container">
      <header class="method-compare__header">
        <h2 class="method-compare__title" v-html="title" />
        <p v-if="subtitle" class="method-compare__subtitle">{{ subtitle }}</p>
      </header>

      <!-- 1. Чипы методов -->
      <div
        class="method-compare__chips"
        :style="{ '--cols': resolvedMethods.length }"
      >
        <div
          v-for="(method, i) in resolvedMethods"
          :key="i"
          class="method-chip"
          :class="{ 'method-chip--recommended': method.recommended }"
        >
          <span class="method-chip__icon">
            <Icon :name="method.icon || 'mdi:help-circle'" size="22" />
          </span>
          <div class="method-chip__text">
            <div class="method-chip__name-row">
              <span class="method-chip__name">{{ method.title }}</span>
              <span v-if="method.recommended" class="method-chip__badge">
                рекомендуем
              </span>
            </div>
            <span v-if="method.tagline" class="method-chip__tagline">
              {{ method.tagline }}
            </span>
          </div>
        </div>
      </div>

      <!-- 2. Таблица характеристик -->
      <div v-if="specRows.length" class="method-compare__table-wrap">
        <table class="method-table">
          <tbody>
            <tr v-for="row in specRows" :key="row.key">
              <th scope="row" class="method-table__label">
                <Icon :name="row.icon" size="16" class="method-table__icon" />
                <span>{{ row.label }}</span>
              </th>
              <td
                v-for="(method, i) in resolvedMethods"
                :key="i"
                class="method-table__value"
                :class="{ 'is-recommended': method.recommended }"
                :data-label="method.title"
              >
                {{ row.get(method) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- 3. Когда выбирать + ограничения -->
      <div
        class="method-compare__when"
        :style="{ '--cols': resolvedMethods.length }"
      >
        <div
          v-for="(method, i) in resolvedMethods"
          :key="i"
          class="when-card"
          :class="{ 'when-card--recommended': method.recommended }"
        >
          <h4 class="when-card__title">
            <Icon :name="method.icon || 'mdi:help-circle'" size="16" />
            {{ method.title }}
          </h4>

          <ul class="when-card__list">
            <li v-for="(item, j) in method.whenToUse" :key="j">
              <Icon name="mdi:check" size="14" class="when-card__check" />
              <span>{{ item }}</span>
            </li>
          </ul>

          <ul v-if="method.cons?.length" class="when-card__cons">
            <li v-for="(item, j) in method.cons" :key="j">
              <Icon name="mdi:minus" size="14" class="when-card__minus" />
              <span>{{ item }}</span>
            </li>
          </ul>
        </div>
      </div>

      <!-- 4. Итоговая рекомендация -->
      <div v-if="summary || $slots.summary" class="method-compare__summary">
        <slot name="summary">
          <Icon name="mdi:lightbulb-outline" size="22" class="summary-icon" />
          <p v-html="summary" />
        </slot>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { NormalizedWorkItem } from '~/types/calculator'
import type { MethodOption } from '../../types'

export interface PriceData {
  standard: NormalizedWorkItem[]
  piece: NormalizedWorkItem[]
}

const props = defineProps<{
  title: string
  subtitle?: string
  methods: MethodOption[]
  summary?: string
  priceData?: Record<string, PriceData>
}>()

/** Поиск работы в переданных данных по ID */
const findWorkById = (id: number): NormalizedWorkItem | undefined => {
  if (!props.priceData) return undefined
  const allWorks = Object.values(props.priceData).flatMap((section) => [
    ...section.standard,
    ...section.piece,
  ])
  return allWorks.find((w) => w.id === id)
}

/** Методы с актуальными ценами */
const resolvedMethods = computed(() =>
  props.methods.map((method) => {
    if (method.priceWorkIds?.length) {
      const total = method.priceWorkIds.reduce((sum, id) => {
        const work = findWorkById(id)
        return sum + (work ? work.pricePerUnit : 0)
      }, 0)
      if (total > 0) return { ...method, priceFrom: Math.round(total) }
    }
    if (method.priceWorkId) {
      const work = findWorkById(method.priceWorkId)
      if (work) return { ...method, priceFrom: Math.round(work.pricePerUnit) }
    }
    return method
  })
)

interface SpecRow {
  key: string
  label: string
  icon: string
  get: (m: MethodOption) => string
}

/** Строки таблицы — только те, у которых есть данные хотя бы у одного метода */
const specRows = computed<SpecRow[]>(() => {
  const rows: SpecRow[] = [
    {
      key: 'price',
      label: 'Цена',
      icon: 'mdi:currency-usd',
      get: (m) => (m.priceFrom ? `${m.priceFrom} ₽/м²` : '—'),
    },
    {
      key: 'soundproof',
      label: 'Звукоизоляция',
      icon: 'mdi:volume-off',
      get: (m) => m.specs?.soundproof || '—',
    },
    {
      key: 'thickness',
      label: 'Толщина',
      icon: 'mdi:arrow-expand-horizontal',
      get: (m) => m.specs?.thickness || '—',
    },
    {
      key: 'strength',
      label: 'Прочность',
      icon: 'mdi:shield-outline',
      get: (m) => m.specs?.strength || '—',
    },
    {
      key: 'weight',
      label: 'Вес',
      icon: 'mdi:weight',
      get: (m) => m.specs?.weight || '—',
    },
    {
      key: 'fire',
      label: 'Огнестойкость',
      icon: 'mdi:fire',
      get: (m) => m.specs?.fireRating || '—',
    },
  ]
  return rows.filter((row) =>
    resolvedMethods.value.some((m) => row.get(m) !== '—')
  )
})
</script>

<style lang="scss" scoped>
@use '@/assets/styles/variables' as *;
@use '@/assets/styles/mixins' as *;

.method-compare {
  @include section-padding;
  background: $background-light;
  color: $text-dark;

  .container {
    @include section-container;
  }

  &__header {
    margin-bottom: 2rem;
    max-width: 720px;

    @media (max-width: 640px) {
      margin-bottom: 1.5rem;
    }
  }

  &__title {
    @include section-title;
  }

  &__subtitle {
    @include section-subtitle;
    color: $text-gray;
    margin-bottom: 0;
  }

  &__summary {
    @include summary-block(light);

    @media (max-width: 640px) {
      padding: 1.1rem 1.2rem;
    }
  }
}

/* ========================================
   1. ЧИПЫ МЕТОДОВ
   ======================================== */

.method-compare__chips {
  display: grid;
  grid-template-columns: repeat(var(--cols, 3), minmax(0, 1fr));
  gap: 1rem;
  margin: 1.5rem 0 1.5rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 0.75rem;
  }
}

.method-chip {
  display: flex;
  align-items: flex-start; /* выравнивание по верху для единообразия */
  gap: 0.85rem;
  padding: 0.9rem 1.1rem;
  background: #fff;
  border: 1px solid $border-color;
  border-radius: 12px;
  transition: var(--transition);

  @media (max-width: 768px) {
    padding: 1rem 1.1rem;
  }

  &--recommended {
    border-color: $blue;
    background: rgba(0, 195, 245, 0.05);
    box-shadow: 0 0 0 1px rgba(0, 195, 245, 0.25);
  }

  &__icon {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 42px;
    height: 42px;
    border-radius: 10px;
    background: rgba(0, 195, 245, 0.1);
    color: $blue;
    margin-top: 2px; /* выравнивание с первой строкой текста */

    @media (max-width: 768px) {
      width: 40px;
      height: 40px;
    }
  }

  &--recommended &__icon {
    background: $blue-gradient;
    color: #fff;
  }

  &__text {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }

  &__name-row {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  &__name {
    font-family: 'Rubik', sans-serif;
    font-weight: 700;
    font-size: 1rem;
    color: $text-dark;
    line-height: 1.2;
  }

  &__badge {
    font-size: 0.65rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    font-weight: 700;
    padding: 0.15rem 0.5rem;
    border-radius: 50px;
    background: $blue-gradient;
    color: #fff;
  }

  &__tagline {
    font-size: 0.82rem;
    color: $text-gray;
    margin-top: 4px;
    line-height: 1.4;
  }
}

/* ========================================
   2. ТАБЛИЦА ХАРАКТЕРИСТИК (ДЕСКТОП)
   ======================================== */

.method-compare__table-wrap {
  margin: 0 0 2rem;
  border-radius: 14px;
  overflow: hidden;
  border: 1px solid $border-color;
  background: #fff;

  @media (max-width: 640px) {
    margin-bottom: 1.5rem;
  }
}

.method-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;

  &__label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.9rem 1.1rem;
    font-family: 'Rubik', sans-serif;
    font-weight: 600;
    font-size: 0.88rem;
    color: $text-gray;
    background: #fafafa;
    border-bottom: 1px solid $border-color;
    border-right: 1px solid $border-color;
    text-align: left;
    vertical-align: middle;
    min-width: 180px;
    max-width: 260px;
    width: 25%;
  }

  &__icon {
    color: $blue;
    flex-shrink: 0;
  }

  &__value {
    padding: 0.9rem 1.1rem;
    font-size: 0.94rem;
    font-weight: 500;
    color: $text-dark;
    border-bottom: 1px solid $border-color;
    border-right: 1px solid $border-color;
    vertical-align: middle;
    text-align: center;

    &:last-child {
      border-right: none;
    }

    &.is-recommended {
      background: rgba(0, 195, 245, 0.045);
      font-weight: 600;
    }
  }

  tr:last-child &__label,
  tr:last-child &__value {
    border-bottom: none;
  }
}

/* ========================================
   3. КОГДА ВЫБИРАТЬ
   ======================================== */

.method-compare__when {
  display: grid;
  grid-template-columns: repeat(var(--cols, 3), minmax(0, 1fr));
  gap: 1rem;
  margin-bottom: 1rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 0.75rem;
  }
}

.when-card {
  display: flex;
  flex-direction: column;
  background: #fff;
  border: 1px solid $border-color;
  border-radius: 14px;
  padding: 1.2rem 1.3rem;

  @media (max-width: 640px) {
    padding: 1rem 1.05rem;
    border-radius: 12px;
  }

  &--recommended {
    border-color: $blue;
    box-shadow: 0 0 0 1px rgba(0, 195, 245, 0.3);
  }

  &__title {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-family: 'Rubik', sans-serif;
    font-size: 0.95rem;
    font-weight: 700;
    color: $text-dark;
    margin: 0 0 0.85rem;
    padding-bottom: 0.6rem;
    border-bottom: 1px solid $border-color;
  }

  &__list,
  &__cons {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0.45rem;
    font-size: 0.9rem;
    line-height: 1.5;

    li {
      display: flex;
      align-items: flex-start;
      gap: 0.5rem;
    }
  }

  &__check {
    color: $green;
    flex-shrink: 0;
    margin-top: 3px;
  }

  &__minus {
    color: $red;
    flex-shrink: 0;
    margin-top: 3px;
  }

  &__cons {
    margin-top: 0.7rem;
    padding-top: 0.7rem;
    border-top: 1px dashed $border-color;
    color: $text-gray;
    font-size: 0.86rem;
  }
}

/* ========================================
   АДАПТИВ: ТАБЛИЦА → КАРТОЧКИ НА МОБИЛЬНЫХ
   ======================================== */

@media (max-width: 640px) {
  .method-compare__table-wrap {
    background: transparent;
    border: none;
    border-radius: 0;
    overflow: visible;
  }

  .method-table,
  .method-table tbody,
  .method-table tr,
  .method-table th,
  .method-table td {
    display: block;
    width: auto;
    border: none;
    min-width: 0;
    max-width: none;
  }

  .method-table tbody {
    display: flex;
    flex-direction: column;
    gap: 0.85rem;
  }

  .method-table tr {
    background: #fff;
    border: 1px solid $border-color;
    border-radius: 12px;
    padding: 1rem 1.1rem;
    margin: 0;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.03);
  }

  .method-table__label {
    background: transparent;
    padding: 0 0 0.6rem;
    font-size: 0.72rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: $text-gray;
    border-bottom: 1px solid $border-color;
    border-right: none;
    width: auto;
    white-space: normal;
    margin-bottom: 0.5rem;

    .method-table__icon {
      display: none;
    }
  }

  .method-table__value {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 1rem;
    padding: 0.75rem 0.5rem;
    border-left: none;
    border-right: none;
    border-bottom: 1px solid rgba(0, 0, 0, 0.06);
    font-size: 0.94rem;
    font-weight: 500;
    line-height: 1.45;
    text-align: left;
    color: $text-dark;

    &:last-child {
      border-bottom: none;
      padding-bottom: 0;
    }

    /* Тонкое выделение рекомендуемого метода */
    &.is-recommended {
      color: $blue;
      font-weight: 600;
    }

    &::before {
      content: attr(data-label);
      order: -1;
      flex: 1 1 auto;
      min-width: 0;
      font-size: 0.84rem;
      font-weight: 500;
      color: $text-gray;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      margin-right: 1em;
    }

    &.is-recommended::before {
      color: $text-dark;
      font-weight: 600;
    }
  }
}

@media (max-width: 380px) {
  .method-table tr {
    padding: 0.85rem 0.9rem;
  }

  .method-table__value {
    font-size: 0.9rem;
    padding: 0.65rem 0.4rem;

    &::before {
      font-size: 0.78rem;
    }
  }
}
</style>