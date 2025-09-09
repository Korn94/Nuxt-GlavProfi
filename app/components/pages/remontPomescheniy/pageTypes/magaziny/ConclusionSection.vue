<!-- components/ConclusionSection.vue -->
<template>
  <section class="article__conclusion-final">
    <div class="icon-wrapper">
      <Icon name="heroicons:currency-dollar" size="32" class="icon" />
    </div>
    <h2>Итог: ремонт как инвестиция, а не расход</h2>
    <p>
      Ремонт магазина — это не затрата, а инструмент роста выручки.
      Даже небольшие правки в планировке и освещении могут увеличить
      средний чек на <strong>15–20%</strong>.
    </p>
    <p class="highlight">
      Задайте себе вопрос: <em>«Если я — покупатель, останусь ли я в этом магазине на 5 минут дольше?»</em>
      <br>
      <span>Если нет — пересмотрите проект.</span>
    </p>
  </section>
</template>

<style lang="scss" scoped>
.article__conclusion-final {
  text-align: center;
  color: $text-light;
  padding: 2rem;
  position: relative;
  border-top: 1px solid $blue;

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 50%;
    width: 80px;
    height: 4px;
    border-radius: 2px;
    background: $blue;
    transform: translateX(-50%);
  }

  h2 {
    font-size: 1.6rem;
    font-weight: 700;
    margin-bottom: 1.2rem;
    color: $color-success;
  }

  p {
    max-width: 650px;
    margin: 0.8rem auto;
    font-size: 1.05rem;
    line-height: 1.6;
  }

  .highlight {
    margin-top: 1.5rem;
    font-style: italic;

    span {
      display: block;
      margin-top: 0.5rem;
      font-weight: 600;
      color: $blue;
    }
  }

  .icon-wrapper {
    background: $blue20;
    border-radius: 50%;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 1rem;
    margin-bottom: 1rem;
  }

  .icon {
    color: $blue;
  }
}
</style>
