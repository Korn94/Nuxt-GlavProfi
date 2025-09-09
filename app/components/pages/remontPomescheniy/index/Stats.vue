<template>
  <section class="stats" ref="statsSection">
    <div class="container">
      <div class="stats__content">
        <h2>Почему 9 из 10 ремонтов коммерческих помещений становятся головной болью для заказчика/генподрядчика</h2>
        <p class="stats__description">
          Вы не заказываете "просто ремонт". Вы ожидаете, что:
        </p>

        <!-- Grid of expectations -->
        <div class="stats__grid">
          <PagesRemontPomescheniyIndexUiStatCard
            v-for="(item, index) in expectations"
            :key="index"
            :text="item.text"
            :icon="item.icon"
            class="fade-in-up"
          />
        </div>

        <!-- Warning block -->
        <div class="stats__warning fade-in-up">
          <h3>Но 87% заказчиков получают вместо этого:</h3>
          <ul>
            <li v-for="(issue, i) in painPoints" :key="i">
              <strong>{{ issue.title }}</strong> — {{ issue.desc }}
            </li>
          </ul>
        </div>

        <!-- Result block -->
        <div class="stats__result fade-in-up">
          <div class="result-badge">11 лет</div>
          <div class="result-text">
            <p>
              Мы ломаем эту статистику. За 11 лет отремонтировали <strong>252+ коммерческих объекта</strong> без штрафов за срыв сроков и с гарантией 3 года на все работы. Вот как:
            </p>
          </div>
        </div>

        <!-- Advantages grid -->
        <div class="stats__advantages fade-in-up">
          <div class="result__advantages-grid">
            <div
              v-for="(advantage, index) in advantages"
              :key="index"
              class="advantage-card"
            >
              <div class="advantage-card__icon">
                <Icon name="lucide:check-circle-2" size="20" />
              </div>
              <p class="advantage-card__text" v-html="advantage.text"></p>
            </div>
          </div>

          <!-- Final message -->
          <p class="result__final">
            Для вас ремонт — это не хаос, срывы и ночные звонки от подрядчиков.<br/>
            <strong>Это спокойствие, предсказуемость и запуск бизнеса в срок.</strong>
          </p>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { onMounted, ref } from 'vue';

const statsSection = ref(null);

// Простая анимация появления (можно заменить на IntersectionObserver)
onMounted(() => {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    },
    { threshold: 0.1 }
  );

  const elements = statsSection.value?.querySelectorAll('.fade-in-up');
  elements?.forEach((el) => {
    el.classList.remove('visible');
    observer.observe(el);
  });
});

const expectations = [
  {
    text: "Работы будут выполнены в строгой последовательности без срывов сроков — планирование и организация последовательности работ.",
    icon: "lucide:clock"
  },
  {
    text: "Каждый этап будет соответствовать нормативам и срокам — чтобы не было переделок, простоев и переплат.",
    icon: "lucide:check-circle"
  },
  {
    text: "Готовый объект пройдет проверки без замечаний — и не остановит ваш бизнес за 3 дня до открытия.",
    icon: "lucide:shield-check"
  }
];

const painPoints = [
  {
    title: "Подрядчик не может соблюсти ППР",
    desc: "потому что «забыл» про этапы, критичные для СНиПов, и теперь срыв сроков из-за переделок"
  },
  {
    title: "Проект красиво лежит в папке, но на стройке его невозможно реализовать",
    desc: "например, вентиляционные шахты пересекаются с несущими балками, а электрощиты «по проекту» не влезают в отведённое пространство"
  },
  {
    title: "Ответственность за чужие ошибки",
    desc: "например, штрафы за нарушения СНиПов, которые вы обнаруживаете только на финальной проверке"
  }
];

const advantages = [
  {
    text: "Проверяем проект на «реализуемость» до старта — находим коллизии с нормами и реальностью за 24 часа (не после разбора полов)"
  },
  {
    text: "Управляем процессом по четкому ППР — знаем, что делать в первую очередь, чтобы не нарушить технологическую цепочку и не терять время"
  },
  {
    text: "Берём на себя полную ответственность за соответствие СНиПам и пожарным нормам — все этапы согласуем с экспертами, а финальная проверка проходит без вашего участия"
  }
];
</script>

