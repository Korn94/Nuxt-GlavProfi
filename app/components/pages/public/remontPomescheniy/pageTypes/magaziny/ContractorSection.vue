<!-- components/ContractorSection.vue -->
<template>
  <section class="article__section">
    <h2 class="article__subtitle">Проверка подрядчика: 3 вопроса, которые спасут бюджет</h2>
    <div class="question-item" v-for="(q, index) in questions" :key="index">
      <h4>Вопрос {{ index + 1 }}:</h4>
      <blockquote>{{ q.question }}</blockquote>
      <p><strong>Хороший ответ:</strong> {{ q.answer }}</p>
    </div>
  </section>
</template>

<script setup>
const questions = [
  {
    question: 'Покажите примеры ремонта именно магазинов, а не других помещений. Какие были сложности с потоком покупателей во время ремонта?',
    answer: 'Хороший подрядчик расскажет, как решал проблему временного размещения касс или защиты товара от пыли.'
  },
  {
    question: 'Как вы учитываете специфику торговли при выборе материалов? Приведите пример, где стандартный выбор привел к проблемам.',
    answer: 'Профессионал назовет конкретику: «В одном проекте клиент выбрал ламинат 31 класса — через месяц от тележек появились сколы. Мы рекомендуем линолеум 34-го класса (Tarkett Work)».'
  },
  {
    question: 'Какие этапы ремонта критичны для минимизации простоя магазина? Как вы их оптимизируете?',
    answer: 'Ответ должен содержать: «Мы разбиваем ремонт на зоны, работаем от входа к кассе, используем быстросохнущие составы для стяжки».'
  }
];
</script>

<style lang="scss" scoped>
.question-item {
  border-bottom: 1px solid $border-color;
  padding-bottom: 1.2rem;
  margin-bottom: 1.2rem;

  &:last-child {
    border-bottom: none;
    margin-bottom: 0;
  }

  h4 {
    margin: 0 0 0.5rem 0;
    color: $blue;
  }

  blockquote {
    margin: 0.8rem 0;
    padding-left: 1rem;
    border-left: 3px solid $yellow;
    color: $text-dark;
    font-style: italic;
  }

  p {
    margin: 0.5rem 0;
    color: $text-dark;
  }
}
</style>