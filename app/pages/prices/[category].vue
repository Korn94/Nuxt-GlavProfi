<!-- app\pages\prices\[category].vue -->
<template>
  <div class="wrap">
    <PagesPublicPrices
      :categories="categories"
      :active-category="currentSlug"
      @update:active-category="setCategory"
    />
    <UiWidgetsOffer
      title="Делимся своими оптовыми скидками на материал"
      description="Наши клиенты получают лучшие цены на строительные материалы для своего объекта. Так же помогаем в организации закупок и логистики"
      buttonText="Связаться"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { usePriceStores } from '~/composables/usePriceStores'
import { usePriceSeo } from '~/composables/usePriceSeo'

// ========================================
// 🎯 ОДНА ТОЧКА ИНИЦИАЛИЗАЦИИ
// ========================================
// usePriceStores инкапсулирует ВСЁ:
// ✅ useAsyncData (загрузка прайса + проверка роли)
// ✅ Инициализацию 3 Pinia-сторов (UI, Data, Edit)
// ✅ Передачу данных в DataStore через setData()
// ✅ onBeforeRouteLeave (предупреждение о несохранённых изменениях)
// ✅ beforeunload listener (защита от закрытия вкладки)
// ✅ onUnmounted — полный сброс всех сторов (размонтирование)
const {
  pricePayload,
  pagesData,
  currentSlug,
  setCategory,
} = usePriceStores()

// ========================================
// 📋 НАВИГАЦИЯ (передаётся в дочерний компонент)
// ========================================
const categories = computed(() =>
  (pagesData.value ?? []).map(page => ({
    id: page.id,
    name: page.title,
    slug: page.slug,
  })),
)

// ========================================
// 🔍 SEO (остаётся без изменений)
// ========================================
usePriceSeo(currentSlug.value, pricePayload, pagesData)
</script>

<style lang="scss" scoped>
.wrap {
  margin: 8em 5px 0;

  @media (max-width: 840px) {
    margin: 2em 5px 0;
  }

  h1 {
    margin-bottom: 3em;
    text-align: center;
  }

  button {
    padding: 10px 20px;
    min-width: 150px;
    margin-top: 1.5em;
    background: linear-gradient(to right, #00c3f5, #00a3d3);
    color: white;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    transition: background 0.3s ease;

    &:hover {
      background: #00a3d3;
    }
  }
}
</style>