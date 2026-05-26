<!-- app/components/pages/public/remontPomescheniy/pageTypes/ui/PriceFactors.vue -->
 <template>
  <section class="price-factors">
    <div class="container">
      <!-- Заголовок -->
      <slot name="header">
        <h2 class="price-factors__title" v-html="title" />
        <p v-if="subtitle" class="price-factors__subtitle">{{ subtitle }}</p>
      </slot>

      <!-- Список факторов -->
      <div class="price-factors__list">
        <article
          v-for="(factor, index) in factors"
          :key="factor.title"
          class="price-factor"
          :style="{ '--delay': index * 0.08 + 's' }"
        >
          <!-- Номер фактора -->
          <div class="price-factor__number">
            {{ String(index + 1).padStart(2, '0') }}
          </div>

          <!-- Иконка -->
          <div class="price-factor__icon">
            <slot name="factor-icon" :factor="factor" :index="index">
              <Icon v-if="factor.icon" :name="factor.icon" size="26" />
              <Icon v-else name="mdi:format-list-numbered" size="26" />
            </slot>
          </div>

          <!-- Контент -->
          <div class="price-factor__content">
            <h3 class="price-factor__title">{{ factor.title }}</h3>
            <p class="price-factor__desc">{{ factor.description }}</p>

            <!-- Опциональный слот для доп. контента внутри фактора -->
            <slot name="factor-content" :factor="factor" :index="index" />
          </div>
        </article>
      </div>

      <!-- Подпись внизу блока (ориентир по цене) -->
      <div v-if="footerNote || $slots.footer" class="price-factors__footer">
        <slot name="footer">
          <Icon name="mdi:information-outline" size="22" class="price-factors__footer-icon" />
          <p class="price-factors__footer-text" v-html="footerNote" />
        </slot>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
export interface PriceFactor {
  title: string
  description: string
  icon?: string
  [key: string]: unknown
}

defineProps<{
  title: string
  subtitle?: string
  factors: PriceFactor[]
  footerNote?: string
}>()
</script>

<style lang="scss" scoped>
@use '@/assets/styles/variables' as *;

span {
  color: unset;
}

.price-factors {
  padding: 5rem 0;
  background: $background-dark;
  position: relative;
  overflow: hidden;

  // Мягкое свечение в углу
  &::after {
    content: '';
    position: absolute;
    bottom: -15%;
    left: -5%;
    width: 450px;
    height: 450px;
    background: radial-gradient(circle, rgba(0, 195, 245, 0.05) 0%, transparent 70%);
    border-radius: 50%;
    pointer-events: none;
  }

  .container {
    max-width: 1000px;
    margin: 0 auto;
    padding: 0 2rem;
    position: relative;
    z-index: 1;

    @media (max-width: 768px) {
      padding: 0 1.2rem;
    }
  }

  // === Заголовок ===
  &__title {
    font-family: 'Rubik', sans-serif;
    font-size: 2rem;
    font-weight: 700;
    color: $text-light;
    margin: 0 0 1rem;
    line-height: 1.25;
    position: relative;
    padding-bottom: 1rem;

    &::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 0;
      width: 70px;
      height: 4px;
      background: $blue-gradient;
      border-radius: 2px;
      box-shadow: 0 0 10px $blue50;
    }

    @media (max-width: 768px) {
      font-size: 1.6rem;
    }

    :deep(span),
    :deep(.accent) {
      background: $blue-gradient;
      -webkit-background-clip: text;
      background-clip: text;
      color: transparent;
    }
  }

  &__subtitle {
    font-size: 1.05rem;
    line-height: 1.6;
    color: rgba($text-light, 0.75);
    margin: 1.5rem 0 2.5rem;
    max-width: 720px;
  }

  // === Список факторов ===
  &__list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    margin-top: 2.5rem;
  }

  // === Подпись внизу ===
  &__footer {
    margin-top: 3rem;
    padding: 1.5rem 1.8rem;
    background: rgba(0, 195, 245, 0.06);
    border: 1px solid rgba(0, 195, 245, 0.2);
    border-left: 4px solid $blue;
    border-radius: $border-radius;
    display: flex;
    align-items: flex-start;
    gap: 1rem;

    @media (max-width: 640px) {
      padding: 1.2rem 1.4rem;
      flex-direction: column;
      gap: 0.6rem;
    }
  }

  &__footer-icon {
    color: $blue;
    flex-shrink: 0;
    margin-top: 2px;
  }

  &__footer-text {
    font-size: 0.98rem;
    line-height: 1.65;
    color: rgba($text-light, 0.88);
    margin: 0;

    :deep(strong),
    :deep(b) {
      color: $blue-light;
      font-weight: 600;
    }

    :deep(em),
    :deep(i) {
      color: rgba($text-light, 0.7);
    }
  }
}

// === Фактор ===
.price-factor {
  position: relative;
  display: grid;
  grid-template-columns: auto auto 1fr;
  gap: 1.2rem 1.2rem;
  align-items: start;
  padding: 1.6rem 1.8rem;
  background: rgba(255, 255, 255, 0.035);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: $border-radius;
  transition: transform 0.35s ease, box-shadow 0.35s ease, border-color 0.35s ease, background 0.35s ease;

  // Анимация появления
  opacity: 0;
  transform: translateY(16px);
  animation: fadeInUp 0.55s var(--delay, 0s) ease forwards;

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 10px 28px rgba(0, 195, 245, 0.12);
    border-color: rgba(0, 195, 245, 0.3);
    background: rgba(0, 195, 245, 0.04);
  }

  // Номер
  &__number {
    position: absolute;
    top: 0.8rem;
    right: 1.2rem;
    font-family: 'Rubik', sans-serif;
    font-size: 1.4rem;
    font-weight: 800;
    background: $blue-gradient;
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
    opacity: 0.35;
    pointer-events: none;
    transition: opacity 0.3s ease;
  }

  &:hover &__number {
    opacity: 0.75;
  }

  // Иконка
  &__icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 50px;
    height: 50px;
    background: rgba(0, 195, 245, 0.12);
    color: $blue-light;
    border-radius: 12px;
    flex-shrink: 0;
    transition: all 0.3s ease;

    .price-factor:hover & {
      background: rgba(0, 195, 245, 0.2);
      transform: scale(1.05);
    }
  }

  // Контент
  &__content {
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  &__title {
    font-family: 'Rubik', sans-serif;
    font-size: 1.2rem;
    font-weight: 600;
    color: $text-light;
    margin: 0;
    line-height: 1.3;
  }

  &__desc {
    font-size: 0.98rem;
    line-height: 1.6;
    color: rgba($text-light, 0.82);
    margin: 0;
  }
}

// === Анимация ===
@keyframes fadeInUp {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

// === Адаптив ===
@media (max-width: 640px) {
  .price-factors {
    padding: 3.5rem 0;
  }

  .price-factor {
    grid-template-columns: auto 1fr;
    padding: 1.3rem 1.2rem;
    gap: 0.8rem 1rem;

    &__icon {
      grid-row: span 1;
      width: 44px;
      height: 44px;
    }

    &__number {
      position: static;
      grid-column: 2;
      justify-self: end;
      font-size: 1.1rem;
      opacity: 0.5;
    }

    &__content {
      grid-column: 1 / -1;
    }

    &__title {
      font-size: 1.1rem;
    }
  }
}
</style>