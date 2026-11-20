<!-- app/components/pages/public/about/index.vue -->
<template>
  <main class="about-page">
    <Breadcrumbs :items="breadcrumbs" />

    <AboutHero @open-contact="openModal" />

    <UiAnimationsBlockAnimator>
      <AboutObjects />
    </UiAnimationsBlockAnimator>

    <UiAnimationsBlockAnimator>
      <AboutWorks />
    </UiAnimationsBlockAnimator>

    <UiAnimationsBlockAnimator>
      <AboutAdvantages />
    </UiAnimationsBlockAnimator>

    <UiAnimationsBlockAnimator>
      <HomeBrands />
    </UiAnimationsBlockAnimator>

    <UiAnimationsBlockAnimator>
      <ProjectsShowcase
        v-if="projects.length"
        id="about-projects"
        title="Наши реализованные проекты <span>для бизнеса в Рязани</span>"
        subtitle="Площади, сроки и состав работ — без рендеров и обещаний."
        :projects="projects"
      />
    </UiAnimationsBlockAnimator>

    <UiAnimationsBlockAnimator>
      <ProcessTimeline />
    </UiAnimationsBlockAnimator>

    <UiAnimationsBlockAnimator>
      <BeforeAfterShowcase
        title="Наши объекты <span>до и после</span>"
        subtitle="Фотографии с реальных объектов в Рязани."
        :items="beforeAfterItems"
        :auto-switch-after-passes="4"
      />
    </UiAnimationsBlockAnimator>

    <UiAnimationsBlockAnimator>
      <AboutCta @open-contact="openModal" />
    </UiAnimationsBlockAnimator>

    <!-- Модальная форма заявки -->
    <UiFormsContactForm
      v-if="showModal"
      source="О компании"
      @close="closeModal"
      @formSubmitted="handleFormSubmitted"
    />
  </main>
</template>

<script setup lang="ts">
import { ref } from 'vue'

import AboutHero from './blocks/Hero.vue'
import AboutObjects from './blocks/Objects.vue'
import AboutWorks from './blocks/Works.vue'
import AboutAdvantages from './blocks/Advantages.vue'
import AboutCta from './blocks/Cta.vue'

import Breadcrumbs from '~/components/pages/public/remontPomescheniy/ui/Breadcrumbs.vue'
import HomeBrands from '~/components/pages/public/homePage/Brands.vue'
import ProjectsShowcase from '~/components/pages/public/remontPomescheniy/pageTypes/ui/ProjectsShowcase.vue'
import ProcessTimeline from '~/components/pages/public/remontPomescheniy/index/blocks/ProcessTimeline.vue'
import BeforeAfterShowcase from '~/components/pages/public/remontPomescheniy/workTypes/ui/BeforeAfterShowcase.vue'

import type { BreadcrumbItem } from '~/components/pages/public/remontPomescheniy/ui/types'
import type { ShowcaseItem } from '~/components/pages/public/remontPomescheniy/workTypes/types'
import { usePortfolioProjects } from '~/composables/portfolio/usePortfolioProjects'

const breadcrumbs: BreadcrumbItem[] = [
  { label: 'Главная', to: '/' },
  { label: 'О компании' },
]

const showModal = ref(false)

const { projects } = await usePortfolioProjects({
  key: 'about-projects',
  slugs: ['ddx', 'fora-bank', 'klinika-alma', 'zerno'],
})

const beforeAfterItems: ShowcaseItem[] = [
  {
    beforeImage: '/main/7-1.webp',
    afterImage: '/main/7.webp',
    beforeAlt: 'Объект до ремонта',
    afterAlt: 'Объект после ремонта',
  },
  {
    beforeImage: '/main/1-1.jpg',
    afterImage: '/main/1.jpg',
    beforeAlt: 'Помещение до отделки',
    afterAlt: 'Помещение после отделки',
  },
  {
    beforeImage: '/main/vidy-rabot/peregorodki-gkl/10.jpg',
    afterImage: '/main/vidy-rabot/peregorodki-gkl/2.jpg',
    beforeAlt: 'Помещение до установки перегородок',
    afterAlt: 'Помещение после установки перегородок',
  },
  {
    beforeImage: '/main/vidy-rabot/peregorodki-gkl/9.jpg',
    afterImage: '/main/vidy-rabot/peregorodki-gkl/4.jpg',
    beforeAlt: 'Помещение до ремонта перегородок',
    afterAlt: 'Помещение после ремонта перегородок',
  },
  {
    beforeImage: '/main/5.jpg',
    afterImage: '/main/6.jpg',
    beforeAlt: 'Коммерческое помещение до ремонта',
    afterAlt: 'Коммерческое помещение после ремонта',
  },
]

function openModal() {
  showModal.value = true
}

function closeModal() {
  showModal.value = false
}

function handleFormSubmitted(formData: unknown) {
  console.log('Форма отправлена:', formData)
  closeModal()
}
</script>

<style lang="scss" scoped>
@use '@/assets/styles/variables' as *;

.about-page {
  margin-top: 3.75em;
  overflow: hidden;
  background: $background-light;

  @media (max-width: 768px) {
    margin-top: 2em;
  }

  // Четыре кейса смотрятся ровно в сетке 2×2,
  // а не «3 + 1» при auto-fit minmax(320px, 1fr).
  :deep(.projects-showcase__grid) {
    grid-template-columns: repeat(2, minmax(0, 1fr));

    @media (max-width: 768px) {
      grid-template-columns: 1fr;
    }
  }

  // Фиксированная шапка не должна перекрывать секцию при переходе по якорю.
  :deep(#about-projects) {
    scroll-margin-top: 80px;
  }
}
</style>
