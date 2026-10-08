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
      label: 'Цена от',
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
  }
}

.method-chip {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  padding: 0.9rem 1.1rem;
  background: #fff;
  border: 1px solid $border-color;
  border-radius: 12px;
  transition: var(--transition);

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
    margin-top: 2px;
    line-height: 1.4;
  }
}

/* ========================================
   2. ТАБЛИЦА ХАРАКТЕРИСТИК
   ======================================== */

.method-compare__table-wrap {
  margin: 0 0 2rem;
  border-radius: 14px;
  overflow: hidden;
  border: 1px solid $border-color;
  background: #fff;
}

.method-table {
  width: 100%;
  border-collapse: collapse;

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
    text-align: left;
    width: 200px;
    white-space: nowrap;
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
    border-left: 1px solid $border-color;
    border-bottom: 1px solid $border-color;

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
  }
}

.when-card {
  display: flex;
  flex-direction: column;
  background: #fff;
  border: 1px solid $border-color;
  border-radius: 14px;
  padding: 1.2rem 1.3rem;

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
   АДАПТИВ: ТАБЛИЦА → СТЕК НА МОБИЛЬНЫХ
   ======================================== */

@media (max-width: 640px) {
  .method-compare__table-wrap {
    background: transparent;
    border: none;
    border-radius: 0;
  }

  .method-table,
  .method-table tbody,
  .method-table tr,
  .method-table th,
  .method-table td {
    display: block;
    width: auto;
    border: none;
  }

  .method-table tr {
    background: #fff;
    border: 1px solid $border-color;
    border-radius: 12px;
    padding: 0.9rem 1rem;
    margin-bottom: 0.75rem;
  }

  .method-table tr:last-child {
    margin-bottom: 0;
  }

  .method-table__label {
    background: transparent;
    padding: 0 0 0.5rem;
    font-size: 0.85rem;
    color: $text-dark;
    border-bottom: 1px dashed $border-color;
    width: auto;
    white-space: normal;
  }

  .method-table__value {
    padding: 0.4rem 0 0.4rem 1.5rem;
    position: relative;
    border-left: none;
    font-size: 0.9rem;

    &.is-recommended {
      background: transparent;
    }

    &::before {
      content: attr(data-label);
      position: absolute;
      left: 0;
      top: 0.55rem;
      width: 1.2rem;
      height: 1.2rem;
      border-radius: 50%;
      background: rgba(0, 195, 245, 0.1);
      color: $blue;
      font-size: 0.7rem;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      text-indent: -9999px;
    }

    &::after {
      content: '';
      position: absolute;
      left: 0;
      top: 0.55rem;
      width: 1.2rem;
      height: 1.2rem;
      border-radius: 50%;
      border: 1.5px solid $blue;
      opacity: 0.4;
    }
  }
}
</style>