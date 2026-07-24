<!-- app/components/pages/public/remontPomescheniy/workTypes/ui/SubServiceSwitcher.vue -->
 <template>
  <section class="sub-service-switcher">
    <div class="container">
      <header class="switcher-header">
        <span class="switcher-label">
          <Icon name="mdi:view-grid-outline" size="16" />
          {{ label }}
        </span>
        <h2 class="switcher-title" v-if="title" v-html="title" />
      </header>

      <!-- Сегментированный контрол -->
      <nav class="switcher-nav" role="tablist" :aria-label="label">
        <NuxtLink
          v-for="item in items"
          :key="item.to"
          :to="item.to"
          class="switcher-tab"
          :class="{ 'switcher-tab--active': item.active }"
          role="tab"
          :aria-selected="item.active"
          :aria-current="item.active ? 'page' : undefined"
        >
          <!-- Иконка -->
          <div class="switcher-tab__icon">
            <Icon :name="item.icon || 'mdi:circle'" size="24" />
          </div>

          <!-- Текст -->
          <div class="switcher-tab__content">
            <span class="switcher-tab__title">{{ item.title }}</span>
            <span v-if="item.priceFrom" class="switcher-tab__price">
              {{ item.priceFrom }} ₽/м²
            </span>
          </div>

          <!-- Индикатор текущей страницы -->
          <span v-if="item.active" class="switcher-tab__badge">
            <Icon name="mdi:check-circle" size="12" />
            Вы здесь
          </span>

          <!-- Стрелка перехода для неактивных -->
          <Icon
            v-else
            name="mdi:arrow-right"
            size="18"
            class="switcher-tab__arrow"
          />
        </NuxtLink>
      </nav>

      <!-- Подпись под активной вкладкой -->
      <p v-if="activeDescription" class="switcher-description">
        {{ activeDescription }}
      </p>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'

export interface SubServiceItem {
  /** Заголовок вкладки */
  title: string
  /** URL страницы */
  to: string
  /** Иконка из @iconify */
  icon?: string
  /** Цена "от" (для отображения под заголовком) */
  priceFrom?: number | string
  /** Текущая страница */
  active?: boolean
  /** Описание активной вкладки (показывается под контролом) */
  description?: string
}

const props = withDefaults(
  defineProps<{
    /** Подпись над заголовком */
    label?: string
    /** Заголовок секции */
    title?: string
    /** Массив вкладок */
    items: SubServiceItem[]
  }>(),
  {
    label: 'Выберите вид работ',
  }
)

const activeDescription = computed(() => {
  const active = props.items.find((i) => i.active)
  return active?.description || null
})
</script>

<style lang="scss" scoped>
@use '@/assets/styles/variables' as *;

span {
  color: unset;
}

.sub-service-switcher {
  padding: 3rem 0 2rem;
  background: $background-dark;
  position: relative;

  .container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 2rem;
    @media (max-width: 768px) {
      padding: 0 1.2rem;
    }
  }
}

// === Шапка ===
.switcher-header {
  margin-bottom: 1.5rem;
}

.switcher-label {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-family: 'Rubik', sans-serif;
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: $blue;
  margin-bottom: 0.6rem;
  padding: 0.3rem 0.8rem;
  background: rgba(0, 195, 245, 0.1);
  border-radius: 50px;
}

.switcher-title {
  font-family: 'Rubik', sans-serif;
  font-size: 1.6rem;
  font-weight: 700;
  color: $text-light;
  margin: 0;
  line-height: 1.3;

  :deep(span),
  :deep(.accent) {
    background: $blue-gradient;
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
  }
}

// === Сегментированный контрол ===
.switcher-nav {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 0.75rem;
  padding: 0.5rem;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 14px;
  backdrop-filter: blur(8px);

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
    padding: 0.4rem;
    gap: 0.5rem;
  }
}

.switcher-tab {
  position: relative;
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.1rem 1.3rem;
  background: transparent;
  border: 1.5px solid transparent;
  border-radius: 10px;
  text-decoration: none;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;

  // === Неактивная вкладка ===
  &:not(.switcher-tab--active) {
    &:hover {
      background: rgba(0, 195, 245, 0.06);
      border-color: rgba(0, 195, 245, 0.25);
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(0, 195, 245, 0.1);

      .switcher-tab__icon {
        background: rgba(0, 195, 245, 0.18);
        color: $blue-light;
      }

      .switcher-tab__title {
        color: $text-light;
      }

      .switcher-tab__arrow {
        transform: translateX(4px);
        color: $blue-light;
      }
    }
  }

  // === Активная вкладка ===
  &--active {
    background: linear-gradient(
      135deg,
      rgba(0, 195, 245, 0.15) 0%,
      rgba(0, 195, 245, 0.05) 100%
    );
    border-color: $blue;
    box-shadow:
      0 0 0 3px rgba(0, 195, 245, 0.15),
      0 8px 24px rgba(0, 195, 245, 0.2);
    cursor: default;
    pointer-events: none;

    .switcher-tab__icon {
      background: $blue-gradient;
      color: $background-dark;
    }

    .switcher-tab__title {
      color: $text-light;
      font-weight: 700;
    }

    .switcher-tab__price {
      color: $blue-light;
    }
  }

  // === Иконка ===
  &__icon {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 48px;
    height: 48px;
    background: rgba(255, 255, 255, 0.06);
    color: rgba($text-light, 0.7);
    border-radius: 12px;
    transition: all 0.3s ease;
  }

  // === Контент ===
  &__content {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  &__title {
    font-family: 'Rubik', sans-serif;
    font-size: 1.05rem;
    font-weight: 600;
    color: rgba($text-light, 0.85);
    line-height: 1.3;
    transition: color 0.2s ease, font-weight 0.2s ease;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__price {
    font-size: 0.85rem;
    color: rgba($text-light, 0.55);
    font-weight: 500;
    transition: color 0.2s ease;
  }

  // === Бейдж "Вы здесь" ===
  &__badge {
    flex-shrink: 0;
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    padding: 0.3rem 0.7rem;
    background: $blue-gradient;
    color: $background-dark;
    font-family: 'Rubik', sans-serif;
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.03em;
    text-transform: uppercase;
    border-radius: 50px;
    box-shadow: 0 4px 12px rgba(0, 195, 245, 0.35);

    @media (max-width: 480px) {
      position: absolute;
      top: -8px;
      right: 1rem;
    }
  }

  // === Стрелка ===
  &__arrow {
    flex-shrink: 0;
    color: rgba($text-light, 0.4);
    transition: all 0.3s ease;
  }
}

// === Описание под активной вкладкой ===
.switcher-description {
  margin: 1.2rem 0 0;
  padding: 1rem 1.3rem;
  background: rgba(0, 195, 245, 0.05);
  border-left: 3px solid $blue;
  border-radius: 0 $border-radius $border-radius 0;
  font-size: 0.98rem;
  line-height: 1.6;
  color: rgba($text-light, 0.85);
  animation: fadeInDesc 0.4s ease;
}

@keyframes fadeInDesc {
  from {
    opacity: 0;
    transform: translateY(-6px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

// === Мобильный адаптив ===
@media (max-width: 768px) {
  .sub-service-switcher {
    padding: 2rem 0 1.5rem;
  }

  .switcher-title {
    font-size: 1.3rem;
  }

  .switcher-tab {
    padding: 0.9rem 1rem;
    gap: 0.8rem;

    &__icon {
      width: 42px;
      height: 42px;
    }

    &__title {
      font-size: 0.98rem;
    }
  }
}
</style>