<template>
  <section
    ref="sectionRef"
    class="before-after-showcase"
    :class="{ 'before-after-showcase--visible': isVisible }"
  >
    <div class="container">
      <!-- Заголовок -->
      <header class="showcase-header">
        <h2 class="showcase-header__title" v-html="title" />
        <p v-if="subtitle" class="showcase-header__subtitle">{{ subtitle }}</p>
      </header>

      <!-- Подписи сторон + кнопка паузы -->
      <div class="showcase-topbar">
        <span class="showcase-label showcase-label--before">
          <Icon name="mdi:circle-half-full" size="14" />
          До
        </span>

        <!-- Кнопка паузы + счётчик (по центру) -->
        <div class="showcase-controls">
          <button
            class="showcase-pause-btn"
            :aria-label="isPlaying ? 'Остановить анимацию' : 'Запустить анимацию'"
            @click="togglePlay"
          >
            <Icon :name="isPlaying ? 'mdi:pause' : 'mdi:play'" size="18" />
          </button>

          <span v-if="items.length > 1" class="showcase-counter">
            {{ activeIndex + 1 }} / {{ items.length }}
          </span>
        </div>

        <span class="showcase-label showcase-label--after">
          После
          <Icon name="mdi:circle-half-full" size="14" />
        </span>
      </div>

      <!-- Слайдер с fade-переходом -->
      <div class="showcase-slider">
        <Transition name="slider-fade" mode="out-in">
          <BeforeAfterSlider
            :key="sliderKey"
            :before-image="activeItem.beforeImage"
            :after-image="activeItem.afterImage"
            :before-alt="activeItem.beforeAlt || 'До ремонта'"
            :after-alt="activeItem.afterAlt || 'После ремонта'"
            :dimming="false"
            :duration="duration"
            :pause-at-edges="pauseAtEdges"
            :pause-on-hover="true"
            :auto-play="isPlaying"
          />
        </Transition>
      </div>

      <!-- Миниатюры (только если больше одной пары) -->
      <div v-if="items.length > 1" class="showcase-thumbnails">
        <button
          v-for="(item, index) in items"
          :key="index"
          class="thumbnail"
          :class="{ 'thumbnail--active': index === activeIndex }"
          :aria-label="`Пример работы ${index + 1}`"
          @click="switchTo(index)"
        >
          <img
            :src="item.afterImage"
            :alt="item.afterAlt || `Пример работы ${index + 1}`"
            loading="lazy"
          />
          <span class="thumbnail__overlay">
            <Icon name="mdi:compare-horizontal" size="18" />
          </span>
          <span class="thumbnail__number">{{ index + 1 }}</span>
        </button>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import BeforeAfterSlider from '../../ui/BeforeAfterSlider.vue'

export interface ShowcaseItem {
  beforeImage: string
  afterImage: string
  beforeAlt?: string
  afterAlt?: string
}

const props = withDefaults(
  defineProps<{
    title: string
    subtitle?: string
    items: ShowcaseItem[]
    duration?: number
    pauseAtEdges?: number
  }>(),
  {
    duration: 7000,
    pauseAtEdges: 2000,
  }
)

// === Состояние ===
const activeIndex = ref(0)
const isPlaying = ref(true)
const isVisible = ref(false)
const sectionRef = ref<HTMLElement | null>(null)

let observer: IntersectionObserver | null = null

const activeItem = computed(() => props.items[activeIndex.value] || props.items[0])

// Ключ для пересоздания слайдера (переключение пар + пауза)
const sliderKey = computed(() => `${activeIndex.value}-${isPlaying.value}`)

// === Переключение пар ===
const switchTo = (index: number) => {
  if (index === activeIndex.value) return
  activeIndex.value = index
}

// === Пауза / воспроизведение ===
const togglePlay = () => {
  isPlaying.value = !isPlaying.value
}

// === Анимация появления при скролле ===
onMounted(() => {
  observer = new IntersectionObserver(
    (entries) => {
      const entry = entries[0]
      if (entry?.isIntersecting) {
        isVisible.value = true
        observer?.disconnect()
      }
    },
    { threshold: 0.15 }
  )

  if (sectionRef.value) {
    observer.observe(sectionRef.value)
  }
})

onBeforeUnmount(() => {
  observer?.disconnect()
})
</script>

<style lang="scss" scoped>
@use '@/assets/styles/variables' as *;

.before-after-showcase {
  padding: 5rem 0;
  background: $background-dark;
  position: relative;
  overflow: hidden;

  // === Анимация появления при скролле ===
  opacity: 0;
  transform: translateY(40px);
  transition: opacity 0.8s ease, transform 0.8s ease;

  &--visible {
    opacity: 1;
    transform: translateY(0);
  }

  &::before {
    content: '';
    position: absolute;
    top: -10%;
    right: -5%;
    width: 500px;
    height: 500px;
    background: radial-gradient(circle, rgba(0, 195, 245, 0.05) 0%, transparent 65%);
    border-radius: 50%;
    pointer-events: none;
  }

  .container {
    max-width: 1100px;
    margin: 0 auto;
    padding: 0 2rem;
    position: relative;
    z-index: 1;

    @media (max-width: 768px) {
      padding: 0 1.2rem;
    }
  }
}

