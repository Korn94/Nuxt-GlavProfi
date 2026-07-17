<!-- app/pages/remont-pomescheniy/proizvodstvo.vue -->
<template>
  <div class="page-proizvodstvo-routing">
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
            Производство
          </li>
        </ol>
      </div>
    </nav>

    <!-- Сборщик страницы -->
    <ProizvodstvoPage />
  </div>
</template>

<script setup lang="ts">
import ProizvodstvoPage from '~/components/pages/public/remontPomescheniy/pageTypes/proizvodstvo/index.vue'
import { usePageSeo } from '~/components/pages/public/remontPomescheniy/pageTypes/composables/usePageSeo'

usePageSeo({
  type: 'proizvodstvo',
  typeName: 'Производство',
  city: 'Рязань',
  title: 'Ремонт производственных цехов и заводов в Рязани под ключ',
  description:
    'Ремонт производственных цехов в Рязани: промышленные полы под станки, вентиляция с фильтрацией выбросов, электроснабжение 380В, пожарная безопасность. Смета и срок фиксируются в договоре. Гарантия 3 года.',
  priceFrom: 12000,
  currency: 'RUB',
  phone: '+7-910-909-69-47',
  ogImage: 'https://glavprofi.ru/og-proizvodstvo.jpg',
  faq: [
    {
      question: 'Можно ли делать ремонт, если производство продолжает работать?',
      answer:
        'Да. Работы проводим поэтапно: изолируем зону ремонта герметичными перегородками, переносим шумные и «грязные» этапы на ночные смены и выходные. Движение техники и логистику организуем по временным маршрутам, чтобы производство не останавливалось.',
    },
    {
      question: 'Как фиксируется смета — не вырастет ли цена в процессе?',
      answer:
        'Итоговая стоимость и сроки закрепляются в договоре и не меняются. Любые дополнительные работы оформляются только через официальное дополнительное соглашение с вашим предварительным согласованием. Если в процессе обнаруживаются скрытые дефекты (например, разрушение основания пола) — заранее согласуем решение и стоимость до начала работ.',
    },
    {
      question: 'Делаете ли вы полы под станки с высокой вибрацией и ударной нагрузкой?',
      answer:
        'Да. Выполняем промышленные бетонные полы М400–М600 с армированием и топпингом (корунд, кварц), виброразвязку под тяжёлое оборудование, фундаменты под станки с отдельной опалубкой и анкерными группами. Для химической и пищевой промышленности — полимерные наливные покрытия (эпоксидные, полиуретановые) с химстойкостью.',
    },
    {
      question: 'Проектируете ли вы вентиляцию под промышленные выбросы?',
      answer:
        'Да. Разрабатываем приточно-вытяжную вентиляцию с местными отсосами над рабочими местами, фильтрами (пылеуловители, скрубберы, угольные адсорберы) и выбросом в атмосферу по нормам ПДВ. Для сварочных постов, окрасочных камер, химических участков — отдельные вытяжные системы с расчётом кратности по СанПиН и ГОСТ.',
    },
    {
      question: 'Какие гарантии на работы?',
      answer:
        '3 года по договору на все строительно-отделочные работы, включая скрытые дефекты. Если в гарантийный срок что-то потрескается, отслоится покрытие, выйдет из строя вентиляция или потребуется регулировка — приедем и исправим за свой счёт в согласованные сроки, не мешая производству.',
    },
    {
      question: 'Работаете ли вы с чистыми помещениями для фармацевтики и электроники?',
      answer:
        'Да. Выполняем чистые помещения классов ISO 5–8 (по ГОСТ ИСО 14644): герметичные ограждающие конструкции, антистатические полы, ламинарные потоки воздуха, HEPA-фильтры, шлюзы и избыточное давление. Передаём валидационную документацию по GMP.',
    },
  ],
})
</script>

<style lang="scss" scoped>
@use '@/assets/styles/variables' as *;

.page-proizvodstvo-routing {
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