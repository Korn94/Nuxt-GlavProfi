<!-- app/components/pages/public/remontPomescheniy/workTypes/ui/MaterialsGuide.vue -->
<template>
  <section class="materials-guide" :class="`materials-guide--${theme}`">
    <div class="container">
      <!-- Заголовок -->
      <header class="materials-guide__header">
        <h2 class="materials-guide__title" v-html="title" />
        <p v-if="subtitle" class="materials-guide__subtitle">{{ subtitle }}</p>
      </header>

      <!-- Карточки материалов -->
      <div class="materials-grid">
        <article
          v-for="(material, index) in materials"
          :key="index"
          class="material-card"
          :style="{ '--material-color': material.color }"
        >
          <!-- Цветная полоса (цвет листа) -->
          <div class="material-card__stripe" aria-hidden="true" />

          <!-- Фото материала (опционально) -->
          <div v-if="material.image" class="material-card__image">
            <img
              :src="material.image"
              :alt="material.imageAlt || material.fullName"
              loading="lazy"
            />
          </div>

          <!-- Шапка: аббревиатура + бейдж -->
          <header class="material-card__header">
            <span class="material-card__abbr">{{ material.name }}</span>
            <span v-if="material.badge" class="material-card__badge">
              {{ material.badge }}
            </span>
          </header>

          <h3 class="material-card__full-name">{{ material.fullName }}</h3>

          <p v-if="material.colorLabel" class="material-card__color-label">
            <Icon name="mdi:palette-swatch" size="14" />
            {{ material.colorLabel }}
          </p>

          <!-- Свойства -->
          <div v-if="material.properties?.length" class="material-card__props">
            <span
              v-for="(prop, i) in material.properties"
              :key="i"
              class="material-card__prop"
            >
              <Icon v-if="prop.icon" :name="prop.icon" size="14" />
              {{ prop.label }}
            </span>
          </div>

          <!-- Где применяется -->
          <div class="material-card__section">
            <h4 class="material-card__section-title material-card__section-title--use">
              <Icon name="mdi:check-circle" size="15" />
              Где применять
            </h4>
            <ul class="material-card__list">
              <li v-for="(item, i) in material.useFor" :key="i">
                <Icon name="mdi:check" size="13" class="list-icon list-icon--use" />
                {{ item }}
              </li>
            </ul>
          </div>

          <!-- Где не применяется -->
          <div v-if="material.avoidFor?.length" class="material-card__section">
            <h4 class="material-card__section-title material-card__section-title--avoid">
              <Icon name="mdi:close-circle" size="15" />
              Не подходит для
            </h4>
            <ul class="material-card__list">
              <li v-for="(item, i) in material.avoidFor" :key="i">
                <Icon name="mdi:close" size="13" class="list-icon list-icon--avoid" />
                {{ item }}
              </li>
            </ul>
          </div>
        </article>
      </div>

      <!-- Толщины -->
      <div v-if="thicknesses?.length" class="thickness-block">
        <h3 class="thickness-block__title">
          <Icon name="mdi:ruler" size="20" />
          Как подобрать толщину
        </h3>
        <div class="thickness-block__grid">
          <div
            v-for="(t, index) in thicknesses"
            :key="index"
            class="thickness-item"
          >
            <span class="thickness-item__value">{{ t.value }}</span>
            <span class="thickness-item__purpose">{{ t.purpose }}</span>
          </div>
        </div>
      </div>

      <!-- Итоговая рекомендация -->
      <div v-if="summary || $slots.summary" class="materials-guide__summary">
        <slot name="summary">
          <Icon name="mdi:lightbulb-outline" size="24" class="summary-icon" />
          <p v-html="summary" />
        </slot>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
export interface MaterialProperty {
  label: string
  icon?: string
}

export interface MaterialCardData {
  /** Аббревиатура: ГКЛ, ГКЛВ, ГВЛ... */
  name: string
  /** Полное название */
  fullName: string
  /** Цвет листа (для полосы и акцентов) */
  color: string
  /** Фото материала (опционально) */
  image?: string
  /** Alt для фото */
  imageAlt?: string
  /** Подпись про цвет/маркировку */
  colorLabel?: string
  /** Бейдж: "Базовый", "Для влажных"... */
  badge?: string
  /** Свойства (пилюли) */
  properties?: MaterialProperty[]
  /** Где применяется */
  useFor: string[]
  /** Где не применяется */
  avoidFor?: string[]
}

export interface ThicknessOption {
  value: string
  purpose: string
}

