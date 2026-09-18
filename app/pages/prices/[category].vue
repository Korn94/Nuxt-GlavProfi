<template>
  <PagesPublicRemontPomescheniyUiBreadcrumbs :items="breadcrumbItems" />
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

const { pricePayload, pagesData, currentSlug, setCategory } = usePriceStores()

const categories = computed(() =>
  (pagesData.value ?? []).map(page => ({
    id: page.id,
    name: page.title,
    slug: page.slug,
  })),
)

const breadcrumbItems = computed(() => {
  const currentCategory = categories.value.find(c => c.slug === currentSlug.value)
  return [
    { label: 'Главная', to: '/' },
    { label: 'Цены', to: '/prices/otdelochnye-raboty' },
    { label: currentCategory?.name ?? 'Цены' },
  ]
})

usePriceSeo(currentSlug.value, pricePayload, pagesData)
</script>

<style lang="scss" scoped>
@use '@/assets/styles/variables' as *;

.wrap {
  margin: 2.5em 5px 0;

  @media (max-width: 840px) {
    margin: 1.5em 5px 0;
  }
}
</style>