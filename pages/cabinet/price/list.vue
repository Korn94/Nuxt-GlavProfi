<template>
  <PagesPrices :active-category="activeCategory" is-admin />
</template>

<script setup>
import { useRoute } from 'vue-router'
import { ref } from 'vue'

definePageMeta({
  layout: "cabinet",
})

const route = useRoute()
const activeCategory = ref(route.params.category || 'floor')
</script>