// app\composables\usePriceSeo.ts
import { computed } from 'vue'
import { useAsyncData, useHead } from 'nuxt/app'

interface PricePage {
  id: number
  title: string
  slug: string
  metaTitle?: string
  metaDescription?: string
  image?: string
}

interface PriceItem {
  id: number
  name: string
  unit: string
  price: number | string
  details?: Array<{ id: number; name: string; unit: string; price: number | string }>
  dopworks?: Array<{ id: number; label?: string | null; dopwork: string; unit: string; price: number | string }>
}

interface PriceCategory {
  id: number
  name: string
  subcategories?: Array<{
    id: number
    name: string
    items?: PriceItem[]
  }>
}

interface PriceData {
  title?: string
  metaDescription?: string
  categories?: PriceCategory[]
}

export function usePriceSeo(currentSlug: string) {
  // Загружаем ПОЛНЫЕ данные прайса для SEO
  const { data: priceData } = useAsyncData<PriceData>(
    `price-seo-${currentSlug}`,
    () => $fetch<PriceData>(`/api/price/list/${currentSlug}`)
  )

  // Загружаем метаданные страницы
  const { data: pagesData } = useAsyncData<PricePage[]>('price-pages', () =>
    $fetch<PricePage[]>('/api/price/pages')
  )

  const currentPage = computed(() =>
    pagesData.value?.find(p => p.slug === currentSlug) || null
  )

  // ✅ Заголовки по умолчанию (fallback, если metaTitle не задан в БД)
  const categoryTitles: Record<string, string> = {
    'otdelochnye-raboty': 'Цены на отделочные работы 2026 — Рязань и область',
    'plumbing': 'Цены на работы по сантехнике 2026 — Рязань и область',
    'electricity': 'Цены на электромонтаж 2026 — Рязань и область',
  }

  // ✅ Приоритет: metaTitle из БД → словарь → дефолт
  const pageTitle = computed(() => {
    return currentPage.value?.metaTitle
      || categoryTitles[currentSlug]
      || 'Цены на ремонт помещений - 2026 | ГлавПрофи'
  })

  // ✅ Описание: metaDescription из БД → metaDescription из API прайса → дефолт
  const pageDescription = computed(() =>
    currentPage.value?.metaDescription
    || priceData.value?.metaDescription
    || 'Актуальные цены 2026 на ремонт помещений.'
  )

  // Генерация JSON-LD из ПОЛНЫХ данных прайса
  const jsonLdSchema = computed(() => {
    const page = currentPage.value
    const price = priceData.value

    const baseSchema = {
      '@context': 'https://schema.org',
      '@type': 'Service',
      'serviceType': 'Ремонтные работы',
      'name': pageTitle.value,
      'description': pageDescription.value,
      'provider': { '@type': 'Organization', 'name': 'ГлавПрофи' },
      'areaServed': 'Россия, Рязань',
    }

    if (!price?.categories?.length) {
      return JSON.stringify(baseSchema)
    }

    const services: any[] = []
    
    for (const category of price.categories) {
      for (const subcategory of category.subcategories || []) {
        for (const item of subcategory.items || []) {
          // Основная работа
          services.push({
            '@type': 'Offer',
            'itemOffered': {
              '@type': 'Service',
              'name': item.name,
              'description': `Единица измерения: ${item.unit}`
            },
            'priceSpecification': {
              '@type': 'UnitPriceSpecification',
              'price': parseFloat(String(item.price)) || 0,
              'priceCurrency': 'RUB',
              'unitText': item.unit
            },
            'availability': 'https://schema.org/InStock'
          })

          // Детали работ
          for (const detail of item.details || []) {
            services.push({
              '@type': 'Offer',
              'itemOffered': {
                '@type': 'Service',
                'name': detail.name,
                'description': `Единица измерения: ${detail.unit}`
              },
              'priceSpecification': {
                '@type': 'UnitPriceSpecification',
                'price': parseFloat(String(detail.price)) || 0,
                'priceCurrency': 'RUB',
                'unitText': detail.unit
              },
              'availability': 'https://schema.org/InStock'
            })
          }

          // ✅ Доп. работы (плоский массив). Объединяем label + dopwork в одно название,
          // как это сделано в UI-компоненте PriceWorkItem.vue
          for (const dopwork of item.dopworks || []) {
            const fullName = [dopwork.label, dopwork.dopwork]
              .filter(Boolean)
              .join(' ')

            services.push({
              '@type': 'Offer',
              'itemOffered': {
                '@type': 'Service',
                'name': fullName || dopwork.dopwork,
                'description': `Единица измерения: ${dopwork.unit}`
              },
              'priceSpecification': {
                '@type': 'UnitPriceSpecification',
                'price': parseFloat(String(dopwork.price)) || 0,
                'priceCurrency': 'RUB',
                'unitText': dopwork.unit
              },
              'availability': 'https://schema.org/InStock'
            })
          }
        }
      }
    }

    return JSON.stringify({
      ...baseSchema,
      'hasOfferCatalog': {
        '@type': 'OfferCatalog',
        'name': `Прайс-лист на ${page?.title || 'ремонт'}`,
        'itemListElement': services
      }
    })
  })

  // Применяем useHead
  useHead({
    title: pageTitle.value,
    meta: [
      { name: 'description', content: pageDescription.value },
      { property: 'og:title', content: pageTitle.value },
      { property: 'og:description', content: pageDescription.value },
      { property: 'og:image', content: currentPage.value?.image || 'https://glavprofi.ru/images/og-image.jpg' },
      {
        name: 'keywords',
        content: 'ремонт, отделка, коммерческие помещения, Рязань, ' +
          (currentPage.value?.title ? currentPage.value.title.toLowerCase() : '')
      }
    ],
    script: [{
      type: 'application/ld+json',
      key: 'price-schema',
      // ✅ ИСПРАВЛЕНО: используем .value, иначе в <script> попадёт [object Object]
      innerHTML: jsonLdSchema.value
    }]
  })

  return {
    pageTitle,
    currentPage,
    jsonLdSchema
  }
}
