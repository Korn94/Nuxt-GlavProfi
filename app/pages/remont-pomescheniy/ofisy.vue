<!-- app/pages/remont-pomescheniy/ofisy.vue -->
 <template>
  <div class="page-ofisy-routing">
    <!-- Хлебные крошки (визуальные) -->
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
            Офисы
          </li>
        </ol>
      </div>
    </nav>

    <!-- Сборщик страницы (explicit import) -->
    <OfisyPage />
  </div>
</template>

<script setup lang="ts">
// Explicit import вместо auto-import
import OfisyPage from '~/components/pages/public/remontPomescheniy/pageTypes/ofisy/index.vue'
import { usePageSeo } from '~/components/pages/public/remontPomescheniy/pageTypes/composables/usePageSeo'

// === SEO: мета-теги + JSON-LD Schema.org ===
usePageSeo({
  type: 'ofisy',
  typeName: 'Офисы',
  city: 'Рязань',
  title: 'Ремонт офисов в Рязани с фиксированной сметой и сроком',
  description:
    'Сдаём офис, в который можно заехать и работать: с готовой планировкой, инженерией и отделкой. Работаем по вашему проекту или составляем ТЗ с нуля. Смета и срок фиксируются в договоре.',
  priceFrom: 3000,
  currency: 'RUB',
  phone: '+7-910-909-69-47',
  ogImage: 'https://glavprofi.ru/og-ofisy.jpg',
  faq: [
    {
      question: 'Можно ли делать ремонт, если в офисе работают люди?',
      answer:
        'Да. Шумные работы (демонтаж, штробление, стяжку) переносим на вечер или выходные. Днём занимаемся тихими этапами: покраска, сборка, монтаж. График согласуем с вами заранее, чтобы бизнес не останавливался.',
    },
    {
      question: 'Как фиксируется смета — не вырастет ли цена в процессе?',
      answer:
        'Все изменения — только через дополнительное соглашение с вашей подписью. Итоговая сумма в акте всегда совпадает с договором.',
    },
    {
      question: 'Кто закупает материалы — вы или мы?',
      answer:
        'Как удобнее вам. Можете купить сами по своей спецификации — мы просто монтируем. Или доверите закупку нам: возьмём на себя логистику, проверим качество на входе и предоставим чеки/накладные.',
    },
    {
      question: 'Какая гарантия на работы?',
      answer:
        '3 года по договору. Если в этот период что-то отклеится, потрескается или потребует регулировки — приедем и исправим за свой счёт. Гарантийный акт и исполнительную документацию передаём вместе с ключами. Гарантия распространяется и на скрытые дефекты, которые могут проявиться со временем.',
    },
  ],
})
</script>

<style lang="scss" scoped>
@use '@/assets/styles/variables' as *;

.page-ofisy-routing {
  background: $background-dark;
}

// === Хлебные крошки ===
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