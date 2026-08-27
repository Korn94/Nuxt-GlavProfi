<!-- app/components/pages/public/remontPomescheniy/workTypes/ui/PriceListTable.vue -->
<template>
  <section class="price-list-table">
    <div class="container">
      <header v-if="title" class="price-list-table__header">
        <h2 class="price-list-table__title" v-html="title" />
        <p v-if="subtitle" class="price-list-table__subtitle">{{ subtitle }}</p>
      </header>

      <!-- Индикатор загрузки -->
      <div v-if="pending" class="price-list-table__loading">
        <Icon name="mdi:loading" size="28" class="spin" />
        <span>Загружаем цены...</span>
      </div>

      <template v-else>
        <div
          v-for="group in groups"
          :key="group.subCategoryId"
          class="price-group"
        >
          <h3 v-if="showSubCategoryTitles && groups.length > 1" class="price-group__title">
            {{ group.subCategoryName }}
          </h3>

          <div class="price-group__table-wrap">
            <table class="price-table">
              <thead>
                <tr>
                  <th class="price-table__th price-table__th--name">Наименование работы</th>
                  <th class="price-table__th price-table__th--unit">Ед. изм.</th>
                  <th class="price-table__th price-table__th--price">Цена</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="item in group.items"
                  :key="item.id"
                  class="price-table__row"
                >
                  <td class="price-table__cell price-table__cell--name">
                    {{ item.name }}
                  </td>
                  <td class="price-table__cell price-table__cell--unit">
                    {{ formatUnit(item.unit) }}
                  </td>
                  <td class="price-table__cell price-table__cell--price">
                    <template v-if="isFree(item)">
                      <span class="price-free">Бесплатно</span>
                    </template>
                    <template v-else-if="isIncluded(item)">
                      <span class="price-included">Включено</span>
                    </template>
                    <template v-else>
                      <span class="price-value">{{ formatPrice(item.price) }}</span>
                      <span class="price-currency">₽</span>
                      <span v-if="isSurcharge(item)" class="price-surcharge">+ к цене</span>
                    </template>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div v-if="groups.length === 0" class="price-list-table__empty">
          <Icon name="mdi:file-document-outline" size="48" />
          <p>Цены для выбранной группы работ не найдены.</p>
        </div>

        <p v-if="footerNote" class="price-list-table__footer">
          {{ footerNote }}
        </p>

        <!-- 🆕 Кнопка перехода на полный прайс-лист -->
        <div v-if="viewAllLink" class="price-list-table__view-all">
          <NuxtLink :to="viewAllLink" class="view-all-btn">
            <Icon name="mdi:cube-scan" size="20" />
            <span>{{ viewAllText }}</span>
            <Icon name="mdi:arrow-right" size="18" class="view-all-btn__arrow" />
          </NuxtLink>
        </div>
      </template>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { DBPriceItem } from '~/types/calculator'
import { usePriceRawFetcher } from '../composables/usePriceRawFetcher'

interface PriceGroup {
  subCategoryId: number
  subCategoryName: string
  items: DBPriceItem[]
}

const props = withDefaults(
  defineProps<{
    title?: string
    subtitle?: string
    /** ID подкатегории или массив ID */
    subCategoryIds: number | number[]
    showSubCategoryTitles?: boolean
    footerNote?: string
    /** 🆕 Ссылка на полный прайс-лист (передайте пустую строку, чтобы скрыть кнопку) */
    viewAllLink?: string
    /** 🆕 Текст кнопки перехода */
    viewAllText?: string
  }>(),
  {
    showSubCategoryTitles: true,
    viewAllLink: '/prices/otdelochnye-raboty',
    viewAllText: 'Смотреть полный прайс-лист',
  }
)

const { pending, getItemsBySubCategoryIds } = usePriceRawFetcher()

const groups = computed<PriceGroup[]>(() => {
  const ids = Array.isArray(props.subCategoryIds)
    ? props.subCategoryIds
    : [props.subCategoryIds]
  return getItemsBySubCategoryIds(ids)
})

function formatPrice(price: string | number): string {
  const num = parseFloat(String(price).replace(',', '.'))
  if (isNaN(num) || num === 0) return '0'
  return Math.round(num).toLocaleString('ru-RU')
}

function formatUnit(unit: string): string {
  return unit.trim()
}

function isFree(item: DBPriceItem): boolean {
  const price = parseFloat(String(item.price).replace(',', '.'))
  return price === 0 && item.unit.toLowerCase().includes('бесплатно')
}

function isIncluded(item: DBPriceItem): boolean {
  const u = item.unit.toLowerCase()
  return u.includes('входит в стоимость') || u.includes('включено')
}

function isSurcharge(item: DBPriceItem): boolean {
  const u = item.unit.toLowerCase().trim()
  return u.endsWith('+') || u.includes('к цене') || u.includes('+ к')
}
</script>

<style lang="scss" scoped>
@use '@/assets/styles/variables' as *;
@use '@/assets/styles/mixins' as *;

