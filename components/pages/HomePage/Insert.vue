<template>
      <div class="box">
      <p>Все обещают качественно и в срок?<br> <UIElementsBlockAnimator offset="-50%" class="text">Мы это делаем, <span>посмотрите объекты</span> которые <br>реализовали</UIElementsBlockAnimator></p>
      <!-- <h2>Слова — это одно, а дела — совсем другое.<br> Предпочитаем показывать, а не рассказывать.<br> Готовы увидеть, как мы <span>воплощаем идеи в жизнь?</span></h2> -->
      <!-- <h2>Слова — это одно, а дела — совсем другое<br> <span>Предпочитаем показывать,</span> а не <br>рассказывать</h2> -->
      <UIElementsArrow />
    </div>
</template>

<style lang="scss" scoped>
.box {
  background: #18191b;
  position: relative;
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
    padding: 2em 0 1em;
    margin: 0;
    
    .text {
      color: #fff;
    }

    @media (max-width: 768px) {
      font-size: 1.2em;
      padding: 1.5em 0 1em;

      br {
        display: none;
      }
    }
  }
}
</style>