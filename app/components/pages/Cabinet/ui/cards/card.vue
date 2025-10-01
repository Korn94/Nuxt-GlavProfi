<!-- app/components/pages/cabinet/ui/cards/card.vue -->
<template>
  <div class="card" :class="{ 'card--elevated': elevated, 'card--bordered': bordered, 'card--loading': loading }">
    <!-- Заголовок -->
    <header v-if="!loading && ($slots.header || title)" class="card__header">
      <div class="card__title-wrapper">
        <!-- <slot name="icon">
          <Icon name="material-symbols-light:account-circle" size="24" />
        </slot> -->
        <h3 v-if="title" class="card__title">{{ title }}</h3>
        <slot v-else name="header" />
      </div>
      <div class="card__actions">
        <slot name="actions" />
      </div>
    </header>

    <!-- Лоадер -->
    <div v-if="loading" class="card__loader">
      <div class="skeleton skeleton-title"></div>
      <div class="skeleton skeleton-text"></div>
      <div class="skeleton skeleton-text short"></div>
    </div>

    <!-- Основное содержимое -->
    <main v-else class="card__body">
      <slot />
    </main>

    <!-- Футер -->
    <footer v-if="$slots.footer && !loading" class="card__footer">
      <slot name="footer" />
    </footer>
  </div>
</template>

<script setup>
const props = defineProps({
  title: {
    type: String,
    default: ''
  },
  icon: {
    type: String,
    default: ''
  },
  elevated: {
    type: Boolean,
    default: false
  },
  bordered: {
    type: Boolean,
    default: true
  },
  loading: {
    type: Boolean,
    default: false
  }
})
</script>

<style lang="scss" scoped>
.card {
  background-color: $background-light;
  border-radius: $border-radius;
  overflow: hidden;
  font-family: 'Inter', sans-serif;

  &--bordered {
    border: 1px solid $border-color;
  }

  &--elevated {
    box-shadow: $box-shadow;
  }

  &:not(.card--elevated) {
    box-shadow: $box-shadow;
    transition: box-shadow 0.3s ease;

    &:hover {
      box-shadow: $box-shadow;
    }
  }

  &--loading {
    pointer-events: none;
    opacity: 0.8;
  }
}

.card__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  background-color: rgba($text-dark, 0.05);
  border-bottom: 1px solid $border-color;
  border-top-left-radius: $border-radius;
  border-top-right-radius: $border-radius;

  .card__title-wrapper {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    font-weight: 600;
    color: $text-dark;
  }
}

.card__icon {
  width: 1.25rem;
  height: 1.25rem;
  object-fit: contain;
  opacity: 0.8;
}

.card__title {
  font-size: 1.125rem;
  margin: 0;
  color: $text-dark;
}

.card__actions {
  display: flex;
  gap: 0.5rem;
  font-size: 0.875rem;
}

.card__body {
  padding: 1.5rem;
  color: $text-dark;
  line-height: 1.5;
}

.card__footer {
  padding: 1rem 1.5rem;
  background-color: rgba($color-muted, 0.05);
  border-top: 1px solid $border-color;
  font-size: 0.875rem;
  color: $color-muted;
}

// Стили лоадера (скелетон)
.card__loader {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;

  .skeleton {
    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
    background-size: 200% 100%;
    animation: loading 1.5s infinite;
    border-radius: 6px;

    &-title {
      height: 24px;
      width: 60%;
    }

    &-text {
      height: 16px;
      width: 100%;

      &.short {
        width: 70%;
      }
    }
  }
}

@keyframes loading {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}
</style>