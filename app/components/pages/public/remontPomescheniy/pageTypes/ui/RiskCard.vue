<!-- app/components/pages/public/remontPomescheniy/pageTypes/ui/RiskCard.vue -->
 <template>
  <article class="risk-card">
    <!-- Шапка карточки -->
    <header class="risk-card__header">
      <div class="risk-card__icon">
        <slot name="icon">
          <Icon v-if="icon" :name="icon" size="26" />
          <Icon v-else name="mdi:alert-circle-outline" size="26" />
        </slot>
      </div>
      <div class="risk-card__title-wrap">
        <span v-if="number" class="risk-card__number">{{ number }}</span>
        <slot name="header">
          <h3 class="risk-card__title">{{ title }}</h3>
        </slot>
      </div>
    </header>

    <!-- Цепочка: Ошибка → Последствие → Решение -->
    <div class="risk-card__chain">
      <!-- 1. Ошибка -->
      <div class="risk-card__block risk-card__block--mistake">
        <div class="risk-card__block-header">
          <Icon name="mdi:close-circle" size="18" class="risk-card__block-icon" />
          <span class="risk-card__block-label">Ошибка</span>
        </div>
        <div class="risk-card__block-text">
          <slot name="mistake">
            <p>{{ mistake }}</p>
          </slot>
        </div>
      </div>

      <!-- Коннектор -->
      <div class="risk-card__connector" aria-hidden="true">
        <Icon name="mdi:arrow-down" size="18" />
      </div>

      <!-- 2. Последствие -->
      <div class="risk-card__block risk-card__block--consequence">
        <div class="risk-card__block-header">
          <Icon name="mdi:alert" size="18" class="risk-card__block-icon" />
          <span class="risk-card__block-label">Последствие</span>
        </div>
        <div class="risk-card__block-text">
          <slot name="consequence">
            <p>{{ consequence }}</p>
          </slot>
        </div>
      </div>

      <!-- Коннектор -->
      <div class="risk-card__connector" aria-hidden="true">
        <Icon name="mdi:arrow-down" size="18" />
      </div>

      <!-- 3. Решение -->
      <div class="risk-card__block risk-card__block--solution">
        <div class="risk-card__block-header">
          <Icon name="mdi:check-circle" size="18" class="risk-card__block-icon" />
          <span class="risk-card__block-label">Наше решение</span>
        </div>
        <div class="risk-card__block-text">
          <slot name="solution">
            <p>{{ solution }}</p>
          </slot>
        </div>
      </div>
    </div>

    <!-- Опциональный футер (доп. инфо, ссылки) -->
    <footer v-if="$slots.footer" class="risk-card__footer">
      <slot name="footer" />
    </footer>
  </article>
</template>

<script setup lang="ts">
defineProps<{
  title: string
  mistake: string
  consequence: string
  solution: string
  icon?: string
  number?: string | number
}>()
</script>

<style lang="scss" scoped>
@use '@/assets/styles/variables' as *;

span {
  color: unset;
}

