<!-- app/components/pages/public/remontPomescheniy/pageTypes/ui/BeforeAfterSlider.vue -->
<template>
  <div
    ref="containerRef"
    :class="[
      'before-after',
      { 'before-after--vertical': orientation === 'vertical', 'before-after--paused': isPaused }
    ]"
    @mouseenter="onHoverEnter"
    @mouseleave="onHoverLeave"
    @focusin="onHoverEnter"
    @focusout="onHoverLeave"
  >
    <!-- Слой "ДО" (нижний) со своим затемнением -->
    <div class="before-after__layer before-after__layer--before">
      <img
        :src="beforeImage"
        :alt="beforeAlt"
        class="before-after__image"
        draggable="false"
        loading="eager"
      />
      <div v-if="dimming" class="before-after__layer-dim" />
    </div>

    <!-- Слой "ПОСЛЕ" (верхний, обрезается clip-path, со своим затемнением) -->
    <div
      class="before-after__layer before-after__layer--after"
      :style="afterLayerStyle"
    >
      <img
        :src="afterImage"
        :alt="afterAlt"
        class="before-after__image"
        draggable="false"
        loading="eager"
      />
      <div v-if="dimming" class="before-after__layer-dim" />
    </div>

    <!-- Линия-разделитель (без ручки) -->
    <div class="before-after__divider" :style="dividerStyle" aria-hidden="true" />

    <!-- Индикатор паузы (появляется при hover, если включён pauseOnHover) -->
    <div v-if="pauseOnHover && isPaused" class="before-after__pause-hint">
      <Icon name="mdi:pause-circle-outline" size="18" />
      <span>Пауза</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'

const props = withDefaults(
  defineProps<{
    /** URL изображения "до" */
    beforeImage: string
    /** URL изображения "после" */
    afterImage: string
    /** Alt-текст */
    beforeAlt?: string
    afterAlt?: string
    /** Ориентация разделителя */
    orientation?: 'horizontal' | 'vertical'
    /** Затемнение поверх каждой картинки (одинаковое на обеих) */
    dimming?: boolean
    /** Длительность одного прохода от края до края (мс) */
    duration?: number
    /** Пауза на каждом краю перед разворотом (мс) */
    pauseAtEdges?: number
    /** Минимальный отступ от края в % (зазор) */
    minGap?: number
    /** Стартовая позиция в % (если авто-анимация выключена) */
    initialPosition?: number
    /** Включить авто-анимацию */
    autoPlay?: boolean
    /** Останавливать анимацию при наведении курсора */
    pauseOnHover?: boolean
  }>(),
  {
    beforeAlt: 'До ремонта',
    afterAlt: 'После ремонта',
    orientation: 'horizontal',
    dimming: false,
    duration: 6000,
    pauseAtEdges: 1500,
    minGap: 8,
    initialPosition: 50,
    autoPlay: true,
    pauseOnHover: true,
  }
)

const containerRef = ref<HTMLElement | null>(null)
const position = ref(props.initialPosition)
const isPaused = ref(false)

let rafId: number | null = null
let lastTimestamp: number = 0
let mediaQueryCleanup: (() => void) | null = null

// Состояние анимации
let direction: 1 | -1 = 1 // 1 = вперёд (к maxGap), -1 = назад (к minGap)
let progress = 0 // Прогресс движения [0, 1]
let isPausedAtEdge = false
let pauseStartTime = 0
let reducedMotion = false

// === Easing: синусоида для плавного замедления у краёв ===
const easeInOutSine = (t: number): number => {
  return -(Math.cos(Math.PI * t) - 1) / 2
}

// === Стили слоёв ===
const afterLayerStyle = computed(() => {
  if (props.orientation === 'horizontal') {
    return { clipPath: `inset(0 0 0 ${position.value}%)` }
  }
  return { clipPath: `inset(${position.value}% 0 0 0)` }
})

const dividerStyle = computed(() => {
  if (props.orientation === 'horizontal') {
    return { left: `${position.value}%` }
  }
  return { top: `${position.value}%` }
})

// === Пауза при наведении ===
const onHoverEnter = () => {
  if (!props.pauseOnHover) return
  isPaused.value = true
}

const onHoverLeave = () => {
  if (!props.pauseOnHover) return
  isPaused.value = false
}

// === Анимационный цикл ===
const animate = (timestamp: number) => {
  if (!lastTimestamp) {
    lastTimestamp = timestamp
  }

  // Если на паузе или reduced-motion — просто ждём
  if (isPaused.value || reducedMotion) {
    lastTimestamp = timestamp
    rafId = requestAnimationFrame(animate)
    return
  }

  const delta = timestamp - lastTimestamp
  lastTimestamp = timestamp

  // Диапазон движения: [minGap, 100 - minGap]
  const minPos = props.minGap
  const maxPos = 100 - props.minGap
  const range = maxPos - minPos

  // Проверяем, находимся ли мы на паузе у края
  if (isPausedAtEdge) {
    const pauseElapsed = timestamp - pauseStartTime
    if (pauseElapsed >= props.pauseAtEdges) {
      // Пауза закончилась — меняем направление и продолжаем
      isPausedAtEdge = false
      direction = direction === 1 ? -1 : 1
      progress = 0
    } else {
      // Ещё на паузе — просто ждём
      rafId = requestAnimationFrame(animate)
      return
    }
  }

  // Вычисляем прогресс движения
  const progressDelta = delta / props.duration
  progress += progressDelta

  // Проверяем, достигли ли края
  if (progress >= 1) {
    progress = 1
    isPausedAtEdge = true
    pauseStartTime = timestamp
  }

  // Применяем easing к прогрессу
  const easedProgress = easeInOutSine(progress)

  // Вычисляем новую позицию
  let newPosition: number
  if (direction === 1) {
    // Движемся от minPos к maxPos
    newPosition = minPos + easedProgress * range
  } else {
    // Движемся от maxPos к minPos
    newPosition = maxPos - easedProgress * range
  }

  position.value = newPosition

  rafId = requestAnimationFrame(animate)
}

