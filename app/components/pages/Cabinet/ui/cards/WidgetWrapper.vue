<!-- app/components/Cabinet/WidgetWrapper.vue -->
<template>
  <div
    class="widget-wrapper"
    :class="{
      [size]: true,
      'is-collapsed': collapsed,
      'is-loading': loading
    }"
    role="region"
    :aria-labelledby="ariaLabelId"
    :aria-busy="loading"
  >
    <!-- Заголовок -->
    <header
      v-if="$slots.header || title"
      class="widget-header"
      @click="handleHeaderClick"
    >
      <div class="widget-header-content">
        <!-- Иконка (опционально) -->
        <slot name="icon">
          <span v-if="icon" class="widget-icon">
            <i :class="icon"></i>
          </span>
        </slot>

        <!-- Заголовок -->
        <h3 :id="ariaLabelId">
          <slot name="title">{{ title }}</slot>
        </h3>
      </div>

      <!-- Кнопки действий (опционально) -->
      <div class="widget-header-actions">
        <button
          v-if="collapsible"
          class="btn-toggle"
          type="button"
          :aria-expanded="!collapsed"
          :aria-label="collapsed ? 'Развернуть' : 'Свернуть'"
          @click.stop="toggleCollapse"
        >
          <i class="icon-chevron-down" :class="{ rotated: collapsed }"></i>
        </button>
        <button
          v-if="closable"
          class="btn-close"
          type="button"
          aria-label="Закрыть виджет"
          @click.stop="$emit('close')"
        >
          <i class="icon-close"></i>
        </button>
        <slot name="actions" />
      </div>
    </header>

    <!-- Анимация при сворачивании -->
    <Transition name="slide">
      <main v-show="!collapsed" class="widget-body" :class="{ loading: loading }">
        <div v-if="loading" class="widget-loader">
          <i class="icon-spinner spin"></i>
          <span>Загрузка...</span>
        </div>
        <div v-else class="widget-content">
          <slot />
        </div>
      </main>
    </Transition>

    <!-- Футер -->
    <footer v-if="$slots.footer && !collapsed" class="widget-footer">
      <slot name="footer" />
    </footer>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

// Пропсы
const props = defineProps({
  title: {
    type: String,
    default: ''
  },
  size: {
    type: String,
    default: 'medium',
    validator: (value) => ['small', 'medium', 'large', 'full'].includes(value)
  },
  icon: {
    type: String,
    default: ''
  },
  collapsible: {
    type: Boolean,
    default: false
  },
  closable: {
    type: Boolean,
    default: false
  },
  loading: {
    type: Boolean,
    default: false
  },
  defaultCollapsed: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['close', 'update:collapsed'])

// ID для a11y
const ariaLabelId = ref('')

onMounted(() => {
  ariaLabelId.value = `widget-title-${Math.random().toString(36).substr(2, 9)}`
})

// Локальное состояние свёрнутости
const collapsed = ref(props.defaultCollapsed)

// Обработчик клика по заголовку
function handleHeaderClick() {
  if (props.collapsible) {
    toggleCollapse()
  }
}

function toggleCollapse() {
  collapsed.value = !collapsed.value
  emit('update:collapsed', collapsed.value) // ✅ используем emit
}
</script>

<style lang="scss" scoped>
// Переменные (можно вынести в _variables.scss)
// $transition: all 0.3s ease;

// Темизация через CSS-переменные
.widget-wrapper {
  --widget-bg: #{$background-light};
  --widget-border: #{$border-color};
  --widget-header-bg: #{$background-dark};
  --widget-header-text: #{$text-light};
  --widget-text: #{$color-muted};

  background-color: var(--widget-bg);
  border: 1px solid var(--widget-border);
  border-radius: $border-radius;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  transition: $transition;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);

  &:focus-within {
    box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.3);
  }

  &.small {
    min-width: 250px;
    max-width: 300px;
  }

  &.medium {
    min-width: 300px;
    max-width: 450px;
  }

  &.large {
    min-width: 450px;
    max-width: 700px;
  }

  &.full {
    width: 100%;
    min-width: auto;
  }

  &.is-loading {
    opacity: 0.85;
  }
}

.widget-header {
  padding: 14px 16px;
  background: var(--widget-header-bg);
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  user-select: none;
  font-weight: 600;
  
  h3 {
    margin: 0;
    color: var(--widget-header-text);
  }

  &:hover {
    opacity: 0.95;
  }

  &-content {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 1rem;
  }

  &-actions {
    display: flex;
    gap: 8px;
  }
}

.widget-icon {
  font-size: 1.1rem;

  i {
    display: flex;
    align-items: center;
  }
}

.widget-body {
  padding: 16px;
  flex: 1;
  color: var(--widget-text);
  font-size: 0.95rem;
  line-height: 1.5;

  &.loading {
    min-height: 80px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
}

.widget-loader {
  display: flex;
  align-items: center;
  gap: 8px;
  color: $color-muted;
  font-size: 0.9rem;

  .spin {
    animation: spin 1s linear infinite;
  }
}

.widget-footer {
  padding: 10px 16px;
  background-color: #f9fafa;
  border-top: 1px solid $border-color;
  font-size: 0.9rem;
  color: $color-muted;
  text-align: right;
}

// Кнопки
.btn-toggle,
.btn-close {
  background: none;
  border: none;
  color: var(--widget-header-text);
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0.8;
  transition: opacity 0.2s;

  &:hover {
    opacity: 1;
  }

  i {
    font-style: normal;
    font-size: 0.9rem;
  }
}

.btn-toggle .icon-chevron-down {
  transition: transform 0.3s ease;
  &.rotated {
    transform: rotate(-180deg);
  }
}

// Анимации
.slide-enter-active,
.slide-leave-active {
  transition: all 0.3s ease;
  overflow: hidden;
}

.slide-enter-from {
  opacity: 0;
  max-height: 0;
}

.slide-leave-to {
  opacity: 0;
  max-height: 0;
}

// Анимация спиннера
@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

// Темная тема (через родительский класс)
.dark-theme .widget-wrapper {
  --widget-bg: #1e1e1e;
  --widget-border: #333;
  --widget-header-bg: #1a1a1a;
  --widget-header-text: #ddd;
  --widget-text: #aaa;

  .widget-footer {
    background-color: #2a2a2a;
    border-top-color: #444;
    color: #aaa;
  }
}
</style>