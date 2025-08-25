<template>
  <section class="benefits-section">
    <div class="container">
      <div class="benefit-item" v-for="(benefit, index) in benefits" :key="index" :style="{ '--delay': index * 0.1 + 's' }">
        <div class="icon-wrapper">
          <Icon :name="benefit.icon" class="icon" />
        </div>
        <h3 class="title">{{ benefit.title }}</h3>
        <p class="description">{{ benefit.description }}</p>
      </div>
    </div>
  </section>
</template>

<script setup>
const benefits = [
  {
    title: 'Все виды оплат',
    description: 'Принимаем любые способы оплаты для вашего удобства',
    icon: 'ph:credit-card-light',
  },
  {
    title: 'Есть бригады',
    description: 'Профессиональные бригады для выполнения любых задач',
    icon: 'ph:users-three-light',
  },
  {
    title: 'Любой формат',
    description: 'Работаем как с частными заказчиками напрямую, так и в рамках субподряда',
    icon: 'ph:arrows-counter-clockwise-light',
  },
  // {
  //   title: 'Гарантия качества',
  //   description: 'Мы гарантируем высокое качество выполнения всех работ',
  //   icon: 'ph:shield-check-light',
  // },
];
</script>

<style scoped lang="scss">
@use 'sass:color';

$bg-color: #18191b;
$transition: all 0.4s ease;

.benefits-section {
  background-color: $bg-color;
  padding: 6em 1.5em 3em;
  color: $text-light;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 2.5rem;
  text-align: center;
}

.benefit-item {
  opacity: 0;
  transform: translateY(20px);
  animation: fadeInUp 0.6s var(--delay) forwards;
  padding: 2rem 1.5rem;
  border-radius: 16px;
  background-color: #18191b;
  filter: drop-shadow(0 0 20px rgba(0, 195, 245, 0.1254901961));
  transition: .3s;

  &:hover {
    // transform: translateY(-8px);
    filter: drop-shadow(0 0 30px rgba(0, 195, 245, 0.1254901961));
  }
}

.icon-wrapper {
  font-size: 2.5rem;
  color: $blue;
  display: flex;
  justify-content: center;
  align-items: center;
  height: 72px;
}

.title {
  font-size: 1.4rem;
  font-weight: 600;
  margin-bottom: 0.8rem;
  color: $text-light;
}

.description {
  font-size: 0.95rem;
  color: rgba($text-light, 0.7);
  line-height: 1.6;
  margin: 0;
  text-align: left;
}

@keyframes fadeInUp {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

// Адаптивность
@media (max-width: 768px) {
  .benefits-section {
    padding: 4rem 1rem;
  }

  .container {
    gap: 1.8rem;
  }

  .benefit-item {
    padding: 1.8rem 1rem;
  }

  .title {
    font-size: 1.25rem;
  }

  .icon-wrapper {
    font-size: 2.2rem;
  }
}
</style>