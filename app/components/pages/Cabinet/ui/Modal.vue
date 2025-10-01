<template>
  <div v-if="visible" class="modal-overlay" @click.self="handleOverlayClick">
    <div class="modal" :class="{ 'modal-small': size === 'sm', 'modal-large': size === 'lg' }">
      <!-- Заголовок -->
      <div v-if="title || closable" class="modal-header">
        <h3 v-if="title" class="modal-title">{{ title }}</h3>
        <button v-if="closable" class="modal-close" @click="close">&times;</button>
      </div>

      <!-- Контент -->
      <div class="modal-body">
        <slot></slot>
      </div>

      <!-- Футер с кнопками -->
      <div v-if="$slots.footer !== undefined" class="modal-footer">
        <slot name="footer"></slot>
      </div>
    </div>
  </div>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue';

const emit = defineEmits(['update:visible', 'close']);

const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
  title: {
    type: String,
    default: '',
  },
  closable: {
    type: Boolean,
    default: true,
  },
  size: {
    type: String,
    validator: (value) => ['sm', 'md', 'lg'].includes(value),
    default: 'md',
  },
  closeOnClickOutside: {
    type: Boolean,
    default: true,
  },
});

// Закрытие модалки
const close = () => {
  emit('update:visible', false);
  emit('close');
};

// Обработка клика по оверлею
const handleOverlayClick = () => {
  if (props.closeOnClickOutside) {
    close();
  }
};
</script>

<style lang="scss" scoped>
// Модальное окно
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.modal {
  background: $background-light;
  border-radius: $border-radius;
  box-shadow: $box-shadow;
  width: 90%;
  max-width: 500px;
  overflow: hidden;
  animation: modalFadeIn 0.3s ease-out;

  &-small {
    max-width: 350px;
  }

  &-large {
    max-width: 800px;
  }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid $border-color;
  background: $blue20;
  color: $text-dark;

  .modal-title {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 600;
  }
}

.modal-close {
  background: none;
  border: none;
  font-size: 1.8rem;
  color: $text-gray;
  cursor: pointer;
  line-height: 1;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: $transition;

  &:hover {
    background: $blue20;
    color: $blue;
  }
}

.modal-body {
  padding: 20px;
  color: $text-dark;
  max-height: 70vh;
  overflow-y: auto;
}

.modal-footer {
  padding: 16px 20px;
  border-top: 1px solid $border-color;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  background: $sub-item-bg;
}

// Анимация появления
@keyframes modalFadeIn {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

// Адаптивность
@media (max-width: 576px) {
  .modal {
    width: 95%;
    margin: 10px;
  }
}
</style>