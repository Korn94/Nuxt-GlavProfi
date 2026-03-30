<!-- components/pages/projects/casePage/BeforeAfter.vue -->
<template>
  <div class="before-after-wrapper">
    <!-- Основной блок сравнения -->
    <div class="before-after-container" ref="container">
      <div class="image-wrapper before">
        <img v-if="currentBefore" :src="currentBefore" :alt="currentBeforeAlt" class="image" />
      </div>
      <div class="image-wrapper after" :style="{ '--clip-left': position + '%' }">
        <img v-if="currentAfter" :src="currentAfter" :alt="currentAfterAlt" class="image" />
      </div>

      <!-- Ползунок -->
      <div class="slider" :style="{ left: position + '%' }" @mousedown="startDrag" @touchstart="startDrag"
        @mouseenter="onSliderHover" @mouseleave="onSliderLeave">
        <div class="divider-line"></div>
        <div class="handle">
          <!-- Подсказка "Потяни" -->
          <transition name="hint-fade">
            <div v-if="showHint" class="hint-text">
              <span class="hint-arrow hint-arrow--left">⟨</span>
              <span class="hint-label">Потяни</span>
              <span class="hint-arrow hint-arrow--right">⟩</span>
            </div>
          </transition>
        </div>
      </div>
    </div>

    <!-- Миниатюры — отдельный блок под слайдером -->
    <div v-if="imagePairs.length > 1" class="thumbnails">
      <div v-for="(pair, index) in imagePairs" :key="index" class="thumbnail-wrapper"
        :class="{ active: index === currentIndex }" @click="selectPair(index)">
        <img :src="pair.after" alt="Миниатюра после" class="thumbnail" />
        <div class="click-icon">
          <Icon name="tabler:click" size="24px" class="ico" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onUnmounted, onMounted } from 'vue'

const props = defineProps({
  imagePairs: {
    type: Array,
    required: true,
    validator: (pairs) =>
      pairs.every(
        (pair) => typeof pair.before === 'string' && typeof pair.after === 'string'
      )
  }
})

const position = ref(50)
const currentIndex = ref(0)
const isDragging = ref(false)
const showHint = ref(true)
const isHoveringSlider = ref(false)

// Инициализируем таймер сразу, чтобы избежать проблем с undefined
let inactivityTimeout = null

const currentBefore = ref(props.imagePairs[0]?.before || '')
const currentAfter = ref(props.imagePairs[0]?.after || '')
const currentBeforeAlt = ref(props.imagePairs[0]?.beforeAlt || 'Фото до')
const currentAfterAlt = ref(props.imagePairs[0]?.afterAlt || 'Фото после')

// Безопасная очистка таймера
const clearInactivityTimer = () => {
  if (inactivityTimeout) {
    clearTimeout(inactivityTimeout)
    inactivityTimeout = null
  }
}

// Управление подсказкой
const hideHint = () => {
  showHint.value = false
  clearInactivityTimer()
}

const resetInactivityTimer = () => {
  clearInactivityTimer()
  // Показываем подсказку снова через 3 сек бездействия
  inactivityTimeout = setTimeout(() => {
    if (!isDragging.value && !isHoveringSlider.value) {
      showHint.value = true
    }
  }, 3000)
}

const onSliderHover = () => {
  isHoveringSlider.value = true
  if (!isDragging.value) {
    showHint.value = true
    clearInactivityTimer() // Не показываем подсказку, если пользователь активно взаимодействует
  }
}

const onSliderLeave = () => {
  isHoveringSlider.value = false
  resetInactivityTimer()
}

// Обновление при изменении пропсов
watch(
  () => props.imagePairs,
  (newPairs) => {
    if (!newPairs?.length) return

    const index = Math.min(currentIndex.value, newPairs.length - 1)
    currentBefore.value = newPairs[index]?.before || ''
    currentAfter.value = newPairs[index]?.after || ''
    currentBeforeAlt.value = newPairs[index]?.beforeAlt || 'Фото до'
    currentAfterAlt.value = newPairs[index]?.afterAlt || 'Фото после'

    // Показываем подсказку при смене пары, но только если не тянем
    if (!isDragging.value) {
      showHint.value = true
      resetInactivityTimer()
    }
  },
  { immediate: true }
)

const selectPair = (index) => {
  currentIndex.value = index
  currentBefore.value = props.imagePairs[index]?.before || ''
  currentAfter.value = props.imagePairs[index]?.after || ''
  position.value = 50
  showHint.value = true
  resetInactivityTimer()
}

// Перетаскивание
const container = ref(null)

const handleMouseMove = (e) => {
  if (!isDragging.value || !container.value) return
  const rect = container.value.getBoundingClientRect()
  const x = e.clientX - rect.left
  const percent = (x / rect.width) * 100
  position.value = Math.min(Math.max(percent, 2), 98)
}

const handleTouchMove = (e) => {
  if (!isDragging.value || !container.value) return
  const touch = e.touches[0]
  const rect = container.value.getBoundingClientRect()
  const x = touch.clientX - rect.left
  const percent = (x / rect.width) * 100
  position.value = Math.min(Math.max(percent, 2), 98)
  e.preventDefault()
}

