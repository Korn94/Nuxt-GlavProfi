<!-- app\components\pages\public\remontPomescheniy\workTypes\ui\BeforeAfterShowcase.vue -->
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

      <!-- Подписи сторон + счётчик -->
      <div class="showcase-topbar">
        <span
          v-if="isCurrentPair"
          class="showcase-label showcase-label--before"
        >
          <Icon name="mdi:circle-half-full" size="14" />
          До
        </span>
        <span v-else class="showcase-label showcase-label--placeholder" />

        <!-- Счётчик (по центру) -->
        <span v-if="items.length > 1" class="showcase-counter">
          {{ activeIndex + 1 }} / {{ items.length }}
        </span>

        <!-- Подпись "После" только если активный элемент — пара -->
        <span
          v-if="isCurrentPair"
          class="showcase-label showcase-label--after"
        >
          После
          <Icon name="mdi:circle-half-full" size="14" />
        </span>
        <span v-else class="showcase-label showcase-label--placeholder" />
      </div>

      <!-- Слайдер: BeforeAfterSlider для пар, <img> для одиночных -->
      <div class="showcase-slider">
        <Transition name="slider-fade" mode="out-in">
          <!-- ПАРА до/после -->
          <BeforeAfterSlider
            v-if="isCurrentPair"
            :key="'pair-' + activeIndex"
            :before-image="activeItem.beforeImage!"
            :after-image="activeItem.afterImage!"
            :before-alt="activeItem.beforeAlt || 'До ремонта'"
            :after-alt="activeItem.afterAlt || 'После ремонта'"
            :dimming="false"
            :duration="duration"
            :pause-at-edges="pauseAtEdges"
            :pause-on-hover="true"
            auto-play
            @pass-complete="onPassComplete"
          />
          <!-- ОДИНОЧНОЕ ФОТО -->
          <img
            v-else
            :key="'single-' + activeIndex"
            :src="activeItem.src!"
            :alt="activeItem.alt || 'Пример работы'"
            class="showcase-main-image"
            draggable="false"
          />
        </Transition>
      </div>

      <!-- Миниатюры (только если больше одного элемента) -->
      <div v-if="items.length > 1" class="showcase-thumbnails">
        <button
          v-for="(item, index) in items"
          :key="index"
          class="thumbnail"
          :class="{
            'thumbnail--active': index === activeIndex,
            'thumbnail--pair': isPair(item),
          }"
          :aria-label="isPair(item) ? `Пример работы ${index + 1} (до/после)` : `Фото ${index + 1}`"
          @click="switchTo(index)"
        >
          <img
            :src="getThumbnailSrc(item)"
            :alt="getThumbnailAlt(item, index)"
            loading="lazy"
          />
          <!-- Иконка сравнения только для пар -->
          <span v-if="isPair(item)" class="thumbnail__overlay">
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

/**
 * Универсальный ShowcaseItem:
 * - Пара (до/после): нужны beforeImage + afterImage
 * - Одиночное фото: нужен src
 */
export interface ShowcaseItem {
  beforeImage?: string
  afterImage?: string
  beforeAlt?: string
  afterAlt?: string
  src?: string
  alt?: string
}

const props = withDefaults(
  defineProps<{
    title: string
    subtitle?: string
    items: ShowcaseItem[]
    duration?: number
    pauseAtEdges?: number
    /**
     * Количество полных проходов линии сравнения, после которых
     * авто-переключается на следующую пару. 0 или undefined = выключено.
     */
    autoSwitchAfterPasses?: number
  }>(),
  {
    duration: 7000,
    pauseAtEdges: 2000,
    // autoSwitchAfterPasses по умолчанию undefined — автопереключение выключено
  }
)

// === Состояние ===
const activeIndex = ref(0)
const isVisible = ref(false)
const sectionRef = ref<HTMLElement | null>(null)
const passesCount = ref(0) // Счётчик завершённых проходов

let observer: IntersectionObserver | null = null

const activeItem = computed(() => props.items[activeIndex.value] || props.items[0])

// === Проверка типа элемента ===
const isPair = (item: ShowcaseItem): boolean => {
  return Boolean(item.beforeImage && item.afterImage)
}

const isCurrentPair = computed(() => isPair(activeItem.value))

// === Превью для миниатюр ===
const getThumbnailSrc = (item: ShowcaseItem): string => {
  if (isPair(item)) return item.afterImage!
  return item.src!
}

const getThumbnailAlt = (item: ShowcaseItem, index: number): string => {
  if (isPair(item)) return item.afterAlt || `Пример работы ${index + 1}`
  return item.alt || `Фото ${index + 1}`
}

