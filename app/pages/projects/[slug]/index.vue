<template>
  <PagesPublicProjectsCasePage 
    v-if="caseData" 
    :case-data="caseData" 
    :images="images" 
    :works="works" 
  />
  <div v-else-if="loading" class="loading">
    <Icon name="eos-icons:bubble-loading" size="34px" /> Загрузка...
  </div>
  <div v-else-if="error" class="error">{{ error }}</div>
</template>

<script setup>
import { ref, onServerPrefetch } from 'vue'
import { useHead } from '#app'

const caseData = ref(null)
const images = ref([])
const works = ref([])
const loading = ref(true)
const error = ref(null)

// Загрузка данных
const fetchData = async () => {
  try {
    loading.value = true
    const slug = useRoute().params.slug
    
    if (!slug) throw new Error('Slug не найден')
    
    // Загружаем все данные параллельно
    const [caseRes, imagesRes, worksRes] = await Promise.all([
      $fetch(`/api/portfolio/${slug}`, { method: 'GET' }),
      $fetch(`/api/portfolio/${slug}/images`, { method: 'GET' }).catch(() => []),
      $fetch(`/api/portfolio/${slug}/works`, { method: 'GET' }).catch(() => [])
    ])
    
    caseData.value = caseRes
    images.value = imagesRes
    works.value = worksRes
    
    // Устанавливаем мета-теги сразу после загрузки
    if (caseData.value) {
      const seoDescription = getSeoDescription(caseData.value)
      const mainImageUrl = getMainImageUrl(images.value)
      
      useHead({
        title: `${caseData.value.title} | ГлавПрофи — ремонт коммерческих помещений`,
        meta: [
          { name: 'description', content: seoDescription },
          { property: 'og:description', content: seoDescription },
          { property: 'og:image', content: mainImageUrl },
          { property: 'og:url', content: `${useRuntimeConfig().public.siteUrl}/projects/${slug}` }
        ]
      })
    }
  } catch (err) {
    error.value = 'Не удалось загрузить данные кейса'
    console.error('Ошибка загрузки:', err)
  } finally {
    loading.value = false
  }
}

// Вспомогательные функции
const getSeoDescription = (data) => {
  if (!data.fullDescription) return 'Ремонт коммерческих помещений под ключ в Рязани'
  
  const tempDiv = document.createElement('div')
  tempDiv.innerHTML = data.fullDescription
  const cleanDesc = tempDiv.textContent || ''
  
  return cleanDesc.length > 155 
    ? cleanDesc.substring(0, 155) + '...' 
    : cleanDesc
}

const getMainImageUrl = (images) => {
  const mainImage = images.find(img => img.type === 'main')
  return mainImage?.url || '/main/projects.webp'
}

// Для SSR
onServerPrefetch(fetchData)

// Для клиентской навигации
if (process.client) {
  fetchData()
}
</script>
