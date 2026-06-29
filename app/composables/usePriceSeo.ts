// app/composables/usePriceSeo.ts
/**
 * 🔍 SEO-композабл для страниц прайс-листа.
 *
 * Отвечает за:
 * - Генерацию мета-тегов (title, description, og:image)
 * - Формирование JSON-LD микроразметки (Schema.org) для поисковиков
 *
 * ВАЖНО: Не делает HTTP-запросов самостоятельно.
 * Принимает уже загруженные данные со страницы (pagesData и pricePayload),
 * что предотвращает дублирование запросов и проблемы с SSR.
 *
 * ИСТОЧНИК ТИПОВ: ~/stores/price/types (единый источник истины)
 */

import { computed, type Ref } from 'vue'
import { useHead } from 'nuxt/app'
import type { ApiPriceListResponse, PricePage } from 'stores/price/types'

/**
 * SEO-хук для страницы прайс-листа.
 *
 * @param currentSlug - Текущий slug категории из параметров роута
 * @param pricePayload - Ref с загруженными данными прайса (из useAsyncData)
 * @param pagesData - Ref со списком всех страниц прайс-листа (для навигации)
 */
export function usePriceSeo(
  currentSlug: string,
  pricePayload: Ref<{ priceData: ApiPriceListResponse | null; isAdminUser: boolean } | null | undefined>,
  pagesData: Ref<PricePage[] | null | undefined>,
) {
  // 🛡️ Защита: не делаем ничего, если slug пустой (например, при переходе на главную)
  if (!currentSlug) {
    console.warn('[usePriceSeo] currentSlug пустой, пропускаем инициализацию SEO')
    return {
      pageTitle: computed(() => ''),
      currentPage: computed(() => null),
      jsonLdSchema: computed(() => '{}'),
    }
  }

  // ========================================
  // 📊 ВЫЧИСЛЯЕМЫЕ СВОЙСТВА
  // ========================================
  const currentPage = computed(() =>
    pagesData.value?.find(p => p.slug === currentSlug) || null,
  )

  const priceData = computed(() => pricePayload.value?.priceData ?? null)

  // ✅ Заголовки по умолчанию (fallback, если metaTitle не задан в БД)
  const categoryTitles: Record<string, string> = {
    'otdelochnye-raboty': 'Цены на отделочные работы 2026 — Рязань и область',
    'plumbing': 'Цены на работы по сантехнике 2026 — Рязань и область',
    'electricity': 'Цены на электромонтаж 2026 — Рязань и область',
  }

  // ✅ Описания по умолчанию (fallback, если metaDescription не задан в БД)
  const categoryDescriptions: Record<string, string> = {
    'otdelochnye-raboty': 'Прайс-лист на отделочные работы в Рязани и области 2026. Цены на штукатурку, шпаклёвку, покраску, укладку плитки и другие виды отделки помещений.',
    'plumbing': 'Стоимость сантехнических работ в Рязани 2026. Цены на установку унитазов, ванн, смесителей, разводку труб и другие сантехнические услуги.',
    'electricity': 'Цены на электромонтажные работы в Рязани 2026. Стоимость установки розеток, выключателей, электрощитов, прокладки кабеля и других электромонтажных услуг.',
  }

  // ✅ Приоритет: metaTitle из БД → словарь → дефолт
  const pageTitle = computed(() => {
    return (
      currentPage.value?.metaTitle ||
      categoryTitles[currentSlug] ||
      'Цены на ремонт помещений - 2026 | ГлавПрофи'
    )
  })

  // ✅ Описание: metaDescription из БД → metaDescription из API прайса → словарь → дефолт
  const pageDescription = computed(
    () =>
      currentPage.value?.metaDescription ||
      priceData.value?.metaDescription ||
      categoryDescriptions[currentSlug] ||
      'Актуальные цены 2026 на ремонт помещений.',
  )

  // ========================================
  // 🕸️ ГЕНЕРАЦИЯ JSON-LD (Schema.org)
  // ========================================
  const jsonLdSchema = computed(() => {
    const page = currentPage.value
    const price = priceData.value

    const baseSchema = {
      '@context': 'https://schema.org',
      '@type': 'Service',
      'serviceType': 'Ремонтные работы',
      name: pageTitle.value,
      description: pageDescription.value,
      provider: { '@type': 'Organization', name: 'ГлавПрофи' },
      areaServed: 'Россия, Рязань',
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
            itemOffered: {
              '@type': 'Service',
              name: item.name,
              description: `Единица измерения: ${item.unit}`,
            },
            priceSpecification: {
              '@type': 'UnitPriceSpecification',
              price: parseFloat(String(item.price)) || 0,
              priceCurrency: 'RUB',
              unitText: item.unit,
            },
            availability: 'https://schema.org/InStock',
          })

          // Детали работ
          for (const detail of item.details || []) {
            services.push({
              '@type': 'Offer',
              itemOffered: {
                '@type': 'Service',
                name: detail.name,
                description: `Единица измерения: ${detail.unit}`,
              },
              priceSpecification: {
                '@type': 'UnitPriceSpecification',
                price: parseFloat(String(detail.price)) || 0,
                priceCurrency: 'RUB',
                unitText: detail.unit,
              },
              availability: 'https://schema.org/InStock',
            })
          }

          // Доп. работы (плоский массив). Объединяем label + dopwork в одно название
          for (const dopwork of item.dopworks || []) {
            const fullName = [dopwork.label, dopwork.dopwork].filter(Boolean).join(' ')

            services.push({
              '@type': 'Offer',
              itemOffered: {
                '@type': 'Service',
                name: fullName || dopwork.dopwork,
                description: `Единица измерения: ${dopwork.unit}`,
              },
              priceSpecification: {
                '@type': 'UnitPriceSpecification',
                price: parseFloat(String(dopwork.price)) || 0,
                priceCurrency: 'RUB',
                unitText: dopwork.unit,
              },
              availability: 'https://schema.org/InStock',
            })
          }
        }
      }
    }

    return JSON.stringify({
      ...baseSchema,
      hasOfferCatalog: {
        '@type': 'OfferCatalog',
        name: `Прайс-лист на ${page?.title || 'ремонт'}`,
        itemListElement: services,
      },
    })
  })

  // ========================================
  // 🏷️ ПРИМЕНЕНИЕ МЕТА-ТЕГОВ
  // ========================================
  useHead({
    title: pageTitle.value,
    meta: [
      { name: 'description', content: pageDescription.value },
      { property: 'og:title', content: pageTitle.value },
      { property: 'og:description', content: pageDescription.value },
      { property: 'og:image', content: 'https://glavprofi.ru/images/og-image.jpg' },
      {
        name: 'keywords',
        content:
          'ремонт, отделка, коммерческие помещения, Рязань, ' +
          (currentPage.value?.title ? currentPage.value.title.toLowerCase() : ''),
      },
    ],
    script: [
      {
        type: 'application/ld+json',
        key: 'price-schema',
        innerHTML: jsonLdSchema.value,
      },
    ],
  })

  return { pageTitle, currentPage, jsonLdSchema }
}