const startDrag = (e) => {
  isDragging.value = true
  hideHint()

  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mouseup', stopDrag)
  document.addEventListener('touchmove', handleTouchMove, { passive: false })
  document.addEventListener('touchend', stopDrag)

  e.preventDefault()
}

const stopDrag = () => {
  isDragging.value = false
  resetInactivityTimer()

  document.removeEventListener('mousemove', handleMouseMove)
  document.removeEventListener('mouseup', stopDrag)
  document.removeEventListener('touchmove', handleTouchMove)
  document.removeEventListener('touchend', stopDrag)
}

// Очистка при размонтировании
onUnmounted(() => {
  clearInactivityTimer()
})

// Инициализация таймера при монтировании
onMounted(() => {
  resetInactivityTimer()
})
</script>

<style lang="scss" scoped>
.before-after-wrapper {
  display: flex;
  flex-direction: column;
  width: 100%;
  gap: 5px;
}

.before-after-container {
  border-top: 4px solid white;
  position: relative;
  margin: auto;
  width: 100%;
  max-width: 800px;
  overflow: hidden;
  aspect-ratio: 1/1;

  @media (max-width: 768px) {
    aspect-ratio: 1/1;
  }

  .image-wrapper {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    overflow: hidden;
    pointer-events: none;

    &.before {
      z-index: 1;
    }

    &.after {
      z-index: 2;
      clip-path: inset(0 0 0 calc(var(--clip-left, 50%)));
    }

    .image {
      width: 100%;
      height: 100%;
      object-fit: cover;
      user-select: none;
      -webkit-user-drag: none;
    }
  }

  .slider {
    position: absolute;
    top: 0;
    left: 50%;
    height: 100%;
    width: 4px;
    background-color: #fff;
    cursor: ew-resize;
    z-index: 10;
    box-shadow: 0 0 50px 20px rgba(0, 0, 0, 0.3);
    transition: box-shadow 0.2s ease;

    .divider-line {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: #fff;
      z-index: -1;
    }

    .handle {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 36px;
      height: 36px;

      &::before,
      &::after {
        content: '';
        position: absolute;
        top: 50%;
        transform: translateY(-50%);
        width: 0;
        height: 0;
        border: 6px solid transparent;
      }

      &::before {
        left: -5px;
        border-right-color: white;
        border-right-width: 10px;
        animation: pulse-before 1s infinite ease-in-out;
        animation-delay: 0.2s;
      }

      &::after {
        right: -5px;
        border-left-color: white;
        border-left-width: 10px;
        animation: pulse-after 1s infinite ease-in-out;
        animation-direction: alternate-reverse;
        animation-delay: 0.2s;
      }

      // Подсказка "Потяни"
      .hint-text {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        display: flex;
        align-items: center;
        gap: 4px;
        background: rgba(0, 0, 0, 0.6);
        padding: 4px 10px;
        border-radius: 20px;
        white-space: nowrap;
        pointer-events: none;
        z-index: 20;

        .hint-label {
          font-size: 12px;
          font-weight: 500;
          color: #fff;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
        }

        .hint-arrow {
          font-size: 14px;
          color: #fff;
          font-weight: bold;
          opacity: 0.9;

          &--left {
            animation: swipe-left 1.5s infinite ease-in-out;
          }

          &--right {
            animation: swipe-right 1.5s infinite ease-in-out;
          }
        }
      }
    }
  }

  // Анимация исчезновения/появления подсказки
  .hint-fade-enter-active,
  .hint-fade-leave-active {
    transition: opacity 0.3s ease, transform 0.3s ease;
  }

  .hint-fade-enter-from,
  .hint-fade-leave-to {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.95);
  }

  @keyframes pulse-before {
    0% {
      left: -5px;
    }

    50% {
      left: 0px;
    }

    100% {
      left: -5px;
    }
  }

  @keyframes pulse-after {
    0% {
      right: -5px;
    }

    50% {
      right: 0px;
    }

    100% {
      right: -5px;
    }
  }

  @keyframes swipe-left {

    0%,
    100% {
      transform: translateX(0);
      opacity: 0.9;
    }

    50% {
      transform: translateX(-3px);
      opacity: 1;
    }
  }

  @keyframes swipe-right {

    0%,
    100% {
      transform: translateX(0);
      opacity: 0.9;
    }

    50% {
      transform: translateX(3px);
      opacity: 1;
    }
  }
}

// Миниатюры
.thumbnails {
  display: flex;
  gap: 5px;
  overflow-x: auto;
  scroll-padding: 1rem;
  padding-bottom: 5px;
}

.thumbnail-wrapper {
  position: relative;
  width: 200px;
  height: 120px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    z-index: 1;
    transition: opacity 0.2s ease;
    pointer-events: none;
  }

  &:not(.active)::before {
    opacity: 1;
  }

  &.active::before {
    opacity: 0;
  }

  &:hover {
    .thumbnail {
      transform: scale(1.05);
    }
  }

  .thumbnail {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    transition: transform 0.3s ease;
    z-index: 0;
    position: relative;
  }

  .click-icon {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    opacity: 0.7;
    pointer-events: none;
    z-index: 1;
    transition: opacity 0.2s ease;

    .ico {
      color: #fff;
    }
  }

  &.active .click-icon {
    opacity: 0;
    visibility: hidden;
  }
}
</style>