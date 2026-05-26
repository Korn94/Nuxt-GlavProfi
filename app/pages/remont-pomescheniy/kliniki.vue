<!-- app/pages/remont-pomescheniy/kliniki.vue -->
 <template>
  <div class="page-kliniki-routing">
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
            Клиники
          </li>
        </ol>
      </div>
    </nav>

    <!-- Сборщик страницы -->
    <KlinikiPage />
  </div>
</template>

<script setup lang="ts">
import KlinikiPage from '~/components/pages/public/remontPomescheniy/pageTypes/kliniki/index.vue'
import { usePageSeo } from '~/components/pages/public/remontPomescheniy/pageTypes/composables/usePageSeo'

usePageSeo({
  type: 'kliniki',
  typeName: 'Клиники',
  city: 'Рязань',
  title: 'Ремонт клиник и медцентров с учётом СанПиН в Рязани',
  description:
    'Ремонт клиник под ключ в Рязани: с учётом СанПиН 3.3686-21, лицензионных требований и инженерии под медоборудование. Сдача с первого раза. Штатные бригады, фиксированная смета, гарантия 3 года.',
  priceFrom: 8500,
  currency: 'RUB',
  phone: '+7-910-909-69-47',
  ogImage: 'https://glavprofi.ru/og-kliniki.jpg',
  faq: [
    {
      question: 'Можно ли делать ремонт, если клиника принимает пациентов?',
      answer:
        'Да. Шумные и «грязные» работы (демонтаж, штробление, стяжка) переносим на ночное время или выходные. Днём — тихие этапы: покраска, монтаж, сборка. Зоны работ изолируем герметичными перегородками и обеспыливанием.',
    },
    {
      question: 'Помогаете ли вы с лицензированием медицинской деятельности?',
      answer:
        'Да. Ремонт ведём строго под требования СанПиН и лицензионных условий. По завершении передаём исполнительную документацию, акты скрытых работ, паспорта на инженерные системы. По запросу сопровождаем до получения лицензии.',
    },
    {
      question: 'Как фиксируется смета — не вырастет ли цена в процессе?',
      answer:
        'Все изменения — только через дополнительное соглашение с вашей подписью. Итоговая сумма в акте всегда совпадает с договором.',
    },
    {
      question: 'Кто закупает материалы — вы или мы?',
      answer:
        'Как удобнее вам. Можете купить сами по своей спецификации — мы просто монтируем. Или доверите закупку нам: возьмём на себя логистику, проверим сертификаты соответствия для медучреждений и предоставим все документы.',
    },
    {
      question: 'Какие гарантии на работы?',
      answer:
        '3 года по договору. Если в этот период что-то отклеится, потрескается или потребует регулировки — приедем и исправим за свой счёт. Гарантия распространяется и на скрытые дефекты.',
    },
    {
      question: 'Делаете ли вы отдельные кабинеты — например, только рентген или стоматологию?',
      answer:
        'Да. Можем выполнить ремонт одного кабинета или группы помещений в действующей клинике: с защитой, инженерией под конкретное оборудование и сдачей под ключ.',
    },
  ],
})
</script>

<style lang="scss" scoped>
@use '@/assets/styles/variables' as *;

.page-kliniki-routing {
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