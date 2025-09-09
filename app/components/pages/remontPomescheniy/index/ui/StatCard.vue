<template>
  <div class="stat-card">
    <div class="stat-card__icon-wrapper">
      <Icon :name="icon" size="24" />
    </div>
    <p class="stat-card__text">{{ text }}</p>
  </div>
</template>

<script setup>
defineProps({
  text: { type: String, required: true },
  icon: { type: String, required: true }
});
</script>

<style scoped lang="scss">
.stat-card {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: $border-radius;
  padding: 1.6rem;
  transition: all 0.35s ease;
  position: relative;

  &:hover {
    transform: translateY(-6px);
    box-shadow: 0 12px 25px rgba(0, 0, 0, 0.2);
    border-color: $blue;
    background: rgba(0, 195, 245, 0.1);
  }
}

.stat-card__icon-wrapper {
  color: $blue;
  margin-bottom: 1.2rem;
  font-size: 24px;
  transition: color 0.3s ease;

  .stat-card:hover & {
    color: #00e0ff;
  }
}

.stat-card__text {
  font-size: 1.05rem;
  line-height: 1.65;
  color: $text-light;
}
</style>