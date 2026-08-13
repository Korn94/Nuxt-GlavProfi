<template>
  <div class="container">
    <h2 class="visually-hidden">Отзывы о компании ГлавПрофи</h2>
    <div class="feedback">
      <iframe class="feedback-iframe" src="https://yandex.ru/maps-reviews-widget/187227784297?comments"></iframe>
      <a class="feedback-link" href="https://yandex.ru/maps/org/glavprofi/187227784297/" target="_blank">ГлавПрофи на карте Рязани — Яндекс Карты</a>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use '@/assets/styles/variables' as *;
@use '@/assets/styles/mixins' as *;

.container {
  @include section-padding;
  background: $background-light;

  .feedback {
    @include section-container;
    height: 800px;
    overflow: hidden;
    position: relative;
    display: flex;
    justify-content: center;

    .feedback-iframe {
      width: 100%;
      max-width: 600px;
      height: 100%;
      border: 1px solid $border-color;
      border-radius: $border-radius;
      margin: 0 10px;
      box-sizing: border-box;
    }

    .feedback-link {
      box-sizing: border-box;
      text-decoration: none;
      color: $text-gray;
      font-size: 10px;
      font-family: 'YS Text', sans-serif;
      position: absolute;
      bottom: 8px;
      width: 100%;
      text-align: center;
      left: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      display: block;
      max-height: 14px;
      white-space: nowrap;
      padding: 0 16px;
    }
  }
}

@media (max-width: 768px) {
  .container {
    .feedback {
      height: 600px;

      .feedback-iframe {
        max-width: 100%;
      }
    }
  }
}
</style>