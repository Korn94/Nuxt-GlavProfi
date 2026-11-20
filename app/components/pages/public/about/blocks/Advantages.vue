<!-- app/components/pages/public/about/blocks/Advantages.vue -->
<template>
  <section id="about-advantages" class="about-advantages">
    <div class="container">
      <header class="about-section__header">
        <span class="about-section__badge">
          <Icon name="mdi:star-four-points-outline" size="14" />
          <span>Почему мы</span>
        </span>

        <h2 class="about-section__title">
          Наши <span class="accent">преимущества</span>
        </h2>

        <p class="about-section__subtitle">
          Почему работать с нами — это удобно?
        </p>
      </header>

      <div class="advantages-layout">
        <div class="advantages-grid">
          <article
            v-for="item in features"
            :key="item.title"
            class="advantage-card"
          >
            <span class="advantage-card__icon">
              <Icon :name="item.icon" size="24" />
            </span>
            <h3 class="advantage-card__title">{{ item.title }}</h3>
            <p class="advantage-card__desc">{{ item.description }}</p>
          </article>
        </div>

        <aside class="conditions">
          <div class="conditions__head">
            <span class="conditions__icon">
              <Icon name="mdi:star-four-points" size="22" />
            </span>
            <h3 class="conditions__title">Особые условия для клиентов</h3>
          </div>

          <ul class="conditions__list">
            <li
              v-for="condition in conditions"
              :key="condition.text"
              class="conditions__item"
            >
              <span class="conditions__check">
                <Icon name="mdi:check" size="14" />
              </span>
              <span>{{ condition.text }}</span>
            </li>
          </ul>
        </aside>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
interface AdvantageCard {
  title: string
  description: string
  icon: string
}

interface ConditionItem {
  text: string
}

const features: AdvantageCard[] = [
  {
    title: 'Оптовые цены на материалы',
    description: 'Контракт с проверенными поставщиками материалов. Мы закупаем материалы для вас по оптовым ценам.',
    icon: 'mdi:package-variant-closed',
  },
  {
    title: 'Помогаем с выбором',
    description: 'Объясняем плюсы и минусы материалов и решений, чтобы вы принимали взвешенное решение.',
    icon: 'mdi:lightbulb-on-outline',
  },
  {
    title: 'Берем организацию на себя',
    description: 'Все организационные моменты берем на себя — от закупок до сдачи объекта.',
    icon: 'mdi:clipboard-check-outline',
  },
  {
    title: 'Работа под ключ',
    description: 'Возможность работы под ключ: вы получаете готовый объект, а не набор подрядчиков.',
    icon: 'mdi:key-variant',
  },
]

const conditions: ConditionItem[] = [
  { text: 'Бесплатный выезд и расчет на вашем объекте' },
  { text: 'Консультации по всем вопросам' },
  { text: 'Заключаем официальные договоры — никаких рисков для вас' },
  {
    text: 'Несколько больших бригад, каждая из которых специализируется на своей области, что позволяет нам выполнять работы качественно и точно в срок',
  },
]
</script>

<style lang="scss" scoped>
@use '@/assets/styles/variables' as *;
@use '@/assets/styles/mixins' as *;

.about-advantages {
  @include section-padding;
  background: $background-light;
  color: $text-dark;
  scroll-margin-top: 80px;

  .container {
    @include section-container;
  }
}

.about-section {
  &__header {
    max-width: 760px;
    margin-bottom: 2.5rem;
  }

  &__badge {
    display: inline-flex;
    align-items: center;
    gap: 0.45rem;
    padding: 0.4rem 0.85rem;
    margin-bottom: 1rem;
    font-size: 0.78rem;
    font-weight: 600;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: $blue;
    background: rgba(0, 195, 245, 0.08);
    border: 1px solid rgba(0, 195, 245, 0.22);
    border-radius: 100px;
  }

  &__title {
    @include section-title;
    color: $text-dark;

    .accent {
      background: $blue-gradient;
      -webkit-background-clip: text;
      background-clip: text;
      color: transparent;
    }
  }

  &__subtitle {
    @include section-subtitle;
    margin-bottom: 0;
    color: $text-gray;
  }
}

.advantages-layout {
  display: grid;
  grid-template-columns: minmax(0, 1.15fr) minmax(0, 0.85fr);
  gap: 1.25rem;
  align-items: stretch;

  @media (max-width: 992px) {
    grid-template-columns: 1fr;
  }
}

.advantages-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;

  @media (max-width: 560px) {
    grid-template-columns: 1fr;
  }
}

.advantage-card {
  @include light-card;
  padding: 1.4rem 1.3rem;

  &__icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 46px;
    height: 46px;
    margin-bottom: 0.9rem;
    color: $blue;
    background: rgba(0, 195, 245, 0.1);
    border: 1px solid rgba(0, 195, 245, 0.2);
    border-radius: 12px;
    transition: all 0.35s ease;
  }

  &:hover &__icon {
    color: $blue-light;
    background: $blue-gradient;
    border-color: transparent;
    transform: rotate(-4deg) scale(1.05);
  }

  &__title {
    font-size: 1rem;
    font-weight: 600;
    line-height: 1.35;
    margin: 0 0 0.45rem;
    color: $text-dark;
  }

  &__desc {
    margin: 0;
    font-size: 0.88rem;
    line-height: 1.55;
    color: $text-gray;
  }
}

.conditions {
  display: flex;
  flex-direction: column;
  gap: 1.1rem;
  padding: 1.6rem 1.5rem;
  background:
    linear-gradient(
      160deg,
      rgba(0, 195, 245, 0.09) 0%,
      rgba(0, 195, 245, 0.02) 100%
    );
  border: 1px solid rgba(0, 195, 245, 0.28);
  border-radius: 16px;
  box-shadow: 0 10px 30px rgba(0, 195, 245, 0.08);

  &__head {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
  }

  &__icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    flex-shrink: 0;
    color: $blue-light;
    background: $blue-gradient;
    border-radius: 11px;
  }

  &__title {
    margin: 0;
    font-size: 1.15rem;
    font-weight: 700;
    line-height: 1.3;
    color: $text-dark;
  }

  &__list {
    display: flex;
    flex-direction: column;
    gap: 0.8rem;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  &__item {
    display: flex;
    align-items: flex-start;
    gap: 0.6rem;
    font-size: 0.9rem;
    line-height: 1.55;
    color: $text-dark;
  }

  &__check {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 22px;
    height: 22px;
    flex-shrink: 0;
    margin-top: 1px;
    color: $blue;
    background: rgba(0, 195, 245, 0.12);
    border: 1px solid rgba(0, 195, 245, 0.24);
    border-radius: 50%;
  }
}

@media (max-width: 768px) {
  .about-advantages {
    padding-top: 3.5rem;
    padding-bottom: 3.5rem;
  }

  .about-section {
    &__header {
      margin-bottom: 1.75rem;
    }
  }

  .conditions {
    padding: 1.35rem 1.2rem;

    &__title {
      font-size: 1.05rem;
    }
  }
}
</style>
