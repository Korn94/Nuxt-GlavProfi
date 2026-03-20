<template>
  <PagesPublicProjectsCasePage 
    v-if="caseData" 
    :case-data="caseData" 
    :images="images" 
    :works="works" 
  />
  <div v-else-if="loading" class="loading">Загрузка...</div>
  <div v-else-if="error" class="error">{{ error }}</div>
</template>

<script setup>
const route = useRoute()
const slug = route.params.slug

const { data, pending: loading, error } = await useAsyncData(
  `case-${slug}`,
  async () => {
    const [caseRes, imagesRes, worksRes] = await Promise.all([
      $fetch(`/api/portfolio/${slug}`),
      $fetch(`/api/portfolio/${slug}/images`).catch(() => []),
      $fetch(`/api/portfolio/${slug}/works`).catch(() => [])
    ])
    return { caseData: caseRes, images: imagesRes, works: worksRes }
  }
)

const caseData = computed(() => data.value?.caseData || null)
const images = computed(() => data.value?.images || [])
const works = computed(() => data.value?.works || [])

// SEO
watchEffect(() => {
  if (!caseData.value) return

  const cleanDesc = (caseData.value.fullDescription || '')
    .replace(/<[^>]*>/g, '')
    .trim()

  const seoDescription = cleanDesc.length > 155
    ? cleanDesc.substring(0, 155) + '...'
    : cleanDesc || 'Ремонт коммерческих помещений под ключ в Рязани'

  const mainImage = images.value.find(img => img.type === 'main')
  const mainImageUrl = mainImage?.url || '/main/projects.webp'

  useHead({
    title: `${caseData.value.title} | ГлавПрофи — ремонт коммерческих помещений`,
    meta: [
      { name: 'description', content: seoDescription },
      { property: 'og:description', content: seoDescription },
      { property: 'og:image', content: mainImageUrl },
      { property: 'og:url', content: `${useRuntimeConfig().public.siteUrl}/projects/${slug}` }
    ]
  })
})
</script>
