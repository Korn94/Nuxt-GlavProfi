<template>
  <div class="service-card">
    <div class="service-card__header">
      <div class="service-card__icon">
        <Icon :name="icon" size="24px" />
      </div>
      <h3 class="service-card__title">{{ title }}</h3>
    </div>

    <p class="service-card__description">{{ description }}</p>

    <a href="#" class="service-card__cta">
      {{ cta }}
    </a>

    <p class="service-card__result">
      {{ result }}
    </p>
  </div>
</template>

<script setup>
defineProps({
  icon: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  cta: {
    type: String,
    default: 'Посмотреть примеры →'
  },
  result: {
    type: String,
    required: true
  }
});
</script>

<style lang="scss" scoped>
.service-card {
  background: $color-light;
  padding: 2rem;
  transition: $transition;
  border-radius: $border-radius;
  box-shadow: 0 4px 10px rgba(0,0,0,0.05);
  border: 1px solid $border-color;
  height: 100%;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 4px;
    height: 100%;
    background: $blue;
    opacity: 0;
    transition: $transition;
  }

  &:hover {
    transform: translateY(-6px);
    box-shadow: 0 12px 20px rgba(0, 0, 0, 0.18);
    border-color: $blue20;

    &::before {
      opacity: 1;
    }

    .service-card__cta {
      color: $yellow;
      gap: 0.7rem;

      &::after {
        transform: translateX(4px);
      }
    }
  }

  &__header {
    margin-bottom: 1rem;
    overflow: hidden; // создаёт блок форматирования, чтобы float не вылезал
  }

  &__icon {
    float: left;
    margin-right: 0.8rem;
    margin-top: 2px; // подстройка по вертикали, чтобы иконка была по центру первой строки
    color: $blue;
    flex-shrink: 0;
  }

  &__title {
    font-size: 1.5rem;
    font-weight: 700;
    line-height: 1.3;
    margin: 0;
    transition: $transition;
  }

  &__description {
    font-size: 1.05rem;
    line-height: 1.6;
    margin-bottom: 1.5rem;
    flex-grow: 1;
    opacity: 0.95;
  }

  &__cta {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    color: $blue;
    text-decoration: none;
    font-weight: 600;
    margin-bottom: 1.2rem;
    transition: $transition;
    position: relative;
    z-index: 1;

    &::after {
      content: '→';
      transition: $transition;
      font-size: 0.95em;
    }
  }

  &__result {
    font-size: 0.95rem;
    line-height: 1.5;
    color: $text-gray;
    font-style: italic;
    padding-top: 1rem;
    border-top: 1px solid $border-color;
    transition: $transition;
  }
}
</style>