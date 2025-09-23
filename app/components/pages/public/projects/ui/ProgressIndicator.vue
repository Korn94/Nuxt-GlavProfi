<template>
  <div class="progress-container">
    <span class="progress-label">{{ progress }}%</span>
    <div class="progress-bar">
      <div
        class="progress-fill"
        :style="{ width: progress + '%' }"
      ></div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  progress: {
    type: Number,
    required: true,
    validator: value => value >= 0 && value <= 100
  }
})
</script>

<style lang="scss" scoped>
// .progress-container {
  // display: flex;
  // align-items: center;
  // gap: 1rem;
  // width: 100%;
// }

.progress-bar {
  flex: 1;
  height: 6px;
  background: rgba(0, 0, 0, 0.1);
  border-radius: 4px;
  margin: .5em 0;
  border: 1px solid $blue20;
  overflow: hidden;
  position: relative;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, $blue, #6366f1);
  border-radius: 4px;
  transition: width 0.5s ease-in-out;
}

.progress-label {
  min-width: 40px;
  // text-align: right;
  color: #fff;
  font-size: 1.3em;
  font-weight: 600;
  // font-size: 0.9rem;
}
</style>