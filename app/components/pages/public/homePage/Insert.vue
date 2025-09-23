<template>
  <div class="box">
    <p>Все обещают качественно и в срок?</p>
    <UiAnimationsBlockAnimator offset="-50%" class="text"><p><span>Мы это делаем</span></p></UiAnimationsBlockAnimator>
    <UiAnimationsBlockAnimator offset="-65%" class="text arrow"><p>посмотрите объекты которые реализовали</p></UiAnimationsBlockAnimator>
    <UiAnimationsArrow />
  </div>
</template>

<style lang="scss" scoped>
.box {
  background: #18191b;
  position: relative;
  padding: 3em 0;
  clip-path: polygon(
    0% 0%,       /* Левый верхний угол */
    100% 0%,     /* Правый верхний угол */
    100% 70%,    /* Правый нижний угол (выше центра) */
    50% 100%,    /* Нижний центральный угол (ниже центра) */
    0% 70%       /* Левый нижний угол (выше центра) */
  );

  .arrow {
    margin-bottom: 3em;
  }

  p {
    font-size: 1.5em;
    font-weight: 600;
    line-height: 1.5em;
    text-align: center;
    color: #fff;
    margin: 0;
    
    .text {
      color: #fff;
    }

    @media (max-width: 768px) {
      font-size: 1.2em;
    }
  }
}
</style>