<!-- components/Article.vue -->
<template>
  <article class="article">
    <!-- Вступление -->
    <div class="article__section article__intro-section">
      <ArticleIntro />
    </div>

    <!-- Основные секции -->
    <div class="article__content">
      <ProblemSection />
      <LightingSection />
      <MistakesSection />
      <TimelineSection />
      <ContractorSection />
    </div>

    <!-- Призыв к действию -->
    <div class="article__cta">
      <ConclusionSection />
    </div>
  </article>
</template>

<script setup>
import ArticleIntro from './ArticleIntro.vue';
import ProblemSection from './ProblemSection.vue';
import LightingSection from './LightingSection.vue';
import MistakesSection from './MistakesSection.vue';
import TimelineSection from './TimelineSection.vue';
import ContractorSection from './ContractorSection.vue';
import ConclusionSection from './ConclusionSection.vue';
</script>

<style lang="scss" scoped>
.article {
  max-width: 900px;
  margin: 10em auto 6em;
  padding: 0 1rem;
  line-height: 1.7;

  @media (max-width: 600px) {
    margin: 1rem auto;
    padding: 0 0.8rem;
    font-size: 0.95rem;
  }

  @media (max-width: 480px) {
    padding: 0 0.6rem;
    font-size: 0.92rem;
  }
}

// Вступление — отдельный стиль
.article__intro-section {
  margin-bottom: 2.5rem;
  background: white;
  border-radius: $border-radius;
  box-shadow: $box-shadow;
  padding: 2rem;

  @media (max-width: 768px) {
    padding: 1.8rem;
  }

  @media (max-width: 600px) {
    padding: 1.5rem;
    margin-bottom: 2rem;
  }

  @media (max-width: 480px) {
    padding: 1.4rem;
    margin-bottom: 2rem;
  }
}

// Основное содержимое — группировка секций
.article__content > * {
  background: white;
  border-radius: $border-radius;
  box-shadow: $box-shadow;
  padding: 2rem;
  margin-bottom: 2.5rem;

  @media (max-width: 768px) {
    padding: 1.8rem;
  }

  @media (max-width: 600px) {
    padding: 1.5rem;
    margin-bottom: 2rem;
  }

  @media (max-width: 480px) {
    padding: 1.3rem;
    margin-bottom: 1.8rem;
  }
}

// CTA — призыв к действию
.article__cta {
  text-align: center;
  background: white;
  border-radius: 14px;
  box-shadow: $box-shadow;
  padding: 2.5rem 1.5rem;
  margin: 3rem auto 2rem;

  @media (max-width: 600px) {
    padding: 2rem 1.2rem;
  }

  @media (max-width: 480px) {
    padding: 1.8rem 1rem;
    margin: 2.5rem auto 1.8rem;
  }
}
</style>