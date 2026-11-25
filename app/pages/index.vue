<!-- app\pages\index.vue -->
<template>
  <main>
    <PagesPublicHomePage />
    <UiAnimationsBlockAnimator>
      <PagesPublicHomePageAdvantage />
    </UiAnimationsBlockAnimator>
    <UiAnimationsBlockAnimator>
      <PagesPublicHomePageInsert id="portfolio" />
    </UiAnimationsBlockAnimator>
    <UiAnimationsBlockAnimator>
      <PagesPublicHomePageMiniProjects />
    </UiAnimationsBlockAnimator>
    <UiAnimationsBlockAnimator>
      <!-- ==================== 3. ДО / ПОСЛЕ ==================== -->
      <section id="before-after" class="page-section">
        <BeforeAfterShowcase
          title="Примеры объектов <span>до и после</span>"
          subtitle="Фотографии с реальных объектов в Рязани."
          :items="beforeAfterItems"
          :auto-switch-after-passes="4"
        />
      </section>
    </UiAnimationsBlockAnimator>

    <UiAnimationsBlockAnimator>
      <PagesPublicHomePagePremisesPreview />
    </UiAnimationsBlockAnimator>
    <UiAnimationsBlockAnimator>
      <PagesPublicHomePageWorksPreview />
    </UiAnimationsBlockAnimator>

    <UiAnimationsBlockAnimator>
      <PagesPublicHomePageBrands />
    </UiAnimationsBlockAnimator>
    <UiAnimationsBlockAnimator>
      <PagesPublicHomePageIntro />
    </UiAnimationsBlockAnimator>
    <UiAnimationsBlockAnimator>
      <PagesPublicHomePageCall />
    </UiAnimationsBlockAnimator>
    <UiAnimationsBlockAnimator>
      <PagesPublicHomePageMiniPrice />
    </UiAnimationsBlockAnimator>

    <!-- ==================== FAQ ==================== -->
    <!-- Блок стоит после прайса: вопрос «сколько стоит / как считается» возникает
         именно там. Данные — faqItems из <script setup>: тот же массив уходит
         в JSON-LD FAQPage, поэтому разметка и видимый текст не расходятся. -->
    <section id="faq" class="page-section">
      <PagesPublicRemontPomescheniyUiFAQBlock
        title="Частые <span>вопросы</span> о ремонте"
        subtitle="Ответы на то, что чаще всего спрашивают до начала работ."
        :items="faqItems"
        id-prefix="home-faq"
        theme="light"
      />
    </section>

    <UiAnimationsBlockAnimator>
      <PagesPublicHomePageCallRevers />
    </UiAnimationsBlockAnimator>
    <UiAnimationsBlockAnimator>
      <PagesPublicHomePageFeedback id="feedback" />
    </UiAnimationsBlockAnimator>
  </main>
</template>

<script setup lang="ts">
import BeforeAfterShowcase from '../components/pages/public/remontPomescheniy/workTypes/ui/BeforeAfterShowcase.vue'
// app\components\pages\public\remontPomescheniy\workTypes\ui\BeforeAfterShowcase.vue
import { organizationId } from '~/utils/organizationSchema'

const config = useRuntimeConfig()
const siteUrl = String(config.public.siteUrl || 'https://glavprofi.ru').replace(/\/+$/, '')
const homeUrl = `${siteUrl}/`

/**
 * ⚠️ Бренда в title НЕТ: суффикс «| ГлавПрофи» добавляет titleTemplate из app.vue.
 * Раньше здесь стояло «… - ГлавПрофи», и на проде получалось
 * «Ремонт и отделка … в Рязани и области - ГлавПрофи | ГлавПрофи» (91 символ).
 */
const TITLE = 'Ремонт и отделка коммерческих помещений в Рязани'
/** ≤ 160 символов — длиннее поисковики обрезают в сниппете. */
const DESCRIPTION =
  'Ремонт коммерческих помещений под ключ в Рязани и области: офисы, магазины, склады, клиники. Смета за 1 день, гарантия 3 года, свои бригады. Звоните!'
/** 1200×630 — из готовых OG-картинок только этот формат (og-image.jpg — 1200×1200). */
const OG_IMAGE = `${siteUrl}/og-remont-kommercheskih.jpg`

// ============================================================
// ДО / ПОСЛЕ
// ============================================================
// beforeAlt/afterAlt читает BeforeAfterShowcase. Раньше подписи были
// «Пример работы 1…5» — без объекта и без гео.
const beforeAfterItems = [
  {
    beforeImage: '/main/7-1.webp',
    afterImage: '/main/7.webp',
    beforeAlt: 'Помещение до ремонта — объект в Рязани',
    afterAlt: 'Помещение после ремонта — объект в Рязани'
  },
  {
    beforeImage: '/main/1-1.jpg',
    afterImage: '/main/1.jpg',
    beforeAlt: 'Офис до ремонта — объект в Рязани',
    afterAlt: 'Офис после ремонта — объект в Рязани'
  },
  {
    beforeImage: '/main/vidy-rabot/peregorodki-gkl/10.jpg',
    afterImage: '/main/vidy-rabot/peregorodki-gkl/2.jpg',
    beforeAlt: 'Монтаж перегородок ГКЛ — этап до отделки',
    afterAlt: 'Перегородки ГКЛ после монтажа и отделки'
  },
  {
    beforeImage: '/main/vidy-rabot/peregorodki-gkl/9.jpg',
    afterImage: '/main/vidy-rabot/peregorodki-gkl/4.jpg',
    beforeAlt: 'Каркас перегородки до обшивки',
    afterAlt: 'Готовая перегородка после обшивки и отделки'
  },
  {
    beforeImage: '/main/5.jpg',
    afterImage: '/main/6.jpg',
    beforeAlt: 'Коммерческое помещение до ремонта',
    afterAlt: 'Коммерческое помещение после ремонта'
  }
]

