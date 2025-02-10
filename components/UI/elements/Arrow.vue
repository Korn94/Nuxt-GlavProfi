<template>
  <div class="arrow-container">
    <Icon name="fe:arrow-down" class="arrow" />
  </div>
</template>

<style scoped lang="scss">
.arrow-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  padding-bottom: .5em;
}

.arrow {
  width: 24px;
  height: 24px;
  animation: bounce 1.5s infinite;
  color: #fff;
}

@keyframes bounce {
  0%, 20%, 50%, 80%, 100% {
    transform: translateY(0);
  }
  40% {
    transform: translateY(-10px);
  }
  60% {
    transform: translateY(-5px);
  }
}
</style>
