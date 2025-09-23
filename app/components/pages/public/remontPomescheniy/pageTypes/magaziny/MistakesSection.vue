<!-- components/MistakesSection.vue -->
<template>
  <section class="article__section">
    <h2 class="article__subtitle">
      3 Ошибки, Которые Превращают Ремонт в Катастрофу
    </h2>

    <div class="error-item">
      <h3>
        <Icon name="icon-park-solid:error" size="20" class="red" />
        <span class="red">Ошибка №1</span> "Сделайте, как у конкурента"
      </h3>
      <p>
        Копирование чужого дизайна — верный путь к среднему результату. Покупатель приходит к вам, потому что вы —
        <strong>НЕ конкурент</strong>.
      </p>
      <p>Что делать: Проведите аудит:</p>
      <ul class="article__list">
        <li>
          <Icon name="ph:lightbulb-duotone" size="18" class="yellow" />
          Какие 3 товара покупают чаще всего? Расположите их по "золотому треугольнику" (вход-касса-хит продаж)
        </li>
        <li>
          <Icon name="ph:lightbulb-duotone" size="18" class="yellow" />
          Где чаще всего теряются покупатели? Просмотрите камеры за 1 день — вы удивитесь, какие зоны "мертвые"
        </li>
      </ul>
    </div>

    <div class="error-item">
      <h3>
        <Icon name="icon-park-solid:error" size="20" class="red" />
        <span class="red">Ошибка №2</span> Игнорирование "первых 10 секунд"
      </h3>
      <p>
        Человек решает остаться в магазине за 7–10 секунд после входа. Если за это время он не увидел:
      </p>
      <ul class="article__list">
        <li>
          <Icon name="mdi:check" size="16" class="green" />
          Четкая навигация (грубо говоря - "здесь вы найдете...")
        </li>
        <li>
          <Icon name="mdi:check" size="16" class="green" />
          Живой сотрудник (не сидящий в телефоне)
        </li>
        <li>
          <Icon name="mdi:check" size="16" class="green" />
          Визуальный стимул (акция, новинка, яркий дисплей)
        </li>
        <li>— он уйдет</li>
      </ul>
    </div>

    <div class="error-item">
      <h3>
        <Icon name="icon-park-solid:error" size="20" class="red" />
        <span class="red">Ошибка №3</span> Экономия на "невидимом"
      </h3>
      <p>
        Покупатель не замечает проводку, но замечает, что свет мерцает. Не видит вентиляцию, но задыхается от духоты.
      </p>
      <ul class="article__list">
        <li>
          <Icon name="mdi:check" size="16" class="green" />
          Проверьте нагрузку на электросеть (особенно если добавляете LED-подсветку)
        </li>
        <li>
          <Icon name="mdi:check" size="16" class="green" />
          Убедитесь, что система вентиляции справляется с пиковыми нагрузками (например, в праздники)
        </li>
        <li>
          <Icon name="mdi:check" size="16" class="green" />
          Протестируйте покрытие пола на шум (резина вместо ламината сократит недовольство из-за "громких каблуков")
        </li>
      </ul>
    </div>
  </section>
</template>

<style lang="scss" scoped>
.article__subtitle {
  font-size: 1.5rem;
  margin-bottom: 1.5rem;
  color: $color-dark;

  @media (max-width: 480px) {
    font-size: 1.3rem;
    margin-bottom: 1.2rem;
  }
}

.error-item {
  background: $color-light;
  margin-bottom: 1rem;
  padding: 1rem;
  border-radius: $border-radius;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
  border: 1px solid $border-color;

  h3 {
    margin: 0 0 0.7rem 0;
    font-size: 1.15rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap; /* Переносим текст при нехватке места */
    line-height: 1.3;
  }

  p {
    margin: 0.5rem 0;
    color: $color-dark;
    font-size: 0.95rem;
    line-height: 1.5;
  }
}

.article__list {
  margin: 0.8rem 0;
  padding-left: 1.2rem;

  @media (max-width: 480px) {
    padding-left: 1rem;
  }

  li {
    display: flex;
    align-items: flex-start; /* Чтобы иконка была сверху при переносе */
    gap: 0.5rem;
    margin-bottom: 0.5rem;
    font-size: 0.95rem;
    line-height: 1.5;

    :deep(svg) {
      flex-shrink: 0; /* Иконка не сжимается */
    }
  }
}

// Адаптация иконок и текста
.red {
  color: #d32f2f;
}

.yellow {
  color: #fbc02d;
}

.green {
  color: #388e3c;
}

// Уменьшаем размер иконок на мобильных
@media (max-width: 768px) {
  .error-item {
    padding: 0.9rem;
  }

  .article__list li {
    font-size: 0.9rem;
    gap: 0.4rem;
  }

  h3 {
    font-size: 1.1rem !important;
  }
}

@media (max-width: 480px) {
  .error-item {
    padding: 0.8rem;
  }

  .article__list {
    padding-left: 0.8rem;
  }

  .article__list li {
    font-size: 0.85rem;
    gap: 0.3rem;
  }

  h3 {
    font-size: 1rem;
  }

  .article__subtitle {
    text-align: left;
  }
}
</style>