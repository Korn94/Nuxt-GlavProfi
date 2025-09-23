<template>
  <div class="shimmering-text__holder">
    <slot name="text">
      <p class="shimmering-text" :style="{ fontSize: fontSize }">{{ text }}</p>
    </slot>
  </div>
</template>

<script>
export default {
  name: "ShimmeringText",
  props: {
    text: {
      type: String,
      default: "",
    },
    fontSize: {
      type: String,
      default: "", // Укажите здесь ваш базовый размер шрифта
    },
  },
};
</script>

<style lang="scss" scoped>
.shimmering-text__holder {
  // display: inline-block;
  overflow: hidden;
  padding: 0;
  margin: 0;
  vertical-align: middle; 
}

.shimmering-text {
  text-transform: none;
  background: linear-gradient(
    45deg,
    #80dbf7 1%,
    #b3e9f8 7%,
    #1abef5 17%,
    #00c3f5 33%,
    #00c3f5 40%,
    #00c3f5 46%,
    #00c3f5 67%,
    #1abef5 83%,
    #80dbf7 93%,
    #80dbf7 100%
  );
  background-size: 200% 100%;
  background-clip: text;
  -webkit-background-clip: text;
  color: transparent;
  animation: shimmer 15s linear infinite;
}

@keyframes shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}
</style>