<style scoped lang="scss">
.stats {
  padding: 3rem 0;
  background: $background-dark;
  overflow: hidden;

  .container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 2rem;
  }

  &__content {
    background: rgba(34, 34, 34, 0.6);
    backdrop-filter: blur(12px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: $border-radius;
    padding: 3.5rem;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
    position: relative;

    @media (max-width: 768px) {
      padding: 2.5rem 1.5rem;
    }
  }

  h2 {
    font-size: 2.3rem;
    margin-bottom: 1.8rem;
    color: $text-light;
    font-weight: 700;
    line-height: 1.3;
    position: relative;
    padding-bottom: 1rem;

    &::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 0;
      width: 80px;
      height: 4px;
      background: $blue-gradient;
      border-radius: 2px;
      box-shadow: 0 0 10px $blue50;
    }
  }

  &__description {
    font-size: 1.2rem;
    margin-bottom: 2.8rem;
    color: $text-light;
    line-height: 1.7;
    opacity: 0.95;
  }

  &__grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 1.8rem;
    margin-bottom: 3.2rem;
  }

  &__warning {
    background: rgba(255, 69, 58, 0.12);
    border: 1px solid rgba(255, 69, 58, 0.2);
    border-radius: $border-radius;
    padding: 2rem;
    margin: 3rem 0;

    h3 {
      color: $red;
      margin-bottom: 1.2rem;
      font-size: 1.5rem;
      font-weight: 600;
    }

    ul {
      list-style: none;
      padding-left: 0;
      margin: 0;

      li {
        position: relative;
        padding: 0.6rem 0 0.6rem 1.8rem;
        line-height: 1.6;
        color: $text-light;
        opacity: 0.95;

        &::before {
          content: '⚠️';
          position: absolute;
          left: 0;
          top: 0.5rem;
          font-size: 1.1rem;
        }
      }
    }
  }

  &__result {
    display: flex;
    flex-direction: column;
    gap: 1.8rem;
    margin-bottom: 2.5rem;

    @media (min-width: 769px) {
      flex-direction: row;
      align-items: flex-start;
    }
  }

  &__advantages {
    opacity: 0;
    transform: translateY(20px);
    transition: opacity 0.6s ease, transform 0.6s ease;

    &.visible {
      opacity: 1;
      transform: translateY(0);
    }
  }
}

/* Badge */
.result-badge {
  background: $blue-gradient;
  color: $background-dark;
  padding: 0.9rem 1.6rem;
  border-radius: 50px;
  font-weight: 700;
  font-size: 1.3rem;
  white-space: nowrap;
  flex-shrink: 0;
  box-shadow: 0 4px 15px rgba(0, 195, 245, 0.3);
  letter-spacing: -0.5px;
}

.result-text {
  p {
    font-size: 1.15rem;
    color: $text-light;
    line-height: 1.7;
    margin: 0;
  }
}

/* Grid of advantages */
.result__advantages-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.4rem;
  margin-bottom: 1.8rem;
}

.advantage-card {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: $border-radius;
  padding: 1.5rem;
  display: flex;
  align-items: flex-start;
  gap: 0.9rem;
  transition: all 0.35s ease;
  position: relative;

  &:hover {
    transform: translateY(-6px);
    box-shadow: 0 12px 25px rgba(0, 0, 0, 0.25);
    border-color: $blue;
    background: rgba(0, 195, 245, 0.1);
  }
}

.advantage-card__icon {
  color: $blue;
  flex-shrink: 0;
  transition: color 0.3s ease;

  .advantage-card:hover & {
    color: #00e0ff;
  }
}

.advantage-card__text {
  font-size: 1.05rem;
  line-height: 1.65;
  color: $text-light;
  margin: 0;
}

/* Final message */
.result__final {
  font-size: 1.15rem;
  color: $text-light;
  line-height: 1.75;
  margin: 0;
  text-align: center;
  max-width: 700px;
  margin: 1.5rem auto 0;

  strong {
    color: $blue;
    font-weight: 700;
  }
}

/* Animation classes */
.fade-in-up {
  opacity: 0;
  transform: translateY(20px);
  transition: opacity 0.6s ease, transform 0.6s ease;
}

.fade-in-up.visible {
  opacity: 1;
  transform: translateY(0);
}

/* Responsive */
@media (max-width: 768px) {
  .stats {
    padding: 3.5rem 0;

    &__content {
      padding: 2rem 1.2rem;
    }

    h2 {
      font-size: 2rem;
    }

    &__grid,
    .result__advantages-grid {
      grid-template-columns: 1fr;
    }

    .result-badge {
      font-size: 1.1rem;
      padding: 0.8rem 1.4rem;
    }

    .result__final {
      font-size: 1.05rem;
      text-align: left;
    }
  }
}
</style>