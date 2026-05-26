<!-- app/components/pages/public/remontPomescheniy/pageTypes/ui/RepairTypes.vue -->
 <template>
  <section class="repair-types">
    <div class="container">
      <!-- Заголовок блока -->
      <slot name="header">
        <h2 class="repair-types__title" v-html="title" />
        <p v-if="subtitle" class="repair-types__subtitle">{{ subtitle }}</p>
      </slot>

      <!-- Сетка карточек -->
      <div class="repair-types__grid">
        <article
          v-for="(variant, index) in variants"
          :key="variant.title"
          class="repair-type-card"
          :class="{ 'repair-type-card--featured': variant.featured }"
          :style="{ '--delay': index * 0.1 + 's' }"
        >
          <!-- Бейдж "популярный" / "рекомендуем" -->
          <span v-if="variant.badge" class="repair-type-card__badge">
            {{ variant.badge }}
          </span>

          <!-- Шапка карточки: иконка + название -->
          <header class="repair-type-card__header">
            <div class="repair-type-card__icon">
              <slot name="variant-icon" :variant="variant" :index="index">
                <Icon v-if="variant.icon" :name="variant.icon" size="28" />
                <Icon v-else name="mdi:format-paint" size="28" />
              </slot>
            </div>
            <h3 class="repair-type-card__title">{{ variant.title }}</h3>
          </header>

          <!-- Описание (для кого / когда) -->
          <p class="repair-type-card__lead">{{ variant.lead }}</p>

          <!-- Список работ -->
          <ul v-if="variant.works?.length" class="repair-type-card__works">
            <li v-for="work in variant.works" :key="work">
              <Icon name="mdi:check-circle" size="16" class="work-icon" />
              <span>{{ work }}</span>
            </li>
          </ul>

          <!-- Кастомный контент внутри карточки -->
          <slot name="variant-content" :variant="variant" :index="index" />

          <!-- Подвал карточки: срок + (опционально) цена -->
          <footer class="repair-type-card__footer">
            <div v-if="variant.duration" class="repair-type-card__duration">
              <Icon name="mdi:clock-outline" size="18" />
              <span>Срок работ: <strong>{{ variant.duration }}</strong></span>
            </div>

            <div v-if="variant.price" class="repair-type-card__price">
              {{ variant.price }}
            </div>
          </footer>

          <!-- Слот для кнопки / доп. действия -->
          <slot name="variant-footer" :variant="variant" :index="index" />
        </article>
      </div>

      <!-- Контент после карточек (например, вводный текст перед факторами цены) -->
      <slot name="after" />
    </div>
  </section>
</template>

<script setup lang="ts">
export interface RepairVariant {
  title: string
  lead: string
  works?: string[]
  duration?: string
  price?: string
  icon?: string
  badge?: string
  featured?: boolean
  [key: string]: unknown
}

defineProps<{
  title: string
  subtitle?: string
  variants: RepairVariant[]
}>()
</script>

<style lang="scss" scoped>
@use '@/assets/styles/variables' as *;

span {
  color: unset;
}

.repair-types {
  padding: 5rem 0;
  background: $background-dark;
  position: relative;
  overflow: hidden;

  // Декоративное свечение
  &::before {
    content: '';
    position: absolute;
    top: -10%;
    right: -5%;
    width: 500px;
    height: 500px;
    background: radial-gradient(circle, rgba(0, 195, 245, 0.06) 0%, transparent 70%);
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

  // === Заголовок ===
  &__title {
    font-family: 'Rubik', sans-serif;
    font-size: 2.2rem;
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

  &__subtitle {
    font-size: 1.1rem;
    line-height: 1.6;
    color: rgba($text-light, 0.75);
    margin: 1.5rem 0 2.5rem;
    max-width: 720px;
  }

  // === Сетка карточек ===
  &__grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(340px, 1fr));
    gap: 1.8rem;
    margin-top: 2.5rem;

    @media (max-width: 640px) {
      grid-template-columns: 1fr;
      gap: 1.2rem;
    }
  }
}