// === Жизненный цикл ===
onMounted(() => {
  // Проверяем prefers-reduced-motion
  const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
  reducedMotion = mediaQuery.matches

  const handleChange = (e: MediaQueryListEvent) => {
    reducedMotion = e.matches
  }
  mediaQuery.addEventListener?.('change', handleChange)

  mediaQueryCleanup = () => {
    mediaQuery.removeEventListener?.('change', handleChange)
  }

  // Если авто-анимация включена — запускаем цикл
  if (props.autoPlay) {
    // Определяем стартовое направление
    if (props.initialPosition <= props.minGap) {
      direction = 1
      progress = 0
    } else if (props.initialPosition >= 100 - props.minGap) {
      direction = -1
      progress = 0
    } else {
      // Начальная позиция где-то посередине — вычисляем прогресс
      const range = (100 - props.minGap) - props.minGap
      const normalizedPos = (props.initialPosition - props.minGap) / range
      progress = normalizedPos
      direction = 1 // По умолчанию вправо
    }

    rafId = requestAnimationFrame(animate)
  }
})

onBeforeUnmount(() => {
  if (rafId !== null) {
    cancelAnimationFrame(rafId)
    rafId = null
  }
  mediaQueryCleanup?.()
})
</script>

<style lang="scss" scoped>
@use '@/assets/styles/variables' as *;

.before-after {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 400px;
  overflow: hidden;
  user-select: none;
  -webkit-user-select: none;
  touch-action: none;

  // Создаём локальный stacking context —
  // чтобы z-index внутри не конфликтовал с элементами вне компонента
  isolation: isolate;

  // === Слои изображений ===
  &__layer {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    overflow: hidden;
  }

  &__layer--before {
    z-index: 1;
  }

  &__layer--after {
    z-index: 2;
    will-change: clip-path;
  }

  &__image {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    pointer-events: none;
    user-select: none;
    -webkit-user-drag: none;
  }

  // === Затемнение ВНУТРИ каждого слоя ===
  // Благодаря этому затемнение выглядит одинаково на обеих картинках
  // и корректно обрезается clip-path вместе с "После" слоем
  &__layer-dim {
    position: absolute;
    inset: 0;
    z-index: 1;
    // background: linear-gradient(
    //   135deg,
    //   rgba(24, 25, 27, 0.85) 0%,
    //   rgba(24, 25, 27, 0.55) 60%,
    //   rgba(24, 25, 27, 0.35) 100%
    // );
    pointer-events: none;
  }

  // === Разделительная линия (без ручки) ===
  &__divider {
    position: absolute;
    top: 0;
    bottom: 0;
    z-index: 3;
    width: 2px;
    background: rgba(255, 255, 255, 0.95);
    transform: translateX(-50%);
    box-shadow:
      0 0 0 1px rgba(0, 0, 0, 0.3),
      0 0 20px rgba(0, 0, 0, 0.4);
    pointer-events: none;
    will-change: left, top;

    .before-after--vertical & {
      top: auto;
      left: 0;
      right: 0;
      bottom: auto;
      width: auto;
      height: 2px;
      transform: translateY(-50%);
    }
  }

  // === Индикатор паузы ===
  &__pause-hint {
    position: absolute;
    bottom: 1.5rem;
    left: 50%;
    transform: translateX(-50%);
    z-index: 4;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    background: rgba(0, 0, 0, 0.65);
    backdrop-filter: blur(8px);
    border: 1px solid rgba(255, 255, 255, 0.15);
    border-radius: 50px;
    color: #fff;
    font-family: 'Rubik', sans-serif;
    font-size: 0.82rem;
    font-weight: 500;
    pointer-events: none;
    opacity: 0;
    animation: fadeInHint 0.3s ease forwards;

    @media (max-width: 640px) {
      bottom: 1rem;
      font-size: 0.78rem;
    }
  }
}

@keyframes fadeInHint {
  to { opacity: 1; }
}

// === Мобильная версия ===
@media (max-width: 768px) {
  .before-after {
    min-height: 300px;
  }
}

@media (max-width: 480px) {
  .before-after {
    min-height: 240px;
  }
}

// === Поддержка reduced motion ===
@media (prefers-reduced-motion: reduce) {
  .before-after {
    &__divider,
    &__layer--after {
      transition: none !important;
    }

    &__pause-hint {
      animation: none;
      opacity: 1;
    }
  }
}
</style>