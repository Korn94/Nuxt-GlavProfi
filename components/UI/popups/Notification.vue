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
        }, 6000); // Скрываем уведомление через 6 секунды
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
  backdrop-filter: blur(5px);
  -webkit-backdrop-filter: blur(5px); // Для Safari
  text-align: center;

  &--green {
    background-color: #00800033;
    border: 1px solid #008000;

    p {
      color: white;
    }
  }

  &--red {
    background-color: #ff000033;
    border: 1px solid #ff0000;

    p {
      color: white;
    }
  }

  &--yellow {
    background-color: #ffff0033;
    border: 1px solid #ffff00;

    p {
      color: black;
    }
  }
}
</style>