// === Карточка варианта ===
.repair-type-card {
  position: relative;
  background: rgba(255, 255, 255, 0.04);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: $border-radius;
  padding: 2rem;
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
  transition: transform 0.35s ease, box-shadow 0.35s ease, border-color 0.35s ease, background 0.35s ease;

  // Анимация появления
  opacity: 0;
  transform: translateY(20px);
  animation: fadeInUp 0.6s var(--delay, 0s) ease forwards;

  &:hover {
    transform: translateY(-6px);
    box-shadow: 0 12px 32px rgba(0, 195, 245, 0.15);
    border-color: $blue;
    background: rgba(0, 195, 245, 0.05);
  }

  // === "Рекомендуемый" вариант ===
  &--featured {
    border-color: rgba(0, 195, 245, 0.4);
    background: rgba(0, 195, 245, 0.06);

    &::before {
      content: '';
      position: absolute;
      inset: -1px;
      border-radius: $border-radius;
      padding: 1px;
      background: $blue-gradient;
      -webkit-mask:
        linear-gradient(#fff 0 0) content-box,
        linear-gradient(#fff 0 0);
      -webkit-mask-composite: xor;
              mask-composite: exclude;
      pointer-events: none;
    }
  }

  // === Бейдж ===
  &__badge {
    position: absolute;
    top: -12px;
    right: 1.5rem;
    background: $yellow;
    color: $background-dark;
    font-size: 0.8rem;
    font-weight: 700;
    padding: 0.35rem 0.9rem;
    border-radius: 50px;
    letter-spacing: 0.02em;
    text-transform: uppercase;
    box-shadow: 0 4px 12px rgba(250, 183, 2, 0.35);
  }

  // === Шапка ===
  &__header {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  &__icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 54px;
    height: 54px;
    background: rgba(0, 195, 245, 0.12);
    color: $blue-light;
    border-radius: 12px;
    flex-shrink: 0;
    transition: all 0.3s ease;

    .repair-type-card:hover & {
      background: rgba(0, 195, 245, 0.2);
      transform: scale(1.05);
    }
  }

  &__title {
    font-family: 'Rubik', sans-serif;
    font-size: 1.5rem;
    font-weight: 700;
    color: $text-light;
    margin: 0;
    line-height: 1.25;
  }

  // === Описание-лид ===
  &__lead {
    font-size: 1rem;
    line-height: 1.6;
    color: rgba($text-light, 0.85);
    margin: 0;
  }

  // === Список работ ===
  &__works {
    display: flex;
    flex-direction: column;
    gap: 0.55rem;
    margin: 0;
    padding: 1rem 0;
    border-top: 1px solid rgba(255, 255, 255, 0.08);
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    list-style: none;

    li {
      display: flex;
      align-items: flex-start;
      gap: 0.6rem;
      font-size: 0.95rem;
      line-height: 1.5;
      color: rgba($text-light, 0.9);
    }

    .work-icon {
      color: $green;
      flex-shrink: 0;
      margin-top: 2px;
    }
  }

  // === Подвал: срок + цена ===
  &__footer {
    margin-top: auto;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
    flex-wrap: wrap;
  }

  &__duration {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.95rem;
    color: rgba($text-light, 0.75);

    .mdi\:clock-outline {
      color: $blue;
    }

    strong {
      color: $text-light;
      font-weight: 600;
    }
  }

  &__price {
    font-family: 'Rubik', sans-serif;
    font-size: 1.15rem;
    font-weight: 700;
    color: $blue-light;
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
@media (max-width: 768px) {
  .repair-types {
    padding: 3.5rem 0;
  }

  .repair-type-card {
    padding: 1.5rem;

    &__title {
      font-size: 1.25rem;
    }

    &__icon {
      width: 46px;
      height: 46px;
    }

    &__footer {
      flex-direction: column;
      align-items: flex-start;
    }
  }
}
</style>