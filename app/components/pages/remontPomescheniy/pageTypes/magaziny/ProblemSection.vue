<!-- components/ProblemSection.vue -->
<template>
  <section class="article__section">
    <h2 class="article__subtitle">
      Почему Ваш Текущий Магазин «Съедает» 40% Прибыли
    </h2>
    <p class="article__text">
      Забудьте про «красивый ремонт». Покупатели не платят за красоту — они платят за удобство.
    </p>
    
    <div class="article__warning">
      <Icon name="ri:error-warning-line" size="24" class="red" />
      <strong>7 из 10 посетителей уходят за 2 минуты, если:</strong>
    </div>
    
    <ul class="article__list article__list--check">
      <li><Icon name="mdi:check" size="18" class="green" /> Не видят зону примерочных/кассу сразу при входе</li>
      <li><Icon name="mdi:check" size="18" class="green" /> Путаются в проходах (слишком узкие или запутанные)</li>
      <li><Icon name="mdi:check" size="18" class="green" /> Отсутствует четкая навигация</li>
    </ul>

    <p class="article__text">
      По замерам (через вебвизор и опросы в 15 городах)
    </p>

    <div class="article__example">
      <h3>Пример из жизни: магазин косметики в Рязани</h3>
      <p>Конверсия выросла с <strong>1,8%</strong> до <strong>5,3%</strong>. Как?</p>
      <ul class="article__list">
        <li>Убрали «водопад» полок у входа — теперь покупатель видит всю зону продаж</li>
        <li>Сделали цветовые акценты на стеллажах с хитами продаж (красный для ухода за кожей, синий — для декора)</li>
        <li>Добавили зону «5 минут до метро» — компактные наборы для тех, кто спешит</li>
      </ul>
    </div>
  </section>
</template>

<style lang="scss" scoped>
.article__text {
  margin-bottom: 1rem;
  color: $text-dark;
}

.article__warning {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: $red;
  margin: 1rem 0;
  font-weight: 500;
}

.article__list {
  margin: 0.8rem 0;
  padding-left: 1.5rem;

  li {
    margin-bottom: 0.5rem;
  }
}

.article__list--check {
  li {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
}

.article__example {
  background: $color-light;
  padding: 1.2rem;
  border-radius: 3px;
  margin-top: 1.5rem;
  border-left: 3px solid $blue;

  h3 {
    margin: 0 0 0.5rem 0;
    font-size: 1.2rem;
    color: $text-dark;
  }

  p {
    margin: 0.5rem 0;
  }
}
</style>