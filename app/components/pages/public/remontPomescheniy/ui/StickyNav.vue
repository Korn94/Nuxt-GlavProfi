<!-- app/components/pages/public/remontPomescheniy/pageTypes/ui/StickyNav.vue -->
<template>
  <div
    ref="wrapperRef"
    class="sticky-nav-wrapper"
    :style="wrapperStyle"
  >
    <div class="sticky-nav__sentinel" data-sticky-nav-sentinel aria-hidden="true" />
    <nav
      ref="navRef"
      :class="[
        'sticky-nav',
        { 'sticky-nav--stuck': isSticky }
      ]"
      role="navigation"
      aria-label="Навигация по разделам страницы"
    >
      <div class="sticky-nav__container">
        <!-- Подпись-маркер "На странице:" -->
        <span v-if="label && !isSticky" class="sticky-nav__label">
          <Icon name="mdi:format-list-bulleted" size="14" class="sticky-nav__label-icon" />
          {{ label }}
        </span>
        
        <!-- Обёртка для списка + кнопок скролла -->
        <div class="sticky-nav__list-wrapper">
          <!-- Стрелка ВЛЕВО -->
          <button
            v-if="canScrollLeft && !isSticky"
            type="button"
            class="sticky-nav__scroll-btn sticky-nav__scroll-btn--left"
            aria-label="Прокрутить навигацию влево"
            @click="scrollList('left')"
          >
            <Icon name="mdi:chevron-left" size="22" />
          </button>
          
          <ul 
            ref="listRef" 
            class="sticky-nav__list"
            :class="{ 'sticky-nav__list--dragging': isDragging }"
            @scroll="handleListScroll"
            @mousedown="handleDragStart"
            @mousemove="handleDragMove"
            @mouseup="handleDragEnd"
            @mouseleave="handleDragEnd"
          >
            <li
              v-for="(item, index) in items"
              :key="item.id"
              :ref="(el) => setItemRef(item.id, el as HTMLElement | null)"
              class="sticky-nav__item"
            >
              <a
                :href="`#${item.id}`"
                :class="[
                  'sticky-nav__link',
                  { 'sticky-nav__link--active': activeId === item.id }
                ]"
                @click.prevent="handleLinkClick(item.id, $event)"
              >
                <span class="sticky-nav__roman">{{ toRoman(index + 1) }}</span>
                <span>{{ item.label }}</span>
              </a>
            </li>
          </ul>
          
          <!-- Стрелка ВПРАВО -->
          <button
            v-if="canScrollRight && !isSticky"
            type="button"
            class="sticky-nav__scroll-btn sticky-nav__scroll-btn--right"
            aria-label="Прокрутить навигацию вправо"
            @click="scrollList('right')"
          >
            <Icon name="mdi:chevron-right" size="22" />
          </button>
        </div>
      </div>
    </nav>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useStickyNav } from '../composables/useStickyNav'

export interface StickyNavItem {
  id: string
  label: string
  icon?: string
}

const props = withDefaults(
  defineProps<{
    items: StickyNavItem[]
    scrollOffset?: number
    label?: string
  }>(),
  {
    scrollOffset: 120,
  }
)

const wrapperRef = ref<HTMLElement | null>(null)
const navRef = ref<HTMLElement | null>(null)
const listRef = ref<HTMLUListElement | null>(null)
const itemRefs = new Map<string, HTMLElement>()

// === Отслеживание скролла списка ===
const canScrollLeft = ref(false)
const canScrollRight = ref(false)

const checkScrollPosition = () => {
  if (!listRef.value) return
  
  const { scrollLeft, scrollWidth, clientWidth } = listRef.value
  const tolerance = 5
  
  canScrollLeft.value = scrollLeft > tolerance
  canScrollRight.value = scrollWidth > clientWidth + scrollLeft + tolerance
}

const handleListScroll = () => {
  checkScrollPosition()
}

// === Программная прокрутка списка ===
const scrollList = (direction: 'left' | 'right') => {
  if (!listRef.value) return
  
  const scrollAmount = listRef.value.clientWidth * 0.8
  const targetScroll = direction === 'left'
    ? listRef.value.scrollLeft - scrollAmount
    : listRef.value.scrollLeft + scrollAmount
  
  listRef.value.scrollTo({
    left: Math.max(0, targetScroll),
    behavior: 'smooth',
  })
}

// === Drag-to-scroll (перетаскивание мышкой) ===
const isDragging = ref(false)
const dragStartX = ref(0)
const dragScrollLeft = ref(0)
const hasDragged = ref(false)