withDefaults(
  defineProps<{
    title: string
    subtitle?: string
    materials: MaterialCardData[]
    thicknesses?: ThicknessOption[]
    summary?: string
    /** 🆕 Тема оформления: 'light' | 'dark' */
    theme?: 'light' | 'dark'
  }>(),
  {
    theme: 'dark',
  }
)
</script>

<style lang="scss" scoped>
@use '@/assets/styles/variables' as *;
@use '@/assets/styles/mixins' as *;

.materials-guide {
  @include section-padding;
  position: relative;
  overflow: hidden;

  // ========================================
  // THEME: DARK (по умолчанию)
  // ========================================
  &--dark {
    --section-bg: #{$background-dark};
    --section-text: #{$text-light};
    --section-text-secondary: rgba(255, 255, 255, 0.7);
    --section-text-muted: rgba(255, 255, 255, 0.55);
    --card-bg: rgba(255, 255, 255, 0.035);
    --card-border: rgba(255, 255, 255, 0.08);
    --card-hover-shadow: 0 12px 32px rgba(0, 0, 0, 0.3);
    --props-bg: rgba(255, 255, 255, 0.06);
    --props-text: rgba(255, 255, 255, 0.8);
    --list-text: rgba(255, 255, 255, 0.82);
    --thickness-bg: rgba(0, 195, 245, 0.05);
    --thickness-border: rgba(0, 195, 245, 0.15);
    --thickness-hover-bg: rgba(0, 195, 245, 0.08);
    --thickness-hover-border: rgba(0, 195, 245, 0.4);
    --summary-bg: rgba(0, 195, 245, 0.06);
    --summary-border: rgba(0, 195, 245, 0.2);
    --summary-text: rgba(255, 255, 255, 0.88);
    --glow-color: rgba(0, 195, 245, 0.05);
    --image-overlay: rgba($background-dark, 0.5);
  }

  // ========================================
  // THEME: LIGHT
  // ========================================
  &--light {
    --section-bg: #{$background-light};
    --section-text: #{$text-dark};
    --section-text-secondary: #{$text-gray};
    --section-text-muted: rgba(0, 0, 0, 0.45);
    --card-bg: #fff;
    --card-border: #{$border-color};
    --card-hover-shadow: 0 12px 32px rgba(0, 0, 0, 0.1);
    --props-bg: rgba(0, 0, 0, 0.04);
    --props-text: #{$text-dark};
    --list-text: #{$text-dark};
    --thickness-bg: rgba(0, 195, 245, 0.04);
    --thickness-border: rgba(0, 195, 245, 0.2);
    --thickness-hover-bg: rgba(0, 195, 245, 0.08);
    --thickness-hover-border: rgba(0, 195, 245, 0.4);
    --summary-bg: rgba(0, 195, 245, 0.04);
    --summary-border: rgba(0, 195, 245, 0.2);
    --summary-text: #{$text-dark};
    --glow-color: rgba(0, 195, 245, 0.03);
    --image-overlay: rgba(255, 255, 255, 0.3);
  }

  background: var(--section-bg);
  color: var(--section-text);

  &::before {
    content: '';
    position: absolute;
    top: -10%;
    left: -5%;
    width: 500px;
    height: 500px;
    background: radial-gradient(circle, var(--glow-color) 0%, transparent 65%);
    border-radius: 50%;
    pointer-events: none;
  }

  .container {
    @include section-container;
  }

  // === Заголовок ===
  &__header {
    margin-bottom: 2.5rem;
    max-width: 760px;
  }

  &__title {
    @include section-title;
  }

  &__subtitle {
    @include section-subtitle;
    color: var(--section-text-secondary);
  }

  // === Итоговая рекомендация ===
  &__summary {
    margin-top: 2.5rem;
    padding: 1.5rem 1.8rem;
    background: var(--summary-bg);
    border: 1px solid var(--summary-border);
    border-left: 4px solid $blue;
    border-radius: $border-radius;
    display: flex;
    align-items: flex-start;
    gap: 1rem;

    @media (max-width: 640px) {
      flex-direction: column;
      gap: 0.6rem;
    }

    .summary-icon {
      color: $blue;
      flex-shrink: 0;
      margin-top: 2px;
    }

    p {
      font-size: 0.98rem;
      line-height: 1.65;
      margin: 0;
      color: var(--summary-text);

      :deep(strong),
      :deep(b) {
        color: $blue;
        font-weight: 600;
      }

      :deep(a) {
        color: $blue;
        text-decoration: underline;
        text-underline-offset: 3px;

        &:hover {
          color: $blue-light;
        }
      }
    }
  }
}

