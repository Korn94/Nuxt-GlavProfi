// app\components\pages\public\remontPomescheniy\workTypes\composables\useWorkTypeSeo.ts
import { useHead, useSeoMeta } from "nuxt/app"

export interface WorkTypeBreadcrumb {
  label: string
  to?: string
}

export interface WorkTypeSeoOptions {
  /** Категория вида работ (slug): 'gkl', 'plitka', 'elektrika' */
  category: string
  /** Название категории: 'ГКЛ', 'Плитка', 'Электрика' */
  categoryName: string
  /** Слаг самой страницы: 'steny', 'potolki', 'peregorodki' */
  slug: string
  /** H1 / название услуги: 'Монтаж гипсокартона на стены' */
  title: string
  /** Meta description (до 160 символов) */
  description: string
  /** Город (для локального SEO) */
  city: string
  /** Минимальная цена (для Schema.org) */
  priceFrom?: number
  /** Валюта */
  currency?: string
  /** Тип услуги для Schema.org: 'Монтаж гипсокартона', 'Укладка плитки' */
  serviceType?: string
  /** FAQ для JSON-LD */
  faq?: Array<{ question: string; answer: string }>
  /** OG-изображение */
  ogImage?: string
  /** Кастомные хлебные крошки (переопределяют автогенерацию) */
  breadcrumbs?: WorkTypeBreadcrumb[]
  /** Базовый URL */
  baseUrl?: string
  phone?: string
  companyName?: string
  companyLogo?: string
}

export function useWorkTypeSeo(options: WorkTypeSeoOptions) {
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

  // === Канонический URL: /vidy-rabot/{category}/{slug}/ ===
  const pageUrl = `${baseUrl}/vidy-rabot/${category}/${slug}`
  const categoryUrl = `${baseUrl}/vidy-rabot/${category}`
  const hubUrl = `${baseUrl}/vidy-rabot`

  // === Хлебные крошки (если не переданы — строим автоматически) ===
  const crumbs: WorkTypeBreadcrumb[] = breadcrumbs ?? [
    { label: 'Главная', to: '/' },
    { label: 'Виды работ', to: '/vidy-rabot' },
    { label: categoryName, to: `/vidy-rabot/${category}` },
    { label: title }, // текущая страница без to
  ]

  // === 1. Базовые мета-теги ===
  useSeoMeta({
    title: `${title} в ${city} — от ${priceFrom ?? '...'} ₽/м² | ${companyName}`,
    description,
    ogTitle: `${title} — ${categoryName} работы в ${city}`,
    ogDescription: description,
    ogImage,
    ogUrl: pageUrl,
    ogType: 'website',
    ogLocale: 'ru_RU',
    twitterCard: 'summary_large_image',
    twitterTitle: `${title} | ${companyName}`,
    twitterDescription: description,
    twitterImage: ogImage,
  })

  // === 2. JSON-LD: Schema.org ===
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      // --- Услуга: монтаж / вид работ ---
      {
        '@type': 'Service',
        '@id': `${pageUrl}#service`,
        name: title,
        serviceType: serviceType ?? `${categoryName} работы`,
        description,
        provider: {
          '@type': 'LocalBusiness',
          '@id': `${baseUrl}#organization`,
        },
        areaServed: {
          '@type': 'City',
          name: city,
        },
        offers: priceFrom
          ? {
              '@type': 'Offer',
              price: priceFrom,
              priceCurrency: currency,
              priceSpecification: {
                '@type': 'UnitPriceSpecification',
                price: priceFrom,
                priceCurrency: currency,
                unitText: 'м²',
              },
              availability: 'https://schema.org/InStock',
            }
          : undefined,
        url: pageUrl,
        // Ссылка на родительскую категорию
        isPartOf: {
          '@type': 'Service',
          '@id': `${categoryUrl}#category`,
          name: `${categoryName} работы`,
        },
      },

      // --- Родительская категория (чтобы Google видел иерархию) ---
      {
        '@type': 'Service',
        '@id': `${categoryUrl}#category`,
        name: `${categoryName} работы`,
        url: categoryUrl,
        provider: {
          '@type': 'LocalBusiness',
          '@id': `${baseUrl}#organization`,
        },
      },

      // --- Организация (один раз на сайте) ---
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
        areaServed: {
          '@type': 'City',
          name: city,
        },
      },

      // --- FAQ (если есть) ---
      ...(faq.length > 0
        ? [
            {
              '@type': 'FAQPage',
              '@id': `${pageUrl}#faq`,
              mainEntity: faq.map((item) => ({
                '@type': 'Question',
                name: item.question,
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: item.answer,
                },
              })),
            },
          ]
        : []),

      // --- BreadcrumbList ---
      {
        '@type': 'BreadcrumbList',
        itemListElement: crumbs.map((crumb, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: crumb.label,
          item: crumb.to ? `${baseUrl}${crumb.to}` : undefined,
        })),
      },

      // --- WebPage (сам документ) ---
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
  }

  useHead({
    script: [
      {
        type: 'application/ld+json',
        innerHTML: JSON.stringify(jsonLd),
      },
    ],
    link: [
      { rel: 'canonical', href: pageUrl },
    ],
  })
}