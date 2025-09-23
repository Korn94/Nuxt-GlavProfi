<template>
  <div class="guarantee-card">
    <div class="guarantee-card__icon">
      <Icon name="material-symbols-light:check-circle-outline" size="32" class="guarantee-card__icon" />
    </div>
    <h3>{{ title }}</h3>
    <p>{{ description }}</p>
  </div>
</template>

<script setup>
defineProps({
  title: String,
  description: String
})
</script>

<style scoped lang="scss">
.guarantee-card {
  background: $background-gray;
  border-radius: $border-radius;
  padding: 2rem;
  // text-align: center;
  transition: $transition;
  border: 1px solid rgba(255, 255, 255, 0.08);

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 15px 25px rgba(0, 0, 0, 0.2);
    border-color: $blue20;
  }

  &__icon {
    margin-bottom: .5rem;
    color: $color-success;
    font-size: 2.5rem;
  }

  h3 {
    // font-size: 1.4rem;
    margin-bottom: 1rem;
    color: $text-light;
  }

  p {
    color: $text-gray;
    line-height: 1.6;
  }
}
</style>