// === Карточка риска ===
.risk-card {
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: $border-radius;
  padding: 2rem;
  transition: transform 0.35s ease, box-shadow 0.35s ease, border-color 0.35s ease;
  height: 100%;

  // Базовый layout: flex (fallback для всех браузеров)
  display: flex;
  flex-direction: column;
  gap: 1.5rem;

  // ✅ Subgrid для современных браузеров:
  // внутренние строки карточки синхронизируются с соседними
  @supports (grid-template-rows: subgrid) {
    display: grid;
    grid-template-rows: subgrid;
    grid-row: span 3; // шапка + цепочка + футер
    gap: 1.5rem;
    height: auto; // в subgrid высота управляется сеткой
  }

  &:hover {
    // transform: translateY(-4px);
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.25);
    border-color: rgba(0, 195, 245, 0.3);
  }

  // === Шапка ===
  &__header {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding-bottom: 1.2rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    // Без min-height — subgrid автоматически делает высоту равной
    // максимальной в ряду, а flex-layout подстраивается под содержимое
  }

  &__icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 52px;
    height: 52px;
    background: rgba(255, 107, 107, 0.1);
    color: #ff6b6b;
    border-radius: 12px;
    flex-shrink: 0;
    transition: all 0.3s ease;

    .risk-card:hover & {
      background: rgba(255, 107, 107, 0.18);
      transform: scale(1.05);
    }
  }

  &__title-wrap {
    display: flex;
    align-items: center;
    gap: 0.8rem;
    min-width: 0;
    flex: 1;
  }

  &__number {
    font-family: 'Rubik', sans-serif;
    font-size: 0.85rem;
    font-weight: 700;
    color: $blue;
    background: rgba(0, 195, 245, 0.12);
    padding: 0.25rem 0.65rem;
    border-radius: 50px;
    letter-spacing: 0.03em;
    flex-shrink: 0;
  }

  &__title {
    font-family: 'Rubik', sans-serif;
    font-size: 1.1rem;
    font-weight: 600;
    color: $text-light;
    margin: 0;
    line-height: 1.3;

    // ✅ Перенос длинных слов
    overflow-wrap: break-word;    // Современное свойство (заменяет word-wrap)
    word-break: break-word;       // Fallback для Safari/iOS
    hyphens: auto;                // Красивые переносы по правилам языка
    -webkit-hyphens: auto;        // Safari
    -ms-hyphens: auto;            // Старый Edge

    // Ограничиваем переносы 3 строками (чтобы шапка не стала огромной)
    display: -webkit-box;
    // -webkit-line-clamp: 3;
    // line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  // === Цепочка блоков (ошибка → последствие → решение) ===
  &__chain {
    display: flex;
    flex-direction: column;
    gap: 0;
    flex: 1; // Fallback: занимает оставшееся место в flex-контейнере

    @supports (grid-template-rows: subgrid) {
      flex: initial; // В subgrid не нужен flex
    }
  }

  // === Блок (ошибка / последствие / решение) ===
  &__block {
    padding: 1.1rem 1.2rem;
    border-radius: $border-radius;
    border-left: 3px solid transparent;
    transition: all 0.3s ease;

    &--mistake {
      background: rgba(255, 107, 107, 0.06);
      border-left-color: #ff6b6b;

      .risk-card__block-icon,
      .risk-card__block-label {
        color: #ff6b6b;
      }
    }

    &--consequence {
      background: rgba(250, 183, 2, 0.06);
      border-left-color: $yellow;

      .risk-card__block-icon,
      .risk-card__block-label {
        color: $yellow;
      }
    }

    &--solution {
      background: rgba(0, 161, 42, 0.08);
      border-left-color: $green;

      .risk-card__block-icon,
      .risk-card__block-label {
        color: $green;
      }
    }

    &:hover {
      transform: translateX(2px);
    }
  }

  &__block-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
  }

  &__block-icon {
    flex-shrink: 0;
  }

  &__block-label {
    font-family: 'Rubik', sans-serif;
    font-size: 0.78rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }

  &__block-text {
    :deep(p) {
      font-size: 0.95rem;
      line-height: 1.6;
      color: rgba($text-light, 0.88);
      margin: 0;
    }

    :deep(strong),
    :deep(b) {
      color: $text-light;
      font-weight: 600;
    }
  }

  // === Коннектор (стрелка между блоками) ===
  &__connector {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 28px;
    color: rgba($text-light, 0.3);
    position: relative;

    &::before {
      content: '';
      position: absolute;
      left: 50%;
      top: 0;
      bottom: 0;
      width: 1px;
      background: linear-gradient(
        to bottom,
        transparent,
        rgba($text-light, 0.15) 50%,
        transparent
      );
      transform: translateX(-50%);
      z-index: 0;
    }

    .mdi\:arrow-down {
      position: relative;
      z-index: 1;
      background: $background-dark;
      padding: 2px;
    }
  }

  // === Футер ===
  &__footer {
    padding-top: 1rem;
    border-top: 1px solid rgba(255, 255, 255, 0.08);
    font-size: 0.9rem;
    color: rgba($text-light, 0.7);

    // Fallback: прижимаем к низу через flex
    margin-top: auto;
    flex-shrink: 0;

    @supports (grid-template-rows: subgrid) {
      margin-top: 0; // В subgrid не нужно
    }

    :deep(a) {
      color: $blue;
      text-decoration: none;
      font-weight: 500;

      &:hover {
        color: $blue-light;
      }
    }
  }
}

// === Адаптив ===
@media (max-width: 768px) {
  .risk-card {
    padding: 1.4rem;

    &__icon {
      width: 44px;
      height: 44px;
    }

    &__title {
      font-size: 1.1rem;
    }

    &__block {
      padding: 0.95rem 1rem;
    }

    &__block-text {
      :deep(p) {
        font-size: 0.9rem;
      }
    }
  }
}

@media (max-width: 480px) {
  .risk-card {
    &__title-wrap {
      flex-direction: column;
      align-items: flex-start;
      gap: 0.4rem;
    }

    &__number {
      font-size: 0.75rem;
    }
  }
}
</style>