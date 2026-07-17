<!-- app/pages/remont-pomescheniy/fitness.vue -->
<template>
  <div class="page-fitness-routing">
    <!-- Хлебные крошки -->
    <nav class="breadcrumbs" aria-label="Хлебные крошки">
      <div class="breadcrumbs__container">
        <ol class="breadcrumbs__list">
          <li class="breadcrumbs__item">
            <NuxtLink to="/" class="breadcrumbs__link">Главная</NuxtLink>
          </li>
          <li class="breadcrumbs__item">
            <NuxtLink to="/remont-pomescheniy" class="breadcrumbs__link">
              Ремонт помещений
            </NuxtLink>
          </li>
          <li class="breadcrumbs__item breadcrumbs__item--current" aria-current="page">
            Фитнес-клубы
          </li>
        </ol>
      </div>
    </nav>

    <!-- Сборщик страницы -->
    <FitnessPage />
  </div>
</template>

<script setup lang="ts">
import FitnessPage from '~/components/pages/public/remontPomescheniy/pageTypes/fitness/index.vue'
import { usePageSeo } from '~/components/pages/public/remontPomescheniy/pageTypes/composables/usePageSeo'

usePageSeo({
  type: 'fitness',
  typeName: 'Фитнес-клубы',
  city: 'Рязань',
  title: 'Ремонт фитнес-клубов и спортивных залов в Рязани под ключ',
  description:
    'Ремонт фитнес-клубов и спортзалов в Рязани: вентиляция с повышенной кратностью, амортизирующие полы, звукоизоляция, мокрые зоны. Смета и срок фиксируются в договоре. Гарантия 3 года.',
  priceFrom: 14000,
  currency: 'RUB',
  phone: '+7-910-909-69-47',
  ogImage: 'https://glavprofi.ru/og-fitness.jpg',
  faq: [
    {
      question: 'Можно ли делать ремонт, если клуб продолжает работать?',
      answer:
        'Да. Шумные и «грязные» работы (демонтаж, стяжка, штробление) переносим на ночные смены и выходные. Днём — тихие этапы: покраска, сборка, монтаж. Зоны работ изолируем герметичными перегородками, чтобы клиенты не контактировали со стройкой, а тренировки не останавливались.',
    },
    {
      question: 'Как фиксируется смета — не вырастет ли цена в процессе?',
      answer:
        'Итоговая стоимость и сроки закрепляются в договоре и не меняются. Любые дополнительные работы оформляются только через официальное дополнительное соглашение с вашим предварительным согласованием. Если в процессе обнаруживаются скрытые дефекты — заранее согласуем решение и стоимость до начала работ.',
    },
    {
      question: 'Делаете ли вы звукоизоляцию под тренажёры и групповые залы?',
      answer:
        'Да. Проектируем виброразвязку пола под силовые зоны и кардио-оборудование, «плавающие» стяжки с демпферными прокладками, двойные перегородки с минераловатными плитами. Это защищает соседние помещения от шума и вибраций — нет жалоб от соседей, нет штрафов от управляющей компании.',
    },
    {
      question: 'Кто закупает материалы — вы или мы?',
      answer:
        'Как удобнее вам. Можете купить сами по своей спецификации — мы просто монтируем. Или доверите закупку нам: возьмём на себя логистику, проверим сертификаты соответствия для спортивных объектов (огнестойкость, экологичность, износостойкость) и предоставим все документы.',
    },
    {
      question: 'Какие гарантии на работы?',
      answer:
        '3 года по договору на все строительно-отделочные работы, включая скрытые дефекты. Если в гарантийный срок что-то отклеится, потрескается, разгерметизируется гидроизоляция или потребует регулировки — приедем и исправим за свой счёт в согласованные сроки, не мешая работе клуба.',
    },
    {
      question: 'Делаете ли вы мокрые зоны — душевые, сауны, бассейны?',
      answer:
        'Да. Выполняем полный цикл по мокрым зонам: многослойная гидроизоляция с заводом на стены, противоскользящая плитка, трапы с уклоном, противогрибковая обработка, вентиляция с повышенной кратностью. Для саун и хаммамов делаем отдельный пирог с пароизоляцией и жаростойкими материалами.',
    },
  ],
})
</script>

<style lang="scss" scoped>
@use '@/assets/styles/variables' as *;

.page-fitness-routing {
  background: $background-dark;
}

.breadcrumbs {
  background: rgba(0, 0, 0, 0.25);
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  padding: 0.85rem 0;

  &__container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 2rem;

    @media (max-width: 768px) {
      padding: 0 1.2rem;
    }
  }

  &__list {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.4rem;
    margin: 0;
    padding: 0;
    list-style: none;
    font-size: 0.88rem;
  }

  &__item {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    color: rgba($text-light, 0.55);

    &:not(:last-child)::after {
      content: '/';
      color: rgba($text-light, 0.3);
      margin-left: 0.1rem;
    }

    &--current {
      color: rgba($text-light, 0.85);
      font-weight: 500;
    }
  }

  &__link {
    color: rgba($text-light, 0.65);
    text-decoration: none;
    transition: color 0.2s ease;

    &:hover {
      color: $blue-light;
    }
  }
}
</style>