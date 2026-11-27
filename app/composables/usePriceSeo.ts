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

import { computed, toValue, type MaybeRefOrGetter, type Ref } from 'vue'
import { useHead, useRuntimeConfig } from 'nuxt/app'
import type { ApiPriceListResponse, PricePage } from 'stores/price/types'
import { organizationId } from '~/utils/organizationSchema'

/**
 * Год в заголовках и описаниях. Не хардкодим: статичный «2026» через месяц
 * превращается в ложную информацию, которую видят и пользователи, и роботы.
 */
const CURRENT_YEAR = new Date().getFullYear()

/**
 * Очистка мета-значений.
 *
 * `/api/price/pages` раньше возвращал сгенерированные заглушки
 * («Описание для Отделочные работы», «ключевые, слова, для …»),
 * и они попадали в `<meta name="description">` — такой сниппет хуже,
 * чем отсутствие описания. Теперь заглушки отфильтрованы ещё и здесь:
 * если в БД поле пустое, работает осмысленный текст из словаря ниже.
 */
function cleanMeta(value?: string | null): string | undefined {
  const text = (value ?? '').replace(/\s+/g, ' ').trim()
  if (!text) return undefined
  if (/^описание для /i.test(text)) return undefined
  if (/^ключевые, слова/i.test(text)) return undefined
  return text
}

/**
 * Актуализация года в мета-текстах из БД.
 *
 * Тексты в `price_pages.meta_title` / `meta_description` правятся вручную и
 * почти всегда содержат год: «Цены на Отделочные работы 2026». Без этой
 * замены 1 января title и description начинают врать.
 * Меняем ТОЛЬКО прошлый год (2026 → 2027), чтобы не задеть «с 2014 года»,
 * «гарантия 3 года» и прочие исторические даты.
 */
function withActualYear(text: string): string {
  return text.replace(
    new RegExp(`\\b${CURRENT_YEAR - 1}\\b`, 'g'),
    String(CURRENT_YEAR),
  )
}

/**
 * SEO-хук для страницы прайс-листа.
 *
 * @param currentSlug - Текущий slug категории (Ref/computed или getter —
 *   вычисляется внутри, чтобы title/JSON-LD обновлялись при клиентском
 *   переходе между /prices/<slug> без перезагрузки страницы)
 * @param pricePayload - Ref с загруженными данными прайса (из useAsyncData)
 * @param pagesData - Ref со списком всех страниц прайс-листа (для навигации)
 */
export function usePriceSeo(
  currentSlug: MaybeRefOrGetter<string>,
  pricePayload: Ref<{ priceData: ApiPriceListResponse | null; isAdminUser: boolean } | null | undefined>,
  pagesData: Ref<PricePage[] | null | undefined>,
) {
  const slug = computed(() => String(toValue(currentSlug) ?? '').trim())

  /**
   * ⚠️ `useRuntimeConfig()` читаем здесь, в setup.
   * Раньше он вызывался внутри computed JSON-LD, который вычислялся сразу при
   * создании useHead-объекта. После перехода на функцию-геттер computed
   * выполняется уже во время рендера head — вне Nuxt-контекста, и падал
   * с «A composable that requires access to the Nuxt instance…».
   */
  const siteUrl = useRuntimeConfig().public.siteUrl

  // ========================================
  // 📊 ВЫЧИСЛЯЕМЫЕ СВОЙСТВА
  // ========================================
  const currentPage = computed(() =>
    pagesData.value?.find(p => p.slug === slug.value) || null,
  )

  const priceData = computed(() => pricePayload.value?.priceData ?? null)

  // ✅ Заголовки по умолчанию (fallback, если metaTitle не задан в БД).
  // Формулировка совпадает с H1 в prices/data/pricesContent.ts.
  const categoryTitles: Record<string, string> = {
    'otdelochnye-raboty': `Прайс-лист на отделочные работы в Рязани — цены ${CURRENT_YEAR}`,
    'plumbing': `Прайс-лист на сантехнические работы в Рязани — цены ${CURRENT_YEAR}`,
    'electricity': `Прайс-лист на электромонтажные работы в Рязани — цены ${CURRENT_YEAR}`,
  }

  // ✅ Описания по умолчанию (fallback, если metaDescription не задан в БД).
  // До 160–170 символов: длиннее Яндекс и Google обрезают в сниппете.
  const categoryDescriptions: Record<string, string> = {
    'otdelochnye-raboty': `Прайс-лист на отделочные работы в Рязани и области — ${CURRENT_YEAR}. Цены за работу без материалов: штукатурка, шпаклёвка, покраска, плитка, ГКЛ. Смета в договоре.`,
    'plumbing': `Прайс-лист на сантехнические работы в Рязани — ${CURRENT_YEAR}. Цены за работу: установка унитазов, ванн, смесителей, разводка труб. Материалы отдельно, смета в договоре.`,
    'electricity': `Прайс-лист на электромонтажные работы в Рязани — ${CURRENT_YEAR}. Цены за работу: розетки, выключатели, щиты, кабельные линии, освещение. Материалы отдельно, смета в договоре.`,
  }

  // ✅ Приоритет: metaTitle из БД → словарь → дефолт
  // Бренд «| ГлавПрофи» добавляет titleTemplate в app.vue — здесь его нет.
  const pageTitle = computed(() => {
    const fromDb = cleanMeta(currentPage.value?.metaTitle)
    if (fromDb) return withActualYear(fromDb)

    return (
      categoryTitles[slug.value] ||
      `Прайс-лист на ремонтные работы в Рязани — цены ${CURRENT_YEAR}`
    )
  })

  // ✅ Описание: metaDescription из БД → metaDescription из API прайса → словарь → дефолт
  const pageDescription = computed(() => {
    const fromDb =
      cleanMeta(currentPage.value?.metaDescription) ||
      cleanMeta(priceData.value?.metaDescription)

    if (fromDb) return withActualYear(fromDb)

    return (
      categoryDescriptions[slug.value] ||
      `Актуальные цены ${CURRENT_YEAR} на ремонтные работы в Рязани и области. Цены за работу без материалов, смета фиксируется в договоре.`
    )
  })

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
      // 🔗 Ссылка на единственный узел организации из app.vue (GeneralContractor)
      provider: { '@id': organizationId(siteUrl) },
      areaServed: { '@type': 'City', name: 'Рязань' },
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
  // ⚠️ useHead получает функцию-геттер, а не готовый объект: при клиентском
  // переходе /prices/plumbing → /prices/electricity компонент страницы
  // переиспользуется, и статический объект оставлял бы title/description
  // и JSON-LD от предыдущей категории.
  useHead(() => ({
    title: pageTitle.value,
    meta: [
      { name: 'description', content: pageDescription.value },
      { property: 'og:title', content: pageTitle.value },
      { property: 'og:description', content: pageDescription.value },
      // 1200×630: `og-image.jpg` — квадратный мастер (1200×1200), под OG он не подходит.
      { property: 'og:image', content: 'https://glavprofi.ru/og-default.jpg' },
      // ⚠️ meta keywords убран: тег не учитывается ни Google, ни Яндексом.
    ],
    script: [
      {
        type: 'application/ld+json',
        key: 'price-schema',
        innerHTML: jsonLdSchema.value,
      },
    ],
  }))

  return { pageTitle, currentPage, jsonLdSchema }
}
