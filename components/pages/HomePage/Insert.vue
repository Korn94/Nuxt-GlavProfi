<template>
  <div class="box">
    <p>Все обещают качественно и в срок?</p> <UIElementsBlockAnimator offset="-50%" class="text"><p><span>Мы это делаем</span></p></UIElementsBlockAnimator><UIElementsBlockAnimator offset="-65%" class="text"><p>посмотрите объекты которые реализовали</p></UIElementsBlockAnimator>
    <UIElementsArrow />
  </div>
</template>

<style lang="scss" scoped>
.box {
  background: #18191b;
  position: relative;
  padding: 2em 0 1em;
  clip-path: polygon(
    0% 0%,       /* Левый верхний угол */
    100% 0%,     /* Правый верхний угол */
    100% 70%,    /* Правый нижний угол (выше центра) */
    50% 100%,    /* Нижний центральный угол (ниже центра) */
    0% 70%       /* Левый нижний угол (выше центра) */
  );

  p {
    font-size: 1.5em;
    font-weight: 600;
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