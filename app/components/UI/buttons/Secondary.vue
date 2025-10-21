<template>
  <button
    class="secondary-button"
    :class="{ 'reverse-effect': reverseEffect }"
    @click="handleClick"
  >
    <slot></slot>
  </button>
</template>

<script>
export default {
  props: {
    reverseEffect: {
      type: Boolean,
      default: false,
    },
  },
  methods: {
    handleClick() {
      this.$emit("click");
    },
  },
};
</script>

<style scoped lang="scss">
.secondary-button {
  padding: 12px 15px;
  cursor: pointer;
  border: none;
  border-radius: 5px;
  font-weight: 600;
  transition: all 0.3s ease;
  display: flex;
  justify-content: center;
  gap: 0.1rem;
  border: 1px solid $color-light;

  &:hover {
    border: 1px solid $blue;
    transform: translateY(-3px);
    background: $blue;
    box-shadow: 0 5px 25px rgba(0, 195, 245, 0.4);
    color: $text-light;
  }
}
</style>