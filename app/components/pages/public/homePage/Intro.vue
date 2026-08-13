<template>
  <div class="intro">
    <h2 class="visually-hidden">О компании ГлавПрофи</h2>
    <div class="content">
      <div class="text">
        <h4>О нас</h4>
        <h3>Почему выбирают <span>Глав Профи?</span></h3>
        <p>
          Работаем с <b>2014</b> года и за это время завоевали доверие сотен
          клиентов. Нас рекомендуют, а многие работают с нами не первый год,
          зная, что мы предлагаем надежное качество и четкое выполнение сроков.
        </p>
        <NuxtLink to="/about">
          <UiButtonsPrimary text="Подробнее" variant="outline-dark" />
        </NuxtLink>
      </div>
      <img
        class="image"
        src="/main/about.png"
        alt="Изображение наброска здания"
      />
    </div>
    <div class="exp">
      <div class="box">
        <div class="ico"><Icon name="solar:city-broken" class="icon" /></div>
        <p>11 лет на рынке<br />в Рязани и области</p>
      </div>
      <div class="box">
        <div class="ico"><Icon name="solar:hand-shake-broken" class="icon" /></div>
        <p>5 специализированных бригад</p>
      </div>
      <div class="box">
        <div class="ico"><Icon name="solar:key-square-2-broken" class="icon" /></div>
        <p>
          Полный комплекс<br />
          услуг под ключ
        </p>
      </div>
      <div class="box">
        <div class="ico"><Icon name="solar:box-broken" class="icon" /></div>
        <p>Прямые контракты с<br />7 поставщиками — экономия 15-20%</p>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use '@/assets/styles/variables' as *;
@use '@/assets/styles/mixins' as *;

.intro {
  @include section-padding;
  background: $background-light;
  color: $text-dark;

  .content {
    @include section-container;
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 2rem;

    .text {
      max-width: 520px;
      width: 100%;
      margin-bottom: 1em;

      h4 {
        font-family: 'Rubik', sans-serif;
        font-size: 0.875rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: $blue;
        margin: 0 0 0.5rem;
      }

      h3 {
        font-family: 'Rubik', sans-serif;
        font-size: 2rem;
        font-weight: 700;
        line-height: 1.25;
        margin: 0 0 1rem;
        color: $text-dark;

        span {
          color: $blue;
        }

        @media (max-width: 768px) {
          font-size: 1.5rem;
        }
      }

      p {
        line-height: 1.6;
        margin-bottom: 1.5rem;
        color: $text-gray;
      }
    }

    img {
      width: 100%;
      max-width: 500px;
      height: auto;
      border-radius: $border-radius;
    }
  }

  .exp {
    @include section-container;
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 1rem;
    margin-top: 3rem;

    .box {
      @include light-card;
      position: relative;
      background: linear-gradient(to top, #ffffff, #f8f9fa);
      padding: 2rem 1.5rem 1.5rem;
      text-align: center;

      .ico {
        position: absolute;
        top: -20px;
        left: 50%;
        transform: translateX(-50%);
        background: $background-light;
        padding: 0.6rem;
        border-radius: 12px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);

        .icon {
          width: 24px;
          height: 24px;
          color: $background-dark;
        }
      }

      p {
        font-size: 0.95rem;
        line-height: 1.5;
        color: $text-dark;
        margin: 0;
      }
    }
  }
}

@media (max-width: 1024px) {
  .intro {
    .content {
      flex-direction: column;
    }

    .exp {
      grid-template-columns: repeat(2, 1fr);

      .box p {
        font-size: 0.85rem;
      }
    }
  }
}

@media (max-width: 768px) {
  .intro {
    .exp {
      grid-template-columns: repeat(2, 1fr);

      .box {
        margin: 1em 0;

        .ico {
          margin: 0 auto;
          background: #f8f9fa;

          .icon {
            width: 20px;
            height: 20px;
          }
        }
      }
    }
  }
}
</style>