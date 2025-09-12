<template>
  <div class="construction-service">
    <!-- Hero Section -->
    <section class="hero">
      <div class="container">
        <h1>Отделочные и строительные работы</h1>
        <p class="subtitle">
          Профессиональное выполнение строительства и отделки любой сложности — от фундамента до финишной отделки.
        </p>
      </div>
    </section>

    <!-- Services Overview -->
    <section class="overview">
      <div class="container">
        <h2>Наши услуги</h2>
        <div class="cards">
          <div v-for="(service, index) in services" :key="index" class="card">
            <h3>{{ service.title }}</h3>
            <p>{{ service.description }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Features -->
    <section class="features">
      <div class="container">
        <h2>Почему выбирают нас?</h2>
        <ul class="feature-list">
          <li v-for="(feature, index) in features" :key="index">
            <span class="icon">✓</span>
            {{ feature }}
          </li>
        </ul>
      </div>
    </section>

    <!-- CTA -->
    <section class="cta">
      <div class="container">
        <h2>Готовы начать проект?</h2>
        <p>Свяжитесь с нами для бесплатной консультации и расчёта стоимости.</p>
        <button class="btn btn-primary">Заказать звонок</button>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
const services = [
  {
    title: 'Кладка и возведение стен',
    description: 'Кирпич, газобетон, пеноблоки — качественная кладка по ГОСТ.'
  },
  {
    title: 'Фундаментные работы',
    description: 'Ленточный, свайный, плитный — рассчитаем и построим надёжно.'
  },
  {
    title: 'Кровля и перекрытия',
    description: 'Монтаж стропильной системы, утепление, гидроизоляция.'
  },
  {
    title: 'Внутренняя отделка',
    description: 'Штукатурка, шпаклёвка, поклейка обоев, покраска, плитка.'
  },
  {
    title: 'Полы и потолки',
    description: 'Стяжка, наливные полы, подвесные и натяжные потолки.'
  },
  {
    title: 'Электромонтаж и сантехника',
    description: 'Проектирование и прокладка коммуникаций по нормам ПУЭ и СНиП.'
  }
]

const features = [
  'Опыт более 10 лет в строительстве и ремонте',
  'Работаем по договору с гарантией результата',
  'Используем только качественные материалы',
  'Соблюдаем сроки и бюджет',
  'Выезд замерщика — бесплатно',
  'Полный цикл: от проекта до сдачи ключей'
]
</script>

<style scoped lang="scss">
.hero {
  background: $background-dark;
  padding: 120px 20px 60px;
  text-align: center;
  box-shadow: $box-shadow;
  
  h1 {
    color: $text-light;
    font-size: 2.8rem;
    margin-bottom: 16px;
    font-weight: 700;
  }
  
  .subtitle {
    color: $text-light;
    font-size: 1.25rem;
    max-width: 700px;
    margin: 0 auto;
    opacity: 0.95;
  }
}

.overview {
  padding: 80px 20px;
  background: $background-light;
  color: $text-dark;

  h2 {
    text-align: center;
    font-size: 2rem;
    margin-bottom: 40px;
    // color: $blue;
  }

  .cards {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 24px;
  }

  .card {
    background: #fff;
    padding: 30px;
    border-radius: $border-radius;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    transition: transform $transition, box-shadow $transition;

    h3 {
      font-size: 1.4rem;
      margin-bottom: 12px;
      color: $blue;
    }

    p {
      color: $text-gray;
      line-height: 1.6;
    }

    &:hover {
      transform: translateY(-6px);
      box-shadow: 0 10px 20px rgba(0, 0, 0, 0.12);
    }
  }
}

.features {
  padding: 80px 20px;
  background: $background-gray;
  color: $text-light;

  h2 {
    text-align: center;
    font-size: 2rem;
    margin-bottom: 40px;
    color: $blue-light;
  }

  .feature-list {
    max-width: 800px;
    margin: 0 auto;
    list-style: none;
    padding: 0;

    li {
      font-size: 1.15rem;
      margin-bottom: 16px;
      display: flex;
      align-items: center;
      line-height: 1.6;

      .icon {
        display: inline-flex;
        justify-content: center;
        align-items: center;
        width: 30px;
        height: 30px;
        background: $green;
        color: white;
        border-radius: 50%;
        margin-right: 12px;
        font-weight: bold;
        font-size: 0.9rem;
      }
    }
  }
}

.cta {
  text-align: center;
  padding: 100px 20px;
  background: $gray-gradient;
  color: $text-dark;

  h2 {
    font-size: 2.2rem;
    margin-bottom: 16px;
    color: $blue;
  }

  p {
    font-size: 1.2rem;
    max-width: 600px;
    margin: 0 auto 32px;
    color: $text-gray;
  }

  .btn-primary {
    background: $blue;
    color: white;
    border: none;
    padding: 16px 40px;
    font-size: 1.1rem;
    border-radius: $border-radius;
    cursor: pointer;
    transition: $transition;
    font-weight: 600;

    &:hover {
      background: $blue20;
      transform: translateY(-2px);
    }
  }
}
</style>