<template>
  <div class="container" :class="[theme]">
    <div class="line-left"></div>
    <!-- <div class="point"></div> -->
    <div class="line-right"></div>
  </div>
</template>

<script>
export default {
  props: {
    theme: {
      type: String,
      default: "light", // Тема по умолчанию (light или dark)
      validator: (value) => ["light", "dark"].includes(value), // Ограничение допустимых значений
    },
  },
};
</script>

<style lang="scss" scoped>
.container {
  display: flex;
  align-items: center;
  // gap: 1em;
  margin-top: 2em;

  .line-left,
  .line-right {
    width: 100%;
    border-top: 1px solid;
  }

  .point::after {
    position: relative;
    content: "\16EB";
    font-size: 22px;
    margin-top: 0px;
    float: right;
  }

  // Тема light (по умолчанию)
  &.light {
    .line-left {
      border-image: linear-gradient(to right, #fff, #18191b, #18191b);
      border-image-slice: 1;
    }

    .line-right {
      border-image: linear-gradient(to right, #18191b, #18191b, #fff);
      border-image-slice: 1;
    }

    .point::after {
      color: #00c3f5;
    }
  }

  // Тема dark
  &.dark {
    .line-left {
      border-image: linear-gradient(to right, #18191b, #fff, #fff);
      border-image-slice: 1;
    }

    .line-right {
      border-image: linear-gradient(to right, #fff, #fff, #18191b);
      border-image-slice: 1;
    }

    .point::after {
      color: #00c3f5;
    }
  }
}
</style>