// === Заголовок ===
.showcase-header {
  margin-bottom: 2rem;
  text-align: center;

  &__title {
    font-family: 'Rubik', sans-serif;
    font-size: 2.2rem;
    font-weight: 700;
    color: $text-light;
    margin: 0 0 0.8rem;
    line-height: 1.25;

    @media (max-width: 768px) {
      font-size: 1.7rem;
    }

    :deep(span),
    :deep(.accent) {
      background: $blue-gradient;
      -webkit-background-clip: text;
      background-clip: text;
      color: transparent;
    }
  }

  &__subtitle {
    font-size: 1.05rem;
    line-height: 1.6;
    color: rgba($text-light, 0.7);
    margin: 0 auto;
    max-width: 640px;
  }
}

// === Верхняя панель: подписи + контролы ===
.showcase-topbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
  padding: 0 0.25rem;
}

.showcase-label {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-family: 'Rubik', sans-serif;
  font-size: 0.85rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;

  &--before {
    color: rgba($text-light, 0.5);
  }

  &--after {
    color: $blue-light;
  }
}

// === Контролы по центру ===
.showcase-controls {
  display: flex;
  align-items: center;
  gap: 0.8rem;
}

.showcase-pause-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 50%;
  color: rgba($text-light, 0.7);
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(0, 195, 245, 0.12);
    border-color: $blue;
    color: $blue-light;
    transform: scale(1.1);
  }

  &:active {
    transform: scale(0.95);
  }
}

.showcase-counter {
  font-family: 'Rubik', sans-serif;
  font-size: 0.82rem;
  font-weight: 600;
  color: rgba($text-light, 0.5);
  letter-spacing: 0.05em;
}

// === Слайдер ===
.showcase-slider {
  position: relative;
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);

  :deep(.before-after) {
    height: 500px;
    min-height: 400px;

    @media (max-width: 768px) {
      height: 350px;
      min-height: 280px;
    }

    @media (max-width: 480px) {
      height: 280px;
      min-height: 220px;
    }
  }
}

// === Fade-переход между парами ===
.slider-fade-enter-active,
.slider-fade-leave-active {
  transition: opacity 0.4s ease, transform 0.4s ease;
}

.slider-fade-enter-from {
  opacity: 0;
  transform: scale(0.98);
}

.slider-fade-leave-to {
  opacity: 0;
  transform: scale(1.02);
}

// === Миниатюры ===
.showcase-thumbnails {
  display: flex;
  justify-content: center;
  gap: 0.8rem;
  margin-top: 1.5rem;
  flex-wrap: wrap;
}

.thumbnail {
  position: relative;
  width: 110px;
  height: 74px;
  border-radius: 10px;
  overflow: hidden;
  border: 2px solid rgba(255, 255, 255, 0.15);
  cursor: pointer;
  padding: 0;
  background: transparent;
  transition: all 0.3s ease;
  flex-shrink: 0;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    transition: transform 0.3s ease, filter 0.3s ease;
  }

  &__overlay {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(24, 25, 27, 0.45);
    color: $text-light;
    opacity: 0;
    transition: opacity 0.3s ease;
  }

  &__number {
    position: absolute;
    bottom: 4px;
    right: 6px;
    font-family: 'Rubik', sans-serif;
    font-size: 0.7rem;
    font-weight: 700;
    color: $text-light;
    background: rgba(0, 0, 0, 0.6);
    padding: 0.1rem 0.35rem;
    border-radius: 4px;
    line-height: 1.2;
  }

  &:hover:not(.thumbnail--active) {
    border-color: rgba(0, 195, 245, 0.5);
    transform: translateY(-3px);
    box-shadow: 0 8px 20px rgba(0, 195, 245, 0.2);

    .thumbnail__overlay {
      opacity: 1;
    }
  }

  &--active {
    border-color: $blue;
    box-shadow: 0 0 0 2px rgba(0, 195, 245, 0.3), 0 8px 24px rgba(0, 195, 245, 0.25);

    img {
      filter: brightness(1.05);
    }

    .thumbnail__overlay {
      opacity: 1;
      background: rgba(0, 195, 245, 0.25);
      color: $blue-light;
    }
  }
}

// === Мобильный адаптив ===
@media (max-width: 768px) {
  .before-after-showcase {
    padding: 3.5rem 0;
  }

  .showcase-header {
    margin-bottom: 1.5rem;
  }

  .showcase-label {
    font-size: 0.78rem;
  }

  .showcase-thumbnails {
    gap: 0.5rem;
  }

  .thumbnail {
    width: 80px;
    height: 54px;
    border-radius: 8px;
  }
}

@media (max-width: 480px) {
  .thumbnail {
    width: 64px;
    height: 44px;
  }
}

// === Respect reduced motion ===
@media (prefers-reduced-motion: reduce) {
  .before-after-showcase {
    opacity: 1;
    transform: none;
    transition: none;
  }

  .slider-fade-enter-active,
  .slider-fade-leave-active {
    transition: none;
  }
}
</style>