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
    <!-- <PagesHomePagePrice /> -->
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
  title: 'Ремонт и отделка коммерческих помещений под ключ - Рязань и область',
  meta: [
    { name: 'description', content: 'Занимаемся ремонтом и отделкой коммерческих помещений под любые задачи и масштабы. Высокое качество и индивидуальный подход.' },
    { property: 'og:title', content: 'Ремонт и отделка коммерческих помещений - Главпрофи' },
    { property: 'og:description', content: 'Занимаемся ремонтом и отделкой коммерческих помещений под любые задачи и масштабы. Высокое качество и индивидуальный подход.' },
    { name: 'keywords', content: 'ремонт, отделка, строительство, коммерческие помещения, офисы, склады, магазины, аптеки, ангары, капитальный ремонт, косметический ремонт, ремонт под ключ, отделочные работы, строительные работы, строительство в Рязани, ремонт в Рязани, ремонт в Рязанской области, ГлавПрофи, Глав Профи, ремонт офиса под ключ в Рязани, отделка торговых помещений в Рязанской области, капитальный ремонт складских помещений, ремонт с гарантией до 3 лет, профессиональная отделка помещений, оптовая закупка материалов, собственные бригады рабочих' }
  ]
})
</script>