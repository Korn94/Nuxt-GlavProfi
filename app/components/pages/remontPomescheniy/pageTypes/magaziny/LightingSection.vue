<!-- components/LightingSection.vue -->
<template>
  <section class="article__section">
    <h2 class="article__subtitle">
      <Icon name="ph:lightbulb-duotone" size="28" class="yellow" /> Освещение: невидимый продавец
    </h2>
    <p class="article__text">
      В 80% случаев владельцы экономят на освещении, полагая, что "главное — ярко". Но яркость ≠ эффективность. Вот как свет влияет на продажи:
    </p>

    <div class="article__grid">
      <div class="card">
        <h4><Icon name="material-symbols-light:activity-zone" size="24" />Товарные зоны</h4>
        <p>500 люкс (как дневной свет) — товары выглядят естественно, снижается количество возвратов.</p>
      </div>
      <div class="card">
        <h4><Icon name="lsicon:badge-promotion-outline" size="24" />Акционные стойки</h4>
        <p>На 30% ярче основного освещения — привлекает внимание без раздражения.</p>
      </div>
      <div class="card">
        <h4><Icon name="material-symbols-light:arrow-shape-up-stack-outline" size="24" />Потолки выше 3 м</h4>
        <p>Светодиодные линейки вместо точечных — равномерное освещение без "тёмных зон".</p>
      </div>
    </div>

    <div class="article__example">
      <h3>Пример из Рязани</h3>
      <p>После правильного зонирования света в продуктовом магазине на Московском шоссе продажи акционных позиций выросли на <strong>22%</strong> без изменения ассортимента. Просто покупатели заметили товары, которые раньше "терялись" в тени.</p>
    </div>

    <div class="article__conclusion">
      <Icon name="material-symbols-light:search-insights-rounded" size="24" />
      <strong>Вывод:</strong> Ремонт — это не покраска стен. Это перепроектирование поведения покупателя.
    </div>
  </section>
</template>

<style lang="scss" scoped>
.article__text {
  margin-bottom: 1rem;
  color: $text-dark;
}

.article__subtitle {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.article__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
  margin: 1.5rem 0;
}

.card {
  padding: 1.2rem;
  background: $color-light;
  border-radius: $border-radius;
  box-shadow: 0 4px 10px rgba(0,0,0,0.05);
  border: 1px solid $border-color;

  h4 {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin: 0 0 0.7rem 0;
    font-size: 1.1rem;
  }

  p {
    margin: 0;
    color: $text-gray;
    font-size: 0.95rem;
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
}

.article__conclusion {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  background: $blue20;
  padding: 1rem;
  border-radius: $border-radius;
  margin-top: 1.5rem;
  font-style: italic;
  color: $text-dark;
}
</style>