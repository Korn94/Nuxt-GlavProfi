// app/utils/organizationSchema.ts
/**
 * 🏗️ JSON-LD организации — единственный builder для всего сайта.
 *
 * Зачем: раньше узел `#organization` описывался в пяти местах и по-разному:
 * - `app.vue` → `Organization` без `streetAddress` и без прямого `telephone`
 *   (телефон лежал в `contactPoint`, который Яндекс не читает);
 * - `usePageSeo.ts` / `useWorkTypeSeo.ts` → `LocalBusiness` с другим набором полей;
 * - `app/pages/remont-pomescheniy/index.vue` → `LocalBusiness` с ЧУЖИМ телефоном
 *   (+7-900-123-45-67) и несуществующим `logo.png`.
 * На одной странице получалось два разных описания одной сущности с одним `@id`.
 *
 * Теперь все места вызывают этот builder → на странице всегда один и тот же узел,
 * а страницы-потребители ссылаются на него через `{ '@id': organizationId(url) }`.
 *
 * Что именно нужно Яндексу (см. справку «Адреса и организации»):
 * - обязательные поля адресного сниппета: `name`, `url`, `address` (с `streetAddress`),
 *   `telephone` — именно прямым свойством организации;
 * - `openingHours` строкой вида `Mo-Fr 09:00-18:00` (`openingHoursSpecification`
 *   Яндекс НЕ поддерживает);
 * - тип из ветки `Organization`/`Place`; `GeneralContractor` входит в список
 *   поддерживаемых (`HomeAndConstructionBusiness`).
 */
import { COMPANY } from 'shared/constants/company'

/** `@id` узла организации — один на весь сайт. */
export function organizationId(siteUrl: string): string {
  return `${String(siteUrl).replace(/\/+$/, '')}/#organization`
}

/** «Рязанская область» → AdministrativeArea, «Рязань» → City. */
function toAreaServed(name: string) {
  return {
    '@type': /область|край|республика/i.test(name) ? 'AdministrativeArea' : 'City',
    name,
  }
}

/**
 * Полный узел организации для `@graph`.
 *
 * @param siteUrl базовый адрес сайта (берётся из `runtimeConfig.public.siteUrl`)
 */
export function buildOrganizationSchema(siteUrl: string) {
  const base = String(siteUrl).replace(/\/+$/, '')

  return {
    '@type': 'GeneralContractor',
    '@id': organizationId(base),
    name: COMPANY.name,
    legalName: COMPANY.legalName,
    url: base,
    logo: `${base}/logo.png`,
    image: `${base}/og-image.jpg`,
    description:
      'Ремонт и отделка коммерческих помещений под ключ в Рязани и области: офисы, магазины, склады, клиники, фитнес-клубы, производство. Собственные бригады, смета фиксируется в договоре, гарантия 3 года.',
    telephone: COMPANY.phoneE164,
    email: COMPANY.email,
    foundingDate: String(COMPANY.foundedYear),
    priceRange: '₽₽',
    address: {
      '@type': 'PostalAddress',
      streetAddress: COMPANY.address.streetAddress,
      addressLocality: COMPANY.address.addressLocality,
      addressRegion: COMPANY.address.addressRegion,
      addressCountry: COMPANY.address.addressCountry,
    },
    openingHours: [...COMPANY.openingHours],
    sameAs: [...COMPANY.sameAs],
    areaServed: COMPANY.areaServed.map(toAreaServed),
    contactPoint: [
      {
        '@type': 'ContactPoint',
        telephone: COMPANY.phoneE164,
        email: COMPANY.email,
        contactType: 'customer service',
        areaServed: 'RU',
        availableLanguage: ['ru'],
      },
    ],
  }
}
