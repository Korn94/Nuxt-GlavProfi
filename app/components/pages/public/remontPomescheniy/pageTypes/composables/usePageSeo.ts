// app/components/pages/public/remontPomescheniy/pageTypes/composables/usePageSeo.ts

import { useHead, useSeoMeta } from "nuxt/app"

export interface PageSeoOptions {
  /** Тип помещения (slug): 'ofisy', 'magaziny', 'kliniki' и т.д. */
  type: string
  /** Название типа помещения: 'Офисы', 'Магазины' */
  typeName: string
  /** Город (для локального SEO) */
  city: string
  /** Заголовок страницы (до 60 символов) */
  title: string
  /** Описание (до 160 символов) */
  description: string
  /** Минимальная цена за м² (для Schema.org) */
  priceFrom?: number
  /** Валюта (по умолчанию RUB) */
  currency?: string
  /** FAQ для JSON-LD (массив вопросов-ответов) */
  faq?: Array<{ question: string; answer: string }>
  /** OG-изображение (полный URL) */
  ogImage?: string
  /** Базовый URL сайта */
  baseUrl?: string
  /** Телефон компании */
  phone?: string
  /** Название компании */
  companyName?: string
  /** Логотип компании (URL) */
  companyLogo?: string
}

export function usePageSeo(options: PageSeoOptions) {
  const {
    type,
    typeName,
    city,
    title,
    description,
    priceFrom,
    currency = 'RUB',
    faq = [],
    ogImage = 'https://glavprofi.ru/og-default.jpg',
    baseUrl = 'https://glavprofi.ru',
    phone = '+7-910-909-69-47',
    companyName = 'ГлавПрофи',
    companyLogo = 'https://glavprofi.ru/logo.png',
  } = options

  const pageUrl = `${baseUrl}/remont-pomescheniy/${type}`

  // === 1. Базовые мета-теги ===
  useSeoMeta({
    title: `${title} | ${companyName}`,
    description,
    ogTitle: `${typeName}: ${title}`,
    ogDescription: description,
    ogImage,
    ogUrl: pageUrl,
    ogType: 'website',
    twitterCard: 'summary_large_image',
    twitterTitle: `${title} | ${companyName}`,
    twitterDescription: description,
    twitterImage: ogImage,
  })

  // === 2. JSON-LD: Schema.org ===
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      // Услуга: ремонт конкретного типа помещения
      {
        '@type': 'Service',
        '@id': `${pageUrl}#service`,
        name: `Ремонт ${typeName.toLowerCase()} в ${city}`,
        serviceType: `Ремонт и отделка ${typeName.toLowerCase()}`,
        description,
        provider: {
          '@type': 'LocalBusiness',
          '@id': `${baseUrl}#organization`,
          name: companyName,
          image: companyLogo,
          telephone: phone,
          priceRange: priceFrom ? `от ${priceFrom} ₽/м²` : '₽₽₽',
          address: {
            '@type': 'PostalAddress',
            addressLocality: city,
            addressCountry: 'RU',
          },
          areaServed: {
            '@type': 'City',
            name: city,
          },
          url: baseUrl,
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
            }
          : undefined,
        url: pageUrl,
      },

      // Организация (один раз на сайте)
      {
        '@type': 'LocalBusiness',
        '@id': `${baseUrl}#organization`,
        name: companyName,
        url: baseUrl,
        logo: companyLogo,
        telephone: phone,
        address: {
          '@type': 'PostalAddress',
          addressLocality: city,
          addressCountry: 'RU',
        },
        areaServed: {
          '@type': 'City',
          name: city,
        },
      },

      // FAQ (если есть вопросы)
      ...(faq.length > 0
        ? [
            {
              '@type': 'FAQPage',
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

      // BreadcrumbList (хлебные крошки)
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Главная',
            item: baseUrl,
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: 'Ремонт помещений',
            item: `${baseUrl}/remont-pomescheniy`,
          },
          {
            '@type': 'ListItem',
            position: 3,
            name: typeName,
            item: pageUrl,
          },
        ],
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
      // Canonical URL
      {
        rel: 'canonical',
        href: pageUrl,
      },
    ],
  })
}