<!-- app/pages/remont-pomescheniy/magaziny.vue -->
<template>
  <div class="page-magaziny-routing">
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
            Магазины
          </li>
        </ol>
      </div>
    </nav>

    <!-- Сборщик страницы -->
    <MagazinyPage />
  </div>
</template>

<script setup lang="ts">
import MagazinyPage from '~/components/pages/public/remontPomescheniy/pageTypes/magaziny/index.vue'
import { usePageSeo } from '~/components/pages/public/remontPomescheniy/pageTypes/composables/usePageSeo'

usePageSeo({
  type: 'magaziny',
  typeName: 'Магазины',
  city: 'Рязань',
  title: 'Ремонт магазинов и торговых помещений под стандарты ритейла в Рязани',
  description:
    'Ремонт магазинов под ключ в Рязани: под стандарты ритейла, с учётом потоков покупателей, витринного оборудования и пожарной безопасности. Смета и срок фиксируются в договоре. Штатные бригады, гарантия 3 года.',
  priceFrom: 7500,
  currency: 'RUB',
  phone: '+7-910-909-69-47',
  ogImage: 'https://glavprofi.ru/og-magaziny.jpg',
  faq: [
    {
      question: 'Можно ли делать ремонт, если магазин продолжает работать?',
      answer:
        'Да. Шумные и «грязные» работы (демонтаж, штробление, стяжка) переносим на ночные смены и выходные. Днём — тихие этапы: покраска, монтаж, сборка. Зоны работ изолируем временными перегородками, чтобы покупатели и персонал не контактировали со стройкой.',
    },
    {
      question: 'Как фиксируется смета — не вырастет ли цена в процессе?',
      answer:
        'Итоговая стоимость закрепляется в договоре и не меняется. Любые дополнительные работы оформляются только через официальное дополнительное соглашение с вашим предварительным согласованием. Если в процессе обнаруживаются скрытые дефекты — заранее согласуем решение и стоимость до начала работ.',
    },
    {
      question: 'Учитываете ли требования пожарной безопасности и санитарных норм?',
      answer:
        'Да. На этапе аудита проверяем ширину эвакуационных проходов, класс огнестойкости отделочных материалов, планировку выходов и требования СанПиН для продовольственных магазинов. Все материалы закупаем с сертификатами пожарной и санитарной безопасности.',
    },
    {
      question: 'Кто закупает материалы — вы или мы?',
      answer:
        'Как удобнее вам. Можете купить сами по своей спецификации — мы просто монтируем. Или доверите закупку нам: возьмём на себя логистику, проверим сертификаты соответствия для торговых объектов и предоставим все документы.',
    },
    {
      question: 'Какие гарантии на работы?',
      answer:
        '3 года по договору на все строительно-отделочные работы, включая скрытые дефекты. Если в гарантийный срок что-то отклеится, потрескается или потребует регулировки — приедем и исправим за свой счёт в согласованные сроки, не мешая торговле.',
    },
    {
      question: 'Работаете ли вы с сетевыми ритейлерами и их бренд-буками?',
      answer:
        'Да. Работали с федеральными и региональными сетями: знаем требования к фирменным материалам, цветовой палитре, навигации, витринным конструкциям и зонам самообслуживания. Соблюдаем бренд-бук и проходим внутреннюю приёмку службы эксплуатации ритейлера.',
    },
  ],
})
</script>

<style lang="scss" scoped>
@use '@/assets/styles/variables' as *;

.page-magaziny-routing {
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