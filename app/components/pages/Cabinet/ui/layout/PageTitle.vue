<!-- app/components/layout/PageTitle.vue -->
<template>
  <div class="cabinet-title">
    <!-- Основной заголовок (по умолчанию slot) -->
    <h1>
      <slot>{{ title }}</slot>
    </h1>

    <!-- Правая часть — действия/кнопки -->
    <div class="cabinet-title__actions">
      <slot name="actions" />
    </div>
  </div>
</template>

<script setup>
// Пропс для простого текстового заголовка (опционально)
defineProps({
  title: {
    type: String,
    default: ''
  }
})
</script>

<style lang="scss" scoped>
.cabinet-title {
  // width: 95%;
  padding: 1em;
  margin: 0 auto 1.5rem auto;
  border-bottom: 1px solid $border-color;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: white;
  position: sticky;
  top: 0;
  z-index: 10;
  // box-shadow: 0 1px 0 rgba(0, 0, 0, 0.05);

  h1 {
    margin: 0;
    font-size: 1.5rem;
    font-weight: 600;
    color: $color-dark;
    flex-grow: 1;
    text-align: center;
  }

  &__actions {
    position: absolute;
    right: 5%;
    display: flex;
    gap: 0.5rem;
    align-items: center;
  }
}
</style>