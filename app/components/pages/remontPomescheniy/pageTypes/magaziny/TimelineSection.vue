<!-- components/TimelineSection.vue -->
<template>
  <section class="article__section">
    <h2 class="article__subtitle">
      Пошаговый гайд: Как заказать ремонт, чтобы не переплатить и не разочароваться
    </h2>
    <div class="timeline">
      <!-- Шаг 1 -->
      <div class="timeline-item">
        <div class="timeline-number">1</div>
        <div class="timeline-content">
          <h4><span>Шаг 1.</span> Соберите "боль" вашей аудитории</h4>
          <p>Не спрашивайте: "Что улучшить?". Спрашивайте:</p>
          <ul class="article__list">
            <li>"Какие 3 вещи мешают вам быстро найти товар?"</li>
            <li>"Где вы чаще всего теряете время в нашем магазине?"</li>
          </ul>
        </div>
      </div>

      <!-- Шаг 2 -->
      <div class="timeline-item">
        <div class="timeline-number">2</div>
        <div class="timeline-content">
          <h4><span>Шаг 2.</span> Разбейте ремонт на этапы с измеримыми целями</h4>
          <div class="table-wrapper">
            <table class="article__table">
              <thead>
                <tr>
                  <th>Этап</th>
                  <th>Что сделать</th>
                  <th>КПЭ (Ключевой показатель)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td class="title">Проектирование</td>
                  <td>Нанять дизайнера, который работал с магазинами <span class="small">(не с офисами!)</span></td>
                  <td>Сокращение "мертвых зон" на 30%</td>
                </tr>
                <tr>
                  <td class="title">Черновые работы</td>
                  <td>Проверить электрику, вентиляцию, полы</td>
                  <td>Отсутствие переделок на этапе чистовой отделки</td>
                </tr>
                <tr>
                  <td class="title">Чистовая отделка</td>
                  <td>Сделать акценты на зонах продаж <span class="small">(цвет, освещение)</span></td>
                  <td>Рост времени пребывания на 25%</td>
                </tr>
                <tr>
                  <td class="title">Тестовый запуск</td>
                  <td>Замерить поток покупателей до/после</td>
                  <td>Увеличение конверсии минимум на 15%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
// Статический компонент — данные не требуются
</script>

<style lang="scss" scoped>
.article__subtitle {
  font-size: 1.5rem;
  margin-bottom: 1.8rem;
  color: $color-dark;

  @media (max-width: 480px) {
    font-size: 1.3rem;
    margin-bottom: 1.4rem;
    text-align: left;
  }
}

.timeline {
  position: relative;
  margin-left: 1.5rem;

  &::before {
    content: '';
    position: absolute;
    left: -1.2rem;
    top: 0;
    bottom: 0;
    width: 2px;
    background: $blue;
    z-index: 0;
  }

  @media (max-width: 768px) {
    margin-left: 1rem;

    &::before {
      left: -0.9rem;
    }
  }

  @media (max-width: 480px) {
    margin-left: 0.5rem;

    &::before {
      left: -0.7rem;
    }
  }
}

.timeline-item {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
  position: relative;

  @media (max-width: 480px) {
    gap: 0.8rem;
    margin-bottom: 1.2rem;
  }
}

.timeline-number {
  width: 32px;
  height: 32px;
  background: $blue;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  flex-shrink: 0;
  z-index: 1;
  font-size: 0.9rem;

  @media (max-width: 480px) {
    width: 28px;
    height: 28px;
    font-size: 0.85rem;
  }
}

.timeline-content {
  flex: 1;
  min-width: 0; // Для корректного переноса текста

  h4 {
    margin: 0 0 0.5rem 0;
    font-size: 1.1rem;
    line-height: 1.3;

    span {
      color: $blue;
    }

    @media (max-width: 480px) {
      font-size: 1rem;
    }
  }

  p {
    margin: 0.5rem 0;
    color: $color-dark;
    font-size: 0.95rem;
    line-height: 1.5;
  }
}

// Список с маркерами
.article__list {
  margin-bottom: 0.6rem;
  padding-left: 1.2rem;
  font-size: 0.95rem;

  @media (max-width: 480px) {
    padding-left: 1rem;
    font-size: 0.9rem;
  }

  li {
    margin-bottom: 0.5rem;
    position: relative;
    line-height: 1.5;

    &::before {
      content: "•";
      color: $blue;
      font-weight: bold;
      position: absolute;
      left: -0.8rem;
    }
  }
}

// Обёртка для таблицы — позволяет скроллить на узких экранах
.table-wrapper {
  overflow-x: auto;
  margin: 0.8rem 0;
  border-radius: $border-radius;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);

  @media (max-width: 480px) {
    overflow-x: auto;
    margin: 0.6rem 0;
  }
}

.article__table {
  width: 100%;
  border-collapse: collapse;
  min-width: 500px; // Предотвращает слишком сильное сжатие
  font-size: 0.9rem;

  @media (max-width: 480px) {
    font-size: 0.85rem;
  }

  th,
  td {
    padding: 6px 10px;
    text-align: left;
    border: 1px solid $border-color;
    word-wrap: break-word;
    white-space: normal;
  }

  th {
    background-color: $border-color;
    font-weight: bold;
    text-align: center;
    vertical-align: middle;
    padding: 10px 8px;

    &:last-child {
      border-right: none;
    }
  }

  .title {
    font-weight: 600;
    background-color: $color-light;
    min-width: 160px;

    @media (max-width: 480px) {
      min-width: 140px;
    }
  }

  tr:hover {
    background-color: rgba($blue, 0.05);
  }
}
</style>