<!-- app\components\ui\ScrollToTop\index.vue -->
 <script setup lang="ts">
/**
 * ScrollToTop — неброский индикатор прогресса скролла
 * с кнопкой возврата в начало страницы.
 * Появляется, когда страница пролистана минимум на 20%.
 */

const progress = ref(0)
const isVisible = ref(false)
const isHovered = ref(false)

// Параметры SVG-кольца (радиус и длина окружности)
const radius = 22
const circumference = 2 * Math.PI * radius

const strokeDashoffset = computed(() => {
  return circumference - (progress.value / 100) * circumference
})

const updateProgress = () => {
  const scrollTop = window.scrollY || document.documentElement.scrollTop
  const scrollHeight =
    document.documentElement.scrollHeight - document.documentElement.clientHeight

  if (scrollHeight <= 0) return

  const percent = Math.round((scrollTop / scrollHeight) * 100)
  progress.value = Math.max(0, Math.min(100, percent))
  isVisible.value = percent >= 20
}

const scrollToTop = () => {
  window.scrollTo({
    top: 0,
    behavior: 'smooth',
  })
}

// Throttling через requestAnimationFrame для плавности без просадок
let rafId: number | null = null
const onScroll = () => {
  if (rafId !== null) return
  rafId = requestAnimationFrame(() => {
    updateProgress()
    rafId = null
  })
}

onMounted(() => {
  window.addEventListener('scroll', onScroll, { passive: true })
  updateProgress()
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', onScroll)
  if (rafId !== null) {
    cancelAnimationFrame(rafId)
    rafId = null
  }
})
</script>

<template>
  <Transition name="scroll-top-fade">
    <button
      v-show="isVisible"
      class="scroll-top"
      type="button"
      aria-label="Прокрутить в начало"
      @click="scrollToTop"
      @mouseenter="isHovered = true"
      @mouseleave="isHovered = false"
    >
      <!-- Прогресс-кольцо -->
      <svg class="scroll-top__ring" viewBox="0 0 52 52" aria-hidden="true">
        <circle
          class="scroll-top__ring-track"
          cx="26"
          cy="26"
          :r="radius"
          fill="none"
          stroke-width="3"
        />
        <circle
          class="scroll-top__ring-progress"
          cx="26"
          cy="26"
          :r="radius"
          fill="none"
          stroke-width="3"
          stroke-linecap="round"
          :stroke-dasharray="circumference"
          :stroke-dashoffset="strokeDashoffset"
        />
      </svg>

      <!-- Содержимое: либо %, либо стрелка (переключается при hover) -->
      <span class="scroll-top__content">
        <Transition name="scroll-top-content" mode="out-in">
          <span v-if="isHovered" key="arrow" class="scroll-top__icon">
            <Icon name="material-symbols:arrow-upward-rounded" size="20" />
          </span>
          <span v-else key="percent" class="scroll-top__percent">
            {{ progress }}<span class="scroll-top__percent-sign">%</span>
          </span>
        </Transition>
      </span>
    </button>
  </Transition>
</template>

<style lang="scss" scoped>
@use 'assets/styles/variables' as *;

$size: 52px;
$size-mobile: 48px;
$track-color: rgba(0, 0, 0, 0.06);
$bg-color: rgba(255, 255, 255, 0.88);

.scroll-top {
  position: fixed;
  right: 24px;
  bottom: 24px;
  z-index: 900;

  width: $size;
  height: $size;
  padding: 0;
  border: none;
  border-radius: 50%;
  background: $bg-color;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  box-shadow:
    0 4px 20px rgba(0, 0, 0, 0.08),
    0 1px 2px rgba(0, 0, 0, 0.04);

  display: flex;
  align-items: center;
  justify-content: center;

  cursor: pointer;
  user-select: none;
  transition:
    transform 0.3s cubic-bezier(0.4, 0, 0.2, 1),
    box-shadow 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow:
      0 8px 28px rgba(0, 0, 0, 0.12),
      0 2px 4px rgba(0, 0, 0, 0.06);
  }

  &:active {
    transform: translateY(0);
  }

  &:focus-visible {
    outline: 2px solid $blue;
    outline-offset: 3px;
  }

  &__ring {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    transform: rotate(-90deg); // прогресс идёт от 12 часов
    pointer-events: none;

    &-track {
      stroke: $track-color;
    }

    &-progress {
      stroke: $blue;
      transition: stroke-dashoffset 0.25s ease;
    }
  }

  &__content {
    position: relative;
    z-index: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    color: $text-dark;
  }

  &__icon {
    display: flex;
    align-items: center;
    justify-content: center;
    color: $blue;
  }

  &__percent {
    display: flex;
    align-items: baseline;
    justify-content: center;
    font-family: 'Rubik', sans-serif;
    font-size: 13px;
    font-weight: 600;
    letter-spacing: -0.02em;
    line-height: 1;

    &-sign {
      font-size: 9px;
      font-weight: 500;
      opacity: 0.6;
      margin-left: 1px;
    }
  }

  @media (max-width: 768px) {
    right: 16px;
    bottom: 16px;
    width: $size-mobile;
    height: $size-mobile;

    &__percent {
      font-size: 12px;

      &-sign {
        font-size: 8px;
      }
    }
  }
}

/* Плавное появление/исчезновение */
.scroll-top-fade {
  &-enter-active,
  &-leave-active {
    transition:
      opacity 0.3s ease,
      transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  &-enter-from,
  &-leave-to {
    opacity: 0;
    transform: translateY(16px) scale(0.9);
  }
}

/* Плавная смена контента (процент ↔ стрелка) */
.scroll-top-content {
  &-enter-active,
  &-leave-active {
    transition:
      opacity 0.2s ease,
      transform 0.2s ease;
  }

  &-enter-from,
  &-leave-to {
    opacity: 0;
    transform: scale(0.85);
  }
}

/* Учитываем пользователей с prefers-reduced-motion */
@media (prefers-reduced-motion: reduce) {
  .scroll-top {
    transition: none;

    &__ring-progress {
      transition: none;
    }
  }

  .scroll-top-fade-enter-active,
  .scroll-top-fade-leave-active,
  .scroll-top-content-enter-active,
  .scroll-top-content-leave-active {
    transition: none;
  }
}

@media (max-width: 827px) {
  .scroll-top {
    display: none !important;
  }
}
</style>