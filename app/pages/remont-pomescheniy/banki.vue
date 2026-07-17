<!-- app/pages/remont-pomescheniy/banki.vue -->
<template>
  <div class="page-banki-routing">
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
            Банки
          </li>
        </ol>
      </div>
    </nav>

    <!-- Сборщик страницы -->
    <BankiPage />
  </div>
</template>

<script setup lang="ts">
import BankiPage from '~/components/pages/public/remontPomescheniy/pageTypes/banki/index.vue'
import { usePageSeo } from '~/components/pages/public/remontPomescheniy/pageTypes/composables/usePageSeo'

usePageSeo({
  type: 'banki',
  typeName: 'Банки',
  city: 'Рязань',
  title: 'Ремонт банков и банковских отделений под стандарты ЦБ в Рязани',
  description:
    'Ремонт банков под ключ в Рязани: под стандарты ЦБ, требования безопасности и бренд-бук. Смета и срок фиксируются в договоре. Штатные бригады, гарантия 3 года.',
  priceFrom: 14000,
  currency: 'RUB',
  phone: '+7-910-909-69-47',
  ogImage: 'https://glavprofi.ru/og-banki.jpg',
  faq: [
    {
      question: 'Можно ли проводить ремонт, если отделение продолжает работать?',
      answer:
        'Да. Мы разрабатываем поэтапный план работ или переносим шумные и «грязные» этапы на ночные смены и выходные дни. На время работ возводим временные пыле- и шумозащитные перегородки, чтобы не мешать обслуживанию клиентов и работе сотрудников.',
    },
    {
      question: 'Как фиксируется смета? Может ли цена вырасти в процессе?',
      answer:
        'Итоговая стоимость и сроки закрепляются в договоре и не меняются. Любые дополнительные работы (если они возникают по инициативе заказчика или из-за скрытых дефектов, выявленных при демонтаже) оформляются только через официальное дополнительное соглашение с вашим предварительным согласованием.',
    },
    {
      question: 'Учитываете ли вы требования службы безопасности и нормативы при ремонте?',
      answer:
        'Да. На этапе аудита мы собираем все технические требования (включая внутренние регламенты банка, нормы ЦБ и Росгвардии) и закладываем их в смету. Мы готовим проёмы, усиления и технологические ниши под монтаж специализированного оборудования, которое впоследствии устанавливают профильные подрядчики.',
    },
    {
      question: 'Кто занимается закупкой черновых и чистовых материалов?',
      answer:
        'Как вам удобнее. Мы можем взять закупку на себя (с предоставлением всех сертификатов соответствия, паспортов безопасности и чеков), либо работать с давальческими материалами, которые предоставляет заказчик. В любом случае мы проверяем их соответствие техническому заданию и нормам пожарной безопасности.',
    },
    {
      question: 'Какую гарантию вы предоставляете на выполненные работы?',
      answer:
        'Мы даем гарантию 3 года по договору на все выполненные строительно-отделочные работы, включая скрытые дефекты. В случае выявления недостатков в гарантийный срок мы устраняем их своими силами и за свой счет в оговоренные сроки, не мешая работе отделения.',
    },
    {
      question: 'Предоставляете ли вы полный пакет закрывающих документов для бухгалтерии?',
      answer:
        'Обязательно. Мы работаем официально с юридическими лицами (с НДС или без). По завершении этапов или всего объекта предоставляем акты формы КС-2, КС-3, исполнительную документацию и все необходимые сертификаты на использованные материалы.',
    },
  ],
})
</script>

<style lang="scss" scoped>
@use '@/assets/styles/variables' as *;

.page-banki-routing {
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