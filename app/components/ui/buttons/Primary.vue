<!-- app\components\ui\buttons\Primary.vue -->
<template>
  <button
    class="universal-button"
    :class="buttonClasses"
    :style="customColors"
    :disabled="disabled"
    @click="handleClick"
  >
    <slot>
      <span class="button-text">{{ text }}</span>
    </slot>
  </button>
</template>

<script>
export default {
  name: 'UniversalButton',
  props: {
    text: {
      type: String,
      default: 'Кнопка'
    },
    variant: {
      type: String,
      default: 'light',
      validator: (v) => ['light', 'dark', 'outline', 'outline-dark', 'blue'].includes(v)
    },
    size: {
      type: String,
      default: 'md',
      validator: (v) => ['sm', 'md', 'lg'].includes(v)
    },
    fullWidth: { type: Boolean, default: false },
    disabled: { type: Boolean, default: false },
    loading: { type: Boolean, default: false },
    color: { type: String, default: null },
    textColor: { type: String, default: null }
  },

  computed: {
    buttonClasses() {
      return [
        `variant-${this.variant}`,
        `size-${this.size}`,
        {
          'full-width': this.fullWidth,
          'is-disabled': this.disabled,
          'is-loading': this.loading
        }
      ]
    },
    customColors() {
      const styles = {}
      if (this.color) styles['--btn-color'] = this.color
      if (this.textColor) styles['--btn-text-color'] = this.textColor
      return styles
    }
  },

  methods: {
    handleClick(event) {
      if (this.disabled || this.loading) return
      this.$emit('click', event)
    }
  }
}
</script>

<style lang="scss" scoped>
@use '@/assets/styles/variables' as *;

span {
  color: unset;
}

.universal-button {
  // ===== Переменные по умолчанию =====
  --btn-bg: #{$background-light};
  --btn-color: #{$blue};
  --btn-text: #{$text-dark};
  --btn-border: #{$border-color};
  --btn-hover-bg: #{$blue};
  --btn-hover-text: #{$text-light};
  --btn-hover-border: #{$blue};
  --btn-shadow-color: rgba(0, 195, 245, 0.4);

  // ===== Базовые стили =====
  padding: 12px 24px;
  cursor: pointer;
  border: 1px solid var(--btn-border);
  border-radius: var(--border-radius, 6px);
  background: var(--btn-bg);
  color: var(--btn-text);
  font-weight: 600;
  font-size: 1rem;
  transition: all 0.3s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  line-height: 1.2;
  font-family: 'Rubik', sans-serif;
  position: relative;
  overflow: hidden;

  .button-text {
    position: relative;
    z-index: 1;
  }

  &:focus-visible {
    outline: none;
    box-shadow: 0 0 0 3px var(--btn-shadow-color);
  }

  &:hover:not(.is-disabled):not(.is-loading) {
    background: var(--btn-hover-bg);
    color: var(--btn-hover-text);
    border-color: var(--btn-hover-border);
    transform: translateY(-3px);
    box-shadow: 0 5px 25px var(--btn-shadow-color);
  }

  &:active:not(.is-disabled):not(.is-loading) {
    transform: translateY(-1px);
  }

  // ============================================
  // ПРЕСЕТ: LIGHT (белая кнопка)
  // ============================================
  &.variant-light {
    --btn-bg: #{$background-light};
    --btn-color: #{$blue};
    --btn-text: #{$text-dark};
    --btn-border: #{$color-light};
    --btn-hover-bg: #{$blue};
    --btn-hover-text: #{$text-light};
    --btn-hover-border: #{$blue};
    --btn-shadow-color: rgba(0, 195, 245, 0.4);
  }

  // ============================================
  // ПРЕСЕТ: DARK (тёмная кнопка)
  // ============================================
  &.variant-dark {
    --btn-bg: #{$background-dark};
    --btn-color: #{$blue};
    --btn-text: #{$text-light};
    --btn-border: #{$background-dark};
    --btn-hover-bg: #{$blue};
    --btn-hover-text: #{$text-light};
    --btn-hover-border: #{$blue};
    --btn-shadow-color: rgba(0, 195, 245, 0.4);
  }

  // ============================================
  // ПРЕСЕТ: OUTLINE (прозрачная, синяя рамка и текст)
  // ============================================
  &.variant-outline {
    --btn-bg: transparent;
    --btn-color: #{$blue};
    --btn-text: #{$text-light};
    --btn-border: #{$color-light};
    --btn-hover-bg: #{$blue};
    --btn-hover-text: #{$text-light};
    --btn-hover-border: #{$blue};
    --btn-shadow-color: rgba(0, 195, 245, 0.4);
  }

  // ============================================
  // ПРЕСЕТ: OUTLINE-DARK (прозрачная, тёмная рамка и текст)
  // ============================================
  &.variant-outline-dark {
    --btn-bg: transparent;
    --btn-color: #{$color-dark};
    --btn-text: #{$text-dark};
    --btn-border: #{$color-dark};
    --btn-hover-bg: #{$blue};
    --btn-hover-text: #{$text-light};
    --btn-hover-border: #{$blue};
    --btn-shadow-color: rgba(0, 195, 245, 0.4);
  }

  // ============================================
  // ПРЕСЕТ: BLUE (изначально синяя кнопка)
  // ============================================
  &.variant-blue {
    --btn-bg: #{$blue-gradient};
    --btn-color: #{$blue};
    --btn-text: #{$text-dark};
    // --btn-border: #{$blue};
    --btn-hover-bg: #{$blue-light};
    --btn-hover-text: #{$text-dark};
    --btn-hover-border: #{$blue-light};
    --btn-shadow-color: rgba(0, 195, 245, 0.4);
  }

  // ============================================
  // РАЗМЕРЫ
  // ============================================
  &.size-sm {
    padding: 8px 16px;
    font-size: 0.875rem;
  }

  &.size-md {
    padding: 12px 24px;
    font-size: 0.9rem;
  }

  &.size-lg {
    padding: 16px 32px;
    font-size: 1.125rem;
  }

  // ============================================
  // УТИЛИТЫ
  // ============================================
  &.full-width { width: 100%; }

  &.is-disabled {
    opacity: 0.5;
    cursor: not-allowed;
    pointer-events: none;
  }

  &.is-loading {
    cursor: wait;
    pointer-events: none;

    .button-text { opacity: 0.7; }

    &::after {
      content: '';
      width: 16px;
      height: 16px;
      border: 2px solid currentColor;
      border-right-color: transparent;
      border-radius: 50%;
      animation: spin 0.6s linear infinite;
      margin-left: 8px;
    }
  }

  // Адаптив
  @media (max-width: 460px) {
    &.size-md { padding: 10px 20px; font-size: 0.9375rem; }
    &.size-lg { padding: 12px 24px; font-size: 1rem; }
  }

  @media (max-width: 390px) {
    &.size-md { padding: 10px 16px; font-size: 0.875rem; }
  }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>