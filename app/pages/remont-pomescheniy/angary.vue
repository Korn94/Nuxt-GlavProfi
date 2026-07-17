<!-- app/pages/remont-pomescheniy/angary.vue -->
<template>
  <div class="page-angary-routing">
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
            Ангары
          </li>
        </ol>
      </div>
    </nav>

    <!-- Сборщик страницы -->
    <AngaryPage />
  </div>
</template>

<script setup lang="ts">
import AngaryPage from '~/components/pages/public/remontPomescheniy/pageTypes/angary/index.vue'
import { usePageSeo } from '~/components/pages/public/remontPomescheniy/pageTypes/composables/usePageSeo'

usePageSeo({
  type: 'angary',
  typeName: 'Ангары',
  city: 'Рязань',
  title: 'Ремонт ангаров, модульных зданий и металлоконструкций в Рязани',
  description:
    'Ремонт ангаров и быстровозводимых зданий в Рязани: утепление сэндвич-панелями и ППУ, антикоррозийная защита, кровля, огнезащита металлоконструкций. Смета и срок фиксируются в договоре. Гарантия 3 года.',
  priceFrom: 9000,
  currency: 'RUB',
  phone: '+7-910-909-69-47',
  ogImage: 'https://glavprofi.ru/og-angary.jpg',
  faq: [
    {
      question: 'Можно ли делать ремонт, если ангар продолжает эксплуатироваться?',
      answer:
        'Да. Работы проводим поэтапно: изолируем зону ремонта герметичными перегородками, шумные этапы (демонтаж кровли, замена панелей, пескоструй) переносим на ночные смены и выходные. Логистику и движение техники организуем по временным маршрутам, чтобы эксплуатация не останавливалась.',
    },
    {
      question: 'Как фиксируется смета — не вырастет ли цена в процессе?',
      answer:
        'Итоговая стоимость и сроки закрепляются в договоре и не меняются. Любые дополнительные работы оформляются только через официальное дополнительное соглашение с вашим предварительным согласованием. Если в процессе обнаруживаются скрытые дефекты (коррозия несущих элементов, разрушение фундамента) — заранее согласуем решение и стоимость до начала работ.',
    },
    {
      question: 'Делаете ли вы утепление ангара для круглогодичной эксплуатации?',
      answer:
        'Да. Выполняем утепление тремя способами: замена обшивки на сэндвич-панели (50–200 мм в зависимости от климата), напыление ППУ (бесшовное, без мостиков холода) или монтаж минераловатных плит с пароизоляцией. Подбираем решение под ваш температурный режим и бюджет. Все работы — с теплотехническим расчётом по СП 50.13330.',
    },
    {
      question: 'Работаете ли вы с антикоррозийной защитой металлоконструкций?',
      answer:
        'Да. Выполняем полный цикл: пескоструйная или дробеструйная очистка до степени Sa 2,5, грунтовка (эпоксидные, цинкнаполненные составы), финишное покрытие полиуретановыми эмалями. Толщину покрытия контролируем электронным толщиномером. Гарантия на антикор — от 5 лет в зависимости от системы ЛКП.',
    },
    {
      question: 'Какие гарантии на работы?',
      answer:
        '3 года по договору на все строительно-отделочные и кровельные работы, включая скрытые дефекты. На антикоррозийную защиту — от 5 лет, на кровельные мембраны — по гарантии производителя (до 15 лет). Если в гарантийный срок появятся протечки, отслоения покрытия или потребуется регулировка ворот — приедем и исправим за свой счёт.',
    },
    {
      question: 'Делаете ли вы огнезащиту металлоконструкций?',
      answer:
        'Да. Проектируем и наносим огнезащитные составы под требуемый предел огнестойкости (R15, R30, R45, R60) по СП 2.13130. Используем тонкослойные вспучивающиеся краски, плитные материалы или штукатурные составы. Сдаём объект с паспортом огнезащиты и актом скрытых работ — всё для МЧС и пожарного аудита.',
    },
  ],
})
</script>

<style lang="scss" scoped>
@use '@/assets/styles/variables' as *;

.page-angary-routing {
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