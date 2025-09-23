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
// Используем useHead() для установки метатегов
useHead({
  title: 'Ремонт и отделка коммерческих помещений',
  meta: [
    { name: 'description', content: 'Профессиональный ремонт и отделка коммерческих помещений под любые задачи и масштабы. Высокое качество и индивидуальный подход.' },
    { property: 'og:title', content: 'Ремонт и отделка коммерческих помещений - Главпрофи' },
    { property: 'og:description', content: 'Профессиональный ремонт и отделка коммерческих помещений под любые задачи и масштабы. Высокое качество и индивидуальный подход.' },
    { property: 'og:image', content: 'https://glavprofi.ru/images/homepage.jpg' },
    { property: 'og:url', content: 'https://glavprofi.ru/' },
  ],
  link: [
    { rel: 'canonical', href: 'https://glavprofi.ru/' }
  ]
})
</script>