const handleDragStart = (e: MouseEvent) => {
  // Только левая кнопка мыши
  if (e.button !== 0) return
  
  isDragging.value = true
  hasDragged.value = false
  dragStartX.value = e.pageX - (listRef.value?.offsetLeft || 0)
  dragScrollLeft.value = listRef.value?.scrollLeft || 0
  
  // Предотвращаем выделение текста
  e.preventDefault()
}

const handleDragMove = (e: MouseEvent) => {
  if (!isDragging.value || !listRef.value) return
  
  e.preventDefault()
  
  const x = e.pageX - listRef.value.offsetLeft
  const walk = (x - dragStartX.value) * 1.5 // Множитель для ускорения
  
  // Если сдвинули больше чем на 5px — считаем это drag'ом
  if (Math.abs(walk) > 5) {
    hasDragged.value = true
  }
  
  listRef.value.scrollLeft = dragScrollLeft.value - walk
}

const handleDragEnd = () => {
  isDragging.value = false
}

// === Обработчик клика по ссылке ===
const handleLinkClick = (id: string, e: MouseEvent) => {
  // Если был drag — не переходим по ссылке
  if (hasDragged.value) {
    e.preventDefault()
    hasDragged.value = false
    return
  }
  
  // Иначе — обычный скролл к секции
  scrollTo(id)
}

const setItemRef = (id: string, el: HTMLElement | null) => {
  if (el) {
    itemRefs.set(id, el)
  } else {
    itemRefs.delete(id)
  }
}

const sectionIds = computed(() => props.items.map((i) => i.id))

const { activeId, isSticky, scrollTo } = useStickyNav({
  sectionIds,
  scrollOffset: props.scrollOffset,
})

