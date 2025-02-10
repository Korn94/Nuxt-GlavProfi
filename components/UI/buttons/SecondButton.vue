<template>
  <div class="hover-box">
    <div
      class="button"
      :class="{ reverse: reverseEffect }"
      @click="handleClick"
    >
      {{ text }}
    </div>
  </div>
</template>

<script>
export default {
  props: {
    text: {
      type: String,
      default: "Click Me",
    },
    reverseEffect: {
      type: Boolean,
      default: false,
    },
  },
  methods: {
    handleClick() {
      this.$emit("click");
      console.log("Button clicked!");
    },
  },
};
</script>

<style lang="scss" scoped>
.hover-box {
  .button {
    min-width: 100px;
    padding: 10px 15px;
    border-radius: 5px;
    font-weight: 600;
    text-align: center;
    background: linear-gradient(to right, #00c3f5, #00a3d3);
    color: #fff;
    border: none;
    position: relative; // для правильного позиционирования стрелочки
    transition: 0.3s;
    cursor: pointer;

    &.reverse {
      background: #f0f0f0;
      color: #18191b;

      &:hover {
        background-color: #00c3f5;
      }

      // Убираем стрелочку для класса reverse
      &::after {
        content: none;
      }
    }

    // Стрелочка вниз (треугольник) для белой кнопки
    // &::after {
    //   content: '';
    //   position: absolute;
    //   bottom: -6px; // Расположение стрелочки под кнопкой
    //   left: 50%;
    //   transform: translateX(-50%);
    //   border-left: 6px solid transparent;
    //   border-right: 6px solid transparent;
    //   border-top: 6px solid #00c3f5; // Треугольник вниз
    // }
  }
}
</style>

