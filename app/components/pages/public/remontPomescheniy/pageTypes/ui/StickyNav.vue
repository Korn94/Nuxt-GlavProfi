<!-- app/components/pages/public/remontPomescheniy/pageTypes/ui/StickyNav.vue -->
<template>
  <div
    ref="wrapperRef"
    class="sticky-nav-wrapper"
    :style="wrapperStyle"
  >
    <!-- Sentinel: невидимый маркер для определения момента "прилипания" -->
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
        <ul ref="listRef" class="sticky-nav__list">
          <li
            v-for="item in items"
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
              @click.prevent="scrollTo(item.id)"
            >
              <Icon
                v-if="item.icon"
                :name="item.icon"
                size="16"
                class="sticky-nav__icon"
              />
              <span>{{ item.label }}</span>
            </a>
          </li>
        </ul>
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
  }>(),
  {
    scrollOffset: 120,
  }
)

const wrapperRef = ref<HTMLElement | null>(null)
const navRef = ref<HTMLElement | null>(null)
const listRef = ref<HTMLUListElement | null>(null)
const itemRefs = new Map<string, HTMLElement>()

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

// === 1. Фиксация высоты wrapper ===
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

// === 2. Авто-центрирование активного пункта ===
const centerActiveItem = async () => {
  const currentActiveId = activeId.value
  if (!currentActiveId) return

  await nextTick()

  // Проверяем, не изменился ли activeId, пока мы ждали nextTick
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

onMounted(() => {
  measureNavHeight()
  window.addEventListener('resize', measureNavHeight)

  nextTick(() => {
    setTimeout(centerActiveItem, 400)
  })
})

// === Очистка ===
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

// Sentinel: 1px высота, не мешает лэйауту
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
  // border-bottom: 1px solid $border-color;
  transition: box-shadow 0.3s ease, background 0.3s ease;
  z-index: 90;

  // === "Прилипшее" состояние ===
  &--stuck {
    position: fixed;
    top: 60px;
    left: 0;
    background: $background-dark;
    border-bottom: 1px solid $text-dark;
    backdrop-filter: blur(12px);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
    border-bottom-color: rgba($blue, 0.2);

    @media (max-width: 768px) {
      top: 0;
    }

    // Компенсируем "прыжок" контента при fixed
    // & + * {
      // Не нужен padding-top здесь, т.к. wrapper сохраняет место
    // }
  }

  // Когда меню fixed — wrapper сохраняет его высоту, чтобы контент не прыгал
  &--stuck::after {
    content: '';
    display: block;
  }

  &__container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 2rem;

    @media (max-width: 768px) {
      padding: 0 1rem;
    }
  }

  // === Список: горизонтальный скролл на мобильном ===
  &__list {
    display: flex;
    gap: 0.25rem;
    margin: 0;
    padding: 0;
    list-style: none;
    overflow-x: auto;
    scrollbar-width: none;
    -webkit-overflow-scrolling: touch;
    scroll-behavior: smooth;
    justify-content: center;

    &::-webkit-scrollbar {
      display: none;
    }

    // Маски-градиенты по краям (подсказка, что можно скроллить)
    mask-image: linear-gradient(
      to right,
      transparent 0,
      black 8px,
      black calc(100% - 8px),
      transparent 100%
    );
  }

  &__item {
    flex-shrink: 0;
  }

  // === Ссылка-кнопка ===
  &__link {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.9rem 1.1rem;
    color: $text-light;
    font-family: 'Rubik', sans-serif;
    font-size: 0.92rem;
    font-weight: 500;
    text-decoration: none;
    white-space: nowrap;
    border-bottom: 2px solid transparent;
    transition: color 0.25s ease, border-color 0.25s ease, background 0.25s ease;
    position: relative;

    &:hover {
      // color: $text-dark;
      background: rgba(0, 195, 245, 0.1);
    }

    // === Активный пункт ===
    &--active {
      color: $blue;
      border-bottom-color: $blue;
      font-weight: 600;

      .sticky-nav__icon {
        color: $blue;
      }

      &:hover {
        color: $blue;
        background: rgba(0, 195, 245, 0.06);
      }
    }
  }

  &__icon {
    color: $text-gray;
    flex-shrink: 0;
    transition: color 0.25s ease;
  }
}

// === Компенсация "прыжка" контента при fixed ===
// Wrapper всегда занимает место меню
// .sticky-nav-wrapper {
  // Высота = фактическая высота меню (подстраивается автоматически)
// }

// Адаптив
@media (max-width: 768px) {
  .sticky-nav {
    &__link {
      padding: 0.75rem 0.9rem;
      font-size: 0.85rem;
    }

    &__icon {
      display: none; // Иконки на мобильном скрываем, чтобы влезло больше пунктов
    }
  }
}

@media (max-width: 480px) {
  .sticky-nav__link {
    padding: 0.7rem 0.75rem;
    font-size: 0.8rem;
  }
}
</style>