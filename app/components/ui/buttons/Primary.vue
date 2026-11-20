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

    <!-- Иконка справа от текста.
         По умолчанию стрелка показывается у синей CTA-кнопки (как на главной),
         отключается через icon="" -->
    <Icon
      v-if="iconName && !loading"
      :name="iconName"
      :size="iconSize"
      class="button-icon"
    />

    <!-- Блик, пробегающий по кнопке при наведении -->
    <span v-if="showShine" class="button-shine" aria-hidden="true"></span>
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
    // Иконка справа от текста. null → для variant="blue" подставляется стрелка,
    // icon="" — иконку отключить
    icon: {
      type: String,
      default: null
    },
    iconSize: {
      type: [Number, String],
      default: 18
    },
    // Блик при наведении. null → включён для variant="blue"
    shine: {
      type: Boolean,
      default: null
    },
    variant: {
      type: String,
      default: 'light',
      validator: (v) => ['light', 'dark', 'outline', 'outline-dark', 'blue'].includes(v)
    },
    size: {
      type: String,
      default: 'md',
      validator: (v) => ['sm', 'md', 'lg', ''].includes(v)
    },
    fullWidth: { type: Boolean, default: false },
    disabled: { type: Boolean, default: false },
    loading: { type: Boolean, default: false },
    color: { type: String, default: null },
    textColor: { type: String, default: null }
  },

  computed: {
    buttonClasses() {
      const classes = [`variant-${this.variant}`]

      // size="" (пустая строка) трактуем как «размер по умолчанию»
      if (this.size) classes.push(`size-${this.size}`)

      classes.push({
        'full-width': this.fullWidth,
        'is-disabled': this.disabled,
        'is-loading': this.loading
      })

      return classes
    },
    iconName() {
      // Иконка задана явно (в том числе icon="" — чтобы её отключить)
      if (this.icon !== null) return this.icon
      // По умолчанию — стрелка у синей CTA-кнопки, как на главной
      return this.variant === 'blue' ? 'mdi:arrow-right' : ''
    },
    showShine() {
      if (this.shine !== null) return this.shine
      return this.variant === 'blue'
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
  --btn-shadow: none;
  --btn-hover-shadow: 0 5px 25px var(--btn-shadow-color);
  --btn-lift: -3px;
  --btn-active-lift: -1px;

  // ===== Базовые стили (метрики как у .btn с главной) =====
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.55rem;
  padding: 0.95rem 1.65rem;
  cursor: pointer;
  border: 1px solid var(--btn-border);
  border-radius: var(--border-radius, 6px);
  background: var(--btn-bg);
  color: var(--btn-text);
  font-family: 'Rubik', sans-serif;
  font-weight: 600;
  font-size: 0.95rem;
  line-height: 1.2;
  letter-spacing: 0.01em;
  overflow: hidden;
  box-shadow: var(--btn-shadow);
  transition: transform 0.25s ease, box-shadow 0.25s ease, background 0.25s ease,
    border-color 0.25s ease, color 0.25s ease;

  .button-text {
    position: relative;
  }

  // Иконка справа от текста — сдвигается при наведении, как на главной
  .button-icon {
    position: relative;
    flex-shrink: 0;
    transition: transform 0.25s ease;
  }

  // Блик, пробегающий по кнопке при наведении
  .button-shine {
    position: absolute;
    top: 0;
    left: -60%;
    width: 40%;
    height: 100%;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(255, 255, 255, 0.5),
      transparent
    );
    transform: translateX(-100%) skewX(-20deg);
    transition: transform 0.7s ease;
    pointer-events: none;
  }

  &:focus-visible {
    outline: none;
    box-shadow: 0 0 0 3px var(--btn-shadow-color);
  }

  &:hover:not(.is-disabled):not(.is-loading) {
    background: var(--btn-hover-bg);
    color: var(--btn-hover-text);
    border-color: var(--btn-hover-border);
    transform: translateY(var(--btn-lift));
    box-shadow: var(--btn-hover-shadow);

    .button-icon {
      transform: translateX(4px);
    }

    .button-shine {
      transform: translateX(200%) skewX(-20deg);
    }
  }

  &:active:not(.is-disabled):not(.is-loading) {
    transform: translateY(var(--btn-active-lift));
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
    // Один в один кнопка .btn--primary с главной страницы
    --btn-bg: linear-gradient(120deg, #{$blue} 0%, #35d6ff 100%);
    --btn-color: #{$blue};
    --btn-text: #061017;
    --btn-border: transparent;
    --btn-hover-bg: linear-gradient(120deg, #{$blue} 0%, #35d6ff 100%);
    --btn-hover-text: #061017;
    --btn-hover-border: transparent;
    --btn-shadow-color: rgba(0, 195, 245, 0.5);
    --btn-shadow: 0 10px 30px rgba(0, 195, 245, 0.35),
      inset 0 1px 0 rgba(255, 255, 255, 0.4);
    --btn-hover-shadow: 0 16px 40px rgba(0, 195, 245, 0.5),
      inset 0 1px 0 rgba(255, 255, 255, 0.5);
    --btn-lift: -2px;
    --btn-active-lift: 0;
  }

  // ============================================
  // РАЗМЕРЫ
  // ============================================
  &.size-sm {
    padding: 0.65rem 1.1rem;
    font-size: 0.85rem;
  }

  &.size-md {
    padding: 0.95rem 1.65rem;
    font-size: 0.95rem;
  }

  &.size-lg {
    padding: 1rem 2rem;
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
    &.size-md { padding: 0.85rem 1.35rem; font-size: 0.925rem; }
    &.size-lg { padding: 0.9rem 1.5rem; font-size: 1rem; }
  }

  @media (max-width: 390px) {
    &.size-md { padding: 0.8rem 1.2rem; font-size: 0.875rem; }
  }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>