// === Переключение ===
const switchTo = (index: number) => {
  if (index === activeIndex.value) return
  activeIndex.value = index
  passesCount.value = 0 // Сбрасываем счётчик при ручном переключении
}

// === Обработчик завершения прохода ===
const onPassComplete = () => {
  // Если опция не задана или элементов мало — ничего не делаем
  if (!props.autoSwitchAfterPasses || props.items.length <= 1) return

  passesCount.value++

  if (passesCount.value >= props.autoSwitchAfterPasses) {
    passesCount.value = 0
    const nextIndex = (activeIndex.value + 1) % props.items.length
    activeIndex.value = nextIndex
  }
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
@use '@/assets/styles/mixins' as *;

.before-after-showcase {
  @include section-padding;
  background: $background-dark;
  color: $text-light;
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
    @include section-container;
  }
}

// === Заголовок ===
.showcase-header {
  margin-bottom: 2rem;

  &__title {
    @include section-title;
  }

  &__subtitle {
    @include section-subtitle;
    color: rgba($text-light, 0.7);
    margin: 0;
  }
}

// === Верхняя панель: подписи + счётчик ===
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
  min-width: 80px;

  &--before {
    color: rgba($text-light, 0.5);
  }

  &--after {
    color: $blue-light;
    justify-content: flex-end;
  }

  &--placeholder {
    visibility: hidden;
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
  border-radius: $border-radius;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
  background: #000;

  :deep(.before-after) {
    height: 900px;
    min-height: 400px;

    @media (max-width: 768px) {
      height: 450px;
      min-height: 280px;
    }

    @media (max-width: 480px) {
      height: 380px;
      min-height: 220px;
    }
  }
}

.showcase-main-image {
  width: 100%;
  height: 700px;
  object-fit: cover;
  display: block;

  @media (max-width: 768px) {
    height: 450px;
  }

  @media (max-width: 480px) {
    height: 380px;
  }
}

// === Fade-переход ===
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
  gap: 0.8rem;
  margin-top: 0.8rem;
  flex-wrap: wrap;
}

.thumbnail {
  position: relative;
  width: 110px;
  height: 74px;
  border-radius: $border-radius;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.15);
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

  // === Оверлей с иконкой сравнения ===
  &__overlay {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
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

  // === Одиночное фото: иконка появляется только при hover ===
  &:hover:not(.thumbnail--active):not(.thumbnail--pair) {
    border-color: rgba(0, 195, 245, 0.5);
    transform: translateY(-3px);
    box-shadow: 0 8px 20px rgba(0, 195, 245, 0.2);

    .thumbnail__overlay {
      opacity: 1;
      background: rgba(24, 25, 27, 0.45);
    }
  }

  // === Парное фото (до/после): иконка видна ВСЕГДА ===
  &--pair {
    .thumbnail__overlay {
      // Градиент снизу — иконка хорошо читается на любом фото
      background: linear-gradient(
        to top,
        rgba(0, 0, 0, 0.7) 0%,
        rgba(0, 0, 0, 0.3) 40%,
        rgba(0, 0, 0, 0.15) 70%,
        transparent 100%
      );
      opacity: 1;

      // Сдвигаем иконку чуть выше номера
      align-items: center;
      padding-bottom: 6px;
    }

    &:hover:not(.thumbnail--active) {
      border-color: rgba(0, 195, 245, 0.5);
      transform: translateY(-3px);
      box-shadow: 0 8px 20px rgba(0, 195, 245, 0.2);

      .thumbnail__overlay {
        background: linear-gradient(
          to top,
          rgba(0, 0, 0, 0.85) 0%,
          rgba(0, 0, 0, 0.5) 40%,
          rgba(0, 0, 0, 0.3) 70%,
          rgba(24, 25, 27, 0.15) 100%
        );
      }

      img {
        transform: scale(1.05);
      }
    }
  }

  // === Активная миниатюра ===
  &--active {
    border-color: $blue;
    box-shadow: 0 0 0 0 rgba(0, 195, 245, 0.3), 0 8px 24px rgba(0, 195, 245, 0.25);

    img {
      filter: brightness(1.05);
    }

    .thumbnail__overlay {
      opacity: 1;
      color: $blue-light;
      background: rgba(24, 25, 27, 0.45);
    }

    // Для активных пар сохраняем градиент, но делаем его синеватым
    &.thumbnail--pair .thumbnail__overlay {
      background: linear-gradient(
        to top,
        rgba(0, 50, 70, 0.85) 0%,
        rgba(0, 30, 50, 0.5) 40%,
        rgba(0, 20, 40, 0.3) 70%,
        transparent 100%
      );
    }
  }
}

// === Мобильный адаптив ===
@media (max-width: 768px) {
  .showcase-label {
    font-size: 0.78rem;
    min-width: 60px;
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