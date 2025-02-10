<template>
  <div v-if="visible" :class="['notification', colorClass]">
    <p>{{ message }}</p>
  </div>
</template>

<script>
export default {
  props: {
    visible: {
      type: Boolean,
      default: false,
    },
    message: {
      type: String,
      default: 'Скопировано',
    },
    color: {
      type: String,
      default: 'green', // Зеленый по умолчанию
      validator: (value) => ['green', 'red', 'yellow'].includes(value),
    },
  },
  computed: {
    colorClass() {
      return `notification--${this.color}`;
    },
  },
  watch: {
    visible(newVal) {
      if (newVal) {
        setTimeout(() => {
          this.$emit('update:visible', false);
        }, 2000); // Скрываем уведомление через 2 секунды
      }
    },
  },
};
</script>

<style lang="scss" scoped>
.notification {
  position: fixed;
  top: 100px;
  left: 50%;
  transform: translateX(-50%);
  padding: 10px 20px;
  border-radius: 5px;
  z-index: 1000;
  backdrop-filter: blur(10px);
  text-align: center;

  &--green {
    background-color: rgba(0, 128, 0, 0.7);

    p {
      color: white;
    }
  }

  &--red {
    background-color: rgba(255, 0, 0, 0.7);

    p {
      color: white;
    }
  }

  &--yellow {
    background-color: rgba(255, 255, 0, 0.7);

    p {
      color: black;
    }
  }
}
</style>