.price-list-table {
  @include section-padding;
  background: $background-light;
  color: $text-dark;
  position: relative;

  .container {
    @include section-container;
  }

  &__header {
    margin-bottom: 2.5rem;
    max-width: 720px;
  }

  &__title {
    @include section-title;
  }

  &__subtitle {
    @include section-subtitle;
    color: $text-gray;
  }

  &__loading {
    display: flex;
    align-items: center;
    gap: 0.8rem;
    padding: 3rem 2rem;
    color: $text-gray;
    justify-content: center;

    .spin {
      animation: spin 1s linear infinite;
      color: $blue;
    }
  }

  &__empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    padding: 3rem 2rem;
    color: $text-gray;
    text-align: center;

    p { margin: 0; }
  }

  &__footer {
    margin-top: 1.5rem;
    font-size: 0.88rem;
    color: $text-gray;
    font-style: italic;
  }

  // 🆕 Контейнер кнопки "Полный прайс"
  &__view-all {
    display: flex;
    justify-content: center;
    margin-top: 2.5rem;
  }
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.price-group {
  margin-bottom: 2rem;

  &:last-child { margin-bottom: 0; }

  &__title {
    font-family: 'Rubik', sans-serif;
    font-size: 1.15rem;
    font-weight: 600;
    margin: 0 0 1rem;
    padding-bottom: 0.5rem;
    border-bottom: 2px solid rgba(0, 195, 245, 0.3);
  }

  &__table-wrap {
    overflow-x: auto;
    border-radius: 14px;
    border: 1px solid $border-color;
    background: #fff;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);
  }
}

.price-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.95rem;

  &__th {
    text-align: left;
    padding: 1rem 1.2rem;
    font-family: 'Rubik', sans-serif;
    font-size: 0.8rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: $text-gray;
    background: rgba(131, 131, 131, 0.1);
    border-bottom: 1px solid $border-color;
    white-space: nowrap;

    &--name { width: 100%; }
    &--unit { width: 100px; text-align: center; }
    &--price { width: 160px; text-align: right; }
  }

  &__row {
    transition: background 0.2s ease;

    &:hover { background: rgba(0, 195, 245, 0.03); }

    &:not(:last-child) {
      border-bottom: 1px solid #f0f0f0;
    }
  }

  &__cell {
    padding: 0.9rem 1.2rem;
    vertical-align: middle;

    &--name {
      color: $text-dark;
      line-height: 1.4;
    }

    &--unit {
      text-align: center;
      color: $text-gray;
      font-size: 0.88rem;
      white-space: nowrap;
    }

    &--price {
      text-align: right;
      white-space: nowrap;
      font-family: 'Rubik', sans-serif;
    }
  }
}

.price-value {
  font-size: 1.05rem;
  font-weight: 700;
  color: $text-dark;
}

.price-currency {
  color: $text-gray;
  margin-left: 0.2rem;
  font-size: 0.9rem;
}

.price-surcharge {
  display: inline-block;
  margin-left: 0.5rem;
  padding: 0.15rem 0.5rem;
  background: rgba(0, 195, 245, 0.1);
  color: $blue;
  font-size: 0.72rem;
  font-weight: 600;
  border-radius: 4px;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.price-free,
.price-included {
  color: $green;
  font-weight: 600;
  font-size: 0.92rem;
}

// 🆕 Стили кнопки "Смотреть полный прайс-лист"
.view-all-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  padding: 1rem 2rem;
  background: $blue-gradient;
  color: $background-dark;
  font-family: 'Rubik', sans-serif;
  font-size: 1rem;
  font-weight: 600;
  text-decoration: none;
  border-radius: 12px;
  border: none;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 6px 20px rgba(0, 195, 245, 0.25);

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 28px rgba(0, 195, 245, 0.4);
    color: $background-dark;

    .view-all-btn__arrow {
      transform: translateX(4px);
    }
  }

  &:active {
    transform: translateY(0);
  }

  &__arrow {
    transition: transform 0.3s ease;
    flex-shrink: 0;
  }
}

@media (max-width: 768px) {
  .price-table {
    font-size: 0.88rem;

    &__th {
      padding: 0.8rem 0.8rem;
      font-size: 0.72rem;
      &--unit { width: 70px; }
      &--price { width: 120px; }
    }

    &__cell { padding: 0.7rem 0.8rem; }
  }

  .price-value { font-size: 0.95rem; }

  .price-surcharge {
    display: block;
    margin-left: auto;
    margin-top: 0.3rem;
    width: fit-content;
  }

  .price-list-table__view-all {
    margin-top: 2rem;
  }

  .view-all-btn {
    width: 100%;
    justify-content: center;
    padding: 0.9rem 1.5rem;
    font-size: 0.95rem;
  }
}

@media (max-width: 480px) {
  .price-table {
    &__th--unit,
    &__cell--unit {
      display: none;
    }
  }
}
</style>