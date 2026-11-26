// app/components/pages/public/remontPomescheniy/composables/usePageSeo.ts

import { useHead, useSeoMeta } from "nuxt/app"
import { organizationId } from "~/utils/organizationSchema"

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
  /**
   * @deprecated Не используется: телефон и логотип берутся из единого узла
   * организации (`shared/constants/company.ts` → `buildOrganizationSchema`).
   * Поле оставлено, чтобы не ломать существующие вызовы.
   */
  phone?: string
  /** Название компании (для title/og) */
  companyName?: string
  /** @deprecated См. `phone` — логотип задаётся в `shared/constants/company.ts`. */
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
    companyName = 'ГлавПрофи',
  } = options

  const pageUrl = `${baseUrl}/remont-pomescheniy/${type}`

  // === 1. Базовые мета-теги ===
  // ⚠️ Бренд в `title` НЕ добавляем: суффикс «| ГлавПрофи» уже даёт titleTemplate
  // в app.vue. Пока здесь было `${title} | ${companyName}`, в <title> попадал
  // дубль «… | ГлавПрофи | ГлавПрофи» на всех 11 страницах типов помещений.
  useSeoMeta({
    title,
    description,
    // og:title без префикса `${typeName}:` — он давал «Офисы: Ремонт офисов…»,
    // дублируя смысл. Бренд добавляем один раз: titleTemplate на og-теги не действует.
    ogTitle: `${title} — ${companyName}`,
    ogDescription: description,
    ogImage,
    ogUrl: pageUrl,
    ogType: 'website',
    twitterCard: 'summary_large_image',
    twitterTitle: `${title} — ${companyName}`,
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
          // 🔗 Ссылка на единственный узел организации из app.vue
          // (GeneralContractor, @id = #organization). Дублировать здесь поля нельзя:
          // получалось два разных описания одной сущности с одним @id, и Яндекс
          // с Google читали то, что оказалось «свежее» в графе.
          '@id': organizationId(baseUrl),
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

      // Узел организации здесь НЕ дублируется: он один на сайте — в app.vue
      // (buildOrganizationSchema → GeneralContractor, @id = #organization).
      // Service выше ссылается на него через @id.

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
