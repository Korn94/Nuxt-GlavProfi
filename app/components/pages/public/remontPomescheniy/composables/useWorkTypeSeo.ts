// app/components/pages/public/remontPomescheniy/workTypes/composables/useWorkTypeSeo.ts
import { useHead, useSeoMeta, useRoute } from 'nuxt/app'
import { computed, toValue, type MaybeRefOrGetter } from 'vue'

export interface WorkTypeBreadcrumb {
  label: string
  to?: string
}

export interface WorkTypeSeoOptions {
  category: string
  categoryName: string
  slug: string
  title: string
  description: string
  city: string
  /** Минимальная цена (принимает Ref/Computed — будет реактивным) */
  priceFrom?: MaybeRefOrGetter<number>
  currency?: string
  serviceType?: string
  faq?: Array<{ question: string; answer: string }>
  ogImage?: string
  /** 🆕 Реальный URL страницы (переопределяет автогенерацию) */
  pageUrl?: string
  /** 🆕 Кастомный URL категории */
  categoryUrl?: string
  breadcrumbs?: WorkTypeBreadcrumb[]
  baseUrl?: string
  phone?: string
  companyName?: string
  companyLogo?: string
}

/**
 * Безопасное извлечение числового значения из Ref/Computed/числа.
 * Возвращает `undefined`, если значение некорректное (0, NaN, null).
 */
function resolvePrice(price: MaybeRefOrGetter<number> | undefined): number | undefined {
  const val = toValue(price)
  if (typeof val !== 'number' || !Number.isFinite(val) || val <= 0) {
    return undefined
  }
  return val
}

export function useWorkTypeSeo(options: WorkTypeSeoOptions) {
  const route = useRoute()

  const {
    category,
    categoryName,
    slug,
    title,
    description,
    city,
    priceFrom,
    currency = 'RUB',
    serviceType,
    faq = [],
    ogImage = 'https://glavprofi.ru/og-default.jpg',
    breadcrumbs,
    baseUrl = 'https://glavprofi.ru',
    phone = '+7-910-909-69-47',
    companyName = 'ГлавПрофи',
    companyLogo = 'https://glavprofi.ru/logo.png',
  } = options

  // === 🆕 URL: берём текущий путь из роутера (реальный, без догадок) ===
  const pageUrl = options.pageUrl
    ? `${baseUrl}${options.pageUrl}`
    : `${baseUrl}${route.path}`

  const categoryUrl = options.categoryUrl
    ? `${baseUrl}${options.categoryUrl}`
    : `${baseUrl}/vidy-rabot`

  const hubUrl = `${baseUrl}/vidy-rabot`

  // === 🆕 Реактивная цена (обновляется вместе с прайсом) ===
  const resolvedPrice = computed(() => resolvePrice(priceFrom))

  const priceLabel = computed(() => {
    const p = resolvedPrice.value
    return p ? `${p.toLocaleString('ru-RU')} ₽/м²` : 'цена по запросу'
  })

  // === Хлебные крошки ===
  const crumbs: WorkTypeBreadcrumb[] = breadcrumbs ?? [
    { label: 'Главная', to: '/' },
    { label: 'Виды работ', to: '/vidy-rabot' },
    { label: title },
  ]

  // === 1. Базовые мета-теги (реактивные — обновятся при изменении цены) ===
  useSeoMeta({
    title: () => `${title} в ${city} — ${priceLabel.value} | ${companyName}`,
    description,
    ogTitle: () => `${title} — ${categoryName} работы в ${city}`,
    ogDescription: description,
    ogImage,
    ogUrl: pageUrl,
    ogType: 'website',
    ogLocale: 'ru_RU',
    twitterCard: 'summary_large_image',
    twitterTitle: () => `${title} | ${companyName}`,
    twitterDescription: description,
    twitterImage: ogImage,
  })

  // === 2. JSON-LD (реактивный) ===
  const jsonLd = computed(() => ({
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Service',
        '@id': `${pageUrl}#service`,
        name: title,
        serviceType: serviceType ?? `${categoryName} работы`,
        description,
        provider: { '@type': 'LocalBusiness', '@id': `${baseUrl}#organization` },
        areaServed: { '@type': 'City', name: city },
        ...(resolvedPrice.value && {
          offers: {
            '@type': 'Offer',
            price: resolvedPrice.value,
            priceCurrency: currency,
            priceSpecification: {
              '@type': 'UnitPriceSpecification',
              price: resolvedPrice.value,
              priceCurrency: currency,
              unitText: 'м²',
            },
            availability: 'https://schema.org/InStock',
          },
        }),
        url: pageUrl,
        isPartOf: {
          '@type': 'Service',
          '@id': `${categoryUrl}#category`,
          name: `${categoryName} работы`,
        },
      },
      {
        '@type': 'Service',
        '@id': `${categoryUrl}#category`,
        name: `${categoryName} работы`,
        url: categoryUrl,
        provider: { '@type': 'LocalBusiness', '@id': `${baseUrl}#organization` },
      },
      {
        '@type': 'LocalBusiness',
        '@id': `${baseUrl}#organization`,
        name: companyName,
        url: baseUrl,
        logo: companyLogo,
        telephone: phone,
        priceRange: '₽₽',
        address: {
          '@type': 'PostalAddress',
          addressLocality: city,
          addressRegion: 'Рязанская область',
          addressCountry: 'RU',
        },
        areaServed: { '@type': 'City', name: city },
      },
      ...(faq.length > 0
        ? [
            {
              '@type': 'FAQPage',
              '@id': `${pageUrl}#faq`,
              mainEntity: faq.map((item) => ({
                '@type': 'Question',
                name: item.question,
                acceptedAnswer: { '@type': 'Answer', text: item.answer },
              })),
            },
          ]
        : []),
      {
        '@type': 'BreadcrumbList',
        itemListElement: crumbs.map((crumb, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: crumb.label,
          item: crumb.to ? `${baseUrl}${crumb.to}` : undefined,
        })),
      },
      {
        '@type': 'WebPage',
        '@id': pageUrl,
        url: pageUrl,
        name: title,
        description,
        isPartOf: { '@id': `${baseUrl}#website` },
        about: { '@id': `${pageUrl}#service` },
        inLanguage: 'ru-RU',
      },
    ],
  }))

  useHead({
    script: [
      {
        type: 'application/ld+json',
        // 🆕 JSON.stringify вызывается внутри computed — безопасен
        innerHTML: () => JSON.stringify(jsonLd.value),
      },
    ],
    link: [{ rel: 'canonical', href: pageUrl }],
  })
}
