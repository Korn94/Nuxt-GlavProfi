<template>
  <div class="container">
    <div class="content">
      <p class="title">За <span>11 лет</span> выполнено<br> более <span>250+</span> проектов по<br> ремонту <span>коммерческих</span> объектов</p>
      <p class="brands">Среди них — помещения известных и премиальных брендов.</p>
    </div>
    <hr class="line" style="max-width: 1200px; margin-top: 2em;">
    <div class="imgbox">
      <img src="/brands/logo-sber.png" alt="ремонт сбербанка">
      <img src="/brands/ddx.png" alt="ремонт сбербанка">
      <img src="/brands/gos.png" alt="ремонт сбербанка">
      <img src="/brands/marmacs.png" alt="ремонт сбербанка">
      <img src="/brands/gasprombank.png" alt="ремонт сбербанка">
      <img src="/brands/nearmedic.png" alt="ремонт сбербанка">
    </div>
  </div>
</template>

<style lang="scss" scoped>
.container {
  background: #18191b;
  padding: 6em 1em;
  

  .imgbox {
    display: flex;
    justify-content: center;
    align-items: center;
    margin-top: 2em;
    gap: 2em;
    flex-wrap: wrap;

    img {
      height: 50px;
      width: auto;
    }
  }

  .content {
    margin: auto;
    display: flex;
    max-width: 1200px;
    align-items: end;
    text-align: left;

    p {
      color: #fff;
      margin: 0.5rem 0;
    }

    .title {
      font-size: 2.5rem;
      font-weight: 700;
      line-height: 1.2;
      flex: 2;
    }

    .brands {
      flex: 1;
    }
  }
}

// Адаптация для планшетов
@media (max-width: 1024px) {
  .container {
    .content {
      flex-direction: column;
      text-align: center;
      align-items: center;

      .title {
        font-size: 2rem;
      }

      .brands {
        font-size: 1rem;
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
    .content {
      .title {
        font-size: 1.5rem;
      }

      .brands {
        font-size: 0.9rem;
      }
    }

    .imgbox {
      gap: 1em;

      img {
        height: 30px;
      }
    }
  }
}

@media (max-width: 460px) {
  .container .content {
      .title {
        font-size: 1.3rem;
      }

      .brands {
        font-size: .9rem;
      }
    }

  .container .imgbox img {
    height: 20px;
  }
}
</style>