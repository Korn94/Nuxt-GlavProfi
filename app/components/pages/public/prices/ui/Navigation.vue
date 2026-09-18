<template>
  <div class="navigation-wrapper">
    <div v-if="isFixed" class="placeholder"></div>
    <!-- <h3>Страницы</h3> -->
    <div class="navigation" :class="{ 'is-fixed': isFixed }" ref="navRef">
      <div class="navigation__inner">
        <button
          v-for="category in props.categories"
          :key="category.id"
          :class="{ active: props.activeCategory === category.slug }"
          @click="emit('update:active-category', category.slug)"
        >
          <Icon
            :name="getCategoryIcon(category.slug)"
            size="18"
            class="navigation__icon"
          />
          <span class="navigation__label">{{ category.name }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

const props = defineProps<{
  categories: Array<{ id: number; name: string; slug: string }>
  activeCategory: string
}>()

const emit = defineEmits<{
  (e: 'update:active-category', value: string): void
}>()

// ═══════════════════════════════════════════
// 🎨 КАРТА ИКОНОК ПО SLUG КАТЕГОРИИ
// ═══════════════════════════════════════════
const CATEGORY_ICONS: Record<string, string> = {
  // Отделочные работы
  'otdelochnye-raboty': 'mdi:format-paint',
  // Сантехнические работы
  'plumbing': 'mdi:pipe-wrench',
  // Электромонтажные работы
  'electricity': 'mdi:lightning-bolt',
  // На всякий случай — если появятся другие категории
  'remont': 'mdi:hammer-wrench',
  'demontazh': 'mdi:hammer',
  'potolki': 'mdi:ceiling-light',
  'poly': 'mdi:waves',
  'steny': 'mdi:wall',
  'krovlya': 'mdi:home-roof',
  'okna': 'mdi:window-closed-variant',
  'dveri': 'mdi:door',
  'plitka': 'mdi:grid',
  'malyarnye': 'mdi:brush',
}

const DEFAULT_ICON = 'mdi:hammer-wrench'

const getCategoryIcon = (slug: string): string =>
  CATEGORY_ICONS[slug] || DEFAULT_ICON

// ═══════════════════════════════════════════
// 📌 FIXED-ПОВЕДЕНИЕ ПРИ СКРОЛЛЕ
// ═══════════════════════════════════════════
const navRef = ref<HTMLElement | null>(null)
const isFixed = ref(false)

let initialOffsetTop = 0
let headerHeight = 0

const handleScroll = () => {
  if (!navRef.value) return
  isFixed.value = window.scrollY >= initialOffsetTop - headerHeight - 10
}

onMounted(() => {
  if (navRef.value) {
    const rect = navRef.value.getBoundingClientRect()
    initialOffsetTop = rect.top + window.scrollY

    const header = document.querySelector('header')
    headerHeight = header ? header.offsetHeight : 0

    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()
  }
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})
</script>

<style lang="scss" scoped>
@use '@/assets/styles/variables' as *;

.navigation-wrapper {
  position: relative;
}

.placeholder {
  width: 100%;
  height: 64px;
}

.navigation {
  width: 100%;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  margin-bottom: 16px;
  white-space: nowrap;
  position: relative;
  z-index: 99;
  transition: all 0.3s ease;

  &.is-fixed {
    position: fixed;
    display: flex;
    top: 60px;
    left: 0;
    right: 0;
    margin: 0;
    padding: 10px 16px;
    background: rgba(255, 255, 255, 0.85);
    backdrop-filter: saturate(180%) blur(12px);
    -webkit-backdrop-filter: saturate(180%) blur(12px);
    border-bottom: 1px solid rgba(0, 0, 0, 0.06);
    box-shadow: 0 4px 24px rgba(0, 0, 0, 0.04);

    .navigation__inner {
      justify-content: center;
      margin: 0 auto;
    }
  }

  &::-webkit-scrollbar {
    height: 4px;
  }
  &::-webkit-scrollbar-thumb {
    background: rgba(0, 195, 245, 0.3);
    border-radius: 2px;
  }
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  scrollbar-width: thin;
  scrollbar-color: rgba(0, 195, 245, 0.3) transparent;

  &__inner {
    display: inline-flex;
    gap: 6px;
    padding: 4px;
    background: #f5f7fa;
    border: 1px solid $border-color;
    border-radius: 12px;

    @media (max-width: 450px) {
      border-radius: 10px;
    }
  }

  button {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
    padding: 9px 18px;
    cursor: pointer;
    border: none;
    background: transparent;
    border-radius: 9px;
    font-weight: 600;
    font-size: 0.85rem;
    color: $text-gray;
    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    white-space: nowrap;

    &:hover:not(.active) {
      background: rgba(0, 195, 245, 0.1);
      color: $blue;

      .navigation__icon {
        color: $blue;
        transform: scale(1.1);
      }
    }

    &.active {
      background: $blue-gradient;
      color: #fff;
      box-shadow: 0 4px 12px rgba(0, 195, 245, 0.35);

      .navigation__icon {
        color: #fff;
      }
    }

    @media (max-width: 600px) {
      padding: 8px 12px;
      font-size: 0.78rem;
      gap: 6px;
    }
  }

  &__icon {
    flex-shrink: 0;
    color: $text-gray;
    transition: all 0.25s ease;
  }

  &__label {
    display: inline-block;
    line-height: 1;
  }
}

@media (max-width: 839px) {
  .navigation.is-fixed {
    top: 0 !important;
  }
}
</style>