<template>
  <div class="intro">
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
          <UiButtonsPrimary text="Подробнее" />
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
        <div class="ico"><Icon name="fluent:city-24-regular" class="icon" /></div>
        <p>11 лет на рынке<br />в Рязани и области</p>
      </div>
      <div class="box">
        <div class="ico"><Icon name="fluent:people-team-16-regular" class="icon" /></div>
        <p>5 специализированных бригад</p>
      </div>
      <div class="box">
        <div class="ico"><Icon name="meteor-icons:key" class="icon" /></div>
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
.intro {
  margin: 6em auto;
  max-width: 1200px;
  padding: 0 1em;

  .content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;

    .text {
      max-width: 500px;
      width: 100%;
      margin-bottom: 1em;

      p {
        line-height: 1.5;
        margin-bottom: 1em;
      }
    }

    img {
      width: 100%;
      max-width: 500px;
      height: auto;
    }
  }

  .exp {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    margin-top: 2em;

    .box {
      position: relative;
      flex-basis: calc(25% - 1em);
      background: linear-gradient(to top, #ffffff, #f0f0f0);
      border-radius: 12px;
      padding: 20px 24px;
      text-align: center;
      margin-bottom: 1em;

      .ico {
        position: absolute;
        top: -25px;
        left: 50%;
        transform: translateX(-50%);
        background: #f0f0f0;
        padding: .5em;
        border-radius: 12px;

        .icon {
          width: 24px;
          height: 24px;
          color: #18191b;
        }
      }

      p {
        font-size: 1rem;
      }
    }
  }
}

// Адаптация для планшетов
@media (max-width: 1024px) {
  .intro {
    .content {
      flex-direction: column;
    }

    .exp {
      .box {
        p {
          font-size: .8rem;
        }
      }
    }
  }
}

// Адаптация для мобильных устройств
@media (max-width: 768px) {
  .intro {
    .content {
      .text {
        h3 {
          font-size: 1.5rem;
        }
      }
    }

    .exp {
      .box {
        margin: 2em 0;
        flex-basis: calc(50% - 1em);

        .ico {
          margin: 0 auto;
          background: #f8f8f8;
          // padding: 0;
          // border-radius: 12px;

          .icon {
            width: 20px;
            height: 20px;
            color: #18191b;
          }
        }
      }
    }
  }
}
</style>