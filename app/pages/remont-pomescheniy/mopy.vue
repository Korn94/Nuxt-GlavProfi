<!-- app/pages/remont-pomescheniy/mopy.vue -->
<template>
  <div class="page-mopy-routing">
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
            МОПы / подъезды
          </li>
        </ol>
      </div>
    </nav>

    <!-- Сборщик страницы -->
    <MopyPage />
  </div>
</template>

<script setup lang="ts">
import MopyPage from '~/components/pages/public/remontPomescheniy/pageTypes/mopy/index.vue'
import { usePageSeo } from '~/components/pages/public/remontPomescheniy/pageTypes/composables/usePageSeo'

usePageSeo({
  type: 'mopy',
  typeName: 'МОПы',
  city: 'Рязань',
  title: 'Ремонт МОПов, подъездов и холлов ЖК в Рязани: антивандальная отделка',
  description:
    'Ремонт подъездов и холлов жилых комплексов в Рязани: антивандальные материалы, пожарная безопасность по СП 1.13130, доступность для МГН, инженерия (домофоны, видеонаблюдение, освещение). Смета фиксируется в договоре. Гарантия 3 года.',
  priceFrom: 4500,
  currency: 'RUB',
  phone: '+7-910-909-69-47',
  ogImage: 'https://glavprofi.ru/og-mopy.jpg',
  faq: [
    {
      question: 'Можно ли делать ремонт в заселённом доме — не мешая жильцам?',
      answer:
        'Да. Работаем поэтажно: изолируем зону ремонта герметичными перегородками, шумные этапы (демонтаж, штробление, стяжка) проводим строго с 9:00 до 19:00 в будни, с соблюдением закона о тишине. Сохраняем доступ к лифтам, почтовым ящикам и эвакуационным выходам. Все этапы согласуем с УК/ТСЖ и вывешиваем график работ на информационном стенде в подъезде.',
    },
    {
      question: 'Как фиксируется смета — не вырастет ли цена в процессе?',
      answer:
        'Итоговая стоимость и сроки закрепляются в договоре и не меняются. Любые дополнительные работы (если они возникают по инициативе заказчика или из-за скрытых дефектов, выявленных при демонтаже) оформляются только через официальное дополнительное соглашение с вашим предварительным согласованием.',
    },
    {
      question: 'Какие антивандальные материалы используете в подъездах?',
      answer:
        'Стены на первых двух этажах — керамогранит или антивандальные стеновые панели (HPL, ЛДСП с защитой), моющаяся краска с классом истирания 1. На верхних этажах — структурные обои под покраску или декоративная штукатурка. Все материалы — с сертификатами пожарной безопасности (КМ0 или КМ1) по ФЗ-123.',
    },
    {
      question: 'Работаете ли вы с УК, ТСЖ и по 44-ФЗ/223-ФЗ?',
      answer:
        'Да. Работаем с управляющими компаниями, товариществами собственников жилья, застройщиками и по государственным закупкам. Предоставляем полный пакет закрывающих документов: акты КС-2, КС-3, счета-фактуры, сертификаты на материалы, исполнительную документацию. Готовы участвовать в тендерах и котировочных сессиях.',
    },
    {
      question: 'Какие гарантии на работы?',
      answer:
        '3 года по договору на все строительно-отделочные работы, включая скрытые дефекты. Если в гарантийный срок что-то отклеится, потрескается, выйдет из строя домофон или освещение — приедем и исправим за свой счёт в согласованные сроки, не мешая жильцам.',
    },
    {
      question: 'Делаете ли вы доступную среду для маломобильных групп населения?',
      answer:
        'Да. Проектируем и монтируем пандусы с уклоном не более 1:12, поручни на двух высотах, тактильную плитку, контрастную маркировку ступеней, кнопки вызова помощи. Все решения — по СП 59.13330.2020 «Доступность зданий и сооружений для маломобильных групп населения». Сдаём объект с паспортом доступности.',
    },
  ],
})
</script>

<style lang="scss" scoped>
@use '@/assets/styles/variables' as *;

.page-mopy-routing {
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