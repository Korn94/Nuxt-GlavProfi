<template>
  <div class="box">
    <h2 class="visually-hidden">Наши работы</h2>
    <p>Все обещают качественно и в срок?</p>
    <UiAnimationsBlockAnimator offset="-50%" class="text"><p><span>Мы это делаем</span></p></UiAnimationsBlockAnimator>
    <UiAnimationsBlockAnimator offset="-65%" class="text arrow"><p>посмотрите объекты которые реализовали</p></UiAnimationsBlockAnimator>
    <UiAnimationsArrow />
  </div>
</template>

<style lang="scss" scoped>
@use '@/assets/styles/variables' as *;
@use '@/assets/styles/mixins' as *;

.box {
  @include section-padding;
  background: $background-dark;
  color: $text-light;
  position: relative;
  clip-path: polygon(
    0% 0%,
    100% 0%,
    100% 70%,
    50% 100%,
    0% 70%
  );

  .arrow {
    margin-bottom: 3em;
  }

  p {
    font-family: 'Rubik', sans-serif;
    font-size: 1.5em;
    font-weight: 600;
    line-height: 1.5em;
    text-align: center;
    margin: 0;

    span {
      color: $blue;
    }

    @media (max-width: 768px) {
      font-size: 1.2em;
    }
  }
}
</style>