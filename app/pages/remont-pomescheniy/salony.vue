<!-- app/pages/remont-pomescheniy/salony.vue -->
<template>
  <div class="page-salony-routing">
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
            Салоны красоты
          </li>
        </ol>
      </div>
    </nav>

    <!-- Сборщик страницы -->
    <SalonyPage />
  </div>
</template>

<script setup lang="ts">
import SalonyPage from '~/components/pages/public/remontPomescheniy/pageTypes/salony/index.vue'
import { usePageSeo } from '~/components/pages/public/remontPomescheniy/pageTypes/composables/usePageSeo'

usePageSeo({
  type: 'salony',
  typeName: 'Салоны красоты',
  city: 'Рязань',
  title: 'Ремонт салонов красоты и барбершопов с учётом СанПиН в Рязани',
  description:
    'Ремонт салонов красоты под ключ в Рязани: с учётом СанПиН, вентиляции под химию, освещения CRI и мокрых зон. Смета и срок фиксируются в договоре. Гарантия 3 года.',
  priceFrom: 15000,
  currency: 'RUB',
  phone: '+7-910-909-69-47',
  ogImage: 'https://glavprofi.ru/og-salony.jpg',
  faq: [
    {
      question: 'Можно ли делать ремонт, если салон продолжает принимать клиентов?',
      answer:
        'Да. Шумные и «грязные» работы (демонтаж, штробление, стяжка) переносим на ночные смены и выходные. Днём — тихие этапы: покраска, монтаж, сборка. Зоны работ изолируем герметичными перегородками, чтобы клиенты не контактировали со стройкой и не дышали пылью или парами химии.',
    },
    {
      question: 'Как фиксируется смета — не вырастет ли цена в процессе?',
      answer:
        'Итоговая стоимость и сроки закрепляются в договоре и не меняются. Любые дополнительные работы оформляются только через официальное дополнительное соглашение с вашим предварительным согласованием. Если в процессе обнаруживаются скрытые дефекты — заранее согласуем решение и стоимость до начала работ.',
    },
    {
      question: 'Помогаете ли вы с согласованием по СанПиН для салонов красоты?',
      answer:
        'Да. Ремонт ведём строго под требования СанПиН 2.1.3678-20 для салонов красоты и барбершопов. По завершении передаём исполнительную документацию, акты скрытых работ, паспорта на инженерные системы и сертификаты на материалы — всё, что нужно для Роспотребнадзора.',
    },
    {
      question: 'Кто закупает материалы — вы или мы?',
      answer:
        'Как удобнее вам. Можете купить сами по своей спецификации — мы просто монтируем. Или доверите закупку нам: возьмём на себя логистику, проверим сертификаты соответствия для салонов красоты (химстойкость, огнестойкость, экологичность) и предоставим все документы.',
    },
    {
      question: 'Какие гарантии на работы?',
      answer:
        '3 года по договору на все строительно-отделочные работы, включая скрытые дефекты. Если в гарантийный срок что-то отклеится, потрескается, разгерметизируется гидроизоляция или потребует регулировки — приедем и исправим за свой счёт в согласованные сроки, не мешая работе салона.',
    },
    {
      question: 'Делаете ли вы отдельные кабинеты — например, только маникюр или солярий?',
      answer:
        'Да. Можем выполнить ремонт одного кабинета или группы помещений в действующем салоне: с защитой, инженерией под конкретное оборудование и сдачей под ключ. Это частый запрос при расширении или переоборудовании.',
    },
  ],
})
</script>

<style lang="scss" scoped>
@use '@/assets/styles/variables' as *;

.page-salony-routing {
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