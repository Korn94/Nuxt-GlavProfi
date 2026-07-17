<!-- app/pages/remont-pomescheniy/sklady.vue -->
<template>
  <div class="page-sklady-routing">
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
            Склады
          </li>
        </ol>
      </div>
    </nav>

    <!-- Сборщик страницы -->
    <SkladyPage />
  </div>
</template>

<script setup lang="ts">
import SkladyPage from '~/components/pages/public/remontPomescheniy/pageTypes/sklady/index.vue'
import { usePageSeo } from '~/components/pages/public/remontPomescheniy/pageTypes/composables/usePageSeo'

usePageSeo({
  type: 'sklady',
  typeName: 'Склады',
  city: 'Рязань',
  title: 'Ремонт складов и логистических центров в Рязани под ключ',
  description:
    'Ремонт складов и логистических центров в Рязани: наливные полы с высокой нагрузкой, антипылевые покрытия, пожарная безопасность, зонирование приёмки и отгрузки. Смета фиксируется в договоре. Гарантия 3 года.',
  priceFrom: 8500,
  currency: 'RUB',
  phone: '+7-910-909-69-47',
  ogImage: 'https://glavprofi.ru/og-sklady.jpg',
  faq: [
    {
      question: 'Можно ли делать ремонт, если склад продолжает работать?',
      answer:
        'Да. Работы проводим поэтапно: изолируем зону ремонта герметичными перегородками, переносим шумные этапы (демонтаж, стяжка) на ночные смены и выходные. Движение погрузчиков и приёмку товара организуем по временным маршрутам, чтобы логистика не останавливалась.',
    },
    {
      question: 'Как фиксируется смета — не вырастет ли цена в процессе?',
      answer:
        'Итоговая стоимость и сроки закрепляются в договоре и не меняются. Любые дополнительные работы оформляются только через официальное дополнительное соглашение с вашим предварительным согласованием. Если в процессе обнаруживаются скрытые дефекты (например, разрушение основания пола) — заранее согласуем решение и стоимость до начала работ.',
    },
    {
      question: 'Делаете ли вы полы под высокую нагрузку от погрузчиков и стеллажей?',
      answer:
        'Да. Выполняем наливные полы с топпингом (кварц, корунд), упрочнённый бетон класса М350–М500, с расчётом нагрузки на квадратный метр под ваши стеллажи и технику. Для холодильных складов — морозостойкие составы с антиобледенительными добавками. Закладываем анкерные группы под стеллажные системы ещё на этапе стяжки.',
    },
    {
      question: 'Кто закупает материалы — вы или мы?',
      answer:
        'Как удобнее вам. Можете купить сами по своей спецификации — мы просто монтируем. Или доверите закупку нам: возьмём на себя логистику больших объёмов, проверим сертификаты соответствия для складских объектов (огнестойкость, антипылевые свойства, износостойкость) и предоставим все документы.',
    },
    {
      question: 'Какие гарантии на работы?',
      answer:
        '3 года по договору на все строительно-отделочные работы, включая скрытые дефекты. Если в гарантийный срок что-то потрескается, отслоится антипылевое покрытие или потребует регулировки — приедем и исправим за свой счёт в согласованные сроки, не мешая работе склада.',
    },
    {
      question: 'Работаете ли вы с холодильными и пищевыми складами?',
      answer:
        'Да. Для холодильных складов используем морозостойкие покрытия, пароизоляцию, теплоизоляцию из ППУ или минваты, специальные ворота с терморазрывом. Для пищевых складов — отделку с сертификатами для контакта с продуктами и моющиеся поверхности по СанПиН. Проектируем вентиляцию под конкретный температурный режим.',
    },
  ],
})
</script>

<style lang="scss" scoped>
@use '@/assets/styles/variables' as *;

.page-sklady-routing {
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