// ============================================================
// FAQ — черновик
// ============================================================
// ⚠️ Формулировки собраны ТОЛЬКО из фактов, уже опубликованных на сайте:
// hero-блок («смета в день обращения», «выезд замерщика бесплатно», «гарантия
// 3 года», «обслуживание после сдачи», «2 месяца от проекта до открытия»,
// регионы), карточки типов помещений (цены «от … ₽/м²»), прайс-блок
// («фиксируем смету в договоре») и FAQ на /remont-pomescheniy.
// Новых цифр и обещаний нет. Текст дорабатывается отдельно — правки нужно
// внести и здесь: этот же массив уходит в JSON-LD FAQPage, разойтись нельзя.
const faqItems = [
  {
    question: 'Сколько стоит ремонт коммерческого помещения?',
    answer:
      'Стоимость зависит от типа объекта и объёма работ. Ориентиры есть в карточках типов помещений на этой странице: например, магазины — от 13 000 ₽ за м², банки — от 14 000 ₽ за м². Смету составляем после замера и фиксируем в договоре до начала работ.'
  },
  {
    question: 'Как быстро вы подготовите смету?',
    answer:
      'Смету готовим в день обращения. Выезд замерщика бесплатный: работаем по Рязани, Рязанской области, Москве и Московской области.'
  },
  {
    question: 'Сколько длится ремонт?',
    answer:
      'Ориентир — около 2 месяцев от проекта до открытия объекта. Точный срок зависит от площади и объёма работ.'
  },
  {
    question: 'Можно ли делать ремонт, если объект работает?',
    answer:
      'Да. Шумные этапы — демонтаж, штробление, стяжку — переносим на вечер или выходные, днём ведём тихие работы: покраску, монтаж, сборку. График согласуем заранее.'
  },
  {
    question: 'Что входит в ремонт под ключ?',
    answer:
      'Берём на себя весь цикл: смету, закупку материалов, работы и сдачу объекта. Материалы закупаем по прямым контрактам с поставщиками — экономия до 20%. После сдачи объект остаётся на обслуживании.'
  },
  {
    question: 'Какая гарантия на работы?',
    answer:
      'Гарантия на выполненные работы — 3 года. После сдачи объекта остаёмся на связи и обслуживаем его.'
  }
]

// ============================================================
// JSON-LD
// ============================================================
// Узел организации здесь НЕ дублируется: он один на сайт — в app.vue
// (buildOrganizationSchema → GeneralContractor, @id = #organization).
// WebPage и Service ссылаются на него через @id.
const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebPage',
      '@id': `${homeUrl}#webpage`,
      url: homeUrl,
      name: TITLE,
      description: DESCRIPTION,
      inLanguage: 'ru-RU',
      isPartOf: { '@id': `${siteUrl}/#website` },
      about: { '@id': organizationId(siteUrl) },
      primaryImageOfPage: OG_IMAGE
    },
    {
      '@type': 'Service',
      '@id': `${homeUrl}#service`,
      name: 'Ремонт и отделка коммерческих помещений под ключ',
      serviceType: 'Ремонт коммерческих помещений',
      description: DESCRIPTION,
      provider: { '@id': organizationId(siteUrl) },
      areaServed: ['Рязань', 'Рязанская область', 'Москва', 'Московская область'],
      url: `${siteUrl}/remont-pomescheniy`
    },
    {
      '@type': 'FAQPage',
      '@id': `${homeUrl}#faq`,
      mainEntity: faqItems.map((item) => ({
        '@type': 'Question',
        name: item.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: item.answer
        }
      }))
    }
  ]
}

useHead({
  title: TITLE,
  link: [
    // ⚡ LCP-кандидат первого экрана — постер hero-видео (23 КБ, main-poster.webp).
    // Сам mp4 грузится только после window.load (см. components/.../homePage/index.vue).
    { rel: 'preload', as: 'image', href: '/main/video/main-poster.webp', fetchpriority: 'high' }
  ],
  meta: [
    { name: 'description', content: DESCRIPTION },
    // og:title несёт бренд один раз — titleTemplate на og-теги не действует.
    { property: 'og:title', content: `${TITLE} — ГлавПрофи` },
    { property: 'og:description', content: DESCRIPTION },
    { property: 'og:image', content: OG_IMAGE },
    { property: 'og:image:width', content: '1200' },
    { property: 'og:image:height', content: '630' },
    { property: 'og:image:alt', content: 'Ремонт коммерческого помещения в Рязани — объекты ГлавПрофи' },
    { property: 'og:site_name', content: 'ГлавПрофи' },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: `${TITLE} — ГлавПрофи` },
    { name: 'twitter:description', content: DESCRIPTION },
    { name: 'twitter:image', content: OG_IMAGE }
    // ⚠️ meta keywords убран: тег не учитывается ни Google, ни Яндексом.
  ],
  script: [
    {
      type: 'application/ld+json',
      key: 'home-schema',
      innerHTML: JSON.stringify(jsonLd)
    }
  ]
})
</script>