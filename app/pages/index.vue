<template>
  <main>
    <PagesHomePage />
    <UIElementsBlockAnimator>
      <PagesHomePageAdvantage />
    </UIElementsBlockAnimator>
    <UIElementsBlockAnimator>
      <PagesHomePageInsert id="portfolio" />
    </UIElementsBlockAnimator>
    <UIElementsBlockAnimator>
      <PagesHomePageMiniProjects />
    </UIElementsBlockAnimator>
    <UIElementsBlockAnimator>
      <PagesHomePageBrands />
    </UIElementsBlockAnimator>
    <UIElementsBlockAnimator>
      <PagesHomePageIntro />
    </UIElementsBlockAnimator>
    <UIElementsBlockAnimator>
      <PagesHomePageCall />
    </UIElementsBlockAnimator>
    <!-- <PagesHomePagePrice /> -->
    <UIElementsBlockAnimator>
      <PagesHomePageMiniPrice />
    </UIElementsBlockAnimator>
    <UIElementsBlockAnimator>
      <PagesHomePageCallRevers />
    </UIElementsBlockAnimator>
    <UIElementsBlockAnimator>
      <PagesHomePageFeedback id="feedback" />
    </UIElementsBlockAnimator>
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