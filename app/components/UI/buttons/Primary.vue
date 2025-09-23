<template>
  <div class="hover-box">
    <div 
      class="button button-hover" 
      :class="{ 'reverse': reverseEffect }"
      :style="{'--button-color': color, '--text-color': textColor}"
    >
      <span>{{ text }}</span>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ButtonHover',
  props: {
    text: {
      type: String,
      required: false,
      default: 'Рассчитать'
    },
    color: {
      type: String,
      required: false,
      default: '#18191b' // Цвет текста по умолчанию
    },
    textColor: {
      type: String,
      required: false,
      default: '#fff' // Цвет фона по умолчанию
    },
    reverseEffect: {
      type: Boolean,
      required: false,
      default: false // Стандартное поведение
    }
  }
};
</script>

<style lang="scss" scoped>
.hover-box {
  width: 200px;
  height: auto;
  text-align: center;
  cursor: pointer;

  @media (max-width: 460px) {
    width: 180px;
  }

  @media (max-width: 390px) {
    width: 160px;
  }
}

.button {
  padding: 1em;

  &.button-hover {
    color: var(--text-color, #18191b); // Цвет текста по умолчанию
    transition: all 0.5s;
    position: relative;

    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 1;
      background-color: var(--button-color, #fff); // Фоновый цвет по умолчанию
      transition: all 0.3s;
    }

    &::after {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 1;
      opacity: 0;
      transition: all 0.3s;
      border: 1px solid var(--button-color, #fff);
      transform: scale(1.2, 1.2);
    }

    span {
      position: relative;
      color: var(--text-color, #18191b);
      font-weight: 600;
      z-index: 2;
      transition: color 0.3s;
    }

    &:hover::before {
      opacity: 0;
      transform: scale(0.5, 0.5);
    }

    &:hover span {
      color: var(--button-color, #fff);
    }

    &:hover::after {
      opacity: 1;
      transform: scale(1, 1);
    }
  }

  // Обратный эффект
  &.reverse {
    &::before {
      opacity: 0;
      transform: scale(0.5, 0.5);
    }

    span {
      color: var(--button-color, #fff);
    }

    &::after {
      opacity: 1;
      transform: scale(1, 1);
    }

    &:hover::before {
      opacity: 1;
      transform: scale(1, 1);
    }

    &:hover span {
      color: var(--text-color, #18191b);
    }

    &:hover::after {
      opacity: 0;
      transform: scale(1.2, 1.2);
    }
  }
}
</style>
