<!-- app\pages\vidy-rabot\gkl\steny.vue -->
<template>
  <div class="page-gkl-steny-routing">
    <!-- Сборщик страницы (вся вёрстка и контент) -->
    <GklStenyPage />
  </div>
</template>

<script setup lang="ts">
import GklStenyPage from '~/components/pages/public/remontPomescheniy/workTypes/gkl/steny.vue'
import { useWorkTypeSeo } from '~/components/pages/public/remontPomescheniy/workTypes/composables/useWorkTypeSeo'

// === SEO для страницы вида работ ===
useWorkTypeSeo({
  category: 'gkl',
  categoryName: 'ГКЛ',
  slug: 'steny',
  title: 'Монтаж гипсокартона на стены',
  description:
    'Монтаж ГКЛ на стены под ключ в Рязани: на каркас или клей. Выравнивание стен, утепление, звукоизоляция. Гарантия 3 года, фиксированная цена от 650 ₽/м².',
  city: 'Рязани',
  priceFrom: 650,
  serviceType: 'Монтаж гипсокартона',
  ogImage: 'https://glavprofi.ru/og-gkl-steny.jpg',
  faq: [
    {
      question: 'Какой гипсокартон выбрать для ванной?',
      answer:
        'Только влагостойкий (ГКЛВ, зелёного цвета). Обычный ГКЛ во влажной среде разбухает за 2-3 года. Для зон прямого контакта с водой лучше дополнительно использовать гидроизоляцию.',
    },
    {
      question: 'Можно ли клеить ГКЛ на кирпичную стену?',
      answer:
        'Да, если перепад стен не превышает 2 см на 2 метра. При большей кривизне — только каркасный монтаж, иначе листы могут отойти или треснуть по швам.',
    },
    {
      question: 'Сколько сохнет шпаклёвка на ГКЛ перед покраской?',
      answer:
        'Первый слой — 4-6 часов при +20°C. Полный цикл (грунт + 2 слоя + шлифовка) — 2-3 дня. После этого можно клеить обои или красить.',
    },
    {
      question: 'Можно ли на стену из ГКЛ вешать тяжёлые полки?',
      answer:
        'Да, но только на специальные дюбели (Molly, «бабочка»). Для телевизора и кухонных шкафов закладываем деревянные закладные на этапе монтажа каркаса.',
    },
    {
      question: 'Какая звукоизоляция у стены из ГКЛ?',
      answer:
        'Стандартная стена 1 слой + минвата 50 мм — ~45 дБ. С двумя слоями ГКЛ + минвата 100 мм — до 58 дБ (уровень тихой спальни).',
    },
  ],
})
</script>

<style lang="scss" scoped>
@use '@/assets/styles/variables' as *;

.page-gkl-steny-routing {
  background: $background-dark;
}
</style>