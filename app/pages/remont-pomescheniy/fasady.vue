<!-- app/pages/remont-pomescheniy/fasady.vue -->
<template>
  <div class="page-fasady-routing">
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
            Фасады
          </li>
        </ol>
      </div>
    </nav>

    <!-- Сборщик страницы -->
    <FasadyPage />
  </div>
</template>

<script setup lang="ts">
import FasadyPage from '~/components/pages/public/remontPomescheniy/pageTypes/fasady/index.vue'
import { usePageSeo } from '~/components/pages/public/remontPomescheniy/pageTypes/composables/usePageSeo'

usePageSeo({
  type: 'fasady',
  typeName: 'Фасады',
  city: 'Рязань',
  title: 'Ремонт и отделка фасадов зданий в Рязани: утепление и облицовка под ключ',
  description:
    'Ремонт фасадов в Рязани: мокрые и вентилируемые системы, утепление по СП 50.13330, герметизация швов, высотные работы (леса, люльки, промальп). Смета и срок фиксируются в договоре. Гарантия 3 года.',
  priceFrom: 3500,
  currency: 'RUB',
  phone: '+7-910-909-69-47',
  ogImage: 'https://glavprofi.ru/og-fasady.jpg',
  faq: [
    {
      question: 'Работаете ли на высоте — с лесов, люлек или методом промальпа?',
      answer:
        'Да. Подбираем метод под высоту и конфигурацию здания: для малоэтажных — рамные и клиновые леса, для 5–9 этажей — фасадные люльки, для сложных конфигураций и точечного ремонта — промышленный альпинизм. Все высотники — с допусками и страховкой, леса — с паспортом и актом приёмки.',
    },
    {
      question: 'Нужно ли согласование с КГА для фасада в Рязани?',
      answer:
        'Зависит от здания: для объектов в охранных зонах, на центральных улицах и зданий-памятников — обязательно. Для рядовых коммерческих объектов вне охранной зоны — достаточно уведомления. Мы берём на себя сбор документации, согласование цветового паспорта и колористическое решение. Всё делаем до начала работ.',
    },
    {
      question: 'При какой температуре можно делать мокрый фасад?',
      answer:
        'По технологии — не ниже +5 °C и без заморозков в течение 72 часов после нанесения составов. При отрицательных температурах используем зимние клеевые смеси с антифризными добавками и организуем тепловые контуры. Работать в мороз без подготовки — это гарантированные отслоения через год.',
    },
    {
      question: 'Утепляете ли вы существующий фасад без демонтажа старой отделки?',
      answer:
        'Да, если основание имеет достаточную несущую способность. Перед утеплением проводим обследование: простукиваем поверхность, проверяем адгезию, делаем вырывные испытания дюбелей. Если старая штукатурка держится — монтируем утеплитель поверх, если нет — локальный демонтаж с восстановлением основания.',
    },
    {
      question: 'Какие гарантии на фасадные работы?',
      answer:
        '3 года по договору на все строительно-отделочные работы, включая скрытые дефекты. На системы вентилируемого фасада — по гарантии производителя (до 15 лет на керамогранит и фиброцемент). Если в гарантийный срок появятся отслоения, трещины, высолы или протечки — приедем и исправим за свой счёт.',
    },
    {
      question: 'Какие фасадные системы используете — мокрые или вентилируемые?',
      answer:
        'Работаем со всеми основными системами: «мокрый» фасад (штукатурка по утеплителю), вентилируемые фасады (керамогранит, фиброцемент, металлокассеты, HPL-панели), облицовка кирпичом и натуральным камнем, светопрозрачные конструкции. Подбираем систему под задачу: бюджет, теплопотери, архитектура и сроки эксплуатации.',
    },
  ],
})
</script>

<style lang="scss" scoped>
@use '@/assets/styles/variables' as *;

.page-fasady-routing {
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