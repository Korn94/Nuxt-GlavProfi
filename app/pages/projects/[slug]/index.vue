<template>
  <PagesPublicProjectsCasePage 
    v-if="caseData" 
    :case-data="caseData" 
    :images="images" 
    :works="works" 
  />
  <div v-else-if="loading" class="loading">Загрузка...</div>
  <div v-else-if="loadError" class="error">{{ loadError }}</div>
  <div v-else-if="error" class="error">{{ error }}</div>
</template>

<script setup>
const route = useRoute()
const slug = route.params.slug

const { data, pending: loading, error } = await useAsyncData(
  `case-${slug}`,
  async () => {
    let caseData = null
    let loadError = null

    try {
      caseData = await $fetch(`/api/portfolio/${slug}`)
    } catch (err) {
      // 404 — кейс действительно не существует: оставляем честный 404 (error.vue)
      if (err?.statusCode === 404 || err?.statusCode === 400) throw err
      // 5xx / сеть — кратковременный сбой: рендерим 200 с сообщением, а не 500
      loadError = 'Кейс временно недоступен. Пожалуйста, попробуйте ещё раз чуть позже.'
      console.error(`[projects/${slug}] Не удалось загрузить кейс:`, err)
    }

    const [images, works] = await Promise.all([
      $fetch(`/api/portfolio/${slug}/images`).catch(() => []),
      $fetch(`/api/portfolio/${slug}/works`).catch(() => [])
    ])
    return { caseData, images, works, loadError }
  }
)

const caseData = computed(() => data.value?.caseData || null)
const loadError = computed(() => data.value?.loadError || null)
const images = computed(() => data.value?.images || [])
const works = computed(() => data.value?.works || [])

// SEO
watchEffect(() => {
  if (!caseData.value) return

  // Для description отдаём приоритет metaDescription из БД (он короче и под SEO)
  const descSource = caseData.value.metaDescription || caseData.value.fullDescription || ''
  const cleanDesc = descSource
    .replace(/<[^>]*>/g, '')
    .trim()

  const seoDescription = cleanDesc.length > 155
    ? cleanDesc.substring(0, 155) + '...'
    : cleanDesc || 'Ремонт коммерческих помещений под ключ в Рязани'

  // SEO-заголовок: кастомный metaTitle из БД или «Название — ремонт коммерческих помещений»
  // (глобальный titleTemplate '%s | ГлавПрофи' из app.vue добавит суффикс сам)
  const caseTitle = caseData.value.metaTitle || `${caseData.value.title} — ремонт коммерческих помещений`
  const ogTitle = caseData.value.metaTitle || caseData.value.title || 'Кейс ГлавПрофи'

  const mainImage = images.value.find(img => img.type === 'main')
  
  // 🔥 Формируем URL для картинки
  const mainImageUrl = mainImage?.url 
    ? useImageUrl(mainImage.url) 
    : '/main/projects.webp'
  
  // 🔥 Для og:image нужен абсолютный URL
  const ogImageUrl = mainImageUrl.startsWith('http') 
    ? mainImageUrl 
    : `${useRuntimeConfig().public.siteUrl}${mainImageUrl}`

  useHead({
    title: caseTitle,
    meta: [
      { name: 'description', content: seoDescription },
      { property: 'og:title', content: ogTitle },
      { property: 'og:description', content: seoDescription },
      { property: 'og:image', content: ogImageUrl }, // ← Исправлено
      { property: 'og:image:alt', content: caseData.value.title || 'Ремонт коммерческих помещений' },
      { property: 'og:url', content: `${useRuntimeConfig().public.siteUrl}/projects/${slug}` },
      // Twitter/X и ряд мессенджеров используют twitter-теги — перекрываем глобальные из app.vue
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: ogTitle },
      { name: 'twitter:description', content: seoDescription },
      { name: 'twitter:image', content: ogImageUrl },
    ]
  })
})
</script>