const toRoman = (num: number): string => {
  const romanNumerals: [number, string][] = [
    [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']
  ]
  let result = ''
  let n = num
  for (const [value, symbol] of romanNumerals) {
    while (n >= value) {
      result += symbol
      n -= value
    }
  }
  return result
}

const wrapperStyle = computed(() => {
  if (!isSticky.value || !navRef.value) return {}
  return { minHeight: `${navHeight.value}px` }
})

const navHeight = ref(0)
const measureNavHeight = () => {
  if (navRef.value) {
    navHeight.value = navRef.value.getBoundingClientRect().height
  }
}

const centerActiveItem = async () => {
  const currentActiveId = activeId.value
  if (!currentActiveId) return

  await nextTick()
  if (activeId.value !== currentActiveId) return

  const activeEl = itemRefs.get(currentActiveId)
  if (!activeEl || !listRef.value) return

  const listRect = listRef.value.getBoundingClientRect()
  const itemRect = activeEl.getBoundingClientRect()

  const itemCenter = itemRect.left - listRect.left + itemRect.width / 2 + listRef.value.scrollLeft
  const targetScroll = itemCenter - listRect.width / 2

  listRef.value.scrollTo({
    left: Math.max(0, targetScroll),
    behavior: 'smooth',
  })
}

watch(activeId, () => {
  centerActiveItem()
})

watch(isSticky, () => {
  if (!isSticky.value) {
    nextTick(checkScrollPosition)
  }
})

onMounted(() => {
  measureNavHeight()
  window.addEventListener('resize', () => {
    measureNavHeight()
    checkScrollPosition()
  })
  
  nextTick(() => {
    setTimeout(() => {
      centerActiveItem()
      checkScrollPosition()
    }, 400)
  })
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', measureNavHeight)
})
</script>

<style lang="scss" scoped>
@use '@/assets/styles/variables' as *;

span {
  color: unset;
}

.sticky-nav-wrapper {
  position: relative;
  width: 100%;
}

.sticky-nav__sentinel {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 1px;
  pointer-events: none;
  visibility: hidden;
}

.sticky-nav {
  width: 100%;
  background: $background-dark;
  transition: box-shadow 0.3s ease, background 0.3s ease;
  z-index: 90;

  &--stuck {
    position: fixed;
    top: 60px;
    left: 0;
    width: 100%;
    background: $background-dark;
    border-bottom: 1px solid $text-dark;
    backdrop-filter: blur(12px);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
    border-bottom-color: rgba($blue, 0.2);

    @media (max-width: 768px) {
      top: 0;
    }

    @media (min-width: 768px) {
      justify-content: center;
    }
  }

  &__container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 2rem;

    @media (max-width: 768px) {
      padding: 0 1rem;
    }
  }

  &__list-wrapper {
    position: relative;
    flex: 1;
    min-width: 0;
    display: flex;
    align-items: center;
  }

  &__list {
    display: flex;
    margin: 0;
    padding: 0;
    list-style: none;
    overflow-x: auto;
    scrollbar-width: none;
    -webkit-overflow-scrolling: touch;
    scroll-behavior: smooth;
    justify-content: flex-start;
    flex: 1;
    min-width: 0;
    cursor: grab; // ✅ Курсор "рука" для drag

    @media (max-width: 768px) {
      justify-content: unset;
    }

    &::-webkit-scrollbar {
      display: none;
    }

    // ✅ Курсор "сжатая рука" при drag
    &--dragging {
      cursor: grabbing;
      scroll-behavior: auto; // Отключаем плавный скролл во время drag
      
      // Предотвращаем выделение текста
      * {
        user-select: none;
        -webkit-user-select: none;
      }
    }
  }

  &__item {
    flex-shrink: 0;
    display: inline-flex;
    align-items: center;

    &:not(:last-child)::after {
      content: '/';
      color: rgba($text-light, 0.25);
      font-size: 0.88rem;
      margin: 0 0.15rem;
      pointer-events: none;
    }
  }

  &__link {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.85rem 0.5rem;
    color: rgba($text-light, 0.65);
    font-family: 'Rubik', sans-serif;
    font-size: 0.88rem;
    font-weight: 400;
    text-decoration: none;
    white-space: nowrap;
    border-bottom: 2px solid transparent;
    transition: color 0.2s ease, border-color 0.25s ease;
    position: relative;

    &:hover {
      color: $blue-light;
    }

    &--active {
      color: rgba($text-light, 0.95);
      border-bottom-color: $blue;
      font-weight: 500;

      .sticky-nav__roman {
        color: $blue;
      }

      &:hover {
        color: rgba($text-light, 0.95);
      }
    }
  }

  &__roman {
    font-family: 'Rubik', sans-serif;
    font-size: 0.75rem;
    font-weight: 600;
    color: rgba($text-light, 0.45);
    letter-spacing: 0.05em;
    transition: color 0.2s ease;
  }

  &__scroll-btn {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    z-index: 10;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border: none;
    border-radius: 50%;
    background: rgba($background-dark, 0.85);
    color: $blue-light;
    cursor: pointer;
    backdrop-filter: blur(8px);
    box-shadow: 
      0 2px 8px rgba(0, 0, 0, 0.3),
      0 0 0 1px rgba(0, 195, 245, 0.2);
    transition: all 0.25s ease;
    animation: fadeInBtn 0.3s ease;

    &:hover {
      background: rgba(0, 195, 245, 0.15);
      color: $blue;
      box-shadow: 
        0 4px 12px rgba(0, 0, 0, 0.4),
        0 0 0 1px rgba(0, 195, 245, 0.5);
      // transform: translateY(-50%) scale(1.1);
    }

    &:active {
      transform: translateY(-50%) scale(0.95);
    }

    &--left {
      left: -4px;
      &::before {
        content: '';
        position: absolute;
        right: 100%;
        top: 0;
        bottom: 0;
        width: 24px;
        background: linear-gradient(
          90deg,
          transparent 0%,
          rgba($background-dark, 0.7) 60%,
          rgba($background-dark, 0.95) 100%
        );
        pointer-events: none;
      }
    }

    &--right {
      right: -4px;
      &::before {
        content: '';
        position: absolute;
        left: 100%;
        top: 0;
        bottom: 0;
        width: 24px;
        background: linear-gradient(
          270deg,
          transparent 0%,
          rgba($background-dark, 0.7) 60%,
          rgba($background-dark, 0.95) 100%
        );
        pointer-events: none;
      }
    }

    @media (max-width: 768px) {
      display: none;
    }
  }
}

.sticky-nav__container {
  display: flex;
  align-items: center;
  gap: 1rem;

  @media (min-width: 768px) {
    justify-content: center;
  }
}

.sticky-nav__label {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-family: 'Rubik', sans-serif;
  font-size: 0.78rem;
  font-weight: 500;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: rgba($text-light, 0.45);
  white-space: nowrap;
  flex-shrink: 0;
  padding-right: 1rem;
  border-right: 1px solid rgba($text-light, 0.12);

  &-icon {
    color: rgba($text-light, 0.4);
    flex-shrink: 0;
  }
}

@keyframes fadeInBtn {
  from {
    opacity: 0;
    transform: translateY(-50%) scale(0.8);
  }
  to {
    opacity: 1;
    transform: translateY(-50%) scale(1);
  }
}

@media (max-width: 768px) {
  .sticky-nav {
    &__link {
      padding: 0.75rem 0.4rem;
      font-size: 0.85rem;
    }
  }
}

@media (max-width: 480px) {
  .sticky-nav__link {
    padding: 0.7rem 0.3rem;
    font-size: 0.8rem;
  }
}
</style>