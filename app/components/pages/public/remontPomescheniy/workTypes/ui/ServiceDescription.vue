<!-- app/components/pages/public/remontPomescheniy/workTypes/ui/ServiceDescription.vue -->
 <template>
  <section class="service-description">
    <div class="container">
      <div class="service-description__layout">
        <!-- ==================== ЛЕВАЯ КОЛОНКА: ТЕКСТ ==================== -->
        <div class="service-description__content">
          <h2 class="service-description__title" v-html="title" />

          <!-- Лид-абзац (акцентный, более крупный) -->
          <p v-if="lead" class="service-description__lead">{{ lead }}</p>

          <!-- Основной текст — через slot, чтобы можно было вставлять NuxtLink -->
          <div class="service-description__body">
            <slot />
          </div>
        </div>

        <!-- ==================== ПРАВАЯ КОЛОНКА: КАРТОЧКИ ==================== -->
        <aside class="service-description__aside">
          <!-- Блок: "Для чего применяется" -->
          <div v-if="highlights?.length" class="aside-card aside-card--highlights">
            <h3 class="aside-card__title">
              <Icon name="mdi:target" size="20" />
              Для чего применяется
            </h3>
            <ul class="aside-card__list">
              <li
                v-for="(item, index) in highlights"
                :key="index"
                class="aside-card__item"
              >
                <span class="aside-card__marker">{{ String(index + 1).padStart(2, '0') }}</span>
                <span class="aside-card__text">{{ item }}</span>
              </li>
            </ul>
          </div>

          <!-- Блок: "Результат для клиента" -->
          <div v-if="results?.length" class="aside-card aside-card--results">
            <h3 class="aside-card__title">
              <Icon name="mdi:check-decagram" size="20" />
              Результат для клиента
            </h3>
            <ul class="aside-card__list aside-card__list--check">
              <li
                v-for="(item, index) in results"
                :key="index"
                class="aside-card__item aside-card__item--check"
              >
                <Icon name="mdi:check-circle" size="18" class="check-icon" />
                <span class="aside-card__text">{{ item }}</span>
              </li>
            </ul>
          </div>

          <!-- Мини-CTA внизу сайдбара -->
          <div class="aside-card aside-card--cta">
            <Icon name="mdi:lightbulb-outline" size="24" class="aside-card__cta-icon" />
            <p class="aside-card__cta-text">
              Не знаете, какой вариант подойдёт? Бесплатный замер и консультация инженера.
            </p>
            <button class="aside-card__cta-btn" @click="$emit('consult')">
              Получить консультацию
            </button>
          </div>
        </aside>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
defineProps<{
  /** Заголовок с поддержкой <span> для акцента */
  title: string
  /** Лид-абзац (крупнее основного текста, серого цвета) */
  lead?: string
  /** Массив пунктов "Для чего применяется" */
  highlights?: string[]
  /** Массив пунктов "Результат для клиента" */
  results?: string[]
}>()

defineEmits<{
  (e: 'consult'): void
}>()
</script>

<style lang="scss" scoped>
@use '@/assets/styles/variables' as *;

.service-description {
  padding: 5rem 0;
  background: $background-dark;
  position: relative;

  &::before {
    content: '';
    position: absolute;
    top: -10%;
    right: -5%;
    width: 500px;
    height: 500px;
    background: radial-gradient(circle, rgba(0, 195, 245, 0.05) 0%, transparent 65%);
    border-radius: 50%;
    pointer-events: none;
  }

  .container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 2rem;
    position: relative;
    z-index: 1;
    @media (max-width: 768px) {
      padding: 0 1.2rem;
    }
  }

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
      gap: 2.5rem;
    }
  }

  &__content {
    max-width: 760px;
  }

  &__title {
    font-family: 'Rubik', sans-serif;
    font-size: 2.2rem;
    font-weight: 700;
    color: $text-light;
    margin: 0 0 1.5rem;
    line-height: 1.25;
    position: relative;
    padding-bottom: 1rem;

    &::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 0;
      width: 80px;
      height: 4px;
      background: $blue-gradient;
      border-radius: 2px;
      box-shadow: 0 0 10px $blue50;
    }
    @media (max-width: 768px) {
      font-size: 1.7rem;
    }
    :deep(span),
    :deep(.accent) {
      background: $blue-gradient;
      -webkit-background-clip: text;
      background-clip: text;
      color: transparent;
    }
  }

  &__lead {
    font-size: 1.15rem;
    line-height: 1.65;
    color: rgba($text-light, 0.88);
    margin: 0 0 1.5rem;
    font-weight: 400;
  }

  &__body {
    :deep(p) {
      font-size: 1.02rem;
      line-height: 1.7;
      color: rgba($text-light, 0.52);
      margin: 0 0 1.1rem;

      &:last-child {
        margin-bottom: 0;
      }
    }

    :deep(a) {
      color: $blue-light;
      text-decoration: underline;
      text-decoration-thickness: 1px;
      text-underline-offset: 3px;
      transition: color 0.2s ease;

      &:hover {
        color: $blue;
      }
    }

    :deep(strong),
    :deep(b) {
      color: $text-light;
      font-weight: 600;
    }
  }
}