// === Сетка карточек ===
.materials-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 1.5rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
}

// === Карточка материала ===
.material-card {
  position: relative;
  display: flex;
  flex-direction: column;
  padding: 1.6rem;
  padding-top: 1.8rem;
  overflow: hidden;
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: 14px;
  transition: all 0.3s ease;

  &:has(.material-card__image) {
    padding-top: 0;
  }

  &:hover {
    transform: translateY(-4px);
    border-color: var(--material-color);
    box-shadow: var(--card-hover-shadow);

    .material-card__image img {
      transform: scale(1.06);
    }
  }

  &__stripe {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: var(--material-color);
    z-index: 2;
  }

  &__image {
    margin: 0 -1.6rem 1.4rem;
    margin-top: 4px;
    height: 160px;
    overflow: hidden;
    position: relative;

    &::after {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(to top, var(--image-overlay) 0%, transparent 40%);
      pointer-events: none;
    }

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
      transition: transform 0.5s ease;
    }
  }

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.8rem;
    margin-bottom: 0.5rem;
  }

  &__abbr {
    font-family: 'Rubik', sans-serif;
    font-size: 1.5rem;
    font-weight: 800;
    color: var(--material-color);
    letter-spacing: 0.02em;
    line-height: 1;
  }

  &__badge {
    padding: 0.25rem 0.7rem;
    background: var(--props-bg);
    border: 1px solid var(--material-color);
    color: var(--material-color);
    font-family: 'Rubik', sans-serif;
    font-size: 0.7rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    border-radius: 50px;
    white-space: nowrap;
  }

  &__full-name {
    font-family: 'Rubik', sans-serif;
    font-size: 1.05rem;
    font-weight: 600;
    color: var(--section-text);
    margin: 0 0 0.4rem;
    line-height: 1.35;
  }

  &__color-label {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    font-size: 0.82rem;
    color: var(--section-text-muted);
    margin: 0 0 1rem;

    :deep(.icon) {
      color: var(--material-color);
      flex-shrink: 0;
    }
  }

  // === Свойства ===
  &__props {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
    margin-bottom: 1.2rem;
  }

  &__prop {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    padding: 0.3rem 0.7rem;
    background: var(--props-bg);
    border-radius: 50px;
    font-size: 0.78rem;
    font-weight: 500;
    color: var(--props-text);

    :deep(.icon) {
      color: var(--material-color);
      flex-shrink: 0;
    }
  }

  // === Секции списков ===
  &__section {
    margin-bottom: 1.1rem;

    &:last-child {
      margin-bottom: 0;
    }
  }

  &__section-title {
    display: flex;
    align-items: center;
    gap: 0.45rem;
    font-family: 'Rubik', sans-serif;
    font-size: 0.82rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    margin: 0 0 0.55rem;

    &--use {
      color: $green;

      :deep(.icon) {
        color: $green;
      }
    }

    &--avoid {
      color: var(--section-text-muted);

      :deep(.icon) {
        color: $red;
      }
    }
  }

  &__list {
    margin: 0;
    padding: 0;
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 0.45rem;

    li {
      display: flex;
      align-items: flex-start;
      gap: 0.45rem;
      font-size: 0.9rem;
      line-height: 1.5;
      color: var(--list-text);
    }

    .list-icon {
      flex-shrink: 0;
      margin-top: 3px;

      &--use {
        color: $green;
      }

      &--avoid {
        color: $red;
      }
    }
  }
}

// === Блок толщин ===
.thickness-block {
  margin-top: 2.5rem;
  padding: 1.8rem;
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: 14px;

  &__title {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    font-family: 'Rubik', sans-serif;
    font-size: 1.15rem;
    font-weight: 700;
    color: var(--section-text);
    margin: 0 0 1.2rem;

    :deep(.icon) {
      color: $blue;
    }
  }

  &__grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 0.8rem;
  }
}

.thickness-item {
  display: flex;
  flex-direction: column;
  text-align: center;
  padding: 0.9rem 1.1rem;
  background: var(--thickness-bg);
  border: 1px solid var(--thickness-border);
  border-radius: 10px;
  transition: all 0.3s ease;

  &:hover {
    border-color: var(--thickness-hover-border);
    background: var(--thickness-hover-bg);
  }

  &__value {
    flex-shrink: 0;
    font-family: 'Rubik', sans-serif;
    font-size: 1.15rem;
    font-weight: 800;
    color: $blue;
    min-width: 64px;
  }

  &__purpose {
    font-size: 0.88rem;
    line-height: 1.45;
    color: var(--section-text-secondary);
  }
}
</style>