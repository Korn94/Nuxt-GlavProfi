<!-- app\components\pages\public\homePage\Brands.vue -->
<template>
  <div class="container">
    <h2 class="visually-hidden">Наши проекты и бренды</h2>
    <div class="content">
      <p class="title">За <span>11 лет</span> выполнено<br> более <span>250+</span> проектов по<br> ремонту <span>коммерческих</span> объектов</p>
      <p class="brands">Среди них — помещения известных и премиальных брендов.</p>
    </div>
    <!-- УБРАЛИ inline-стили, всё теперь в классе .line -->
    <hr class="line">
    <div class="imgbox">
      <img src="/brands/logo-sber.png" alt="ремонт сбербанка">
      <img src="/brands/ddx.png" alt="ремонт фитнес центра DDX">
      <img src="/brands/gos.png" alt="ремонт гос. учреждений">
      <img src="/brands/marmacs.png" alt="ремонт мармакс">
      <img src="/brands/gasprombank.png" alt="ремонт газпромбанк">
      <img src="/brands/nearmedic.png" alt="ремонт клиники Неармедик">
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use '@/assets/styles/variables' as *;
@use '@/assets/styles/mixins' as *;

.container {
  @include section-padding;
  background: $background-dark;
  color: $text-light;

  .content {
    @include section-container;
    display: flex;
    align-items: flex-end;

    .title {
      flex: 2;
      font-family: 'Rubik', sans-serif;
      font-size: 2.5rem;
      font-weight: 700;
      line-height: 1.2;
      margin: 0;
      color: $text-light;

      span {
        color: $blue;
      }
    }

    .brands {
      flex: 1;
      margin: 0;
      font-size: 1.1rem;
      color: $text-light;
    }
  }

  .line {
    max-width: 1200px;
    margin: 2rem auto;
  }

  .imgbox {
    max-width: 1200px;
    margin: 1rem auto 0;
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 2em;
    flex-wrap: wrap;

    img {
      height: 50px;
      width: auto;
    }
  }
}

// Адаптация для планшетов
@media (max-width: 1024px) {
  .container {
    .content {
      flex-direction: column;
      align-items: start;

      .title {
        margin: 0 0 1rem;
      }

      .brands {
        // font-size удален, теперь он остается 1.1rem на всех экранах
      }
    }

    .imgbox {
      gap: 1.5em;

      img {
        height: 40px;
      }
    }
  }
}

// Адаптация для мобильных устройств
@media (max-width: 768px) {
  .container {
    // Скрываем принудительные переносы строк на мобильных
    br {
      display: none;
    }

    .imgbox {
      gap: 2em;
      padding: 0 1.2rem;

      img {
        height: 30px;
      }
    }
  }
}
</style>