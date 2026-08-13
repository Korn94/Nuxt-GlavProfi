<!-- app/components/pages/public/remontPomescheniy/pageTypes/workTypes/ui/WorkStagesTimeline.vue -->
<template>
  <section class="work-stages">
    <div class="container">
      <h2 class="work-stages__title" v-html="title" />
      <p class="work-stages__subtitle" v-if="subtitle">{{ subtitle }}</p>

      <div class="timeline">
        <article
          v-for="(stage, index) in stages"
          :key="index"
          class="timeline-item"
          :class="{ 'timeline-item--highlighted': stage.highlighted }"
        >
          <div class="timeline-marker">
            <span class="timeline-number">{{ String(index + 1).padStart(2, '0') }}</span>
            <Icon v-if="stage.icon" :name="stage.icon" size="22" />
          </div>
          <div class="timeline-content">
            <h3 class="timeline-title">{{ stage.title }}</h3>
            <p class="timeline-desc">{{ stage.description }}</p>
            <div class="timeline-meta" v-if="stage.duration || stage.result">
              <span v-if="stage.duration" class="meta-item">
                <Icon name="mdi:clock-outline" size="14" />
                {{ stage.duration }}
              </span>
              <span v-if="stage.result" class="meta-item">
                <Icon name="mdi:check-decagram" size="14" />
                {{ stage.result }}
              </span>
            </div>
          </div>
        </article>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
export interface WorkStage {
  title: string
  description: string
  icon?: string
  duration?: string
  result?: string
  highlighted?: boolean
}

defineProps<{
  title: string
  subtitle?: string
  stages: WorkStage[]
}>()
</script>

<style lang="scss" scoped>
@use '@/assets/styles/variables' as *;
@use '@/assets/styles/mixins' as *;

// УБРАЛИ: span { color: unset; }

.work-stages {
  @include section-padding;
  background: $background-dark;
  color: $text-light;
  position: relative;
  overflow: hidden;

  .container {
    @include section-container; // БЫЛО: max-width: 1000px, СТАЛО: 1200px
  }

  &__title {
    @include section-title; // БЫЛО: 20 строк дублирования
  }

  &__subtitle {
    @include section-subtitle;
    color: rgba($text-light, 0.75);
  }
}

.timeline {
  position: relative;
  padding-left: 60px;

  &::before {
    content: '';
    position: absolute;
    left: -10px;
    top: 0;
    bottom: 0;
    width: 2px;
    background: linear-gradient(to bottom, $blue, transparent);
  }
}

.timeline-item {
  position: relative;
  padding-bottom: 2.5rem;

  &:last-child { padding-bottom: 0; }
}

.timeline-marker {
  position: absolute;
  left: -60px;
  top: 0;
  width: 50px;
  height: 50px;
  background: rgba(0, 195, 245, 0.12);
  border: 2px solid $blue;
  border-radius: $border-radius;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: $blue-light;

  .timeline-number {
    font-size: 0.65rem;
    font-weight: 700;
    line-height: 1;
  }
}

.timeline-item--highlighted .timeline-marker {
  background: $blue-gradient;
  border-color: transparent;
  color: $background-dark;
}

.timeline-content {
  padding: 1rem 1.5rem;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: $border-radius;
  transition: all 0.3s ease;

  &:hover {
    border-color: rgba(0, 195, 245, 0.3);
    background: rgba(0, 195, 245, 0.04);
  }
}

.timeline-title {
  font-family: 'Rubik', sans-serif;
  font-size: 1.2rem;
  font-weight: 600;
  color: $text-light;
  margin: 0 0 0.5rem;
}

.timeline-desc {
  font-size: 0.95rem;
  line-height: 1.6;
  color: rgba($text-light, 0.8);
  margin: 0 0 0.8rem;
}

.timeline-meta {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.meta-item {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.85rem;
  color: $blue-light;
  font-weight: 500;
}

@media (max-width: 768px) {
  .timeline {
    padding-left: 50px;
  }
  .timeline-marker {
    left: -50px;
    width: 42px;
    height: 42px;
  }
  .timeline-content { padding: 1rem 1.2rem; }
}
</style>