<!-- app/pages/remont-pomescheniy/ofisy.vue -->
<template>
  <OfisyPage />
</template>

<script setup lang="ts">
import OfisyPage from '~/components/pages/public/remontPomescheniy/pageTypes/ofisy/index.vue'
import { usePageSeo } from '~/components/pages/public/remontPomescheniy/composables/usePageSeo'
// SEO-данные страницы (title/description/FAQ) — в едином data-модуле:
// из него же сервер собирает markdown-версию (/remont-pomescheniy/ofisy.md).
import { premisesSeo } from '~/components/pages/public/remontPomescheniy/pageTypes/data/premisesSeo'

usePageSeo(premisesSeo.ofisy)
</script>