// === Карточки справа ===
.aside-card {
  background: rgba(255, 255, 255, 0.035);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: $border-radius;
  padding: 1.6rem;
  transition: border-color 0.3s ease, background 0.3s ease;

  &:not(:last-child) {
    margin-bottom: 1.2rem;
  }

  &:hover {
    border-color: rgba(0, 195, 245, 0.25);
  }

  &--highlights {
    border-left: 3px solid $blue;
  }

  &--results {
    border-left: 3px solid $green;
  }

  &--cta {
    background: rgba(0, 195, 245, 0.06);
    border: 1px solid rgba(0, 195, 245, 0.2);
    border-left: 3px solid $blue;
    text-align: center;
  }

  &__title {
    font-family: 'Rubik', sans-serif;
    font-size: 1.1rem;
    font-weight: 700;
    color: $text-light;
    margin: 0 0 1rem;
    display: flex;
    align-items: center;
    gap: 0.6rem;
    line-height: 1.3;

    :deep(.icon) {
      color: $blue;
      flex-shrink: 0;
    }
    .aside-card--results & :deep(.icon) {
      color: $green;
    }
  }

  &__list {
    margin: 0;
    padding: 0;
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 0.7rem;

    &--check {
      gap: 0.6rem;
    }
  }

  &__item {
    display: flex;
    gap: 0.75rem;
    align-items: flex-start;

    &--check {
      gap: 0.6rem;
    }
  }

  &__marker {
    flex-shrink: 0;
    font-family: 'Rubik', sans-serif;
    font-size: 0.78rem;
    font-weight: 700;
    color: $blue;
    background: rgba(0, 195, 245, 0.12);
    padding: 0.2rem 0.55rem;
    border-radius: 50px;
    letter-spacing: 0.03em;
    line-height: 1;
    margin-top: 2px;
  }

  &__text {
    font-size: 0.95rem;
    line-height: 1.55;
    color: rgba($text-light, 0.88);
  }

  .check-icon {
    color: $green;
    flex-shrink: 0;
    margin-top: 2px;
  }

  &__cta-icon {
    color: $blue-light;
    margin-bottom: 0.5rem;
  }

  &__cta-text {
    font-size: 0.92rem;
    line-height: 1.55;
    color: rgba($text-light, 0.85);
    margin: 0 0 1rem;
  }

  &__cta-btn {
    width: 100%;
    padding: 0.8rem 1.2rem;
    background: $blue-gradient;
    color: $background-dark;
    border: none;
    border-radius: 50px;
    font-family: 'Rubik', sans-serif;
    font-size: 0.92rem;
    font-weight: 700;
    cursor: pointer;
    box-shadow: 0 6px 20px rgba(0, 195, 245, 0.3);
    transition: all 0.3s ease;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 10px 28px rgba(0, 195, 245, 0.45);
    }
    &:active {
      transform: translateY(0);
    }
  }
}

// === Мобильный адаптив ===
@media (max-width: 768px) {
  .service-description {
    padding: 3.5rem 0;

    &__layout {
      gap: 2rem;
    }

    &__lead {
      font-size: 1.05rem;
    }

    &__body :deep(p) {
      font-size: 0.98rem;
    }
  }

  .aside-card {
    padding: 1.3rem;
  }
}
</style>