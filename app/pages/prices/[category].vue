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

    <!-- ==================== БЛОК: КАЛЬКУЛЯТОР ==================== -->
    <section id="calculator" class="page-section page-section--light">
      <div class="calculator-wrap">
        <header class="calculator-header">
          <h2 class="calculator-title">Калькулятор сметы онлайн</h2>
          <p class="calculator-subtitle">
            Рассчитайте предварительную стоимость работ за 1 минуту.
            Введите параметры объекта и тип работ — получите ориентировочную смету.
            Точный расчёт — после бесплатного выезда инженера на объект.
          </p>
        </header>
        <UiCalculator />
      </div>
    </section>
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
@use '@/assets/styles/variables' as *;

.wrap {
  margin: 8em 5px 0;

  @media (max-width: 840px) {
    margin: 5em 5px 0;
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

.page-section {
  position: relative;

  &--light {
    background: $background-light;
    color: $text-dark;
  }
}

// === Калькулятор (обёртка блока) ===
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