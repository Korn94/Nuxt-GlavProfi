<!-- app/components/pages/public/remontPomescheniy/pageTypes/ui/PageHero.vue -->
 <template>
  <section class="page-hero">
    <!-- Фоновый слой (картинка/слайдер) -->
    <div class="page-hero__background">
      <slot name="background">
        <div class="page-hero__placeholder" />
      </slot>
      <div class="page-hero__overlay" />
    </div>

    <!-- Контент -->
    <div class="container">
      <div class="page-hero__layout">
        <!-- Левая колонка: текст + цена + триггеры -->
        <div class="page-hero__content">
          <h1 class="page-hero__title" v-html="title" />
          <p class="page-hero__subtitle">{{ subtitle }}</p>

          <div class="page-hero__price" v-if="$slots.price">
            <slot name="price" />
          </div>

          <div class="page-hero__triggers" v-if="$slots.triggers">
            <slot name="triggers" />
          </div>
        </div>

        <!-- Правая колонка: мини-форма -->
        <aside class="page-hero__form-wrapper" v-if="$slots.form">
          <slot name="form" />
        </aside>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
defineProps<{
  title: string
  subtitle: string
}>()
</script>

<style lang="scss" scoped>
@use '@/assets/styles/variables' as *;

span {
  color: unset;
}

.page-hero {
  position: relative;
  min-height: 95vh;
  display: flex;
  align-items: center;
  overflow: hidden;
  padding: 6rem 0 4rem;
  background: $background-dark;

  @media (max-width: 768px) {
    min-height: auto;
    padding: 5rem 0 3rem;
  }

  // === Фон ===
  &__background {
    position: absolute;
    inset: 0;
    z-index: 0;
    overflow: hidden;

    :deep(img),
    :deep(video) {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }

  &__placeholder {
    width: 100%;
    height: 100%;
    background: radial-gradient(
      circle at 20% 30%,
      rgba(0, 195, 245, 0.15) 0%,
      transparent 50%
    ), $background-dark;
  }

  &__overlay {
    position: absolute;
    inset: 0;
    background: linear-gradient(
      135deg,
      rgba(24, 25, 27, 0.92) 0%,
      rgba(24, 25, 27, 0.75) 60%,
      rgba(24, 25, 27, 0.55) 100%
    );
    z-index: 1;
  }

  // === Контейнер ===
  .container {
    position: relative;
    z-index: 2;
    width: 100%;
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 2rem;

    @media (max-width: 768px) {
      padding: 0 1.2rem;
    }
  }

  // === Лэйаут: 2 колонки ===
  &__layout {
    display: grid;
    grid-template-columns: 1fr 380px;
    gap: 3rem;
    align-items: start;

    @media (max-width: 1024px) {
      grid-template-columns: 1fr 320px;
      gap: 2rem;
    }

    @media (max-width: 768px) {
      grid-template-columns: 1fr;
      gap: 2rem;
    }
  }

  // === Контент (слева) ===
  &__content {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  &__title {
    font-family: 'Rubik', sans-serif;
    font-size: 2.8rem;
    font-weight: 700;
    line-height: 1.15;
    color: $text-light;
    margin: 0;
    letter-spacing: -0.02em;

    @media (max-width: 1024px) {
      font-size: 2.2rem;
    }

    @media (max-width: 640px) {
      font-size: 1.8rem;
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
    font-size: 1.15rem;
    line-height: 1.6;
    color: rgba($text-light, 0.85);
    margin: 0;
    max-width: 640px;

    @media (max-width: 768px) {
      font-size: 1rem;
    }
  }

  // === Блок с ценой (акцент) ===
  &__price {
    padding: 1.5rem;
    background: rgba(0, 195, 245, 0.08);
    border: 1px solid rgba(0, 195, 245, 0.25);
    border-left: 4px solid $blue;
    border-radius: $border-radius;
    max-width: 480px;

    :deep(.price-main) {
      font-size: 2rem;
      font-weight: 700;
      color: $blue-light;
      font-family: 'Rubik', sans-serif;
      line-height: 1.1;
      display: block;
      margin-bottom: 0.3rem;
    }

    :deep(.price-example) {
      font-size: 0.95rem;
      color: rgba($text-light, 0.7);
      display: block;
      margin-bottom: 0.2rem;
    }

    :deep(.price-note) {
      font-size: 0.85rem;
      color: rgba($text-light, 0.55);
      font-style: italic;
      display: block;
      margin-top: 0.5rem;
    }
  }

  // === Триггеры ===
  &__triggers {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem 1rem;
    margin-top: 0.5rem;

    :deep(.trigger-item) {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.95rem;
      color: rgba($text-light, 0.9);
      padding: 0.5rem 0.9rem;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 50px;
      transition: all 0.3s ease;

      &:hover {
        border-color: $blue;
        background: rgba(0, 195, 245, 0.08);
      }

      .trigger-icon {
        color: $blue;
        flex-shrink: 0;
      }
    }
  }

  // === Форма (справа) ===
  &__form-wrapper {
    background: rgba(34, 34, 34, 0.7);
    backdrop-filter: blur(12px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: $border-radius;
    padding: 1.8rem;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
    position: sticky;
    top: 100px;

    @media (max-width: 768px) {
      position: static;
      padding: 1.5rem;
    }
  }
}
</style>