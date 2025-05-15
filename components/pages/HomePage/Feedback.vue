<template>
  <div class="container">
    <div class="feedback">
      <iframe class="feedback-iframe" src="https://yandex.ru/maps-reviews-widget/187227784297?comments"></iframe>
      <a class="feedback-link" href="https://yandex.ru/maps/org/glavprofi/187227784297/" target="_blank">ГлавПрофи на карте Рязани — Яндекс Карты</a>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.container {
  width: 100%;
  height: auto;
  margin: 4em auto;

  .feedback {
    height: 800px;
    width: 100%;
    overflow: hidden;
    position: relative;
    display: flex;
    justify-content: center;

    .feedback-iframe {
      width: 100%;
      max-width: 600px;
      height: 100%;
      border: 1px solid #e6e6e6;
      border-radius: 8px;
      margin: 0 10px;
      box-sizing: border-box;
    }

    .feedback-link {
      box-sizing: border-box;
      text-decoration: none;
      color: #b3b3b3;
      font-size: 10px;
      font-family: 'YS Text', sans-serif;
      padding: 0 20px;
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
</style>