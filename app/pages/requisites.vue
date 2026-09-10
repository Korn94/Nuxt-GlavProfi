<!-- app/pages/requisites.vue -->
 <template>
  <PagesPublicRequisites />
</template>

<script setup>
// Запрещаем поисковым роботам индексировать эту страницу
useHead({
  title: 'Реквизиты компании | ГлавПрофи',
  meta: [
    { name: 'description', content: 'Юридические и банковские реквизиты ООО «ГЛАВПРОФИ»' },
    { name: 'robots', content: 'noindex, nofollow' }
  ]
})
</script>