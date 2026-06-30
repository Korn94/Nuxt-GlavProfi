<!-- app\pages\index.vue -->
<template>
  <main>
    <PagesPublicHomePage />
    <UiAnimationsBlockAnimator>
      <PagesPublicHomePageAdvantage />
    </UiAnimationsBlockAnimator>
    <UiAnimationsBlockAnimator>
      <PagesPublicHomePageInsert id="portfolio" />
    </UiAnimationsBlockAnimator>
    <UiAnimationsBlockAnimator>
      <PagesPublicHomePageMiniProjects />
    </UiAnimationsBlockAnimator>
    <UiAnimationsBlockAnimator>
      <PagesPublicHomePageBrands />
    </UiAnimationsBlockAnimator>
    <UiAnimationsBlockAnimator>
      <PagesPublicHomePageIntro />
    </UiAnimationsBlockAnimator>
    <UiAnimationsBlockAnimator>
      <PagesPublicHomePageCall />
    </UiAnimationsBlockAnimator>
    <UiAnimationsBlockAnimator>
      <PagesPublicHomePageMiniPrice />
    </UiAnimationsBlockAnimator>
    <UiAnimationsBlockAnimator>
      <PagesPublicHomePageCallRevers />
    </UiAnimationsBlockAnimator>
    <UiAnimationsBlockAnimator>
      <PagesPublicHomePageFeedback id="feedback" />
    </UiAnimationsBlockAnimator>
  </main>
</template>

<script setup>
useHead({
  title: 'Ремонт и отделка коммерческих помещений под ключ в Рязани и области - ГлавПрофи',
  meta: [
    { name: 'description', content: 'Ремонт коммерческих помещений под ключ в Рязани и области. Офисы, магазины, склады. Гарантия 3 года, собственные бригады, обслуживание после сдачи. Звоните!' },
    { property: 'og:title', content: 'Ремонт и отделка коммерческих помещений под ключ в Рязани и области - ГлавПрофи' },
    { property: 'og:description', content: 'Ремонт и отделка коммерческих помещений под ключ в Рязани и области. Работаем с офисами, магазинами, складами, аптеками и ангарами. Гарантия до 3 лет. Собственные бригады, обслуживание после сдачи.' },
    { name: 'keywords', content: 'ремонт, отделка, строительство, коммерческие помещения, офисы, склады, магазины, аптеки, ангары, капитальный ремонт, косметический ремонт, ремонт под ключ, отделочные работы, строительные работы, строительство в Рязани, ремонт в Рязани, ремонт в Рязанской области, ГлавПрофи, Глав Профи, ремонт офиса под ключ в Рязани, отделка торговых помещений в Рязанской области, капитальный ремонт складских помещений, ремонт с гарантией до 3 лет, профессиональная отделка помещений, оптовая закупка материалов, собственные бригады рабочих' }
  ]
})
</script>