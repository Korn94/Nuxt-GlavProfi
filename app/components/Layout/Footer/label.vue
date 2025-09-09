<template>
  <div class="label">
    <p class="title"><span>Г</span>лав<span>П</span>рофи</p>
  </div>
</template>

<style lang="scss" scoped>
.label {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 2em 0;
  text-align: center;

  &::before,
  &::after {
    content: '';
    position: absolute;
    top: 50%;
    width: 50%; // Регулирует длину линий (оставляет место для текста)
    height: 1px;
    background-color: $blue;
    transform: translateY(-50%);
  }

  &::before {
    left: 20px;
  }

  &::after {
    right: 20px;
  }
}

.title {
  margin: 0;
  padding: 0 15px;
  position: relative;
  z-index: 1;
  font-family: "Comfortaa", sans-serif;
  background-color: #18191b;
  color: $text-light;
  font-size: 18px;
}
</style>