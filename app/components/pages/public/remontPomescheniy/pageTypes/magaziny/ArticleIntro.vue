<!-- components/ArticleIntro.vue -->
<template>
  <header class="article__intro-wrapper">
    <h1 class="article__title">
      Ремонт Магазина: Как Превратить Строительный Хаос в Источник Прибыли
    </h1>
    <p class="article__intro">
      Вы думаете, что ремонт магазина — это трата денег? <br>
      <span class="highlight">Один владелец магазина в Рязани потратил 700 тыс. рублей — и выручка выросла на 47%.</span>
      Не потому, что он поставил золотые ручки, а потому, что перестал «гнать» покупателей прочь.
    </p>
    <br>
    <p>
      В этой статье — не теория из учебника. Только практические шаги, которые проверены на 127 магазинах.
    </p>

    <section class="article__section">
      <h2 class="article__subtitle">Что вы узнаете:</h2>
      <ul class="highlight__list">
        <li class="article__list-item">
          Почему 68% владельцев теряют деньги на ремонте (и как попасть в оставшиеся 32%)
        </li>
        <li class="article__list-item">
          Как сделать так, чтобы покупатель, зайдя в магазин, не заметил времени
          <span class="small">(среднее время пребывания до 18 минут — в 3 раза больше, чем у конкурентов)</span>
        </li>
        <li class="article__list-item">
          Что важнее для продаж: дизайн или планировка
          <span class="small">(подсказка: даже Микки-Маус в пиджаке не спасёт, если у вас неправильно расположены полки)</span>
        </li>
      </ul>
    </section>
  </header>
</template>

<style lang="scss" scoped>
.article__intro-wrapper {
  text-align: center;
  margin-bottom: 2.5rem;

  .article__title {
    line-height: 1.3;
    @media (max-width: 600px) {
      font-size: 1.8rem;
    }
  }

  .article__intro {
    font-size: 1.2rem;
    font-weight: 600;
    color: $text-gray;
    margin: 0 auto;
    max-width: 700px;
    text-align: left;

    .highlight {
      color: $red;
    }
  }
}

.article__section {
  margin-top: 2rem;
  text-align: left;
}

.article__subtitle {
  font-size: 1.6rem;
  font-weight: 600;
  margin-bottom: 1rem;
  border-bottom: 2px solid $border-color;
  padding-bottom: 0.5rem;
  color: $color-dark;

  @media (max-width: 600px) {
    font-size: 1.4rem;
  }
}

.highlight__list {
  position: relative;
  padding-left: 1.5rem;
  margin-bottom: 0.8rem;

  li {
    margin-bottom: 0.5rem;
    position: relative;
    padding-left: 1rem;

    &::before {
      content: "•";
      color: $blue;
      font-weight: bold;
      position: absolute;
      left: 0;
    }
  }
}
</style>